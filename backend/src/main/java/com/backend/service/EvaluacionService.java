package com.backend.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.backend.dto.EstudianteEvaluacionDTO;
import com.backend.dto.GuardarEvaluacionProfesorRequest;
import com.backend.model.Asignatura;
import com.backend.model.Documento;
import com.backend.model.DocumentoPractica;
import com.backend.model.Estudiante;
import com.backend.model.Evaluacion;
import com.backend.model.Evidencia;
import com.backend.model.Nota;
import com.backend.model.ObservacionEvaluacion;
import com.backend.model.Practica;
import com.backend.model.Profesor;
import com.backend.model.Usuario;
import com.backend.repository.ActividadRepository;
import com.backend.repository.DocumentoPracticaRepository;
import com.backend.repository.DocumentoRepository;
import com.backend.repository.EstudianteRepository;
import com.backend.repository.EvaluacionRepository;
import com.backend.repository.EvidenciaRepository;
import com.backend.repository.NotaRepository;
import com.backend.repository.ObservacionEvaluacionRepository;
import com.backend.repository.PracticaRepository;
import com.backend.repository.ProfesorRepository;
import com.backend.repository.UsuarioRepository;

@Service
public class EvaluacionService {

    private static final Logger logger = LoggerFactory.getLogger(EvaluacionService.class);

    private final EvaluacionRepository evaluacionRepository;
    private final NotaRepository notaRepository;
    private final ProfesorRepository profesorRepository;
    private final EstudianteRepository estudianteRepository;
    private final PracticaRepository practicaRepository;
    private final DocumentoPracticaRepository documentoPracticaRepository;
    private final UsuarioRepository usuarioRepository;
    private final ObservacionEvaluacionRepository observacionEvaluacionRepository;
    private final FileStorageService fileStorageService;
    private final DocumentoRepository documentoRepository;
    private final EvidenciaRepository evidenciaRepository;
    private final AvanceAcademicoService avanceAcademicoService;
    private final ActividadRepository actividadRepository;

    public EvaluacionService(
            EvaluacionRepository evaluacionRepository,
            NotaRepository notaRepository,
            ProfesorRepository profesorRepository,
            EstudianteRepository estudianteRepository,
            PracticaRepository practicaRepository,
            DocumentoPracticaRepository documentoPracticaRepository,
            UsuarioRepository usuarioRepository,
            ObservacionEvaluacionRepository observacionEvaluacionRepository,
            FileStorageService fileStorageService,
            DocumentoRepository documentoRepository,
            EvidenciaRepository evidenciaRepository,
            AvanceAcademicoService avanceAcademicoService,
            ActividadRepository actividadRepository) {
        this.evaluacionRepository = evaluacionRepository;
        this.notaRepository = notaRepository;
        this.profesorRepository = profesorRepository;
        this.estudianteRepository = estudianteRepository;
        this.practicaRepository = practicaRepository;
        this.documentoPracticaRepository = documentoPracticaRepository;
        this.usuarioRepository = usuarioRepository;
        this.observacionEvaluacionRepository = observacionEvaluacionRepository;
        this.fileStorageService = fileStorageService;
        this.documentoRepository = documentoRepository;
        this.evidenciaRepository = evidenciaRepository;
        this.avanceAcademicoService = avanceAcademicoService;
        this.actividadRepository = actividadRepository;
    }

