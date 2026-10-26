package com.backend.service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.backend.dto.EstadoPracticaDTO;
import com.backend.dto.HistorialItemDTO;
import com.backend.model.Asignatura;
import com.backend.model.Estudiante;
import com.backend.model.Evaluacion;
import com.backend.model.Evidencia;
import com.backend.model.Nota;
import com.backend.model.ObservacionEvaluacion;
import com.backend.model.Practica;
import com.backend.model.Usuario;
import com.backend.repository.ActividadRepository;
import com.backend.repository.EstudianteRepository;
import com.backend.repository.EvaluacionRepository;
import com.backend.repository.EvidenciaRepository;
import com.backend.repository.NotaRepository;
import com.backend.repository.ObservacionEvaluacionRepository;
import com.backend.repository.PracticaRepository;
import com.backend.repository.ProfesorRepository;
import com.backend.repository.UsuarioRepository;
import com.backend.util.RutUtils;

@Service
public class EstudianteService {

    private final EstudianteRepository estudianteRepository;
    private final EvidenciaRepository evidenciaRepository;
    private final ActividadRepository actividadRepository;
    private final PracticaRepository practicaRepository;
    private final EvaluacionRepository evaluacionRepository;
    private final NotaRepository notaRepository;
    private final ObservacionEvaluacionRepository observacionEvaluacionRepository;
    private final UsuarioRepository usuarioRepository;
    private final ProfesorRepository profesorRepository;

    public EstudianteService(EstudianteRepository estudianteRepository,
                             EvidenciaRepository evidenciaRepository,
                             ActividadRepository actividadRepository,
                             PracticaRepository practicaRepository,
                             EvaluacionRepository evaluacionRepository,
                             NotaRepository notaRepository,
                             ObservacionEvaluacionRepository observacionEvaluacionRepository,
                             UsuarioRepository usuarioRepository,
                             ProfesorRepository profesorRepository) {
        this.estudianteRepository = estudianteRepository;
        this.evidenciaRepository = evidenciaRepository;
        this.actividadRepository = actividadRepository;
        this.practicaRepository = practicaRepository;
        this.evaluacionRepository = evaluacionRepository;
        this.notaRepository = notaRepository;
        this.observacionEvaluacionRepository = observacionEvaluacionRepository;
        this.usuarioRepository = usuarioRepository;
        this.profesorRepository = profesorRepository;
    }

    public List<Estudiante> obtenerTodos() {
        return estudianteRepository.findAll().stream()
            .filter(e -> e.getUsuario() == null || (e.getUsuario().isActivo() && !"inactivo".equalsIgnoreCase(e.getUsuario().getEstado())))
            .filter(e -> e.getEstado() == null || !"INACTIVO".equalsIgnoreCase(e.getEstado()))
            .collect(java.util.stream.Collectors.toList());
    }

    public Estudiante obtenerPorId(Long id) {
        Estudiante est = estudianteRepository.findById(id).orElse(null);
        if (est != null && est.getUsuario() != null && (!est.getUsuario().isActivo() || "inactivo".equalsIgnoreCase(est.getUsuario().getEstado()))) {
            return null;
        }
        if (est != null && "INACTIVO".equalsIgnoreCase(est.getEstado())) {
            return null;
        }
        return est;
    }

    public Estudiante obtenerPorRut(String rut) {
        if (rut == null || rut.isBlank()) {
            return null;
        }
        Estudiante est = null;
        java.util.Optional<Estudiante> opt = estudianteRepository.findByUsuarioRut(rut);
        if (opt.isPresent()) {
            est = opt.get();
        } else {
            String clean = RutUtils.clean(rut);
            opt = estudianteRepository.findByUsuarioRut(clean);
            if (opt.isPresent()) {
                est = opt.get();
            } else {
                String standard = RutUtils.formatStandard(rut);
                est = estudianteRepository.findByUsuarioRut(standard).orElse(null);
            }
        }
        if (est != null && est.getUsuario() != null && (!est.getUsuario().isActivo() || "inactivo".equalsIgnoreCase(est.getUsuario().getEstado()))) {
            return null;
        }
        if (est != null && "INACTIVO".equalsIgnoreCase(est.getEstado())) {
            return null;
        }
        return est;
    }

