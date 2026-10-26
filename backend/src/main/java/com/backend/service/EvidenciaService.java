package com.backend.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.backend.dto.RevisionEvidenciaDTO;
import com.backend.dto.SeguimientoEstudianteDTO;
import com.backend.dto.SubirEvidenciaDTO;
import com.backend.model.Actividad;
import com.backend.model.Asignatura;
import com.backend.model.Documento;
import com.backend.model.Estudiante;
import com.backend.model.Evidencia;
import com.backend.model.Nota;
import com.backend.model.Profesor;
import com.backend.model.Usuario;
import com.backend.repository.ActividadRepository;
import com.backend.repository.DocumentoRepository;
import com.backend.repository.EstudianteRepository;
import com.backend.repository.EvidenciaRepository;
import com.backend.repository.NotaRepository;
import com.backend.repository.ProfesorRepository;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

@Service
public class EvidenciaService {

    private final EvidenciaRepository evidenciaRepository;
    private final ActividadRepository actividadRepository;
    private final EstudianteRepository estudianteRepository;
    private final ProfesorRepository profesorRepository;
    private final DocumentoRepository documentoRepository;
    private final NotaRepository notaRepository;
    private final FileStorageService fileStorageService;
    private final AvanceAcademicoService avanceAcademicoService;

    public EvidenciaService(EvidenciaRepository evidenciaRepository,
                            ActividadRepository actividadRepository,
                            EstudianteRepository estudianteRepository,
                            ProfesorRepository profesorRepository,
                            DocumentoRepository documentoRepository,
                            NotaRepository notaRepository,
                            FileStorageService fileStorageService,
                            AvanceAcademicoService avanceAcademicoService) {
        this.evidenciaRepository = evidenciaRepository;
        this.actividadRepository = actividadRepository;
        this.estudianteRepository = estudianteRepository;
        this.profesorRepository = profesorRepository;
        this.documentoRepository = documentoRepository;
        this.notaRepository = notaRepository;
        this.fileStorageService = fileStorageService;
        this.avanceAcademicoService = avanceAcademicoService;
    }

    public List<Evidencia> obtenerTodas() {
        return evidenciaRepository.findAllByOrderByFechaEntregaDesc();
    }

    public Evidencia obtenerPorId(Long id) {
        return evidenciaRepository.findById(id).orElse(null);
    }

    public List<Evidencia> obtenerHistorialEstudiante(String rutEstudiante) {
        return evidenciaRepository.findByEstudianteUsuarioRutOrderByFechaEntregaDesc(rutEstudiante);
    }

    public List<Evidencia> obtenerPorActividad(Long idActividad) {
        return evidenciaRepository.findByActividadIdActividadOrderByFechaEntregaDesc(idActividad);
    }

    public List<Evidencia> obtenerPorProfesor(String rutProfesor) {
        return evidenciaRepository.findByActividadProfesorUsuarioRutOrderByFechaEntregaDesc(rutProfesor);
    }

