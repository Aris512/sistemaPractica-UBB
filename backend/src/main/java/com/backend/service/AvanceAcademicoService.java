package com.backend.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.OptionalDouble;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.backend.model.Actividad;
import com.backend.model.Asignatura;
import com.backend.model.CursoAprobado;
import com.backend.model.Estudiante;
import com.backend.model.Evidencia;
import com.backend.repository.ActividadRepository;
import com.backend.repository.AsignaturaRepository;
import com.backend.repository.CursoAprobadoRepository;
import com.backend.repository.EvidenciaRepository;

/**
 * Centraliza la regla académica de aprobación de asignaturas y el cálculo del progreso.
 *
 * Regla: una asignatura queda APROBADA cuando todas sus tareas (actividades) tienen una
 * entrega calificada del estudiante y el promedio de esas notas es >= 4.0.
 * Si todas están calificadas y el promedio es < 4.0 queda REPROBADA.
 * Mientras falten tareas por calificar queda EN_CURSO.
 *
 * Progreso = asignaturas APROBADAS / total de asignaturas del plan (tabla asignatura).
 */
@Service
public class AvanceAcademicoService {

    private static final Logger logger = LoggerFactory.getLogger(AvanceAcademicoService.class);
    public static final double NOTA_APROBACION = 4.0;

    private final CursoAprobadoRepository cursoAprobadoRepository;
    private final ActividadRepository actividadRepository;
    private final EvidenciaRepository evidenciaRepository;
    private final AsignaturaRepository asignaturaRepository;
    private final com.backend.repository.EstudianteRepository estudianteRepository;

    public AvanceAcademicoService(CursoAprobadoRepository cursoAprobadoRepository,
                                  ActividadRepository actividadRepository,
                                  EvidenciaRepository evidenciaRepository,
                                  AsignaturaRepository asignaturaRepository,
                                  com.backend.repository.EstudianteRepository estudianteRepository) {
        this.cursoAprobadoRepository = cursoAprobadoRepository;
        this.actividadRepository = actividadRepository;
        this.evidenciaRepository = evidenciaRepository;
        this.asignaturaRepository = asignaturaRepository;
        this.estudianteRepository = estudianteRepository;
    }

    /** Resultado del cálculo para un estudiante en una asignatura. */
    public record ResultadoCurso(String estado, Double promedio, int tareasTotales, int tareasCalificadas) {}

    /** Resumen del avance del estudiante en el plan. */
    public record ResumenAvance(int totalAsignaturas, int aprobadas, double progreso,
                                Asignatura siguienteAsignatura) {}

    /**
     * Calcula (sin persistir) el estado del estudiante en una asignatura a partir de las notas reales.
     */
    @Transactional(readOnly = true)
    public ResultadoCurso calcularCurso(Estudiante estudiante, Asignatura asignatura) {
        if (estudiante == null || asignatura == null) {
            return new ResultadoCurso(CursoAprobado.EN_CURSO, null, 0, 0);
        }

        List<Actividad> actividades = actividadRepository
            .findByAsignaturaIdAsignaturaOrderByFechaCreacionDesc(asignatura.getIdAsignatura());

        Map<Long, Evidencia> evidenciaPorActividad = evidenciaRepository
            .findByEstudianteIdEstudianteAndActividadAsignaturaIdAsignatura(
                estudiante.getIdEstudiante(), asignatura.getIdAsignatura())
            .stream()
            .filter(e -> e.getActividad() != null)
            .collect(Collectors.toMap(e -> e.getActividad().getIdActividad(), Function.identity(), (a, b) -> a));

        List<Double> notas = actividades.stream()
            .map(a -> evidenciaPorActividad.get(a.getIdActividad()))
            .filter(Objects::nonNull)
            .map(e -> e.getCalificacion())
            .filter(Objects::nonNull)
            .toList();

        OptionalDouble avg = notas.stream().mapToDouble(d -> d.doubleValue()).average();
        Double promedio = avg.isPresent() ? Math.round(avg.getAsDouble() * 10.0) / 10.0 : null;

        String estado;
        if (actividades.isEmpty() || notas.size() < actividades.size() || promedio == null) {
            estado = CursoAprobado.EN_CURSO;
        } else {
            estado = promedio >= NOTA_APROBACION ? CursoAprobado.APROBADO : CursoAprobado.REPROBADO;
        }

        return new ResultadoCurso(estado, promedio, actividades.size(), notas.size());
    }

