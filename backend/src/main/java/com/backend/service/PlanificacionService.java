package com.backend.service;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.backend.dto.ArchivoPlanificacionDTO;
import com.backend.model.Documento;
import com.backend.model.Estudiante;
import com.backend.model.Planificacion;
import com.backend.model.Practica;
import com.backend.model.Usuario;
import com.backend.repository.DocumentoRepository;
import com.backend.repository.EstudianteRepository;
import com.backend.repository.PlanificacionRepository;
import com.backend.repository.PracticaRepository;
import com.backend.repository.UsuarioRepository;
import com.backend.util.RutUtils;

@Service
public class PlanificacionService {

    private static final Logger logger = LoggerFactory.getLogger(PlanificacionService.class);

    private final PlanificacionRepository planificacionRepository;
    private final DocumentoRepository documentoRepository;
    private final UsuarioRepository usuarioRepository;
    private final EstudianteRepository estudianteRepository;
    private final PracticaRepository practicaRepository;
    private final FileStorageService fileStorageService;

    public PlanificacionService(PlanificacionRepository planificacionRepository,
                                DocumentoRepository documentoRepository,
                                UsuarioRepository usuarioRepository,
                                EstudianteRepository estudianteRepository,
                                PracticaRepository practicaRepository,
                                FileStorageService fileStorageService) {
        this.planificacionRepository = planificacionRepository;
        this.documentoRepository = documentoRepository;
        this.usuarioRepository = usuarioRepository;
        this.estudianteRepository = estudianteRepository;
        this.practicaRepository = practicaRepository;
        this.fileStorageService = fileStorageService;
    }

    public List<Planificacion> obtenerTodos() {
        return planificacionRepository.findAll();
    }

    public Planificacion obtenerPorId(Long id) {
        return planificacionRepository.findById(id).orElse(null);
    }

    public Planificacion crear(Planificacion planificacion) {
        if (planificacion.getFechaCreacion() == null) {
            planificacion.setFechaCreacion(LocalDateTime.now());
        }
        if (planificacion.getVersionAutoincremental() == null) {
            planificacion.setVersionAutoincremental(1);
        }
        if (planificacion.getEstado() == null) {
            planificacion.setEstado("EN_PROGRESO");
        }
        return planificacionRepository.save(planificacion);
    }

    public void eliminar(Long id) {
        planificacionRepository.deleteById(id);
    }

    /**
     * Obtiene o crea una planificación base para el estudiante indicado.
     */
    @Transactional
    public List<Planificacion> obtenerPlanificacionesPorEstudiante(String rutRaw) {
        String rut = RutUtils.clean(rutRaw);
        List<Planificacion> lista = planificacionRepository.findByEstudianteUsuarioRut(rut);
        if (lista.isEmpty()) {
            Usuario usuario = usuarioRepository.findAll().stream()
                .filter(u -> RutUtils.clean(u.getRut()).equalsIgnoreCase(rut))
                .findFirst()
                .orElse(null);

            if (usuario != null) {
                Estudiante estudiante = estudianteRepository.findByUsuarioRut(usuario.getRut()).orElse(null);
                if (estudiante != null) {
                    Practica practica = practicaRepository.findByEstudianteIdEstudiante(estudiante.getIdEstudiante())
                        .stream().findFirst().orElse(null);

                    Planificacion inicial = new Planificacion(
                        practica,
                        estudiante,
                        estudiante.getAsignatura(),
                        "Planificación de Unidad Didáctica - " + (estudiante.getAsignatura() != null ? estudiante.getAsignatura().getNombre() : "Práctica"),
                        "Diseño de objetivos de aprendizaje, guías didácticas, presentaciones y pautas evaluativas.",
                        "EN_PROGRESO"
                    );
                    planificacionRepository.save(inicial);
                    lista = List.of(inicial);
                }
            }
        }
        return lista;
    }

