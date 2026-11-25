package com.backend.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.OptionalDouble;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.backend.dto.EvaluacionPautaDTO;
import com.backend.model.Actividad;
import com.backend.model.Asignatura;
import com.backend.model.CursoAprobado;
import com.backend.model.Estudiante;
import com.backend.model.Evidencia;
import com.backend.model.Pauta;
import com.backend.model.PautaAplicacion;
import com.backend.model.Practica;
import com.backend.repository.ActividadRepository;
import com.backend.repository.AsignaturaRepository;
import com.backend.repository.CursoAprobadoRepository;
import com.backend.repository.EvidenciaRepository;
import com.backend.repository.PautaAplicacionRepository;
import com.backend.repository.PautaRepository;
import com.backend.repository.PracticaRepository;

/**
 * Centraliza la regla académica de aprobación de asignaturas y el cálculo del progreso.
 *
 * Regla: una asignatura queda APROBADA cuando todas sus tareas (actividades) tienen una
 * entrega calificada del estudiante y el promedio de esas notas es >= 4.0.
 * Si todas están calificadas y el promedio es < 4.0 queda REPROBADA.
 * Mientras falten tareas por calificar queda EN_CURSO.
 *
 * En las asignaturas hasta 8.° semestre también cuentan las pautas con que evalúan al estudiante en su
 * práctica: cada pauta activa de la asignatura, por cada evaluador (profesor colaborador, tutor o profesor
 * de asignatura), es una evaluación más que debe estar finalizada, y su nota entra al promedio.
 *
 * Progreso = asignaturas APROBADAS / total de asignaturas del plan (tabla asignatura).
 */
@Service
public class AvanceAcademicoService {

    private static final Logger logger = LoggerFactory.getLogger(AvanceAcademicoService.class);
    public static final double NOTA_APROBACION = 4.0;
    /** Último semestre cuyas asignaturas suman las pautas de la práctica al avance académico. */
    public static final int ULTIMO_SEMESTRE_CON_PAUTAS = 8;

    private final CursoAprobadoRepository cursoAprobadoRepository;
    private final ActividadRepository actividadRepository;
    private final EvidenciaRepository evidenciaRepository;
    private final AsignaturaRepository asignaturaRepository;
    private final PautaRepository pautaRepository;
    private final PautaAplicacionRepository pautaAplicacionRepository;
    private final PracticaRepository practicaRepository;

    public AvanceAcademicoService(CursoAprobadoRepository cursoAprobadoRepository,
                                  ActividadRepository actividadRepository,
                                  EvidenciaRepository evidenciaRepository,
                                  AsignaturaRepository asignaturaRepository,
                                  PautaRepository pautaRepository,
                                  PautaAplicacionRepository pautaAplicacionRepository,
                                  PracticaRepository practicaRepository) {
        this.cursoAprobadoRepository = cursoAprobadoRepository;
        this.actividadRepository = actividadRepository;
        this.evidenciaRepository = evidenciaRepository;
        this.asignaturaRepository = asignaturaRepository;
        this.pautaRepository = pautaRepository;
        this.pautaAplicacionRepository = pautaAplicacionRepository;
        this.practicaRepository = practicaRepository;
    }

    /**
     * Resultado del cálculo para un estudiante en una asignatura. tareasTotales y tareasCalificadas cuentan tareas
     * y evaluaciones con pauta.
     */
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

        List<Double> notas = new ArrayList<>(actividades.stream()
            .map(a -> evidenciaPorActividad.get(a.getIdActividad()))
            .filter(Objects::nonNull)
            .map(e -> e.getCalificacion())
            .filter(Objects::nonNull)
            .toList());

        // Pautas de la práctica (asignaturas hasta 8.° semestre): cada evaluación finalizada suma su nota
        List<EvaluacionPautaDTO> pautas = evaluacionesConPauta(estudiante, asignatura);
        pautas.stream()
            .filter(p -> PautaAplicacion.FINALIZADA.equals(p.estado()) && p.nota() != null)
            .forEach(p -> notas.add(p.nota()));
        int evaluacionesTotales = actividades.size() + pautas.size();

        OptionalDouble avg = notas.stream().mapToDouble(d -> d.doubleValue()).average();
        Double promedio = avg.isPresent() ? Math.round(avg.getAsDouble() * 10.0) / 10.0 : null;

        String estado;
        if (evaluacionesTotales == 0 || notas.size() < evaluacionesTotales || promedio == null) {
            estado = CursoAprobado.EN_CURSO;
        } else {
            estado = promedio >= NOTA_APROBACION ? CursoAprobado.APROBADO : CursoAprobado.REPROBADO;
        }

