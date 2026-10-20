package com.backend.service;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.Normalizer;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.backend.dto.DetalleEstudianteDocumentosDTO;
import com.backend.dto.DocumentoItemDTO;
import com.backend.dto.EstudianteDocumentoDTO;
import com.backend.dto.ProfesorContactoDTO;
import com.backend.dto.TareaSeguimientoDTO;
import com.backend.model.Asignatura;
import com.backend.model.DocumentoPractica;
import com.backend.model.Estudiante;
import com.backend.model.Profesor;
import com.backend.model.Usuario;
import com.backend.model.Actividad;
import com.backend.model.Evidencia;
import com.backend.repository.ActividadRepository;
import com.backend.repository.DocumentoPracticaRepository;
import com.backend.repository.EstudianteRepository;
import com.backend.repository.ProfesorRepository;
import com.backend.repository.EvidenciaRepository;
import com.backend.repository.UsuarioRepository;
import com.backend.util.RutUtils;

import java.util.Map;
import java.util.Set;
import java.util.HashSet;
import java.util.stream.Collectors;

@Service
public class DocumentoPracticaService {

    private static final Logger logger = LoggerFactory.getLogger(DocumentoPracticaService.class);
    private static final Path UPLOADS_DIR = Paths.get("uploads", "documentos");

    private final DocumentoPracticaRepository documentoPracticaRepository;
    private final EstudianteRepository estudianteRepository;
    private final ProfesorRepository profesorRepository;
    private final UsuarioRepository usuarioRepository;
    private final com.backend.repository.AsignaturaRepository asignaturaRepository;
    private final FileStorageService fileStorageService;
    private final EvidenciaRepository evidenciaRepository;
    private final AvanceAcademicoService avanceAcademicoService;
    private final ActividadRepository actividadRepository;

    public DocumentoPracticaService(DocumentoPracticaRepository documentoPracticaRepository,
                                   EstudianteRepository estudianteRepository,
                                   ProfesorRepository profesorRepository,
                                   UsuarioRepository usuarioRepository,
                                   com.backend.repository.AsignaturaRepository asignaturaRepository,
                                   FileStorageService fileStorageService,
                                   EvidenciaRepository evidenciaRepository,
                                   AvanceAcademicoService avanceAcademicoService,
                                   ActividadRepository actividadRepository) {
        this.documentoPracticaRepository = documentoPracticaRepository;
        this.estudianteRepository = estudianteRepository;
        this.profesorRepository = profesorRepository;
        this.usuarioRepository = usuarioRepository;
        this.asignaturaRepository = asignaturaRepository;
        this.fileStorageService = fileStorageService;
        this.evidenciaRepository = evidenciaRepository;
        this.avanceAcademicoService = avanceAcademicoService;
        this.actividadRepository = actividadRepository;
        initUploadsDirectory();
    }