    public Estudiante crear(Estudiante estudiante) {
        return estudianteRepository.save(estudiante);
    }

    public void eliminar(Long id) {
        estudianteRepository.deleteById(id);
    }

    /**
     * Módulo 4: Consulta del Historial unificado de actividades y evaluaciones de un estudiante
     * como "checks" completados (HU-09).
     */
    @Transactional(readOnly = true)
    public List<HistorialItemDTO> obtenerHistorialEstudiante(String rut) {
        Estudiante est = obtenerPorRut(rut);
        if (est == null) {
            return Collections.emptyList();
        }

        List<HistorialItemDTO> items = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        DateTimeFormatter simpleFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");

        // 1. Actividades y Evidencias académicas
        List<Evidencia> evidencias = evidenciaRepository.findByEstudianteIdEstudiante(est.getIdEstudiante());
        for (Evidencia ev : evidencias) {
            String titulo = (ev.getActividad() != null && ev.getActividad().getTitulo() != null)
                    ? ev.getActividad().getTitulo()
                    : "Evidencia de Actividad";

            boolean completada = ev.getCalificacion() != null
                    || "REVISADO".equalsIgnoreCase(ev.getEstado())
                    || "ENTREGADO".equalsIgnoreCase(ev.getEstado())
                    || Boolean.TRUE.equals(ev.getAprobado());

            String estado = ev.getCalificacion() != null
                    ? "CALIFICADA"
                    : (ev.getEstado() != null ? ev.getEstado() : "ENTREGADA");

            LocalDateTime fecha = ev.getFechaRevision() != null
                    ? ev.getFechaRevision()
                    : (ev.getFechaEntrega() != null ? ev.getFechaEntrega() : LocalDateTime.now());

            String fechaFormateada = fecha != null ? fecha.format(simpleFormatter) : "—";

            String evaluador = "Profesor de Asignatura";
            if (ev.getRevisadoPor() != null && ev.getRevisadoPor().getUsuario() != null) {
                evaluador = ev.getRevisadoPor().getUsuario().getNombre() + " " + ev.getRevisadoPor().getUsuario().getApellido();
            } else if (ev.getActividad() != null && ev.getActividad().getProfesor() != null
                    && ev.getActividad().getProfesor().getUsuario() != null) {
                evaluador = ev.getActividad().getProfesor().getUsuario().getNombre() + " " + ev.getActividad().getProfesor().getUsuario().getApellido();
            }

            String observacion = ev.getRetroalimentacion() != null && !ev.getRetroalimentacion().isBlank()
                    ? ev.getRetroalimentacion()
                    : ev.getComentarioEstudiante();

            items.add(new HistorialItemDTO(
                    ev.getIdEvidencia(),
                    titulo,
                    "ACTIVIDAD",
                    fecha,
                    fechaFormateada,
                    estado,
                    completada,
                    ev.getCalificacion(),
                    evaluador,
                    "Docente",
                    observacion,
                    ev.getNombreArchivo(),
                    ev.getArchivoUrl()
            ));
        }

        // 2. Evaluaciones y Notas formales del estudiante
        Set<Long> evalsProcesadas = new HashSet<>();
        List<Nota> notas = notaRepository.findByEstudianteIdEstudiante(est.getIdEstudiante());
        for (Nota n : notas) {
            Evaluacion ev = n.getEvaluacion();
            if (ev != null) {
                evalsProcesadas.add(ev.getIdEvaluacion());
            }

            String titulo = (ev != null && ev.getTipoEvaluacion() != null && !ev.getTipoEvaluacion().isBlank())
                    ? ev.getTipoEvaluacion()
                    : "Evaluación Docente";

            LocalDateTime fecha = (ev != null && ev.getFecha() != null)
                    ? ev.getFecha()
                    : LocalDateTime.now();
            String fechaFormateada = fecha != null ? fecha.format(simpleFormatter) : "—";

            String observacion = (ev != null && ev.getObservacion() != null) ? ev.getObservacion() : "";
            if (ev != null) {
                List<ObservacionEvaluacion> obsExtra = observacionEvaluacionRepository.findByEvaluacion_IdEvaluacion(ev.getIdEvaluacion());
                if (!obsExtra.isEmpty()) {
                    StringBuilder sb = new StringBuilder(observacion != null ? observacion : "");
                    for (ObservacionEvaluacion oe : obsExtra) {
                        if (oe.getTexto() != null && !oe.getTexto().isBlank()) {
                            if (sb.length() > 0) sb.append(" | ");
                            sb.append(oe.getTexto());
                        }
                    }
                    observacion = sb.toString();
                }
            }

            String evaluador = "Profesor Asignado";
            if (n.getRutEvaluador() != null) {
                Usuario u = usuarioRepository.findByRut(n.getRutEvaluador()).orElse(null);
                if (u != null) {
                    evaluador = u.getNombre() + " " + u.getApellido();
                }
            } else if (ev != null && ev.getTipoEvaluador() != null) {
                evaluador = ev.getTipoEvaluador();
            }

            items.add(new HistorialItemDTO(
                    n.getIdNota(),
                    titulo,
                    "EVALUACION",
                    fecha,
                    fechaFormateada,
                    "CALIFICADA",
                    true, // Check completado
                    n.getPuntajeObtenido(),
                    evaluador,
                    ev != null ? ev.getTipoEvaluador() : "Evaluador",
                    observacion,
                    ev != null ? ev.getNombreArchivo() : null,
                    ev != null ? ev.getArchivoUrl() : null
            ));
        }

        // 3. Evaluaciones vinculadas a la práctica que no tengan nota directa
        List<Practica> practicas = practicaRepository.findByEstudianteIdEstudiante(est.getIdEstudiante());
        for (Practica p : practicas) {
            List<Evaluacion> evals = evaluacionRepository.findByPracticaIdPractica(p.getIdPractica());
            for (Evaluacion ev : evals) {
                if (!evalsProcesadas.add(ev.getIdEvaluacion())) {
                    continue;
                }
                String titulo = ev.getTipoEvaluacion() != null ? ev.getTipoEvaluacion() : "Pauta de Práctica";
                LocalDateTime fecha = ev.getFecha() != null ? ev.getFecha() : LocalDateTime.now();
                String fechaFormateada = fecha != null ? fecha.format(simpleFormatter) : "—";

                List<ObservacionEvaluacion> obsList = observacionEvaluacionRepository.findByEvaluacion_IdEvaluacion(ev.getIdEvaluacion());
                String obs = ev.getObservacion();
                if (!obsList.isEmpty()) {
                    StringBuilder sb = new StringBuilder(obs != null ? obs : "");
                    for (ObservacionEvaluacion oe : obsList) {
                        if (oe.getTexto() != null && !oe.getTexto().isBlank()) {
                            if (sb.length() > 0) sb.append(" | ");
                            sb.append(oe.getTexto());
                        }
                    }
                    obs = sb.toString();
                }

                items.add(new HistorialItemDTO(
                        ev.getIdEvaluacion(),
                        titulo,
                        "EVALUACION",
                        fecha,
                        fechaFormateada,
                        "COMPLETADA",
                        true,
                        null,
                        ev.getTipoEvaluador() != null ? ev.getTipoEvaluador() : "Comisión Evaluadora",
                        ev.getTipoEvaluador(),
                        obs,
                        ev.getNombreArchivo(),
                        ev.getArchivoUrl()
                ));
            }
        }

        // Ordenar cronológicamente descendente (más recientes primero)
        items.sort(Comparator.comparing(HistorialItemDTO::getFecha, Comparator.nullsLast(Comparator.reverseOrder())));
        return items;
    }