    public List<SeguimientoEstudianteDTO> obtenerSeguimientoProfesor(String rutProfesor) {
        Profesor profesor = profesorRepository.findByUsuarioRut(rutProfesor).orElse(null);
        List<Estudiante> estudiantes;

        if (profesor != null && profesor.getAsignatura() != null) {
            estudiantes = estudianteRepository.findByAsignaturaIdAsignatura(profesor.getAsignatura().getIdAsignatura());
            if (estudiantes.isEmpty()) {
                estudiantes = estudianteRepository.findAll();
            }
        } else {
            estudiantes = estudianteRepository.findAll();
        }

        List<Evidencia> evidenciasProfesor = evidenciaRepository.findByActividadProfesorUsuarioRutOrderByFechaEntregaDesc(rutProfesor);

        List<SeguimientoEstudianteDTO> resultado = new ArrayList<>();

        for (Estudiante est : estudiantes) {
            if (est.getUsuario() == null) continue;
            Usuario u = est.getUsuario();
            // Restricción: No incluir alumnos en estado inactivo
            if (!u.isActivo() || "inactivo".equalsIgnoreCase(u.getEstado()) || "INACTIVO".equalsIgnoreCase(est.getEstado())) {
                continue;
            }

            Evidencia ev = evidenciasProfesor.stream()
                    .filter(e -> e.getEstudiante() != null && e.getEstudiante().getIdEstudiante().equals(est.getIdEstudiante()))
                    .findFirst()
                    .orElse(null);

            String nombreCompleto = est.getUsuario().getNombre() + " " + est.getUsuario().getApellido();
            String rut = est.getUsuario().getRut();
            String correo = est.getUsuario().getCorreo();

            if (ev != null) {
                String estadoRevision = ev.getEstado() != null ? ev.getEstado() : "PENDIENTE_REVISION";
                SeguimientoEstudianteDTO dto = new SeguimientoEstudianteDTO(
                        est.getIdEstudiante(),
                        ev.getIdEvidencia(),
                        ev.getActividad() != null ? ev.getActividad().getIdActividad() : null,
                        rut,
                        nombreCompleto,
                        correo,
                        ev.getActividad() != null ? ev.getActividad().getTitulo() : "Evidencia de Práctica",
                        "ENTREGADO",
                        estadoRevision,
                        ev.getFechaEntrega(),
                        ev.getNombreArchivo(),
                        ev.getArchivoUrl(),
                        ev.getComentarioEstudiante(),
                        ev.getCalificacion(),
                        ev.getRetroalimentacion(),
                        ev.getFechaRevision()
                );
                dto.setIdArchivoAlumno(ev.getIdArchivoAlumno());
                dto.setIdArchivoProfesor(ev.getIdArchivoProfesor());
                dto.setIdNota(ev.getIdNota());
                dto.setAprobado(ev.getAprobado());
                resultado.add(dto);
            } else {
                resultado.add(new SeguimientoEstudianteDTO(
                        est.getIdEstudiante(),
                        null,
                        null,
                        rut,
                        nombreCompleto,
                        correo,
                        "Evidencia de Práctica",
                        "PENDIENTE",
                        "SIN_ENTREGA",
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null
                ));
            }
        }

        return resultado;
    }

    public void validarPlazoEntrega(Long idActividad) {
        Actividad actividad = actividadRepository.findById(idActividad)
                .orElseThrow(() -> new IllegalArgumentException("Actividad no encontrada con ID: " + idActividad));
        validarPlazoEntrega(actividad);
    }

    public void validarPlazoEntrega(Actividad actividad) {
        if (actividad.getFechaLimite() != null && LocalDateTime.now().isAfter(actividad.getFechaLimite())) {
            throw new IllegalArgumentException("El plazo de entrega ha vencido. No se permiten nuevas entregas ni reemplazos.");
        }
        if ("CERRADA".equalsIgnoreCase(actividad.getEstado())) {
            throw new IllegalArgumentException("Esta actividad está cerrada y no admite entregas.");
        }
    }

    @Transactional
    public Evidencia subirEvidencia(SubirEvidenciaDTO dto) {
        Actividad actividad = actividadRepository.findById(dto.getIdActividad())
                .orElseThrow(() -> new IllegalArgumentException("Actividad no encontrada con ID: " + dto.getIdActividad()));

        validarPlazoEntrega(actividad);

        Estudiante estudiante = estudianteRepository.findByUsuarioRut(dto.getRutEstudiante())
                .orElseThrow(() -> new IllegalArgumentException("Estudiante no encontrado con RUT: " + dto.getRutEstudiante()));

        // Verificar si el estudiante ya había subido una entrega para esta actividad (actualización)
        Optional<Evidencia> existenteOpt = evidenciaRepository
                .findByActividadIdActividadAndEstudianteUsuarioRut(actividad.getIdActividad(), dto.getRutEstudiante());

        Evidencia evidencia;
        if (existenteOpt.isPresent()) {
            evidencia = existenteOpt.get();
            evidencia.setNombreArchivo(dto.getNombreArchivo());
            evidencia.setArchivoUrl(dto.getArchivoUrl());
            evidencia.setComentarioEstudiante(dto.getComentario());
            evidencia.setFechaEntrega(LocalDateTime.now());
            evidencia.setEstado("PENDIENTE");
        } else {
            evidencia = new Evidencia(
                    actividad,
                    estudiante,
                    dto.getNombreArchivo(),
                    dto.getArchivoUrl(),
                    dto.getComentario()
            );
        }

        return evidenciaRepository.save(evidencia);
    }