    private void initUploadsDirectory() {
        try {
            if (!Files.exists(UPLOADS_DIR)) {
                Files.createDirectories(UPLOADS_DIR);
                logger.info("Directorio de documentos creado: {}", UPLOADS_DIR.toAbsolutePath());
            }
        } catch (IOException e) {
            logger.error("No se pudo crear el directorio de documentos: {}", e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public List<EstudianteDocumentoDTO> obtenerEstudiantesConProgreso() {
        List<Estudiante> estudiantes = estudianteRepository.findAll();
        List<EstudianteDocumentoDTO> resultado = new ArrayList<>();

        for (Estudiante est : estudiantes) {
            Usuario usuario = est.getUsuario();
            if (usuario == null) continue;

            // Omitir si el usuario está inactivo
            if (!usuario.isActivo() || "inactivo".equalsIgnoreCase(usuario.getEstado())) {
                continue;
            }

            String rut = usuario.getRut();
            String nombreCompleto = usuario.getNombre() + " " + usuario.getApellido();
            String correo = usuario.getCorreo();

            Asignatura asig = est.getAsignatura();
            String asignaturaNombre = asig != null ? asig.getNombre() : "—";
            Long idAsignatura = asig != null ? asig.getIdAsignatura() : null;
            String semestre = asig != null ? asig.getSemestre() : "—";

            // Obtener profesores asociados a la asignatura
            List<ProfesorContactoDTO> profesoresDTO = new ArrayList<>();
            if (idAsignatura != null) {
                List<Profesor> profesores = profesorRepository.findAllByAsignaturaId(idAsignatura);
                for (Profesor p : profesores) {
                    if (p.getUsuario() != null) {
                        String asigProfNombre = p.getAsignatura() != null ? p.getAsignatura().getNombre() : asignaturaNombre;
                        profesoresDTO.add(new ProfesorContactoDTO(
                            p.getUsuario().getRut(),
                            p.getUsuario().getNombre() + " " + p.getUsuario().getApellido(),
                            p.getUsuario().getCorreo(),
                            "Profesor de Asignatura",
                            asigProfNombre
                        ));
                    }
                }
            }

            AvanceAcademicoService.ResumenAvance avance = avanceAcademicoService.calcularAvance(
                est, avanceAcademicoService.obtenerPlanOrdenado()
            );
            int entregados = avance.aprobadas();
            int requeridos = avance.totalAsignaturas();
            double progreso = avance.progreso();

            String estado;
            if (entregados >= requeridos) {
                estado = "COMPLETO";
            } else if (entregados > 0) {
                estado = "EN_PROGRESO";
            } else {
                estado = "PENDIENTE";
            }

            resultado.add(new EstudianteDocumentoDTO(
                rut,
                nombreCompleto,
                correo,
                asignaturaNombre,
                idAsignatura,
                semestre,
                entregados,
                requeridos,
                progreso,
                estado,
                profesoresDTO
            ));
        }

        return resultado;
    }

    @Transactional(readOnly = true)
    public DetalleEstudianteDocumentosDTO obtenerDetalleEstudiante(String rutRaw) {
        String rut = RutUtils.clean(rutRaw);
        Optional<Estudiante> estOpt = estudianteRepository.findAll().stream()
            .filter(e -> e.getUsuario() != null && RutUtils.clean(e.getUsuario().getRut()).equalsIgnoreCase(rut))
            .findFirst();

        Usuario usuario;
        Asignatura asig = null;
        if (estOpt.isPresent()) {
            usuario = estOpt.get().getUsuario();
            asig = estOpt.get().getAsignatura();
        } else {
            usuario = usuarioRepository.findAll().stream()
                .filter(u -> RutUtils.clean(u.getRut()).equalsIgnoreCase(rut))
                .findFirst()
                .orElse(null);
        }

        if (usuario == null) {
            return null;
        }

        String rutFinal = usuario.getRut();
        String nombreCompleto = usuario.getNombre() + " " + usuario.getApellido();
        String correo = usuario.getCorreo();
        String asignaturaNombre = asig != null ? asig.getNombre() : "—";
        Long idAsignatura = asig != null ? asig.getIdAsignatura() : null;
        String semestre = asig != null ? asig.getSemestre() : "—";

        // Obtener profesores de la asignatura
        List<ProfesorContactoDTO> profesoresDTO = new ArrayList<>();
        if (idAsignatura != null) {
            List<Profesor> profesores = profesorRepository.findAllByAsignaturaId(idAsignatura);
            for (Profesor p : profesores) {
                if (p.getUsuario() != null) {
                    String asigProfNombre = p.getAsignatura() != null ? p.getAsignatura().getNombre() : asignaturaNombre;
                    profesoresDTO.add(new ProfesorContactoDTO(
                        p.getUsuario().getRut(),
                        p.getUsuario().getNombre() + " " + p.getUsuario().getApellido(),
                        p.getUsuario().getCorreo(),
                        "Profesor de Asignatura",
                        asigProfNombre
                    ));
                }
            }
        }

        // Consultar documentos de la práctica
        List<DocumentoPractica> docs = idAsignatura != null
            ? documentoPracticaRepository.findByEstudianteRutAndAsignaturaIdAsignatura(rutFinal, idAsignatura)
            : documentoPracticaRepository.findByEstudianteRut(rutFinal);

        Optional<DocumentoPractica> docEstudianteOpt = docs.stream()
            .filter(d -> "ESTUDIANTE".equalsIgnoreCase(d.getTipoDocumento()))
            .findFirst();

        Optional<DocumentoPractica> docProfesorOpt = docs.stream()
            .filter(d -> "PROFESOR".equalsIgnoreCase(d.getTipoDocumento()))
            .findFirst();

        List<DocumentoItemDTO> documentosList = new ArrayList<>();

        // Slot 1: Documento del Estudiante
        if (docEstudianteOpt.isPresent()) {
            DocumentoPractica d = docEstudianteOpt.get();
            documentosList.add(new DocumentoItemDTO(
                d.getIdDocumentoPractica(),
                d.getNombreDocumento() != null ? d.getNombreDocumento() : "Informe de Práctica (Estudiante)",
                d.getNombreArchivo(),
                "ESTUDIANTE",
                d.getFechaCarga(),
                "ENTREGADO",
                formatTamanio(d.getTamanioBytes()),
                d.getUsuario() != null ? d.getUsuario().getNombre() + " " + d.getUsuario().getApellido() : nombreCompleto,
                d.getUsuario() != null ? d.getUsuario().getCorreo() : correo,
                "/admin/documentos/archivo/" + d.getIdDocumentoPractica()
            ));
        } else {
            documentosList.add(new DocumentoItemDTO(
                null,
                "Informe de Práctica y Autoevaluación",
                "—",
                "ESTUDIANTE",
                null,
                "PENDIENTE",
                "—",
                nombreCompleto,
                correo,
                null
            ));
        }

        // Slot 2: Documento del Profesor
        if (docProfesorOpt.isPresent()) {
            DocumentoPractica d = docProfesorOpt.get();
            String nombreProf = d.getUsuario() != null ? d.getUsuario().getNombre() + " " + d.getUsuario().getApellido() : "Profesor";
            String correoProf = d.getUsuario() != null ? d.getUsuario().getCorreo() : "—";
            documentosList.add(new DocumentoItemDTO(
                d.getIdDocumentoPractica(),
                d.getNombreDocumento() != null ? d.getNombreDocumento() : "Evaluación Final de Desempeño (Profesor)",
                d.getNombreArchivo(),
                "PROFESOR",
                d.getFechaCarga(),
                "ENTREGADO",
                formatTamanio(d.getTamanioBytes()),
                nombreProf,
                correoProf,
                "/admin/documentos/archivo/" + d.getIdDocumentoPractica()
            ));
        } else {
            String defaultProfNombre = !profesoresDTO.isEmpty() ? profesoresDTO.get(0).getNombre() : "Profesor Asignado";
            String defaultProfCorreo = !profesoresDTO.isEmpty() ? profesoresDTO.get(0).getCorreo() : "—";
            documentosList.add(new DocumentoItemDTO(
                null,
                "Pauta de Evaluación y Retroalimentación Final",
                "—",
                "PROFESOR",
                null,
                "PENDIENTE",
                "—",
                defaultProfNombre,
                defaultProfCorreo,
                null
            ));
        }

        AvanceAcademicoService.ResumenAvance avance = estOpt
            .map(estudiante -> avanceAcademicoService.calcularAvance(estudiante, avanceAcademicoService.obtenerPlanOrdenado()))
            .orElse(new AvanceAcademicoService.ResumenAvance(0, 0, 0, null));
        int entregados = avance.aprobadas();
        int requeridos = avance.totalAsignaturas();
        double progreso = avance.progreso();

        DetalleEstudianteDocumentosDTO detalle = new DetalleEstudianteDocumentosDTO(
            rutFinal,
            nombreCompleto,
            correo,
            asignaturaNombre,
            idAsignatura,
            semestre,
            progreso,
            entregados,
            requeridos,
            profesoresDTO,
            documentosList
        );
        List<TareaSeguimientoDTO> tareasDTO = new ArrayList<>();
        if (estOpt.isPresent()) {
            Estudiante estudiante = estOpt.get();
            List<Evidencia> evidencias = evidenciaRepository.findByEstudianteIdEstudiante(estudiante.getIdEstudiante());
            Map<Long, Evidencia> evidenciaPorActividad = evidencias.stream()
                .filter(e -> e.getActividad() != null)
                .collect(Collectors.toMap(e -> e.getActividad().getIdActividad(), e -> e, (a, b) -> a));

            Set<Long> asignaturasRelevantes = new HashSet<>();
            if (estudiante.getAsignatura() != null && estudiante.getAsignatura().getIdAsignatura() != null) {
                asignaturasRelevantes.add(estudiante.getAsignatura().getIdAsignatura());
            }
            evidencias.stream()
                .filter(e -> e.getActividad() != null && e.getActividad().getAsignatura() != null)
                .forEach(e -> asignaturasRelevantes.add(e.getActividad().getAsignatura().getIdAsignatura()));

            List<Actividad> todasActividades = new ArrayList<>();
            for (Long idAsig : asignaturasRelevantes) {
                todasActividades.addAll(actividadRepository.findByAsignaturaIdAsignaturaOrderByFechaCreacionDesc(idAsig));
            }

            Set<Long> actividadesProcesadas = new HashSet<>();
            for (Actividad act : todasActividades) {
                actividadesProcesadas.add(act.getIdActividad());
                Evidencia ev = evidenciaPorActividad.get(act.getIdActividad());
                Asignatura asigAct = act.getAsignatura();
                String nombreAsig = asigAct != null ? asigAct.getNombre() : asignaturaNombre;
                Long idAsigAct = asigAct != null ? asigAct.getIdAsignatura() : idAsignatura;
                String semAct = asigAct != null ? asigAct.getSemestre() : semestre;

                if (ev != null) {
                    Double nota = ev.getCalificacion();
                    String estadoAprobacion = nota != null ? (nota >= 4.0 ? "APROBADO" : "REPROBADO") : "PENDIENTE";
                    String profRevisorNombre = null;
                    String profRevisorRut = null;
                    if (ev.getRevisadoPor() != null && ev.getRevisadoPor().getUsuario() != null) {
                        profRevisorNombre = ev.getRevisadoPor().getUsuario().getNombre() + " " + ev.getRevisadoPor().getUsuario().getApellido();
                        profRevisorRut = ev.getRevisadoPor().getUsuario().getRut();
                    } else if (act.getProfesor() != null && act.getProfesor().getUsuario() != null) {
                        profRevisorNombre = act.getProfesor().getUsuario().getNombre() + " " + act.getProfesor().getUsuario().getApellido();
                        profRevisorRut = act.getProfesor().getUsuario().getRut();
                    }

                    tareasDTO.add(new TareaSeguimientoDTO(
                        ev.getIdEvidencia(),
                        act.getIdActividad(),
                        act.getTitulo(),
                        act.getDescripcion(),
                        nombreAsig,
                        idAsigAct,
                        semAct,
                        ev.getEstado() != null ? ev.getEstado() : "ENTREGADO",
                        nota,
                        estadoAprobacion,
                        ev.getFechaEntrega(),
                        ev.getFechaRevision(),
                        ev.getRetroalimentacion(),
                        profRevisorNombre,
                        profRevisorRut,
                        ev.getNombreArchivo(),
                        ev.getNombreArchivoRevision(),
                        ev.getArchivoUrl() != null && !ev.getArchivoUrl().isBlank(),
                        ev.getArchivoRevisionUrl() != null && !ev.getArchivoRevisionUrl().isBlank()
                    ));
                } else {
                    String profNombre = act.getProfesor() != null && act.getProfesor().getUsuario() != null
                        ? act.getProfesor().getUsuario().getNombre() + " " + act.getProfesor().getUsuario().getApellido()
                        : null;
                    String profRut = act.getProfesor() != null && act.getProfesor().getUsuario() != null
                        ? act.getProfesor().getUsuario().getRut()
                        : null;

                    tareasDTO.add(new TareaSeguimientoDTO(
                        null,
                        act.getIdActividad(),
                        act.getTitulo(),
                        act.getDescripcion(),
                        nombreAsig,
                        idAsigAct,
                        semAct,
                        "NO_ENTREGADO",
                        null,
                        "PENDIENTE",
                        null,
                        null,
                        null,
                        profNombre,
                        profRut,
                        null,
                        null,
                        false,
                        false
                    ));
                }
            }

            for (Evidencia ev : evidencias) {
                if (ev.getActividad() != null && !actividadesProcesadas.contains(ev.getActividad().getIdActividad())) {
                    Actividad act = ev.getActividad();
                    Asignatura asigAct = act.getAsignatura();
                    Double nota = ev.getCalificacion();
                    String estadoAprobacion = nota != null ? (nota >= 4.0 ? "APROBADO" : "REPROBADO") : "PENDIENTE";
                    String profRevisorNombre = null;
                    String profRevisorRut = null;
                    if (ev.getRevisadoPor() != null && ev.getRevisadoPor().getUsuario() != null) {
                        profRevisorNombre = ev.getRevisadoPor().getUsuario().getNombre() + " " + ev.getRevisadoPor().getUsuario().getApellido();
                        profRevisorRut = ev.getRevisadoPor().getUsuario().getRut();
                    }

                    tareasDTO.add(new TareaSeguimientoDTO(
                        ev.getIdEvidencia(),
                        act.getIdActividad(),
                        act.getTitulo(),
                        act.getDescripcion(),
                        asigAct != null ? asigAct.getNombre() : "—",
                        asigAct != null ? asigAct.getIdAsignatura() : null,
                        asigAct != null ? asigAct.getSemestre() : "—",
                        ev.getEstado() != null ? ev.getEstado() : "ENTREGADO",
                        nota,
                        estadoAprobacion,
                        ev.getFechaEntrega(),
                        ev.getFechaRevision(),
                        ev.getRetroalimentacion(),
                        profRevisorNombre,
                        profRevisorRut,
                        ev.getNombreArchivo(),
                        ev.getNombreArchivoRevision(),
                        ev.getArchivoUrl() != null && !ev.getArchivoUrl().isBlank(),
                        ev.getArchivoRevisionUrl() != null && !ev.getArchivoRevisionUrl().isBlank()
                    ));
                }
            }
        }
        detalle.setTareas(tareasDTO);
        return detalle;
    }

    @Transactional(readOnly = true)
    public DocumentoPractica obtenerDocumentoPorId(Long id) {
        return documentoPracticaRepository.findById(id).orElse(null);
    }

    @Transactional
    public DocumentoPractica subirDocumentoEstudiante(String rutEstudianteRaw, org.springframework.web.multipart.MultipartFile file, String nombreDocumento) {
        String rut = RutUtils.clean(rutEstudianteRaw);
        Usuario usuarioEstudiante = usuarioRepository.findAll().stream()
            .filter(u -> RutUtils.clean(u.getRut()).equalsIgnoreCase(rut))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Estudiante no encontrado con RUT: " + rutEstudianteRaw));

        Estudiante est = estudianteRepository.findByUsuarioRut(usuarioEstudiante.getRut()).orElse(null);
        Asignatura asig = est != null ? est.getAsignatura() : null;
        if (asig == null) {
            asig = asignaturaRepository.findAll().stream().findFirst().orElse(null);
        }

        FileStorageService.StoredFileResult stored = fileStorageService.storeFile(
            file,
            "documentos",
            List.of(".pdf", ".docx", ".doc", ".zip", ".pptx", ".xlsx")
        );

        Optional<DocumentoPractica> existenteOpt = (asig != null)
            ? documentoPracticaRepository.findByEstudianteRutAndAsignaturaIdAsignaturaAndTipoDocumento(usuarioEstudiante.getRut(), asig.getIdAsignatura(), "ESTUDIANTE")
            : documentoPracticaRepository.findByEstudianteRutAndTipoDocumento(usuarioEstudiante.getRut(), "ESTUDIANTE");

        DocumentoPractica doc;
        if (existenteOpt.isPresent()) {
            doc = existenteOpt.get();
            fileStorageService.deleteFile(doc.getUbicacion());
            doc.setNombreArchivo(stored.originalFilename());
            doc.setNombreDocumento(nombreDocumento != null && !nombreDocumento.isBlank() ? nombreDocumento : "Informe de Práctica (Estudiante)");
            doc.setUbicacion(stored.relativePath());
            doc.setFechaCarga(LocalDateTime.now());
            doc.setEstado("ENTREGADO");
            doc.setTamanioBytes(stored.sizeBytes());
        } else {
            doc = new DocumentoPractica(
                usuarioEstudiante,
                usuarioEstudiante,
                asig,
                stored.originalFilename(),
                nombreDocumento != null && !nombreDocumento.isBlank() ? nombreDocumento : "Informe de Práctica (Estudiante)",
                "ESTUDIANTE",
                stored.relativePath(),
                LocalDateTime.now(),
                "ENTREGADO",
                stored.sizeBytes()
            );
        }

        return documentoPracticaRepository.save(doc);
    }

    @Transactional
    public DocumentoPractica subirDocumentoProfesor(String rutProfesorRaw, String rutEstudianteRaw, Long idAsignatura, org.springframework.web.multipart.MultipartFile file, String nombreDocumento) {
        String rutProf = RutUtils.clean(rutProfesorRaw);
        String rutEst = RutUtils.clean(rutEstudianteRaw);

        Usuario usuarioProfesor = usuarioRepository.findAll().stream()
            .filter(u -> RutUtils.clean(u.getRut()).equalsIgnoreCase(rutProf))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Profesor no encontrado con RUT: " + rutProfesorRaw));

        Usuario usuarioEstudiante = usuarioRepository.findAll().stream()
            .filter(u -> RutUtils.clean(u.getRut()).equalsIgnoreCase(rutEst))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Estudiante no encontrado con RUT: " + rutEstudianteRaw));

        Asignatura asig = idAsignatura != null ? asignaturaRepository.findById(idAsignatura).orElse(null) : null;
        if (asig == null) {
            Estudiante est = estudianteRepository.findByUsuarioRut(usuarioEstudiante.getRut()).orElse(null);
            asig = est != null ? est.getAsignatura() : asignaturaRepository.findAll().stream().findFirst().orElse(null);
        }

        FileStorageService.StoredFileResult stored = fileStorageService.storeFile(
            file,
            "documentos",
            List.of(".pdf", ".docx", ".doc", ".zip", ".xlsx")
        );

        Optional<DocumentoPractica> existenteOpt = (asig != null)
            ? documentoPracticaRepository.findByEstudianteRutAndAsignaturaIdAsignaturaAndTipoDocumento(usuarioEstudiante.getRut(), asig.getIdAsignatura(), "PROFESOR")
            : documentoPracticaRepository.findByEstudianteRutAndTipoDocumento(usuarioEstudiante.getRut(), "PROFESOR");

        DocumentoPractica doc;
        if (existenteOpt.isPresent()) {
            doc = existenteOpt.get();
            fileStorageService.deleteFile(doc.getUbicacion());
            doc.setUsuario(usuarioProfesor);
            doc.setNombreArchivo(stored.originalFilename());
            doc.setNombreDocumento(nombreDocumento != null && !nombreDocumento.isBlank() ? nombreDocumento : "Evaluación Final de Desempeño (Profesor)");
            doc.setUbicacion(stored.relativePath());
            doc.setFechaCarga(LocalDateTime.now());
            doc.setEstado("ENTREGADO");
            doc.setTamanioBytes(stored.sizeBytes());
        } else {
            doc = new DocumentoPractica(
                usuarioProfesor,
                usuarioEstudiante,
                asig,
                stored.originalFilename(),
                nombreDocumento != null && !nombreDocumento.isBlank() ? nombreDocumento : "Evaluación Final de Desempeño (Profesor)",
                "PROFESOR",
                stored.relativePath(),
                LocalDateTime.now(),
                "ENTREGADO",
                stored.sizeBytes()
            );
        }

        return documentoPracticaRepository.save(doc);
    }

    public Resource obtenerRecursoArchivo(DocumentoPractica doc) throws IOException {
        try {
            if (doc.getUbicacion() != null && !doc.getUbicacion().isBlank()) {
                Resource res = fileStorageService.loadFileAsResource(doc.getUbicacion());
                if (res != null && res.exists() && res.isReadable()) {
                    return res;
                }
            }
        } catch (Exception e) {
            logger.warn("FileStorageService no pudo resolver {}, intentando resolver por ruta heredada", doc.getUbicacion());
        }

        Path path = resolverRutaArchivo(doc.getUbicacion(), doc.getNombreArchivo());
        if (path != null && Files.exists(path)) {
            return new FileSystemResource(path.toFile());
        }

        // Si el archivo físico no existe en disco, generar un PDF legible en memoria
        throw new IOException("El archivo físico no está disponible en el servidor.");
    }


    @Transactional(readOnly = true)
    public void escribirZipTarea(Long idEvidencia, OutputStream out) throws IOException {
        Evidencia ev = evidenciaRepository.findById(idEvidencia)
            .orElseThrow(() -> new IllegalArgumentException("Evidencia no encontrada con ID: " + idEvidencia));

        try (ZipOutputStream zos = new ZipOutputStream(out)) {
            boolean hayArchivos = false;

            if (ev.getArchivoUrl() != null && !ev.getArchivoUrl().isBlank()) {
                try {
                    Resource resEst = fileStorageService.loadFileAsResource(ev.getArchivoUrl());
                    if (resEst != null && resEst.exists() && resEst.isReadable()) {
                        String originalName = ev.getNombreArchivo() != null ? ev.getNombreArchivo() : "entrega_estudiante.pdf";
                        ZipEntry entry = new ZipEntry("[ESTUDIANTE]_" + sanitizarNombre(originalName));
                        zos.putNextEntry(entry);
                        try (var is = resEst.getInputStream()) {
                            is.transferTo(zos);
                        }
                        zos.closeEntry();
                        hayArchivos = true;
                    }
                } catch (Exception e) {
                    logger.warn("No se pudo agregar archivo estudiante al zip de tarea {}: {}", idEvidencia, e.getMessage());
                }
            }

            if (ev.getArchivoRevisionUrl() != null && !ev.getArchivoRevisionUrl().isBlank()) {
                try {
                    Resource resRev = fileStorageService.loadFileAsResource(ev.getArchivoRevisionUrl());
                    if (resRev != null && resRev.exists() && resRev.isReadable()) {
                        String originalName = ev.getNombreArchivoRevision() != null ? ev.getNombreArchivoRevision() : "revision_profesor.pdf";
                        ZipEntry entry = new ZipEntry("[PROFESOR_REVISION]_" + sanitizarNombre(originalName));
                        zos.putNextEntry(entry);
                        try (var is = resRev.getInputStream()) {
                            is.transferTo(zos);
                        }
                        zos.closeEntry();
                        hayArchivos = true;
                    }
                } catch (Exception e) {
                    logger.warn("No se pudo agregar archivo de revisión al zip de tarea {}: {}", idEvidencia, e.getMessage());
                }
            }

            if (!hayArchivos) {
                ZipEntry entry = new ZipEntry("sin_archivos.txt");
                zos.putNextEntry(entry);
                String msg = "No hay archivos físicos disponibles para la tarea seleccionada (ID: " + idEvidencia + ").";
                zos.write(msg.getBytes(StandardCharsets.UTF_8));
                zos.closeEntry();
            }

            zos.finish();
        }
    }

    @Transactional(readOnly = true)
    public void escribirZipEstudiante(String rutRaw, OutputStream out) throws IOException {
        String rut = RutUtils.clean(rutRaw);
        Usuario usuario = usuarioRepository.findAll().stream()
            .filter(u -> RutUtils.clean(u.getRut()).equalsIgnoreCase(rut))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Estudiante no encontrado para RUT: " + rutRaw));

        List<DocumentoPractica> documentos = documentoPracticaRepository.findByEstudianteRut(usuario.getRut());
        List<Evidencia> evidencias = evidenciaRepository.findByEstudianteUsuarioRutOrderByFechaEntregaDesc(usuario.getRut());

        try (ZipOutputStream zos = new ZipOutputStream(out)) {
            boolean hayArchivos = false;

            // 1. Documentos de práctica
            for (DocumentoPractica doc : documentos) {
                String asigNombre = doc.getAsignatura() != null ? doc.getAsignatura().getNombre() : "Practica_General";
                String carpeta = sanitizarNombre(asigNombre) + "/Documentos_Practica";
                String prefijo = "ESTUDIANTE".equalsIgnoreCase(doc.getTipoDocumento()) ? "[ESTUDIANTE]" : "[PROFESOR]";
                String nombreArchivo = prefijo + "_" + sanitizarNombre(doc.getNombreArchivo());

                Path rutaArchivo = resolverRutaArchivo(doc.getUbicacion(), doc.getNombreArchivo());
                if (rutaArchivo != null && Files.exists(rutaArchivo) && Files.isReadable(rutaArchivo)) {
                    ZipEntry entry = new ZipEntry(carpeta + "/" + nombreArchivo);
                    zos.putNextEntry(entry);
                    Files.copy(rutaArchivo, zos);
                    zos.closeEntry();
                    hayArchivos = true;
                } else {
                    logger.warn("Se omitió del ZIP el archivo inexistente: {}", doc.getUbicacion());
                }
            }

            // 2. Entregas y revisiones de tareas por asignatura
            for (Evidencia ev : evidencias) {
                String asigNombre = ev.getActividad() != null && ev.getActividad().getAsignatura() != null
                    ? ev.getActividad().getAsignatura().getNombre()
                    : "Asignatura_General";
                String tituloTarea = ev.getActividad() != null ? sanitizarNombre(ev.getActividad().getTitulo()) : "Tarea_" + ev.getIdEvidencia();
                String carpeta = sanitizarNombre(asigNombre) + "/Tareas/" + tituloTarea;

                // Archivo entregado por estudiante
                if (ev.getArchivoUrl() != null && !ev.getArchivoUrl().isBlank()) {
                    try {
                        Resource resEst = fileStorageService.loadFileAsResource(ev.getArchivoUrl());
                        if (resEst != null && resEst.exists() && resEst.isReadable()) {
                            String nomEst = ev.getNombreArchivo() != null ? ev.getNombreArchivo() : "entrega_estudiante";
                            ZipEntry entry = new ZipEntry(carpeta + "/[ESTUDIANTE]_" + sanitizarNombre(nomEst));
                            zos.putNextEntry(entry);
                            try (var is = resEst.getInputStream()) {
                                is.transferTo(zos);
                            }
                            zos.closeEntry();
                            hayArchivos = true;
                        }
                    } catch (Exception e) {
                        logger.warn("Error leyendo archivo estudiante {}: {}", ev.getArchivoUrl(), e.getMessage());
                    }
                }

                // Archivo de revisión subido por profesor
                if (ev.getArchivoRevisionUrl() != null && !ev.getArchivoRevisionUrl().isBlank()) {
                    try {
                        Resource resProf = fileStorageService.loadFileAsResource(ev.getArchivoRevisionUrl());
                        if (resProf != null && resProf.exists() && resProf.isReadable()) {
                            String nomRev = ev.getNombreArchivoRevision() != null ? ev.getNombreArchivoRevision() : "revision_profesor";
                            ZipEntry entry = new ZipEntry(carpeta + "/[PROFESOR_REVISION]_" + sanitizarNombre(nomRev));
                            zos.putNextEntry(entry);
                            try (var is = resProf.getInputStream()) {
                                is.transferTo(zos);
                            }
                            zos.closeEntry();
                            hayArchivos = true;
                        }
                    } catch (Exception e) {
                        logger.warn("Error leyendo archivo revisión {}: {}", ev.getArchivoRevisionUrl(), e.getMessage());
                    }
                }
            }

            if (!hayArchivos) {
                ZipEntry entry = new ZipEntry("sin_documentos.txt");
                zos.putNextEntry(entry);
                String mensaje = "El estudiante " + usuario.getNombre() + " " + usuario.getApellido() +
                                 " (RUT " + usuario.getRut() + ") aún no tiene documentos o entregas archivadas en el servidor.";
                zos.write(mensaje.getBytes(StandardCharsets.UTF_8));
                zos.closeEntry();
            }

            zos.finish();
        }
    }

    private Path resolverRutaArchivo(String ubicacion, String nombreArchivo) {
        if (ubicacion != null && !ubicacion.isBlank()) {
            Path p = Paths.get(ubicacion);
            if (Files.exists(p)) return p;
        }

        if (nombreArchivo != null && !nombreArchivo.isBlank()) {
            Path p1 = UPLOADS_DIR.resolve(nombreArchivo);
            if (Files.exists(p1)) return p1;

            Path p2 = Paths.get(System.getProperty("user.dir"), "uploads", "documentos", nombreArchivo);
            if (Files.exists(p2)) return p2;
        }

        return null;
    }

    public static byte[] generarPdfMock(String titulo, String estudiante, String asignatura) {
        // Generador de archivo de texto con encabezado y formato estructurado
        String contenido = "%PDF-1.4\n" +
            "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n" +
            "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n" +
            "3 0 obj << /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >> endobj\n" +
            "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n" +
            "5 0 obj << /Length 200 >> stream\n" +
            "BT /F1 14 Tf 50 720 Td (" + escapePdf(titulo) + ") Tj\n" +
            "/F1 11 Tf 0 -30 Td (Estudiante: " + escapePdf(estudiante) + ") Tj\n" +
            "0 -20 Td (Asignatura: " + escapePdf(asignatura) + ") Tj\n" +
            "0 -20 Td (Universidad del Bio-Bio - Sistema de Practicas) Tj\n" +
            "0 -20 Td (Documento verificado y archivado localmente.) Tj ET\n" +
            "endstream\nendobj\nxref\n0 6\n0000000000 65535 f \n" +
            "trailer << /Size 6 /Root 1 0 R >>\nstartxref\n500\n%%EOF\n";
        return contenido.getBytes(StandardCharsets.ISO_8859_1);
    }

    private static String escapePdf(String text) {
        if (text == null) return "";
        return text.replace("(", "").replace(")", "").replace("\\", "");
    }

    private String sanitizarNombre(String entrada) {
        if (entrada == null) return "archivo";
        String normalized = Normalizer.normalize(entrada, Normalizer.Form.NFD);
        String limpia = normalized.replaceAll("[\\p{InCombiningDiacriticalMarks}]", "");
        return limpia.replaceAll("[^a-zA-Z0-9._-]", "_");
    }

    private String formatTamanio(Long bytes) {
        if (bytes == null || bytes <= 0) return "—";
        if (bytes < 1024) return bytes + " B";
        int exp = (int) (Math.log(bytes) / Math.log(1024));
        char pre = "KMGTPE".charAt(exp - 1);
        return String.format("%.1f %cB", bytes / Math.pow(1024, exp), pre);
    }
}