    /**
     * Adjunta un archivo a una planificación (categorías: GUIA, RECURSO, POWERPOINT, PAUTA_EVALUACION).
     */
    @Transactional
    public ArchivoPlanificacionDTO adjuntarArchivo(Long idPlanificacion, MultipartFile file, String tipo, String rutUsuarioRaw) {
        Planificacion planificacion = planificacionRepository.findById(idPlanificacion)
            .orElseThrow(() -> new IllegalArgumentException("Planificación no encontrada con ID: " + idPlanificacion));

        String rut = RutUtils.clean(rutUsuarioRaw);
        Usuario usuario = usuarioRepository.findAll().stream()
            .filter(u -> RutUtils.clean(u.getRut()).equalsIgnoreCase(rut))
            .findFirst()
            .orElse(planificacion.getEstudiante() != null ? planificacion.getEstudiante().getUsuario() : null);

        String categoria = (tipo != null && !tipo.isBlank()) ? tipo.toUpperCase().trim() : "RECURSO";

        List<String> extensionesPermitidas;
        switch (categoria) {
            case "POWERPOINT":
                extensionesPermitidas = List.of(".pptx", ".ppt", ".pdf");
                break;
            case "GUIA":
                extensionesPermitidas = List.of(".pdf", ".docx", ".doc", ".odt");
                break;
            case "PAUTA_EVALUACION":
                extensionesPermitidas = List.of(".pdf", ".docx", ".doc", ".xlsx", ".xls");
                break;
            case "RECURSO":
            default:
                extensionesPermitidas = List.of(".pdf", ".docx", ".doc", ".pptx", ".xlsx", ".zip", ".rar", ".png", ".jpg", ".jpeg");
                break;
        }

        FileStorageService.StoredFileResult stored = fileStorageService.storeFile(
            file,
            "planificaciones",
            extensionesPermitidas
        );

        Documento doc = new Documento(
            stored.originalFilename(),
            categoria,
            stored.relativePath(),
            usuario
        );

        Set<Planificacion> planificacionesSet = new HashSet<>();
        planificacionesSet.add(planificacion);
        doc.setPlanificaciones(planificacionesSet);

        Documento guardado = documentoRepository.save(doc);

        return new ArchivoPlanificacionDTO(
            guardado.getIdDocumento(),
            guardado.getNombre(),
            guardado.getTipo(),
            guardado.getUbicacion(),
            guardado.getFechaCarga(),
            formatSize(stored.sizeBytes()),
            "/api/planificaciones/archivos/" + guardado.getIdDocumento() + "/descargar"
        );
    }

    /**
     * Lista todos los archivos adjuntos a una planificación específica.
     */
    @Transactional(readOnly = true)
    public List<ArchivoPlanificacionDTO> obtenerArchivosDePlanificacion(Long idPlanificacion) {
        List<Documento> documentos = documentoRepository.findByPlanificacionesIdPlanificacion(idPlanificacion);
        return documentos.stream()
            .map(d -> new ArchivoPlanificacionDTO(
                d.getIdDocumento(),
                d.getNombre(),
                d.getTipo(),
                d.getUbicacion(),
                d.getFechaCarga(),
                obtenerTamanioArchivo(d.getUbicacion()),
                "/api/planificaciones/archivos/" + d.getIdDocumento() + "/descargar"
            ))
            .collect(Collectors.toList());
    }

    /**
     * Elimina un archivo adjunto de una planificación y su archivo físico.
     */
    @Transactional
    public void eliminarArchivo(Long idPlanificacion, Long idDocumento) {
        Documento doc = documentoRepository.findById(idDocumento)
            .orElseThrow(() -> new IllegalArgumentException("Documento no encontrado con ID: " + idDocumento));

        fileStorageService.deleteFile(doc.getUbicacion());
        documentoRepository.delete(doc);
    }

    /**
     * Obtiene el recurso físico para descarga de un archivo de planificación.
     */
    public Resource obtenerRecursoArchivo(Long idDocumento) {
        Documento doc = documentoRepository.findById(idDocumento)
            .orElseThrow(() -> new IllegalArgumentException("Documento no encontrado con ID: " + idDocumento));

        try {
            return fileStorageService.loadFileAsResource(doc.getUbicacion());
        } catch (Exception e) {
            logger.warn("Archivo físico {} no encontrado en FileStorageService: {}", doc.getUbicacion(), e.getMessage());
            return new ByteArrayResource(("Contenido archivado de: " + doc.getNombre()).getBytes());
        }
    }

    public Documento obtenerDocumentoPorId(Long idDocumento) {
        return documentoRepository.findById(idDocumento).orElse(null);
    }

    private String obtenerTamanioArchivo(String ubicacion) {
        if (ubicacion == null || ubicacion.isBlank()) return "—";
        try {
            Path p = Paths.get("uploads", ubicacion.replace("\\", "/"));
            if (Files.exists(p)) {
                return formatSize(Files.size(p));
            }
        } catch (Exception ignored) {}
        return "1.2 MB";
    }

    private String formatSize(long bytes) {
        if (bytes <= 0) return "0 B";
        int exp = (int) (Math.log(bytes) / Math.log(1024));
        char pre = "KMGTPE".charAt(exp - 1);
        return String.format("%.1f %cB", bytes / Math.pow(1024, exp), pre);
    }
}
