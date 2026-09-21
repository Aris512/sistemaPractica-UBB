package com.backend.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.backend.dto.EstudianteEvaluacionDTO;
import com.backend.dto.GuardarEvaluacionProfesorRequest;
import com.backend.model.Asignatura;
import com.backend.model.Estudiante;
import com.backend.model.Evaluacion;
import com.backend.model.Nota;
import com.backend.model.ObservacionEvaluacion;
import com.backend.model.Practica;
import com.backend.model.Profesor;
import com.backend.repository.DocumentoPracticaRepository;
import com.backend.repository.EstudianteRepository;
import com.backend.repository.EvaluacionRepository;
import com.backend.repository.NotaRepository;
import com.backend.repository.ObservacionEvaluacionRepository;
import com.backend.repository.PracticaRepository;
import com.backend.repository.ProfesorRepository;
import com.backend.repository.UsuarioRepository;

@Service
public class EvaluacionService {

    private final EvaluacionRepository evaluacionRepository;
    private final NotaRepository notaRepository;
    private final ProfesorRepository profesorRepository;
    private final EstudianteRepository estudianteRepository;
    private final PracticaRepository practicaRepository;
    private final DocumentoPracticaRepository documentoPracticaRepository;
    private final UsuarioRepository usuarioRepository;
    private final ObservacionEvaluacionRepository observacionEvaluacionRepository;

    public EvaluacionService(
            EvaluacionRepository evaluacionRepository,
            NotaRepository notaRepository,
            ProfesorRepository profesorRepository,
            EstudianteRepository estudianteRepository,
            PracticaRepository practicaRepository,
            DocumentoPracticaRepository documentoPracticaRepository,
            UsuarioRepository usuarioRepository,
            ObservacionEvaluacionRepository observacionEvaluacionRepository) {
        this.evaluacionRepository = evaluacionRepository;
        this.notaRepository = notaRepository;
        this.profesorRepository = profesorRepository;
        this.estudianteRepository = estudianteRepository;
        this.practicaRepository = practicaRepository;
        this.documentoPracticaRepository = documentoPracticaRepository;
        this.usuarioRepository = usuarioRepository;
        this.observacionEvaluacionRepository = observacionEvaluacionRepository;
    }

    public List<Evaluacion> obtenerTodos() {
        return evaluacionRepository.findAll();
    }

    public Evaluacion obtenerPorId(Long id) {
        return evaluacionRepository.findById(id).orElse(null);
    }

    public Evaluacion crear(Evaluacion evaluacion) {
        return evaluacionRepository.save(evaluacion);
    }