    /**
     * Recalcula y persiste en cursos_aprobados el estado del estudiante en la asignatura.
     * Se invoca cada vez que un profesor registra/actualiza una nota.
     * Si aprueba su asignatura actual, avanza a la siguiente asignatura habilitada en el plan.
     */
    @Transactional
    public CursoAprobado recalcularYGuardar(Estudiante estudiante, Asignatura asignatura) {
        if (estudiante == null || asignatura == null) return null;

        ResultadoCurso resultado = calcularCurso(estudiante, asignatura);

        CursoAprobado registro = cursoAprobadoRepository
            .findByEstudianteIdEstudianteAndAsignaturaIdAsignatura(estudiante.getIdEstudiante(), asignatura.getIdAsignatura())
            .orElseGet(() -> new CursoAprobado(estudiante, asignatura, CursoAprobado.EN_CURSO));

        registro.setEstado(resultado.estado());
        registro.setPromedio(resultado.promedio() != null ? resultado.promedio() : 0.0);
        registro.setFechaActualizacion(java.time.LocalDateTime.now());
        CursoAprobado guardado = cursoAprobadoRepository.save(registro);

        logger.info("Curso recalculado: estudiante={} asignatura={} estado={} promedio={} ({}/{} tareas calificadas)",
            estudiante.getIdEstudiante(), asignatura.getNombre(), resultado.estado(), registro.getPromedio(),
            resultado.tareasCalificadas(), resultado.tareasTotales());

        // Si aprueba la asignatura en la que está matriculado actualmente, avanzar a la siguiente del plan
        if (CursoAprobado.APROBADO.equals(resultado.estado())) {
            Asignatura actual = estudiante.getAsignatura();
            if (actual != null && actual.getIdAsignatura().equals(asignatura.getIdAsignatura())) {
                List<Asignatura> plan = obtenerPlanOrdenado();
                ResumenAvance avance = calcularAvance(estudiante, plan);
                if (avance.siguienteAsignatura() != null && !avance.siguienteAsignatura().getIdAsignatura().equals(actual.getIdAsignatura())) {
                    estudiante.setAsignatura(avance.siguienteAsignatura());
                    estudianteRepository.save(estudiante);
                    logger.info("Estudiante {} avanzó a la siguiente asignatura: {} (Semestre {})",
                        estudiante.getIdEstudiante(), avance.siguienteAsignatura().getNombre(), avance.siguienteAsignatura().getSemestre());
                }
            }
        }

        return guardado;
    }

    /** Plan de estudios: todas las asignaturas registradas, ordenadas por semestre. */
    @Transactional(readOnly = true)
    public List<Asignatura> obtenerPlanOrdenado() {
        List<Asignatura> plan = new ArrayList<>(asignaturaRepository.findAll());
        plan.sort(Comparator.comparingInt((Asignatura a) -> semestreNumerico(a.getSemestre()))
            .thenComparing(a -> a.getNombre() != null ? a.getNombre() : ""));
        return plan;
    }

    /** Estados persistidos del estudiante indexados por id de asignatura. */
    @Transactional(readOnly = true)
    public Map<Long, String> obtenerEstadosPersistidos(Estudiante estudiante) {
        if (estudiante == null) return Map.of();
        return cursoAprobadoRepository.findByEstudianteIdEstudiante(estudiante.getIdEstudiante()).stream()
            .filter(c -> c.getAsignatura() != null)
            .collect(Collectors.toMap(c -> c.getAsignatura().getIdAsignatura(), c -> c.getEstado(), (a, b) -> a));
    }

    /**
     * Progreso real = asignaturas APROBADAS (persistidas en cursos_aprobados) / total del plan.
     * La siguiente asignatura habilitada es la primera del plan (por semestre) aún no aprobada.
     */
    @Transactional(readOnly = true)
    public ResumenAvance calcularAvance(Estudiante estudiante, List<Asignatura> plan) {
        Map<Long, String> estados = obtenerEstadosPersistidos(estudiante);
        int total = plan.size();
        int aprobadas = (int) plan.stream()
            .filter(a -> CursoAprobado.APROBADO.equals(estados.get(a.getIdAsignatura())))
            .count();
        double progreso = total > 0 ? Math.round((aprobadas * 100.0) / total) : 0;

        Optional<Asignatura> siguiente = plan.stream()
            .filter(a -> !CursoAprobado.APROBADO.equals(estados.get(a.getIdAsignatura())))
            .findFirst();

        return new ResumenAvance(total, aprobadas, progreso, siguiente.orElse(null));
    }

    public static int semestreNumerico(String semestre) {
        if (semestre == null) return Integer.MAX_VALUE;
        String digits = semestre.replaceAll("\\D+", "");
        if (digits.isEmpty()) return Integer.MAX_VALUE;
        try {
            return Integer.parseInt(digits);
        } catch (NumberFormatException e) {
            return Integer.MAX_VALUE;
        }
    }
}