    public List<Evaluacion> obtenerTodos() {
        return evaluacionRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Evaluacion> obtenerEvaluacionesPorProfesor(String rutProfesor) {
        if (rutProfesor == null || rutProfesor.isBlank()) {
            return java.util.Collections.emptyList();
        }

        Profesor profesor = profesorRepository.findByUsuarioRut(rutProfesor).orElse(null);
        Set<Long> evaluacionIds = new HashSet<>();
        List<Evaluacion> resultado = new ArrayList<>();

        if (profesor != null) {
            // 1. Evaluaciones donde el profesor es el evaluador directo
            List<Evaluacion> creadas = evaluacionRepository.findByIdEvaluador(profesor.getIdProfesor());
            for (Evaluacion ev : creadas) {
                if (evaluacionIds.add(ev.getIdEvaluacion())) {
                    resultado.add(ev);
                }
            }

            // 2. Evaluaciones de estudiantes inscritos en la asignatura del profesor
            if (profesor.getAsignatura() != null && profesor.getAsignatura().getIdAsignatura() != null) {
                List<Evaluacion> deAsignatura = evaluacionRepository
                        .findByPracticaEstudianteAsignaturaIdAsignatura(profesor.getAsignatura().getIdAsignatura());
                for (Evaluacion ev : deAsignatura) {
                    if (evaluacionIds.add(ev.getIdEvaluacion())) {
                        resultado.add(ev);
                    }
                }
            }
        }

        // 3. Evaluaciones en prácticas donde actúa como tutor
        List<Practica> practicasTutor = practicaRepository.findByTutorPracticaUsuarioRut(rutProfesor);
        if (practicasTutor != null) {
            for (Practica p : practicasTutor) {
                for (Evaluacion ev : evaluacionRepository.findByPracticaIdPractica(p.getIdPractica())) {
                    if (evaluacionIds.add(ev.getIdEvaluacion())) {
                        resultado.add(ev);
                    }
                }
            }
        }

        // 4. Evaluaciones en prácticas donde actúa como profesor colaborador
        List<Practica> practicasColab = practicaRepository.findByProfesoresColaboradoresUsuarioRut(rutProfesor);
        if (practicasColab != null) {
            for (Practica p : practicasColab) {
                for (Evaluacion ev : evaluacionRepository.findByPracticaIdPractica(p.getIdPractica())) {
                    if (evaluacionIds.add(ev.getIdEvaluacion())) {
                        resultado.add(ev);
                    }
                }
            }
        }

        return resultado;
    }

    @Transactional(readOnly = true)
    public boolean profesorTieneAccesoAEvaluacion(Long idEvaluacion, String rutProfesor) {
        if (idEvaluacion == null || rutProfesor == null || rutProfesor.isBlank()) return false;
        Evaluacion ev = evaluacionRepository.findById(idEvaluacion).orElse(null);
        if (ev == null) return false;

        Profesor prof = profesorRepository.findByUsuarioRut(rutProfesor).orElse(null);
        if (prof != null && ev.getIdEvaluador() != null && ev.getIdEvaluador().equals(prof.getIdProfesor())) {
            return true;
        }

        if (prof != null && prof.getAsignatura() != null && ev.getPractica() != null && ev.getPractica().getEstudiante() != null) {
            Estudiante est = ev.getPractica().getEstudiante();
            if (est.getAsignatura() != null && est.getAsignatura().getIdAsignatura().equals(prof.getAsignatura().getIdAsignatura())) {
                return true;
            }
        }

        if (ev.getPractica() != null) {
            Practica p = ev.getPractica();
            if (p.getTutorPractica() != null && p.getTutorPractica().getUsuario() != null
                    && rutProfesor.equals(p.getTutorPractica().getUsuario().getRut())) {
                return true;
            }
            if (p.getProfesoresColaboradores() != null) {
                boolean esColab = p.getProfesoresColaboradores().stream()
                        .anyMatch(pc -> pc.getUsuario() != null && rutProfesor.equals(pc.getUsuario().getRut()));
                if (esColab) return true;
            }
        }

        return false;
    }

    public Evaluacion obtenerPorId(Long id) {
        return evaluacionRepository.findById(id).orElse(null);
    }

    public Evaluacion crear(Evaluacion evaluacion) {
        return evaluacionRepository.save(evaluacion);
    }

    @Transactional
    public void eliminar(Long id) {
        Evaluacion evaluacion = evaluacionRepository.findById(id).orElse(null);
        if (evaluacion == null) return;
        eliminarArchivoDeEvaluacion(evaluacion);
        evaluacionRepository.delete(evaluacion);
    }

    @Transactional(readOnly = true)
    public List<EstudianteEvaluacionDTO> obtenerEstudiantesParaProfesor(String rutProfesor) {
        Profesor profesor = profesorRepository.findByUsuarioRut(rutProfesor)
                .orElseThrow(() -> new RuntimeException("Profesor no encontrado con RUT: " + rutProfesor));

        Set<Asignatura> asignaturas = new HashSet<>();
        if (profesor.getAsignatura() != null) {
            asignaturas.add(profesor.getAsignatura());
        }

        List<EstudianteEvaluacionDTO> resultado = new ArrayList<>();
        Set<Long> estudiantesProcesados = new HashSet<>();

        for (Asignatura asignatura : asignaturas) {
            boolean tieneActividadCreada = actividadRepository
                    .existsByProfesorUsuarioRutAndAsignaturaIdAsignatura(
                            rutProfesor, asignatura.getIdAsignatura());
            if (!tieneActividadCreada) {
                continue;
            }

            List<Estudiante> estudiantes = estudianteRepository.findByAsignaturaIdAsignatura(asignatura.getIdAsignatura());
            for (Estudiante estudiante : estudiantes) {
                if (!estudiantesProcesados.add(estudiante.getIdEstudiante())) {
                    continue;
                }

                // Las tareas se entregan como Evidencia, no como DocumentoPractica.
                // Se limita al mismo profesor y asignatura para no mezclar entregas
                // de otras actividades del estudiante.
                boolean tieneEntrega = evidenciaRepository
                        .existsByEstudianteIdEstudianteAndActividadProfesorUsuarioRutAndActividadAsignaturaIdAsignatura(
                                estudiante.getIdEstudiante(), rutProfesor, asignatura.getIdAsignatura());
                String estadoEntrega = tieneEntrega ? "ENTREGADO" : "NO_ENTREGADO";

                // Práctica asociada
                List<Practica> practicas = practicaRepository.findByEstudianteIdEstudiante(estudiante.getIdEstudiante());
                Practica practica = practicas.stream()
                        .filter(p -> p.getAsignatura() != null && p.getAsignatura().getIdAsignatura().equals(asignatura.getIdAsignatura()))
                        .findFirst()
                        .orElse(practicas.isEmpty() ? null : practicas.get(0));

                // Nota existente: solo la emitida por este profesor, para no mostrar la nota
                // de otra asignatura cuando el estudiante avanza en el plan.
                Optional<Nota> notaOpt = notasDelProfesor(estudiante.getIdEstudiante(), profesor).stream().findFirst();

                // Evaluación existente: SOLAMENTE la asociada a la Nota de este estudiante (no de la práctica)
                Evaluacion evaluacion = null;
                if (notaOpt.isPresent() && notaOpt.get().getEvaluacion() != null) {
                    evaluacion = notaOpt.get().getEvaluacion();
                }

                Double notaValor = null;
                String observacionTexto = null;
                Long idEvaluacion = null;
                String fechaEvaluacion = null;
                String estadoEvaluacion;

                if (notaOpt.isPresent()) {
                    notaValor = notaOpt.get().getPuntajeObtenido();
                    if (evaluacion != null) {
                        observacionTexto = evaluacion.getObservacion();
                        idEvaluacion = evaluacion.getIdEvaluacion();
                        if (evaluacion.getFecha() != null) {
                            fechaEvaluacion = evaluacion.getFecha().toString();
                        }
                    }
                    if (notaValor != null) {
                        estadoEvaluacion = (observacionTexto == null || observacionTexto.trim().isEmpty())
                                ? "SIN_OBSERVACION"
                                : "EVALUADO";
                    } else if (observacionTexto != null && !observacionTexto.trim().isEmpty()) {
                        estadoEvaluacion = "EVALUADO";
                    } else {
                        estadoEvaluacion = "NO_EVALUADO";
                    }
                } else {
                    estadoEvaluacion = "NO_EVALUADO";
                }

                EstudianteEvaluacionDTO dto = new EstudianteEvaluacionDTO();
                dto.setIdEstudiante(estudiante.getIdEstudiante());
                if (estudiante.getUsuario() != null) {
                    dto.setNombre(estudiante.getUsuario().getNombre());
                    dto.setApellido(estudiante.getUsuario().getApellido());
                    dto.setRut(estudiante.getUsuario().getRut());
                    dto.setCorreo(estudiante.getUsuario().getCorreo());
                }
                dto.setAsignatura(asignatura.getNombre());
                dto.setIdAsignatura(asignatura.getIdAsignatura());
                dto.setEstadoEntrega(estadoEntrega);
                dto.setEstadoEvaluacion(estadoEvaluacion);
                if (practica != null) {
                    dto.setIdPractica(practica.getIdPractica());
                    if (practica.getCentroPractica() != null) {
                        dto.setCentroPractica(practica.getCentroPractica().getNombre());
                    }
                }
                dto.setNota(notaValor);
                dto.setObservacion(observacionTexto);
                dto.setIdEvaluacion(idEvaluacion);
                dto.setFechaEvaluacion(fechaEvaluacion);
                if (evaluacion != null) {
                    dto.setPuntajeMinimo(evaluacion.getPuntajeMinimo());
                    dto.setPuntajeMaximo(evaluacion.getPuntajeMaximo());
                    dto.setTipoEvaluacion(evaluacion.getTipoEvaluacion());
                }
                if (notaOpt.isPresent() && notaOpt.get().getRutEvaluador() != null) {
                    dto.setEvaluadorRut(notaOpt.get().getRutEvaluador());
                    usuarioRepository.findByRut(notaOpt.get().getRutEvaluador()).ifPresent(u -> {
                        dto.setEvaluadorNombre(u.getNombre() + " " + u.getApellido());
                    });
                }
                completarEntregaAlumno(dto, estudiante.getIdEstudiante(), profesor.getUsuario().getRut());

                resultado.add(dto);
            }
        }

        return resultado;
    }

    @Transactional
    public EstudianteEvaluacionDTO guardarEvaluacionProfesor(GuardarEvaluacionProfesorRequest req) {
        if (req.getIdEstudiante() == null) {
            throw new IllegalArgumentException("El ID del estudiante es requerido.");
        }
        if (req.getRutProfesor() == null || req.getRutProfesor().trim().isEmpty()) {
            throw new IllegalArgumentException("El RUT del profesor es requerido.");
        }
        // Validar nota si viene informada
        if (req.getPuntajeObtenido() != null) {
            if (req.getPuntajeObtenido() < 1.0 || req.getPuntajeObtenido() > 7.0) {
                throw new IllegalArgumentException("La nota debe estar entre 1.0 y 7.0.");
            }
        }

        Estudiante estudiante = estudianteRepository.findById(req.getIdEstudiante())
                .orElseThrow(() -> new RuntimeException("Estudiante no encontrado con ID: " + req.getIdEstudiante()));

        Profesor profesor = profesorRepository.findByUsuarioRut(req.getRutProfesor())
                .orElseThrow(() -> new RuntimeException("Profesor no encontrado con RUT: " + req.getRutProfesor()));

        // 1. Resolver si ya existe una Nota previa de este profesor para el estudiante
        // (las notas de otros profesores/asignaturas no se tocan).
        List<Nota> notasEstudiante = notasDelProfesor(estudiante.getIdEstudiante(), profesor);
        Nota notaExistente = notasEstudiante.isEmpty() ? null : notasEstudiante.get(0);
        if (notasEstudiante.size() > 1) {
            for (int i = 1; i < notasEstudiante.size(); i++) {
                eliminarNota(notasEstudiante.get(i));
            }
        }

        // 2. Resolver la Evaluación existente (evitar crear registros redundantes)
        Evaluacion evaluacion = null;
        if (req.getIdEvaluacion() != null) {
            evaluacion = evaluacionRepository.findById(req.getIdEvaluacion()).orElse(null);
        }
        if (evaluacion == null && notaExistente != null && notaExistente.getEvaluacion() != null) {
            evaluacion = notaExistente.getEvaluacion();
        }

        String obsLimpia = (req.getObservacion() != null && !req.getObservacion().trim().isEmpty())
                ? req.getObservacion().trim()
                : null;

        // CASO A: Se eliminaron tanto la nota como la observación (ambos null)
        if (req.getPuntajeObtenido() == null && obsLimpia == null
                && !Boolean.TRUE.equals(req.getConservarEvaluacionPorArchivo())) {
            if (notaExistente != null) {
                eliminarNota(notaExistente);
            }
            if (evaluacion != null && evaluacion.getPractica() == null) {
                List<ObservacionEvaluacion> obsHijas = observacionEvaluacionRepository.findByEvaluacion_IdEvaluacion(evaluacion.getIdEvaluacion());
                if (!obsHijas.isEmpty()) {
                    observacionEvaluacionRepository.deleteAll(obsHijas);
                    observacionEvaluacionRepository.flush();
                }
                eliminarArchivoDeEvaluacion(evaluacion);
                evaluacionRepository.delete(evaluacion);
                evaluacionRepository.flush();
                evaluacion = null;
            }
            return construirDTO(estudiante, evaluacion, null, profesor.getUsuario().getRut());
        }

        // CASO B: Existe nota, observación o ambas
        if (evaluacion != null) {
            // Actualizar la evaluación existente SIN crear una nueva
            evaluacion.setPractica(null); // NO completa id_practica
            evaluacion.setObservacion(obsLimpia);
            evaluacion.setFecha(LocalDateTime.now());
            if (req.getTipoEvaluacion() != null && !req.getTipoEvaluacion().trim().isEmpty()) {
                evaluacion.setTipoEvaluacion(req.getTipoEvaluacion());
            }
            if (req.getPuntajeMinimo() != null) {
                evaluacion.setPuntajeMinimo(req.getPuntajeMinimo());
            }
            if (req.getPuntajeMaximo() != null) {
                evaluacion.setPuntajeMaximo(req.getPuntajeMaximo());
            }
            evaluacion = evaluacionRepository.save(evaluacion);
        } else {
            // Solo crear nueva si realmente no existía ninguna
            evaluacion = new Evaluacion();
            evaluacion.setPractica(null);
            evaluacion.setIdEvaluador(profesor.getIdProfesor());
            evaluacion.setTipoEvaluador("PROFESOR_ASIGNATURA");
            evaluacion.setFecha(LocalDateTime.now());
            evaluacion.setTipoEvaluacion(req.getTipoEvaluacion() != null ? req.getTipoEvaluacion() : "Evaluación Docente");
            evaluacion.setPuntajeMinimo(1.0);
            if (req.getPuntajeMinimo() != null) {
                evaluacion.setPuntajeMinimo(req.getPuntajeMinimo());
            }
            evaluacion.setPuntajeMaximo(7.0);
            if (req.getPuntajeMaximo() != null) {
                evaluacion.setPuntajeMaximo(req.getPuntajeMaximo());
            }
            evaluacion.setObservacion(obsLimpia);
            evaluacion.setFechaLimite(LocalDateTime.now().plusDays(30));
            evaluacion = evaluacionRepository.save(evaluacion);
        }

        // Gestión de la Nota:
        if (notaExistente != null) {
            notaExistente.setEvaluacion(evaluacion);
            notaExistente.setPuntajeObtenido(req.getPuntajeObtenido());
            notaExistente.setRutEvaluador(profesor.getUsuario().getRut());
            notaExistente = notaRepository.save(notaExistente);
        } else {
            notaExistente = new Nota(evaluacion, estudiante, req.getPuntajeObtenido(), profesor.getUsuario().getRut());
            notaExistente = notaRepository.save(notaExistente);
        }

        sincronizarRevisionEnEvidencia(estudiante, profesor, notaExistente, obsLimpia);

        return construirDTO(estudiante, evaluacion, notaExistente, profesor.getUsuario().getRut());
    }

    /** Notas que el profesor emitió para el estudiante, la más reciente primero. */
    private List<Nota> notasDelProfesor(Long idEstudiante, Profesor profesor) {
        String rutProfesor = profesor.getUsuario() != null ? profesor.getUsuario().getRut() : null;
        if (rutProfesor == null) return List.of();
        return notaRepository.findByEstudianteIdEstudianteAndRutEvaluadorOrderByIdNotaDesc(idEstudiante, rutProfesor);
    }

    /**
     * Elimina una nota desvinculándola antes de las evidencias que la referencian, para que la
     * entrega deje de figurar como calificada y el avance académico se recalcule sin ella.
     */
    private void eliminarNota(Nota nota) {
        List<Evidencia> afectadas = nota.getIdNota() != null
                ? evidenciaRepository.findByNotaIdNota(nota.getIdNota())
                : List.of();
        for (Evidencia ev : afectadas) {
            ev.setNota(null);
            evidenciaRepository.saveAndFlush(ev);
        }
        notaRepository.delete(nota);
        notaRepository.flush();
        afectadas.forEach(this::actualizarAvanceDesdeEvidencia);
    }

    /** Propaga a las evidencias un cambio de puntaje (p. ej. nota vaciada) y recalcula el avance. */
    private void sincronizarEvidenciasDeNota(Nota nota) {
        if (nota.getIdNota() == null) return;
        for (Evidencia ev : evidenciaRepository.findByNotaIdNota(nota.getIdNota())) {
            ev.actualizarEstadoSegunNota();
            evidenciaRepository.saveAndFlush(ev);
            actualizarAvanceDesdeEvidencia(ev);
        }
    }

    @Transactional
    public EstudianteEvaluacionDTO eliminarNotaEstudiante(Long idEstudiante) {
        Estudiante estudiante = estudianteRepository.findById(idEstudiante)
                .orElseThrow(() -> new RuntimeException("Estudiante no encontrado con ID: " + idEstudiante));

        Optional<Nota> notaOpt = notaRepository.findFirstByEstudianteIdEstudianteOrderByIdNotaDesc(idEstudiante);
        Evaluacion evaluacion = null;
        if (notaOpt.isPresent()) {
            Nota nota = notaOpt.get();
            evaluacion = nota.getEvaluacion();
            if (evaluacion != null && evaluacion.getObservacion() != null && !evaluacion.getObservacion().trim().isEmpty()) {
                // Preservar la nota con puntaje null para no romper el vínculo con la observación
                nota.setPuntajeObtenido(null);
                nota = notaRepository.save(nota);
                sincronizarEvidenciasDeNota(nota);
                return construirDTO(estudiante, evaluacion, nota);
            } else {
                // Si no hay observación, eliminar nota y evaluación huérfana
                eliminarNota(nota);
                if (evaluacion != null && evaluacion.getPractica() == null) {
                    List<ObservacionEvaluacion> obsHijas = observacionEvaluacionRepository.findByEvaluacion_IdEvaluacion(evaluacion.getIdEvaluacion());
                    if (!obsHijas.isEmpty()) {
                        observacionEvaluacionRepository.deleteAll(obsHijas);
                        observacionEvaluacionRepository.flush();
                    }
                    eliminarArchivoDeEvaluacion(evaluacion);
                    evaluacionRepository.delete(evaluacion);
                    evaluacionRepository.flush();
                    evaluacion = null;
                }
            }
        }

        return construirDTO(estudiante, evaluacion, null);
    }

    @Transactional
    public EstudianteEvaluacionDTO eliminarObservacionEstudiante(Long idEstudiante) {
        Estudiante estudiante = estudianteRepository.findById(idEstudiante)
                .orElseThrow(() -> new RuntimeException("Estudiante no encontrado con ID: " + idEstudiante));

        Optional<Nota> notaOpt = notaRepository.findFirstByEstudianteIdEstudianteOrderByIdNotaDesc(idEstudiante);
        Evaluacion evaluacion = null;
        Nota nota = null;
        if (notaOpt.isPresent()) {
            nota = notaOpt.get();
            evaluacion = nota.getEvaluacion();
            if (evaluacion != null) {
                evaluacion.setObservacion(null);
                evaluacion = evaluacionRepository.save(evaluacion);
            }
            if (nota.getPuntajeObtenido() == null) {
                // Si no hay nota ni observación, limpiar ambos para no dejar huérfanos
                eliminarNota(nota);
                nota = null;
                if (evaluacion != null && evaluacion.getPractica() == null) {
                    List<ObservacionEvaluacion> obsHijas = observacionEvaluacionRepository.findByEvaluacion_IdEvaluacion(evaluacion.getIdEvaluacion());
                    if (!obsHijas.isEmpty()) {
                        observacionEvaluacionRepository.deleteAll(obsHijas);
                        observacionEvaluacionRepository.flush();
                    }
                    eliminarArchivoDeEvaluacion(evaluacion);
                    evaluacionRepository.delete(evaluacion);
                    evaluacionRepository.flush();
                    evaluacion = null;
                }
            }
        }

        return construirDTO(estudiante, evaluacion, nota);
    }

    @Transactional
    public EstudianteEvaluacionDTO eliminarEvaluacionYEntregasCompletas(Long idEstudiante) {
        Estudiante estudiante = estudianteRepository.findById(idEstudiante)
                .orElseThrow(() -> new RuntimeException("Estudiante no encontrado con ID: " + idEstudiante));

        String rutEstudiante = estudiante.getUsuario() != null ? estudiante.getUsuario().getRut() : null;
        Asignatura asignatura = estudiante.getAsignatura();

        // 1. Eliminar evidencias vinculadas al estudiante y sus documentos físicos asociados
        List<Evidencia> evidencias = new ArrayList<>(evidenciaRepository.findByEstudianteIdEstudiante(idEstudiante));
        if (rutEstudiante != null) {
            List<Evidencia> evsRut = evidenciaRepository.findByEstudianteUsuarioRutOrderByFechaEntregaDesc(rutEstudiante);
            for (Evidencia er : evsRut) {
                if (!evidencias.contains(er)) {
                    evidencias.add(er);
                }
            }
        }

        Set<Documento> docsFisicosParaBorrar = new HashSet<>();
        Set<String> urlsSueltas = new HashSet<>();
        Set<Asignatura> asignaturasAfectadas = new HashSet<>();
        if (asignatura != null) asignaturasAfectadas.add(asignatura);
        for (Evidencia ev : evidencias) {
            if (ev.getActividad() != null && ev.getActividad().getAsignatura() != null) {
                asignaturasAfectadas.add(ev.getActividad().getAsignatura());
            }
            // Entregas antiguas sin Documento: la ruta vive solo en la evidencia.
            if (ev.getArchivoUrl() != null) urlsSueltas.add(ev.getArchivoUrl());
            if (ev.getArchivoRevisionUrl() != null) urlsSueltas.add(ev.getArchivoRevisionUrl());
            if (ev.getArchivoAlumno() != null) {
                docsFisicosParaBorrar.add(ev.getArchivoAlumno());
                ev.setArchivoAlumno(null);
            }
            if (ev.getArchivoProfesor() != null) {
                docsFisicosParaBorrar.add(ev.getArchivoProfesor());
                ev.setArchivoProfesor(null);
            }
            ev.setNota(null);
        }
        evidenciaRepository.saveAllAndFlush(evidencias);
        evidenciaRepository.deleteAll(evidencias);
        evidenciaRepository.flush();

        for (Documento doc : docsFisicosParaBorrar) {
            if (doc.getUbicacion() != null) {
                fileStorageService.deleteFile(doc.getUbicacion());
            }
            try {
                documentoRepository.delete(doc);
            } catch (Exception ex) {
                logger.warn("No se pudo eliminar documento de evidencia {}: {}", doc.getIdDocumento(), ex.getMessage());
            }
        }
        documentoRepository.flush();
        urlsSueltas.forEach(fileStorageService::deleteFile);

        // 2. Eliminar documentos del estudiante en la tabla Documento asociados a actividades o entregas
        if (rutEstudiante != null) {
            List<Documento> docsEstudiante = documentoRepository.findByRutEstudiante(rutEstudiante);
            for (Documento d : docsEstudiante) {
                if (d.getActividad() != null || "ACTIVIDAD_ALUMNO".equalsIgnoreCase(d.getTipo()) || (d.getTipo() != null && d.getTipo().startsWith("ACTIVIDAD"))) {
                    if (d.getUbicacion() != null) {
                        fileStorageService.deleteFile(d.getUbicacion());
                    }
                    try {
                        documentoRepository.delete(d);
                    } catch (Exception ex) {
                        logger.warn("No se pudo eliminar documento de actividad {}: {}", d.getIdDocumento(), ex.getMessage());
                    }
                }
            }
            documentoRepository.flush();
        }

        // 3. Eliminar documentos de práctica del estudiante en la tabla DocumentoPractica
        if (rutEstudiante != null) {
            List<DocumentoPractica> docPracticas = documentoPracticaRepository.findByEstudianteRut(rutEstudiante);
            for (DocumentoPractica dp : docPracticas) {
                if (dp.getUbicacion() != null) {
                    fileStorageService.deleteFile(dp.getUbicacion());
                }
                try {
                    documentoPracticaRepository.delete(dp);
                } catch (Exception ex) {
                    logger.warn("No se pudo eliminar DocumentoPractica {}: {}", dp.getIdDocumentoPractica(), ex.getMessage());
                }
            }
            documentoPracticaRepository.flush();
        }

        // 4. Eliminar Notas y Evaluaciones del estudiante
        List<Nota> notas = notaRepository.findByEstudianteIdEstudiante(idEstudiante);
        Set<Long> evaluacionesProcesadas = new HashSet<>();

        for (Nota nota : notas) {
            Evaluacion evaluacion = nota.getEvaluacion();
            notaRepository.delete(nota);
            notaRepository.flush();

            if (evaluacion != null && evaluacionesProcesadas.add(evaluacion.getIdEvaluacion())) {
                limpiarOEliminarEvaluacion(evaluacion);
            }
        }

        List<Evaluacion> evsEstudiante = evaluacionRepository.findByPracticaEstudianteIdEstudiante(idEstudiante);
        for (Evaluacion ev : evsEstudiante) {
            if (evaluacionesProcesadas.add(ev.getIdEvaluacion())) {
                limpiarOEliminarEvaluacion(ev);
            }
        }

        // 5. Recalcular progreso en AvanceAcademico de cada asignatura con entregas eliminadas
        for (Asignatura asig : asignaturasAfectadas) {
            try {
                avanceAcademicoService.recalcularYGuardar(estudiante, asig);
            } catch (Exception e) {
                logger.warn("No se pudo recalcular avance académico tras eliminación: {}", e.getMessage());
            }
        }

        return construirDTO(estudiante, null, null);
    }

    private void limpiarOEliminarEvaluacion(Evaluacion evaluacion) {
        if (evaluacion == null) return;
        if (evaluacion.getPractica() == null) {
            List<ObservacionEvaluacion> obsHijas = observacionEvaluacionRepository.findByEvaluacion_IdEvaluacion(evaluacion.getIdEvaluacion());
            if (!obsHijas.isEmpty()) {
                observacionEvaluacionRepository.deleteAll(obsHijas);
                observacionEvaluacionRepository.flush();
            }
            eliminarArchivoDeEvaluacion(evaluacion);
            evaluacionRepository.delete(evaluacion);
            evaluacionRepository.flush();
        } else {
            evaluacion.setObservacion(null);
            eliminarArchivoDeEvaluacion(evaluacion);
            evaluacionRepository.save(evaluacion);
        }
    }

    /**
     * Quita el archivo adjunto de una evaluación junto con todos los registros que se crearon a
     * partir de él al subirlo (copia en DocumentoPractica del expediente y Documento de revisión
     * de la evidencia). El archivo físico se elimina tras el commit y solo si nada más lo referencia.
     */
    private void eliminarArchivoDeEvaluacion(Evaluacion evaluacion) {
        if (evaluacion == null) return;
        String url = evaluacion.getArchivoUrl();
        if (url == null || url.isBlank()) return;

        Set<String> rutas = fileStorageService.variantesDeRuta(url);

        List<DocumentoPractica> copias = documentoPracticaRepository.findByUbicacionIn(rutas);
        if (!copias.isEmpty()) {
            documentoPracticaRepository.deleteAll(copias);
        }

        for (Documento doc : documentoRepository.findByUbicacionIn(rutas)) {
            if (!"EVIDENCIA_REVISION".equalsIgnoreCase(doc.getTipo())) continue;
            for (Evidencia ev : evidenciaRepository.findByArchivoProfesorIdDocumento(doc.getIdDocumento())) {
                ev.setArchivoProfesor(null);
                ev.setNombreArchivoRevision(null);
                ev.setArchivoRevisionUrl(null);
                evidenciaRepository.saveAndFlush(ev);
            }
            documentoRepository.delete(doc);
        }

        evaluacion.setArchivoUrl(null);
        evaluacion.setNombreArchivo(null);
        fileStorageService.deleteFile(url);
    }

    private EstudianteEvaluacionDTO construirDTO(Estudiante estudiante, Evaluacion evaluacion, Nota nota) {
        return construirDTO(estudiante, evaluacion, nota, nota != null ? nota.getRutEvaluador() : null);
    }

    /**
     * Agrega al DTO la entrega (evidencia) que el estudiante subió para las actividades del profesor,
     * para que el profesor pueda previsualizarla al evaluar.
     */
    private void completarEntregaAlumno(EstudianteEvaluacionDTO dto, Long idEstudiante, String rutProfesor) {
        if (rutProfesor == null) return;
        evidenciaRepository
                .findFirstByEstudianteIdEstudianteAndActividadProfesorUsuarioRutOrderByFechaEntregaDesc(idEstudiante, rutProfesor)
                .ifPresent(ev -> {
                    String ruta = ev.getArchivoUrl();
                    dto.setIdEvidencia(ev.getIdEvidencia());
                    dto.setNombreArchivoEntrega(ev.getNombreArchivo());
                    dto.setTituloActividad(ev.getActividad() != null ? ev.getActividad().getTitulo() : null);
                    dto.setFechaEntrega(ev.getFechaEntrega() != null ? ev.getFechaEntrega().toString() : null);
                    dto.setTieneArchivoEntrega(ruta != null && !ruta.isBlank());
                    dto.setEstadoEntrega("ENTREGADO");
                });
    }

    private EstudianteEvaluacionDTO construirDTO(Estudiante estudiante, Evaluacion evaluacion, Nota nota, String rutProfesor) {
        EstudianteEvaluacionDTO dto = new EstudianteEvaluacionDTO();
        dto.setIdEstudiante(estudiante.getIdEstudiante());
        if (estudiante.getUsuario() != null) {
            dto.setNombre(estudiante.getUsuario().getNombre());
            dto.setApellido(estudiante.getUsuario().getApellido());
            dto.setRut(estudiante.getUsuario().getRut());
            dto.setCorreo(estudiante.getUsuario().getCorreo());
        }
        // La asignatura de la evaluación es la del profesor que la emite; la del estudiante puede
        // haber cambiado si avanzó en el plan.
        Profesor profesorEvaluador = rutProfesor != null
                ? profesorRepository.findByUsuarioRut(rutProfesor).orElse(null)
                : null;
        Asignatura asignaturaEvaluacion = profesorEvaluador != null
                ? profesorEvaluador.getAsignatura()
                : null;
        if (asignaturaEvaluacion == null) {
            asignaturaEvaluacion = estudiante.getAsignatura();
        }
        if (asignaturaEvaluacion != null) {
            dto.setAsignatura(asignaturaEvaluacion.getNombre());
            dto.setIdAsignatura(asignaturaEvaluacion.getIdAsignatura());
        }
        long docCount = 0;
        if (estudiante.getAsignatura() != null && estudiante.getUsuario() != null) {
            docCount = documentoPracticaRepository.countByEstudianteRutAndAsignaturaIdAsignatura(
                    estudiante.getUsuario().getRut(), estudiante.getAsignatura().getIdAsignatura()
            );
        }
        dto.setEstadoEntrega(docCount > 0 ? "ENTREGADO" : "NO_ENTREGADO");

        Double notaValor = nota != null ? nota.getPuntajeObtenido() : null;
        String obs = evaluacion != null ? evaluacion.getObservacion() : null;

        if (notaValor != null) {
            dto.setEstadoEvaluacion(obs == null || obs.trim().isEmpty() ? "SIN_OBSERVACION" : "EVALUADO");
        } else if (obs != null && !obs.trim().isEmpty()) {
            dto.setEstadoEvaluacion("EVALUADO");
        } else {
            dto.setEstadoEvaluacion("NO_EVALUADO");
        }

        List<Practica> practicasExistentes = practicaRepository.findByEstudianteIdEstudiante(estudiante.getIdEstudiante());
        if (!practicasExistentes.isEmpty()) {
            Practica p = practicasExistentes.get(0);
            dto.setIdPractica(p.getIdPractica());
            if (p.getCentroPractica() != null) {
                dto.setCentroPractica(p.getCentroPractica().getNombre());
            }
        } else {
            dto.setIdPractica(null);
            dto.setCentroPractica(null);
        }

        dto.setNota(notaValor);
        dto.setObservacion(obs);
        if (evaluacion != null) {
            dto.setIdEvaluacion(evaluacion.getIdEvaluacion());
            dto.setFechaEvaluacion(evaluacion.getFecha() != null ? evaluacion.getFecha().toString() : null);
            dto.setPuntajeMinimo(evaluacion.getPuntajeMinimo());
            dto.setPuntajeMaximo(evaluacion.getPuntajeMaximo());
            dto.setTipoEvaluacion(evaluacion.getTipoEvaluacion());
            dto.setArchivoUrl(evaluacion.getArchivoUrl());
            dto.setNombreArchivo(evaluacion.getNombreArchivo());
            dto.setTieneArchivo(evaluacion.getArchivoUrl() != null && !evaluacion.getArchivoUrl().isBlank());
        }

        // Si no tiene archivo directo en la evaluación, buscar si el profesor ya subió una pauta/documento de práctica
        if ((dto.getTieneArchivo() == null || !dto.getTieneArchivo()) && estudiante.getUsuario() != null) {
            List<DocumentoPractica> docsProf = documentoPracticaRepository.findByEstudianteRut(estudiante.getUsuario().getRut());
            docsProf.stream()
                .filter(d -> "PROFESOR".equalsIgnoreCase(d.getTipoDocumento()))
                .findFirst()
                .ifPresent(d -> {
                    dto.setNombreArchivo(d.getNombreArchivo());
                    dto.setArchivoUrl(d.getUbicacion());
                    dto.setTieneArchivo(true);
                });
        }
        if (nota != null && nota.getRutEvaluador() != null) {
            dto.setEvaluadorRut(nota.getRutEvaluador());
            usuarioRepository.findByRut(nota.getRutEvaluador()).ifPresent(u -> {
                dto.setEvaluadorNombre(u.getNombre() + " " + u.getApellido());
            });
        }
        if (dto.getEvaluadorNombre() == null && estudiante.getAsignatura() != null) {
            List<Profesor> profesores = profesorRepository.findAllByAsignaturaId(estudiante.getAsignatura().getIdAsignatura());
            if (!profesores.isEmpty() && profesores.get(0).getUsuario() != null) {
                dto.setEvaluadorNombre(profesores.get(0).getUsuario().getNombre() + " " + profesores.get(0).getUsuario().getApellido());
                dto.setEvaluadorRut(profesores.get(0).getUsuario().getRut());
            }
        }
        completarEntregaAlumno(dto, estudiante.getIdEstudiante(), rutProfesor);

        return dto;
    }

    @Transactional(readOnly = true)
    public List<EstudianteEvaluacionDTO> obtenerEvaluacionesParaEstudiante(String rutEstudiante) {
        List<Estudiante> estudiantes = estudianteRepository.findAllByUsuarioRut(rutEstudiante);
        if (estudiantes.isEmpty()) {
            estudianteRepository.findByUsuarioRut(rutEstudiante).ifPresent(estudiantes::add);
        }
        List<EstudianteEvaluacionDTO> resultado = new ArrayList<>();
        Set<Long> notasProcesadas = new HashSet<>();

        for (Estudiante est : estudiantes) {
            List<Nota> notas = notaRepository.findByEstudianteIdEstudiante(est.getIdEstudiante());
            for (Nota n : notas) {
                if (!notasProcesadas.add(n.getIdNota())) {
                    continue;
                }
                // Solamente debe aparecer una vez que el profesor cree la nota Y la observación
                if (n.getPuntajeObtenido() == null) {
                    continue;
                }
                Evaluacion ev = n.getEvaluacion();
                if (ev == null || ev.getObservacion() == null || ev.getObservacion().trim().isEmpty()) {
                    continue;
                }
                resultado.add(construirDTO(est, ev, n));
            }
        }
        return resultado;
    }

    @Transactional(readOnly = true)
    public Optional<Nota> obtenerNotaPorEstudiante(Long idEstudiante) {
        return notaRepository.findFirstByEstudianteIdEstudianteOrderByIdNotaDesc(idEstudiante);
    }

    @Transactional
    public EstudianteEvaluacionDTO guardarEvaluacionConArchivo(
            Long idEstudiante,
            String rutProfesor,
            Long idEvaluacion,
            String tipoEvaluacion,
            Double puntajeObtenido,
            String observacion,
            MultipartFile file,
            Boolean eliminarArchivo) {

        GuardarEvaluacionProfesorRequest req = new GuardarEvaluacionProfesorRequest();
        req.setIdEstudiante(idEstudiante);
        req.setRutProfesor(rutProfesor);
        req.setIdEvaluacion(idEvaluacion);
        req.setTipoEvaluacion(tipoEvaluacion);
        req.setPuntajeObtenido(puntajeObtenido);
        req.setObservacion(observacion);
        req.setConservarEvaluacionPorArchivo(file != null && !file.isEmpty());

        EstudianteEvaluacionDTO dto = guardarEvaluacionProfesor(req);

        Evaluacion evaluacion = null;
        if (dto.getIdEvaluacion() != null) {
            evaluacion = evaluacionRepository.findById(dto.getIdEvaluacion()).orElse(null);
        }

        if (evaluacion != null) {
            if (Boolean.TRUE.equals(eliminarArchivo)) {
                if (evaluacion.getArchivoUrl() != null) {
                    eliminarArchivoDeEvaluacion(evaluacion);
                    evaluacion = evaluacionRepository.save(evaluacion);
                }
                limpiarArchivoRevisionEnEvidencia(idEstudiante, rutProfesor);
            } else if (file != null && !file.isEmpty()) {
                // Reemplazo: se retira el archivo anterior con todas sus copias para no dejar registros apuntando a él.
                eliminarArchivoDeEvaluacion(evaluacion);
                FileStorageService.StoredFileResult stored = fileStorageService.storeFile(
                        file,
                        "evaluaciones",
                        List.of("pdf", "doc", "docx", "xls", "xlsx", "zip", "png", "jpg", "jpeg")
                );
                evaluacion.setArchivoUrl(stored.relativePath());
                evaluacion.setNombreArchivo(stored.originalFilename());
                evaluacion = evaluacionRepository.save(evaluacion);
                sincronizarArchivoRevisionEnEvidencia(idEstudiante, rutProfesor, stored);

                // Sincronizar como DocumentoPractica del profesor para que aparezca en el expediente
                try {
                    Estudiante est = estudianteRepository.findById(idEstudiante).orElse(null);
                    Usuario prof = usuarioRepository.findByRut(rutProfesor).orElse(null);
                    if (est != null && est.getUsuario() != null && prof != null) {
                        // Se archiva en la asignatura del profesor que evalúa, no en la que el
                        // estudiante cursa ahora (si ya avanzó, quedaría en la asignatura equivocada).
                        Profesor profesorDoc = profesorRepository.findByUsuarioRut(rutProfesor).orElse(null);
                        Asignatura asignaturaProfesor = profesorDoc != null && profesorDoc.getAsignatura() != null
                                ? profesorDoc.getAsignatura()
                                : est.getAsignatura();
                        DocumentoPractica doc = new DocumentoPractica();
                        doc.setUsuario(prof);
                        doc.setEstudiante(est.getUsuario());
                        doc.setAsignatura(asignaturaProfesor);
                        doc.setNombreArchivo(stored.originalFilename());
                        doc.setNombreDocumento((tipoEvaluacion != null && !tipoEvaluacion.isBlank()) ? tipoEvaluacion : "Pauta de Evaluación y Retroalimentación");
                        doc.setTipoDocumento("PROFESOR");
                        doc.setUbicacion(stored.relativePath());
                        doc.setFechaCarga(LocalDateTime.now());
                        doc.setEstado("ENTREGADO");
                        doc.setTamanioBytes(stored.sizeBytes());
                        documentoPracticaRepository.save(doc);
                    }
                } catch (Exception e) {
                    logger.warn("No se pudo sincronizar DocumentoPractica para evaluación: {}", e.getMessage());
                }
            }

            Estudiante estudiante = estudianteRepository.findById(idEstudiante).orElse(null);
            Nota nota = notaRepository
                    .findByEstudianteIdEstudianteAndRutEvaluadorOrderByIdNotaDesc(idEstudiante, rutProfesor)
                    .stream().findFirst().orElse(null);
            return construirDTO(estudiante, evaluacion, nota, rutProfesor);
        }

        return dto;
    }

    private void sincronizarRevisionEnEvidencia(Estudiante estudiante, Profesor profesor,
                                                Nota nota, String observacion) {
        evidenciaRepository
                .findFirstByEstudianteIdEstudianteAndActividadProfesorUsuarioRutOrderByFechaEntregaDesc(
                        estudiante.getIdEstudiante(), profesor.getUsuario().getRut())
                .ifPresent(evidencia -> {
                    evidencia.setNota(nota);
                    evidencia.setRevisadoPor(profesor);
                    evidencia.setRetroalimentacion(observacion);
                    evidencia.setFechaRevision(LocalDateTime.now());
                    // setNota ya derivó el estado de la nota; si quedó vacía, la entrega vuelve a "REVISADO".
                    if (nota.getPuntajeObtenido() == null) {
                        evidencia.setEstado("REVISADO");
                    }
                    evidenciaRepository.save(evidencia);
                    actualizarAvanceDesdeEvidencia(evidencia);
                });
    }

    private void sincronizarArchivoRevisionEnEvidencia(Long idEstudiante, String rutProfesor,
                                                        FileStorageService.StoredFileResult stored) {
        Estudiante estudiante = estudianteRepository.findById(idEstudiante).orElse(null);
        Profesor profesor = profesorRepository.findByUsuarioRut(rutProfesor).orElse(null);
        if (estudiante == null || profesor == null || estudiante.getUsuario() == null) {
            return;
        }

        evidenciaRepository
                .findFirstByEstudianteIdEstudianteAndActividadProfesorUsuarioRutOrderByFechaEntregaDesc(
                        idEstudiante, rutProfesor)
                .ifPresent(evidencia -> {
                    Documento documento = new Documento(
                            stored.originalFilename(), "EVIDENCIA_REVISION", stored.relativePath(), profesor.getUsuario());
                    documento.setTamanioBytes(stored.sizeBytes());
                    documento.setRutEstudiante(estudiante.getUsuario().getRut());
                    documento.setAsignatura(evidencia.getAsignatura());
                    documento.setActividad(evidencia.getActividad());

                    Documento guardado = documentoRepository.save(documento);
                    Documento documentoAnterior = evidencia.getArchivoProfesor();
                    evidencia.setArchivoProfesor(guardado);
                    evidencia.setNombreArchivoRevision(guardado.getNombre());
                    evidencia.setArchivoRevisionUrl(guardado.getUbicacion());
                    evidencia.setRevisadoPor(profesor);
                    evidencia.setFechaRevision(LocalDateTime.now());
                    if (evidencia.getCalificacion() == null) {
                        evidencia.setEstado("REVISADO");
                    }
                    evidenciaRepository.saveAndFlush(evidencia);
                    if (documentoAnterior != null && !documentoAnterior.equals(guardado)) {
                        documentoRepository.delete(documentoAnterior);
                    }
                });
    }

    private void limpiarArchivoRevisionEnEvidencia(Long idEstudiante, String rutProfesor) {
        evidenciaRepository
                .findFirstByEstudianteIdEstudianteAndActividadProfesorUsuarioRutOrderByFechaEntregaDesc(
                        idEstudiante, rutProfesor)
                .ifPresent(evidencia -> {
                    evidencia.setArchivoProfesor(null);
                    evidencia.setNombreArchivoRevision(null);
                    evidencia.setArchivoRevisionUrl(null);
                    evidenciaRepository.save(evidencia);
                });
    }

    private void actualizarAvanceDesdeEvidencia(Evidencia evidencia) {
        if (evidencia.getEstudiante() != null
                && evidencia.getActividad() != null
                && evidencia.getActividad().getAsignatura() != null) {
            avanceAcademicoService.recalcularYGuardar(
                    evidencia.getEstudiante(), evidencia.getActividad().getAsignatura());
        }
    }

    public Resource obtenerRecursoArchivo(Long idEvaluacion) {
        Evaluacion ev = evaluacionRepository.findById(idEvaluacion)
                .orElseThrow(() -> new IllegalArgumentException("Evaluación no encontrada con ID: " + idEvaluacion));
        if (ev.getArchivoUrl() == null || ev.getArchivoUrl().isBlank()) {
            throw new IllegalArgumentException("La evaluación no tiene ningún archivo adjunto");
        }
        return fileStorageService.loadFileAsResource(ev.getArchivoUrl());
    }

    public Resource obtenerRecursoArchivoPorEstudiante(Long idEstudiante) {
        Estudiante est = estudianteRepository.findById(idEstudiante)
                .orElseThrow(() -> new IllegalArgumentException("Estudiante no encontrado con ID: " + idEstudiante));
        List<Nota> notas = notaRepository.findByEstudianteIdEstudiante(idEstudiante);
        for (Nota n : notas) {
            if (n.getEvaluacion() != null && n.getEvaluacion().getArchivoUrl() != null && !n.getEvaluacion().getArchivoUrl().isBlank()) {
                return fileStorageService.loadFileAsResource(n.getEvaluacion().getArchivoUrl());
            }
        }
        if (est.getUsuario() != null) {
            List<DocumentoPractica> docs = documentoPracticaRepository.findByEstudianteRut(est.getUsuario().getRut());
            for (DocumentoPractica d : docs) {
                if ("PROFESOR".equalsIgnoreCase(d.getTipoDocumento()) && d.getUbicacion() != null) {
                    return fileStorageService.loadFileAsResource(d.getUbicacion());
                }
            }
        }
        throw new IllegalArgumentException("No hay archivo de evaluación disponible para el estudiante seleccionado");
    }

    @Transactional
    public EstudianteEvaluacionDTO eliminarArchivoEvaluacion(Long idEvaluacion) {
        Evaluacion ev = evaluacionRepository.findById(idEvaluacion)
                .orElseThrow(() -> new IllegalArgumentException("Evaluación no encontrada con ID: " + idEvaluacion));
        if (ev.getArchivoUrl() != null) {
            eliminarArchivoDeEvaluacion(ev);
            evaluacionRepository.save(ev);
        }
        Estudiante est = null;
        if (ev.getPractica() != null && ev.getPractica().getEstudiante() != null) {
            est = ev.getPractica().getEstudiante();
        } else {
            List<Nota> notas = notaRepository.findAll();
            for (Nota n : notas) {
                if (n.getEvaluacion() != null && n.getEvaluacion().getIdEvaluacion().equals(idEvaluacion)) {
                    est = n.getEstudiante();
                    break;
                }
            }
        }
        if (est == null) {
            throw new IllegalStateException("No se pudo localizar al estudiante de la evaluación");
        }
        Nota nota = notaRepository.findFirstByEstudianteIdEstudianteOrderByIdNotaDesc(est.getIdEstudiante()).orElse(null);
        return construirDTO(est, ev, nota);
    }
}