    public void eliminar(Long id) {
        evaluacionRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<EstudianteEvaluacionDTO> obtenerEstudiantesParaProfesor(String rutProfesor) {
        Profesor profesor = profesorRepository.findByUsuarioRut(rutProfesor)
                .orElseThrow(() -> new RuntimeException("Profesor no encontrado con RUT: " + rutProfesor));

        Set<Asignatura> asignaturas = new HashSet<>();
        if (profesor.getAsignatura() != null) {
            asignaturas.add(profesor.getAsignatura());
        }
        if (profesor.getAsignaturas() != null) {
            asignaturas.addAll(profesor.getAsignaturas());
        }

        List<EstudianteEvaluacionDTO> resultado = new ArrayList<>();
        Set<Long> estudiantesProcesados = new HashSet<>();

        for (Asignatura asignatura : asignaturas) {
            List<Estudiante> estudiantes = estudianteRepository.findByAsignaturaIdAsignatura(asignatura.getIdAsignatura());
            for (Estudiante estudiante : estudiantes) {
                if (!estudiantesProcesados.add(estudiante.getIdEstudiante())) {
                    continue;
                }

                // Estado de entrega (Documentos)
                long docCount = 0;
                if (estudiante.getUsuario() != null) {
                    docCount = documentoPracticaRepository.countByEstudianteRutAndAsignaturaIdAsignatura(
                            estudiante.getUsuario().getRut(), asignatura.getIdAsignatura()
                    );
                }
                String estadoEntrega = docCount > 0 ? "ENTREGADO" : "NO_ENTREGADO";

                // Práctica asociada
                List<Practica> practicas = practicaRepository.findByEstudianteIdEstudiante(estudiante.getIdEstudiante());
                Practica practica = practicas.stream()
                        .filter(p -> p.getAsignatura() != null && p.getAsignatura().getIdAsignatura().equals(asignatura.getIdAsignatura()))
                        .findFirst()
                        .orElse(practicas.isEmpty() ? null : practicas.get(0));

                // Nota existente
                Optional<Nota> notaOpt = notaRepository.findFirstByEstudianteIdEstudianteOrderByIdNotaDesc(estudiante.getIdEstudiante());

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

        // 1. Resolver si ya existe una Nota previa para este estudiante
        List<Nota> notasEstudiante = notaRepository.findByEstudianteIdEstudiante(estudiante.getIdEstudiante());
        Nota notaExistente = notasEstudiante.isEmpty() ? null : notasEstudiante.get(0);
        if (notasEstudiante.size() > 1) {
            for (int i = 1; i < notasEstudiante.size(); i++) {
                notaRepository.delete(notasEstudiante.get(i));
            }
            notaRepository.flush();
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
        if (req.getPuntajeObtenido() == null && obsLimpia == null) {
            if (notaExistente != null) {
                notaRepository.delete(notaExistente);
                notaRepository.flush();
                notaExistente = null;
            }
            if (evaluacion != null && evaluacion.getPractica() == null) {
                List<ObservacionEvaluacion> obsHijas = observacionEvaluacionRepository.findByEvaluacion_IdEvaluacion(evaluacion.getIdEvaluacion());
                if (!obsHijas.isEmpty()) {
                    observacionEvaluacionRepository.deleteAll(obsHijas);
                    observacionEvaluacionRepository.flush();
                }
                evaluacionRepository.delete(evaluacion);
                evaluacionRepository.flush();
                evaluacion = null;
            }
            return construirDTO(estudiante, evaluacion, null);
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
            evaluacion.setPuntajeMinimo(req.getPuntajeMinimo() != null ? req.getPuntajeMinimo() : 1.0);
            evaluacion.setPuntajeMaximo(req.getPuntajeMaximo() != null ? req.getPuntajeMaximo() : 7.0);
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

        return construirDTO(estudiante, evaluacion, notaExistente);
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
                return construirDTO(estudiante, evaluacion, nota);
            } else {
                // Si no hay observación, eliminar nota y evaluación huérfana
                notaRepository.delete(nota);
                notaRepository.flush();
                if (evaluacion != null && evaluacion.getPractica() == null) {
                    List<ObservacionEvaluacion> obsHijas = observacionEvaluacionRepository.findByEvaluacion_IdEvaluacion(evaluacion.getIdEvaluacion());
                    if (!obsHijas.isEmpty()) {
                        observacionEvaluacionRepository.deleteAll(obsHijas);
                        observacionEvaluacionRepository.flush();
                    }
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
                notaRepository.delete(nota);
                notaRepository.flush();
                nota = null;
                if (evaluacion != null && evaluacion.getPractica() == null) {
                    List<ObservacionEvaluacion> obsHijas = observacionEvaluacionRepository.findByEvaluacion_IdEvaluacion(evaluacion.getIdEvaluacion());
                    if (!obsHijas.isEmpty()) {
                        observacionEvaluacionRepository.deleteAll(obsHijas);
                        observacionEvaluacionRepository.flush();
                    }
                    evaluacionRepository.delete(evaluacion);
                    evaluacionRepository.flush();
                    evaluacion = null;
                }
            }
        }

        return construirDTO(estudiante, evaluacion, nota);
    }

    private EstudianteEvaluacionDTO construirDTO(Estudiante estudiante, Evaluacion evaluacion, Nota nota) {
        EstudianteEvaluacionDTO dto = new EstudianteEvaluacionDTO();
        dto.setIdEstudiante(estudiante.getIdEstudiante());
        if (estudiante.getUsuario() != null) {
            dto.setNombre(estudiante.getUsuario().getNombre());
            dto.setApellido(estudiante.getUsuario().getApellido());
            dto.setRut(estudiante.getUsuario().getRut());
            dto.setCorreo(estudiante.getUsuario().getCorreo());
        }
        if (estudiante.getAsignatura() != null) {
            dto.setAsignatura(estudiante.getAsignatura().getNombre());
            dto.setIdAsignatura(estudiante.getAsignatura().getIdAsignatura());
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
        }
        if (nota != null && nota.getRutEvaluador() != null) {
            dto.setEvaluadorRut(nota.getRutEvaluador());
            usuarioRepository.findByRut(nota.getRutEvaluador()).ifPresent(u -> {
                dto.setEvaluadorNombre(u.getNombre() + " " + u.getApellido());
            });
        }

        return dto;
    }

    @Transactional(readOnly = true)
    public Optional<Nota> obtenerNotaPorEstudiante(Long idEstudiante) {
        return notaRepository.findFirstByEstudianteIdEstudianteOrderByIdNotaDesc(idEstudiante);
    }
}
