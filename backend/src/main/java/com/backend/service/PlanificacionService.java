package com.backend.service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.backend.dto.PlanificacionDTOs.ArchivoPlanificacionDTO;
import com.backend.dto.PlanificacionDTOs.PlanificacionDTO;
import com.backend.model.Documento;
import com.backend.model.DocumentoPlanificacion;
import com.backend.model.Estudiante;
import com.backend.model.Planificacion;
import com.backend.repository.DocumentoRepository;
import com.backend.repository.EstudianteRepository;
import com.backend.repository.PlanificacionRepository;
import com.backend.util.RutUtils;

@Service
public class PlanificacionService {

    private static final Logger logger = LoggerFactory.getLogger(PlanificacionService.class);

    /** Las 5 categorías obligatorias de una planificación, en el orden en que se muestran. */
    public static final Map<String, String> CATEGORIAS = new LinkedHashMap<>();
    private static final Map<String, List<String>> EXTENSIONES = Map.of(
        "PLANIFICACION", List.of("pdf", "doc", "docx", "odt"),
        "PRESENTACION", List.of("ppt", "pptx", "odp", "pdf"),
        "GUIA_ACTIVIDADES", List.of("pdf", "doc", "docx", "odt"),
        "RUBRICA_EVALUACION", List.of("pdf", "doc", "docx", "xls", "xlsx"),
        "MATERIAL_DIDACTICO", List.of("pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "zip", "png", "jpg", "jpeg")
    );

    static {
        CATEGORIAS.put("PLANIFICACION", "Planificación");
        CATEGORIAS.put("PRESENTACION", "Presentación");
        CATEGORIAS.put("GUIA_ACTIVIDADES", "Guía de actividades");
        CATEGORIAS.put("RUBRICA_EVALUACION", "Rúbrica de evaluación");
        CATEGORIAS.put("MATERIAL_DIDACTICO", "Material didáctico");
    }

    private final PlanificacionRepository planificacionRepository;
    private final DocumentoRepository documentoRepository;
    private final EstudianteRepository estudianteRepository;
    private final RubricaPracticaService rubricaPracticaService;
    private final FileStorageService fileStorageService;
    private final JdbcTemplate jdbcTemplate;

    public PlanificacionService(PlanificacionRepository planificacionRepository,
                                DocumentoRepository documentoRepository,
                                EstudianteRepository estudianteRepository,
                                RubricaPracticaService rubricaPracticaService,
                                FileStorageService fileStorageService,
                                JdbcTemplate jdbcTemplate) {
        this.planificacionRepository = planificacionRepository;
        this.documentoRepository = documentoRepository;
        this.estudianteRepository = estudianteRepository;
        this.rubricaPracticaService = rubricaPracticaService;
        this.fileStorageService = fileStorageService;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional(readOnly = true)
    public List<PlanificacionDTO> obtenerPorEstudiante(String rutEstudiante) {
        Estudiante estudiante = buscarEstudiante(rutEstudiante);
        return planificacionRepository.findByEstudianteIdEstudiante(estudiante.getIdEstudiante()).stream()
            .sorted((a, b) -> Long.compare(b.getIdPlanificacion(), a.getIdPlanificacion()))
            .map(this::toDTO)
            .toList();
    }

    /** Crea una planificación vacía (los 5 archivos pendientes). Solo para estudiantes de 8.° semestre en adelante. */
    @Transactional
    public PlanificacionDTO crear(String rutEstudiante) {
        Estudiante estudiante = buscarEstudiante(rutEstudiante);
        String semestre = estudiante.getAsignatura() != null ? estudiante.getAsignatura().getSemestre() : null;
        int numero = AvanceAcademicoService.semestreNumerico(semestre);
        if (numero < 8 || numero == Integer.MAX_VALUE) {
            throw new IllegalArgumentException("La planificación está disponible desde 8.° semestre.");
        }
        Planificacion planificacion = new Planificacion(
            rubricaPracticaService.practicaActual(estudiante.getUsuario().getRut()), estudiante, estudiante.getAsignatura());
        return toDTO(planificacionRepository.save(planificacion));
    }

    /**
     * Sube uno o más archivos, cada uno con su categoría. Un archivo nuevo reemplaza al de su misma categoría.
     * Se valida todo antes de guardar nada, para no dejar la planificación a medias si un archivo es inválido.
     */
    @Transactional
    public PlanificacionDTO subirArchivos(Long idPlanificacion, List<MultipartFile> archivos, List<String> categorias,
                                         String rutUsuario) {
        Planificacion planificacion = buscarPropia(idPlanificacion, rutUsuario);
        if (archivos == null || archivos.isEmpty() || categorias == null || archivos.size() != categorias.size()) {
            throw new IllegalArgumentException("Cada archivo debe tener una categoría.");
        }
        Set<String> vistas = new HashSet<>();
        for (int i = 0; i < archivos.size(); i++) {
            String categoria = categorias.get(i);
            if (!CATEGORIAS.containsKey(categoria)) {
                throw new IllegalArgumentException("Categoría de archivo no válida: " + categoria);
            }
            if (!vistas.add(categoria)) {
                throw new IllegalArgumentException("Hay más de un archivo para «" + CATEGORIAS.get(categoria) + "».");
            }
            String nombre = archivos.get(i).getOriginalFilename() != null ? archivos.get(i).getOriginalFilename() : "";
            String extension = nombre.contains(".") ? nombre.substring(nombre.lastIndexOf('.') + 1).toLowerCase() : "";
            if (!EXTENSIONES.get(categoria).contains(extension)) {
                throw new IllegalArgumentException("«" + nombre + "» no es un formato válido para " + CATEGORIAS.get(categoria)
                    + " (" + String.join(", ", EXTENSIONES.get(categoria)) + ").");
            }
        }

        DocumentoPlanificacion slots = planificacion.getDocumentoPlanificacion();
        List<Documento> reemplazados = new ArrayList<>();
        for (int i = 0; i < archivos.size(); i++) {
            String categoria = categorias.get(i);
            FileStorageService.StoredFileResult stored = fileStorageService.storeFile(
                archivos.get(i), "planificaciones", EXTENSIONES.get(categoria));
            Documento documento = new Documento(stored.originalFilename(), "PLANIFICACION_" + categoria,
                stored.relativePath(), planificacion.getEstudiante().getUsuario());
            documento.setTamanioBytes(stored.sizeBytes());
            documento.setAsignatura(planificacion.getAsignatura());
            Documento anterior = slots.getArchivo(categoria);
            if (anterior != null) reemplazados.add(anterior);
            slots.setArchivo(categoria, documentoRepository.save(documento));
        }
        planificacionRepository.saveAndFlush(planificacion);
        eliminarDocumentos(reemplazados);
        return toDTO(planificacion);
    }

    @Transactional
    public PlanificacionDTO eliminarArchivo(Long idPlanificacion, String categoria, String rutUsuario) {
        Planificacion planificacion = buscarPropia(idPlanificacion, rutUsuario);
        DocumentoPlanificacion slots = planificacion.getDocumentoPlanificacion();
        Documento documento = slots.getArchivo(categoria);
        if (documento != null) {
            slots.setArchivo(categoria, null);
            planificacionRepository.saveAndFlush(planificacion);
            eliminarDocumentos(List.of(documento));
        }
        return toDTO(planificacion);
    }

    /** Elimina la planificación con sus archivos y las retroalimentaciones de IA que tenga. */
    @Transactional
    public void eliminar(Long idPlanificacion, String rutUsuario) {
        Planificacion planificacion = buscarPropia(idPlanificacion, rutUsuario);
        List<Documento> documentos = CATEGORIAS.keySet().stream()
            .map(c -> planificacion.getDocumentoPlanificacion().getArchivo(c))
            .filter(Objects::nonNull)
            .toList();
        // Hijas de la retroalimentación primero, para no romper sus FK
        jdbcTemplate.update("DELETE rp FROM respuesta_pregunta rp JOIN pregunta_diagnostica pd ON pd.id_pregunta = rp.id_pregunta "
            + "JOIN retroalimentacion_ia r ON r.id_retroalimentacion = pd.id_retroalimentacion WHERE r.id_planificacion = ?", idPlanificacion);
        jdbcTemplate.update("DELETE pd FROM pregunta_diagnostica pd JOIN retroalimentacion_ia r "
            + "ON r.id_retroalimentacion = pd.id_retroalimentacion WHERE r.id_planificacion = ?", idPlanificacion);
        jdbcTemplate.update("DELETE FROM retroalimentacion_ia WHERE id_planificacion = ?", idPlanificacion);
        planificacionRepository.delete(planificacion);
        planificacionRepository.flush();
        eliminarDocumentos(documentos);
    }

    public Documento obtenerDocumentoPorId(Long idDocumento) {
        return documentoRepository.findById(idDocumento).orElse(null);
    }

    /** Recurso físico para descargar un archivo de planificación. */
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

    private void eliminarDocumentos(List<Documento> documentos) {
        for (Documento d : documentos) {
            documentoRepository.delete(d);
            // Se borra tras el commit y solo si ningún otro registro usa el archivo
            fileStorageService.deleteFile(d.getUbicacion());
        }
    }

    private Estudiante buscarEstudiante(String rutRaw) {
        String rut = RutUtils.clean(rutRaw);
        return estudianteRepository.findByUsuarioRut(rutRaw)
            .or(() -> estudianteRepository.findAll().stream()
                .filter(e -> e.getUsuario() != null && RutUtils.clean(e.getUsuario().getRut()).equalsIgnoreCase(rut))
                .findFirst())
            .orElseThrow(() -> new IllegalArgumentException("Estudiante no encontrado con RUT: " + rutRaw));
    }

    /** La planificación debe existir y pertenecer al estudiante que hace la solicitud. */
    private Planificacion buscarPropia(Long idPlanificacion, String rutUsuario) {
        Planificacion planificacion = planificacionRepository.findById(idPlanificacion)
            .orElseThrow(() -> new IllegalArgumentException("Planificación no encontrada con ID: " + idPlanificacion));
        String rutDueno = planificacion.getEstudiante() != null && planificacion.getEstudiante().getUsuario() != null
            ? planificacion.getEstudiante().getUsuario().getRut() : null;
        if (rutDueno == null || !RutUtils.clean(rutDueno).equalsIgnoreCase(RutUtils.clean(rutUsuario))) {
            throw new IllegalArgumentException("La planificación no pertenece a este estudiante.");
        }
        if (planificacion.getDocumentoPlanificacion() == null) {
            planificacion.setDocumentoPlanificacion(new DocumentoPlanificacion());
        }
        return planificacion;
    }

    private PlanificacionDTO toDTO(Planificacion p) {
        DocumentoPlanificacion slots = p.getDocumentoPlanificacion();
        List<ArchivoPlanificacionDTO> archivos = new ArrayList<>();
        List<String> pendientes = new ArrayList<>();
        CATEGORIAS.forEach((categoria, etiqueta) -> {
            Documento d = slots != null ? slots.getArchivo(categoria) : null;
            if (d == null) {
                pendientes.add(categoria);
                archivos.add(new ArchivoPlanificacionDTO(categoria, etiqueta, null, null, null, null, null));
            } else {
                archivos.add(new ArchivoPlanificacionDTO(categoria, etiqueta, d.getIdDocumento(), d.getNombre(),
                    d.getTamanioBytes(), d.getFechaCarga(), "/api/planificaciones/archivos/" + d.getIdDocumento() + "/descargar"));
            }
        });
        String asignatura = p.getAsignatura() != null ? p.getAsignatura().getNombre() : null;
        return new PlanificacionDTO(p.getIdPlanificacion(), p.getFechaCreacion(), asignatura, archivos, pendientes, pendientes.isEmpty());
    }
}