        return new ResultadoCurso(estado, promedio, evaluacionesTotales, notas.size());
    }

    /**
     * Evaluaciones con pauta que le corresponden al estudiante en la asignatura, solo hasta 8.° semestre: una por
     * cada pauta de la asignatura (activa, o ya aplicada al estudiante) y cada evaluador que la completa. Cada una
     * lleva la aplicación de ese evaluador en la práctica del estudiante, si existe (la finalizada antes que un
     * borrador).
     */
    @Transactional(readOnly = true)
    public List<EvaluacionPautaDTO> evaluacionesConPauta(Estudiante estudiante, Asignatura asignatura) {
        if (estudiante == null || asignatura == null || asignatura.getNombre() == null
                || semestreNumerico(asignatura.getSemestre()) > ULTIMO_SEMESTRE_CON_PAUTAS) {
            return List.of();
        }
        String nombreAsignatura = asignatura.getNombre().trim();
        List<Practica> practicas = practicaRepository.findByEstudianteIdEstudiante(estudiante.getIdEstudiante()).stream()
            .filter(p -> p.getAsignatura() != null
                && Objects.equals(p.getAsignatura().getIdAsignatura(), asignatura.getIdAsignatura()))
            .sorted(Comparator.comparing(Practica::getIdPractica, Comparator.nullsFirst(Comparator.reverseOrder())))
            .toList();
        List<PautaAplicacion> aplicaciones = practicas.stream()
            .flatMap(p -> pautaAplicacionRepository.findByPracticaIdPractica(p.getIdPractica()).stream())
            .toList();
        Set<Long> pautasAplicadas = aplicaciones.stream()
            .map(a -> a.getPauta().getId())
            .collect(Collectors.toSet());
        Long idPractica = practicas.isEmpty() ? null : practicas.get(0).getIdPractica();

        List<EvaluacionPautaDTO> resultado = new ArrayList<>();
        List<Pauta> pautas = pautaRepository.findAll().stream()
            .filter(p -> p.getAsignatura() != null && nombreAsignatura.equalsIgnoreCase(p.getAsignatura().trim()))
            .filter(p -> !Boolean.FALSE.equals(p.getActiva()) || pautasAplicadas.contains(p.getId()))
            .sorted(Comparator.comparing((Pauta p) -> p.getCodigo() != null ? p.getCodigo() : "")
                .thenComparing(Pauta::getId, Comparator.nullsLast(Comparator.naturalOrder())))
            .toList();
        for (Pauta pauta : pautas) {
            Set<String> roles = pauta.evaluadoresLista();
            List<PautaAplicacion> dePauta = aplicaciones.stream()
                .filter(a -> Objects.equals(a.getPauta().getId(), pauta.getId()))
                .toList();
            for (String rol : roles) {
                // Con un solo evaluador cualquier aplicación es la suya; con varios, la del rol de quien la llenó
                PautaAplicacion app = dePauta.stream()
                    .filter(a -> roles.size() <= 1 || rol.equals(PautaService.rolDelEvaluador(a)))
                    .min(Comparator.comparing((PautaAplicacion a) -> PautaAplicacion.FINALIZADA.equals(a.getEstado()) ? 0 : 1)
                        .thenComparing(PautaAplicacion::getFechaActualizacion, Comparator.nullsLast(Comparator.reverseOrder())))
                    .orElse(null);
                resultado.add(aDto(pauta, rol, app, idPractica, asignatura));
            }
        }
        return resultado;
    }

    private static EvaluacionPautaDTO aDto(Pauta pauta, String rol, PautaAplicacion app, Long idPractica,
                                           Asignatura asignatura) {
        boolean finalizada = app != null && PautaAplicacion.FINALIZADA.equals(app.getEstado());
        Double nota = finalizada && app.getNota() != null ? app.getNota().getPuntajeObtenido() : null;
        String estado = app == null ? EvaluacionPautaDTO.PENDIENTE
            : (finalizada ? PautaAplicacion.FINALIZADA : PautaAplicacion.BORRADOR);
        return new EvaluacionPautaDTO(
            pauta.getId(),
            app != null ? app.getId() : null,
            app != null ? app.getPractica().getIdPractica() : idPractica,
            pauta.getCodigo(),
            pauta.getTitulo(),
            asignatura.getNombre(),
            asignatura.getSemestre(),
            rol,
            app != null ? app.getEvaluadorNombre() : null,
            estado,
            nota,
            app == null ? null : (app.getFechaFinalizacion() != null ? app.getFechaFinalizacion() : app.getFechaActualizacion()));
    }

    /**
     * Recalcula y persiste en cursos_aprobados el estado del estudiante en la asignatura.
     * Se invoca cada vez que un profesor registra/actualiza una nota.
     * No cambia la asignatura que cursa el estudiante: aprobar solo suma avance académico; el paso
     * a otra asignatura lo asigna manualmente el administrador.
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
     * Progreso real = asignaturas APROBADAS / total del plan.
     * Una asignatura cuenta solo si el estudiante la aprobó con las notas vigentes: se exige que esté
     * registrada en cursos_aprobados y que el cálculo actual sobre sus notas lo confirme, para que una
     * nota eliminada por el profesor deje de sumar avance aunque el registro guardado esté desactualizado.
     * La siguiente asignatura habilitada es la primera del plan (por semestre) aún no aprobada.
     */
    @Transactional(readOnly = true)
    public ResumenAvance calcularAvance(Estudiante estudiante, List<Asignatura> plan) {
        Map<Long, String> persistidos = obtenerEstadosPersistidos(estudiante);
        Map<Long, String> estados = new java.util.HashMap<>();
        for (Asignatura a : plan) {
            if (CursoAprobado.APROBADO.equals(persistidos.get(a.getIdAsignatura()))) {
                estados.put(a.getIdAsignatura(), calcularCurso(estudiante, a).estado());
            }
        }
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