    /**
     * Guarda el archivo de entrega y lo asocia tanto al documento como a la
     * evidencia de la actividad. Si el estudiante ya entregó, se reemplaza su
     * archivo mientras el plazo permanezca vigente.
     */
    @Transactional
    public Documento subirArchivoEstudiante(Long idActividad, String rutEstudiante,
                                             String comentario, MultipartFile archivo) {
        Actividad actividad = actividadRepository.findById(idActividad)
                .orElseThrow(() -> new IllegalArgumentException("Actividad no encontrada con ID: " + idActividad));
        validarPlazoEntrega(actividad);

        Estudiante estudiante = estudianteRepository.findByUsuarioRut(rutEstudiante)
                .orElseThrow(() -> new IllegalArgumentException("Estudiante no encontrado con RUT: " + rutEstudiante));

        FileStorageService.StoredFileResult stored = fileStorageService.storeFile(
                archivo,
                "evidencias-estudiantes",
                List.of("pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "png", "jpg", "jpeg", "zip")
        );

        Documento documento = crearDocumento(stored, estudiante.getUsuario(), estudiante, actividad,
                "EVIDENCIA_ESTUDIANTE");
        Documento guardado = documentoRepository.save(documento);

        Evidencia evidencia = evidenciaRepository
                .findByActividadIdActividadAndEstudianteUsuarioRut(idActividad, rutEstudiante)
                .orElseGet(() -> new Evidencia(actividad, estudiante, guardado, null, null));

        String archivoAnterior = evidencia.getArchivoUrl();
        Documento documentoAnterior = evidencia.getArchivoAlumno() != guardado ? evidencia.getArchivoAlumno() : null;
        evidencia.setArchivoAlumno(guardado);
        evidencia.setNombreArchivo(guardado.getNombre());
        evidencia.setArchivoUrl(guardado.getUbicacion());
        evidencia.setComentarioEstudiante(comentario);
        evidencia.setFechaEntrega(LocalDateTime.now());
        evidencia.setEstado("PENDIENTE");
        evidenciaRepository.saveAndFlush(evidencia);

        // La evidencia ya apunta al documento nuevo: el anterior pasa a ser un registro huérfano.
        if (documentoAnterior != null) {
            documentoRepository.delete(documentoAnterior);
        }
        if (archivoAnterior != null && !archivoAnterior.equals(guardado.getUbicacion())) {
            fileStorageService.deleteFile(archivoAnterior);
        }
        return guardado;
    }

    /** Califica una entrega existente y permite adjuntar una revisión del profesor. */
    @Transactional
    public Evidencia calificarORevisarActividad(Long idActividad, String rutEstudiante,
                                                 String rutProfesor, Double calificacion,
                                                 String observacion, MultipartFile archivoRevision) {
        if (calificacion == null || calificacion < 1.0 || calificacion > 7.0) {
            throw new IllegalArgumentException("La calificación debe estar entre 1.0 y 7.0.");
        }

        Estudiante estudiante = estudianteRepository.findByUsuarioRut(rutEstudiante)
                .orElseThrow(() -> new IllegalArgumentException("Estudiante no encontrado con RUT: " + rutEstudiante));
        Profesor profesor = profesorRepository.findByUsuarioRut(rutProfesor)
                .orElseThrow(() -> new IllegalArgumentException("Profesor no encontrado con RUT: " + rutProfesor));
        Evidencia evidencia = evidenciaRepository
                .findByActividadIdActividadAndEstudianteUsuarioRut(idActividad, rutEstudiante)
                .orElseThrow(() -> new IllegalArgumentException("El estudiante no tiene una entrega para esta actividad."));

        if (archivoRevision != null && !archivoRevision.isEmpty()) {
            FileStorageService.StoredFileResult stored = fileStorageService.storeFile(
                    archivoRevision,
                    "revisiones-evidencias",
                    List.of("pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "png", "jpg", "jpeg", "zip")
            );
            Documento documento = documentoRepository.save(crearDocumento(
                    stored, profesor.getUsuario(), estudiante, evidencia.getActividad(), "EVIDENCIA_REVISION"));
            String archivoAnterior = evidencia.getArchivoRevisionUrl();
            Documento documentoAnterior = evidencia.getArchivoProfesor();
            evidencia.setArchivoProfesor(documento);
            evidencia.setNombreArchivoRevision(documento.getNombre());
            evidencia.setArchivoRevisionUrl(documento.getUbicacion());
            evidenciaRepository.saveAndFlush(evidencia);
            if (documentoAnterior != null) {
                documentoRepository.delete(documentoAnterior);
            }
            if (archivoAnterior != null && !archivoAnterior.equals(documento.getUbicacion())) {
                fileStorageService.deleteFile(archivoAnterior);
            }
        }

        Nota nota = evidencia.getNota() != null ? evidencia.getNota() : new Nota();
        nota.setEstudiante(estudiante);
        nota.setPuntajeObtenido(calificacion);
        nota.setRutEvaluador(rutProfesor);
        evidencia.setNota(notaRepository.save(nota));
        evidencia.setRevisadoPor(profesor);
        evidencia.setRetroalimentacion(observacion);
        evidencia.setFechaRevision(LocalDateTime.now());
        Evidencia guardada = evidenciaRepository.save(evidencia);
        actualizarAvanceCurso(guardada);
        return guardada;
    }

    @Transactional
    public Evidencia revisarEvidencia(Long idEvidencia, RevisionEvidenciaDTO dto) {
        Evidencia evidencia = evidenciaRepository.findById(idEvidencia)
            .orElseThrow(() -> new IllegalArgumentException("Evidencia no encontrada con ID: " + idEvidencia));

        aplicarRevision(evidencia, dto);
        Evidencia guardada = evidenciaRepository.save(evidencia);
        actualizarAvanceCurso(guardada);
        return guardada;
    }

    @Transactional
    public Evidencia revisarEvidenciaConArchivo(Long idEvidencia, RevisionEvidenciaDTO dto, MultipartFile archivoRevision) {
        Evidencia evidencia = evidenciaRepository.findById(idEvidencia)
            .orElseThrow(() -> new IllegalArgumentException("Evidencia no encontrada con ID: " + idEvidencia));

        if (archivoRevision != null && !archivoRevision.isEmpty()) {
            FileStorageService.StoredFileResult stored = fileStorageService.storeFile(
                archivoRevision,
                "revisiones-evidencias",
                List.of("pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "png", "jpg", "jpeg", "zip")
            );
            String archivoAnterior = evidencia.getArchivoRevisionUrl();
            Documento documentoAnterior = evidencia.getArchivoProfesor();
            Usuario autor = evidencia.getRevisadoPor() != null ? evidencia.getRevisadoPor().getUsuario() : null;
            if (dto.getRutProfesor() != null) {
                Profesor revisor = profesorRepository.findByUsuarioRut(dto.getRutProfesor()).orElse(null);
                if (revisor != null) {
                    autor = revisor.getUsuario();
                }
            }
            // Se registra como Documento (el getter de la evidencia prioriza archivoProfesor sobre la URL suelta).
            Documento documento = documentoRepository.save(crearDocumento(
                    stored, autor, evidencia.getEstudiante(), evidencia.getActividad(), "EVIDENCIA_REVISION"));
            evidencia.setArchivoProfesor(documento);
            evidencia.setNombreArchivoRevision(documento.getNombre());
            evidencia.setArchivoRevisionUrl(documento.getUbicacion());
            evidenciaRepository.saveAndFlush(evidencia);
            if (documentoAnterior != null) {
                documentoRepository.delete(documentoAnterior);
            }
            if (archivoAnterior != null && !archivoAnterior.equals(documento.getUbicacion())) {
                fileStorageService.deleteFile(archivoAnterior);
            }
        }

        aplicarRevision(evidencia, dto);
        Evidencia guardada = evidenciaRepository.save(evidencia);
        actualizarAvanceCurso(guardada);
        return guardada;
    }

    private void aplicarRevision(Evidencia evidencia, RevisionEvidenciaDTO dto) {

        if (dto.getRutProfesor() != null) {
            Profesor profesor = profesorRepository.findByUsuarioRut(dto.getRutProfesor()).orElse(null);
            evidencia.setRevisadoPor(profesor);
        }

        evidencia.setRetroalimentacion(dto.getRetroalimentacion());
        evidencia.setFechaRevision(LocalDateTime.now());
        aplicarCalificacion(evidencia, dto.getCalificacion(), dto.getRutProfesor());

        if (dto.getEstado() != null && !dto.getEstado().isBlank()) {
            evidencia.setEstado(dto.getEstado().toUpperCase());
        } else if (evidencia.getCalificacion() == null) {
            evidencia.setEstado("REVISADO");
        }
    }

    /**
     * La calificación vive solo en la tabla nota: se crea/actualiza la Nota de la evidencia,
     * o se elimina si la calificación viene vacía.
     */
    private void aplicarCalificacion(Evidencia evidencia, Double calificacion, String rutProfesor) {
        Nota nota = evidencia.getNota();
        if (calificacion == null) {
            if (nota != null) {
                evidencia.setNota(null);
                evidenciaRepository.saveAndFlush(evidencia);
                if (nota.getEvaluacion() == null) {
                    notaRepository.delete(nota);
                }
            }
            return;
        }
        if (calificacion < 1.0 || calificacion > 7.0) {
            throw new IllegalArgumentException("La calificación debe estar entre 1.0 y 7.0.");
        }
        if (nota == null) {
            nota = new Nota();
            nota.setEstudiante(evidencia.getEstudiante());
        }
        nota.setPuntajeObtenido(calificacion);
        if (rutProfesor != null) {
            nota.setRutEvaluador(rutProfesor);
        }
        evidencia.setNota(notaRepository.save(nota));
    }

    private void actualizarAvanceCurso(Evidencia evidencia) {
        if (evidencia.getEstudiante() == null || evidencia.getActividad() == null) return;
        var asignatura = evidencia.getActividad().getAsignatura();
        if (asignatura == null) return;
        avanceAcademicoService.recalcularYGuardar(evidencia.getEstudiante(), asignatura);
    }

    public Resource obtenerRecursoArchivo(Long idEvidencia, boolean revision) {
        Evidencia evidencia = evidenciaRepository.findById(idEvidencia)
            .orElseThrow(() -> new IllegalArgumentException("Evidencia no encontrada con ID: " + idEvidencia));
        String ruta = revision ? evidencia.getArchivoRevisionUrl() : evidencia.getArchivoUrl();
        if (ruta == null || ruta.isBlank()) {
            throw new IllegalArgumentException("El archivo solicitado no está disponible.");
        }
        return fileStorageService.loadFileAsResource(ruta);
    }

    @Transactional
    public void eliminar(Long id) {
        Evidencia evidencia = evidenciaRepository.findById(id).orElse(null);
        if (evidencia != null) {
            eliminarEvidencia(evidencia);
        }
    }

    @Transactional
    public void eliminarEntregaEstudiante(Long idActividad, String rutEstudiante) {
        Evidencia evidencia = evidenciaRepository
                .findByActividadIdActividadAndEstudianteUsuarioRut(idActividad, rutEstudiante)
                .orElseThrow(() -> new IllegalArgumentException("No existe una entrega para la actividad y estudiante indicados."));
        eliminarEvidencia(evidencia);
    }

    private Documento crearDocumento(FileStorageService.StoredFileResult stored, Usuario usuario,
                                     Estudiante estudiante, Actividad actividad, String tipo) {
        Documento documento = new Documento(stored.originalFilename(), tipo, stored.relativePath(), usuario);
        documento.setTamanioBytes(stored.sizeBytes());
        documento.setRutEstudiante(estudiante.getUsuario().getRut());
        documento.setAsignatura(actividad.getAsignatura());
        documento.setActividad(actividad);
        return documento;
    }

    private void eliminarEvidencia(Evidencia evidencia) {
        Actividad actividad = evidencia.getActividad();
        if (actividad != null) {
            validarPlazoEntrega(actividad);
        }
        eliminarEvidenciaConArchivos(evidencia);
    }

    /**
     * Elimina la evidencia junto con los Documento que la respaldan y sus archivos físicos.
     * Primero se desvincula y borra el registro (FK), y los archivos se eliminan solo tras el commit
     * y si ningún otro registro los sigue usando.
     */
    private void eliminarEvidenciaConArchivos(Evidencia evidencia) {
        Estudiante estudiante = evidencia.getEstudiante();
        Asignatura asignatura = evidencia.getActividad() != null ? evidencia.getActividad().getAsignatura() : null;
        String urlAlumno = evidencia.getArchivoUrl();
        String urlRevision = evidencia.getArchivoRevisionUrl();
        Documento docAlumno = evidencia.getArchivoAlumno();
        Documento docProfesor = evidencia.getArchivoProfesor();

        evidencia.setArchivoAlumno(null);
        evidencia.setArchivoProfesor(null);
        evidenciaRepository.saveAndFlush(evidencia);
        evidenciaRepository.delete(evidencia);
        evidenciaRepository.flush();

        if (docAlumno != null) documentoRepository.delete(docAlumno);
        if (docProfesor != null) documentoRepository.delete(docProfesor);
        documentoRepository.flush();

        fileStorageService.deleteFile(urlAlumno);
        fileStorageService.deleteFile(urlRevision);

        // Sin la entrega la tarea deja de estar calificada: la asignatura no puede seguir aprobada.
        if (estudiante != null && asignatura != null) {
            avanceAcademicoService.recalcularYGuardar(estudiante, asignatura);
        }
    }

    /** Recalcula el avance de los estudiantes en la asignatura (p. ej. tras eliminar una actividad). */
    @Transactional
    public void recalcularAvance(Collection<Estudiante> estudiantes, Asignatura asignatura) {
        if (asignatura == null) return;
        for (Estudiante estudiante : estudiantes) {
            avanceAcademicoService.recalcularYGuardar(estudiante, asignatura);
        }
    }

    /** Elimina todas las entregas de una actividad (con sus documentos y archivos) antes de borrar la actividad. */
    @Transactional
    public Set<Estudiante> eliminarPorActividad(Long idActividad) {
        List<Evidencia> evidencias = new java.util.ArrayList<>(
                evidenciaRepository.findByActividadIdActividadOrderByFechaEntregaDesc(idActividad));
        Set<Estudiante> afectados = new HashSet<>();
        for (Evidencia evidencia : evidencias) {
            if (evidencia.getEstudiante() != null) afectados.add(evidencia.getEstudiante());
            eliminarEvidenciaConArchivos(evidencia);
        }
        // Documentos sueltos ligados a la actividad (FK id_actividad) sin evidencia viva.
        for (Documento doc : documentoRepository.findByActividadIdActividad(idActividad)) {
            documentoRepository.delete(doc);
            fileStorageService.deleteFile(doc.getUbicacion());
        }
        documentoRepository.flush();
        return afectados;
    }
}