    /**
     * Módulo 4: Consulta del Estado de Práctica del estudiante (HU-10).
     * Determina si el estudiante cursa práctica (para renderizar condicionalmente la línea de progreso)
     * y cuál es su etapa actual dentro del proceso.
     */
    @Transactional(readOnly = true)
    public EstadoPracticaDTO obtenerEstadoPractica(String rut) {
        EstadoPracticaDTO dto = new EstadoPracticaDTO();
        Estudiante est = obtenerPorRut(rut);
        if (est == null) {
            dto.setEsPractica(false);
            dto.setHistorial(Collections.emptyList());
            return dto;
        }

        Asignatura asig = est.getAsignatura();
        String sem = asig != null ? String.valueOf(asig.getSemestre()) : "";
        String nom = asig != null ? asig.getNombre().toLowerCase() : "";
        List<Practica> practicas = practicaRepository.findByEstudianteIdEstudiante(est.getIdEstudiante());

        boolean esPractica = sem.contains("8") || sem.contains("9")
                || nom.contains("práctica") || nom.contains("practica")
                || !practicas.isEmpty();

        dto.setEsPractica(esPractica);
        dto.setAsignaturaNombre(asig != null ? asig.getNombre() : "—");
        dto.setCodigoAsignatura(asig != null ? ("PRA-" + asig.getIdAsignatura()) : "—");
        dto.setSemestre(sem);

        List<HistorialItemDTO> historial = obtenerHistorialEstudiante(rut);
        dto.setHistorial(historial);

        if (!esPractica) {
            // Estudiante regular: no tiene línea de práctica profesional
            dto.setEtapaActual("REGULAR");
            dto.setEtapaIndex(-1);
            dto.setProgresoPorcentaje(0);
            return dto;
        }

        // Estudiante de formación práctica: determinar centro, tutor y etapa
        Practica p = !practicas.isEmpty() ? practicas.get(0) : null;
        if (p != null) {
            if (p.getCentroPractica() != null) {
                dto.setCentroPractica(p.getCentroPractica().getNombre());
            }
            if (p.getTutorPractica() != null) {
                dto.setTutorNombre(p.getTutorPractica().getNombre());
            }
        }

        if (asig != null) {
            List<com.backend.model.Profesor> profes = profesorRepository.findAllByAsignaturaId(asig.getIdAsignatura());
            if (!profes.isEmpty() && profes.get(0).getUsuario() != null) {
                dto.setProfesorNombre(profes.get(0).getUsuario().getNombre() + " " + profes.get(0).getUsuario().getApellido());
            }
        }

        boolean esNoveno = sem.contains("9") || nom.contains("profesional");
        dto.setHorasRealizadas(esNoveno ? 160 : 128);
        dto.setHorasTotales(esNoveno ? 300 : 250);

        // Determinación de la etapa actual en la línea de práctica:
        // 0: Inscripción, 1: Inicio, 2: Seguimiento, 3: Evaluación Final
        long totalCompletadas = historial.stream().filter(HistorialItemDTO::isCompletado).count();
        if (p != null && "APROBADO".equalsIgnoreCase(p.getEstadoAprobacion())) {
            dto.setEtapaActual("EVALUACION_FINAL");
            dto.setEtapaIndex(3);
            dto.setProgresoPorcentaje(100);
        } else if (totalCompletadas >= 2) {
            dto.setEtapaActual("SEGUIMIENTO");
            dto.setEtapaIndex(2);
            dto.setProgresoPorcentaje(75);
        } else if (p != null) {
            dto.setEtapaActual("INICIO");
            dto.setEtapaIndex(1);
            dto.setProgresoPorcentaje(50);
        } else {
            dto.setEtapaActual("INSCRIPCION");
            dto.setEtapaIndex(0);
            dto.setProgresoPorcentaje(25);
        }

        return dto;
    }
}
