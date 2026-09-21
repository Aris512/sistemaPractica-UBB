package com.backend.controller;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.backend.dto.ArchivoPlanificacionDTO;
import com.backend.model.Documento;
import com.backend.model.Planificacion;
import com.backend.service.PlanificacionService;

@RestController
@RequestMapping("/api/planificaciones")
@CrossOrigin(origins = "*")
public class PlanificacionController {

    private static final Logger logger = LoggerFactory.getLogger(PlanificacionController.class);

    private final PlanificacionService planificacionService;

    public PlanificacionController(PlanificacionService planificacionService) {
        this.planificacionService = planificacionService;
    }

    @GetMapping
    public ResponseEntity<List<Planificacion>> obtenerTodos() {
        return ResponseEntity.ok(planificacionService.obtenerTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Planificacion> obtenerPorId(@PathVariable Long id) {
        Planificacion planificacion = planificacionService.obtenerPorId(id);
        if (planificacion == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(planificacion);
    }

    @GetMapping("/estudiante/{rut}")
    public ResponseEntity<List<Planificacion>> obtenerPorEstudiante(@PathVariable String rut) {
        return ResponseEntity.ok(planificacionService.obtenerPlanificacionesPorEstudiante(rut));
    }

    @PostMapping
    public ResponseEntity<Planificacion> crear(@RequestBody Planificacion planificacion) {
        return ResponseEntity.ok(planificacionService.crear(planificacion));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        planificacionService.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Adjunta un archivo a una planificación (Límite 20MB, categorías: GUIA, RECURSO, POWERPOINT, PAUTA_EVALUACION).
     */
    @PostMapping("/{id}/archivos")
    public ResponseEntity<?> adjuntarArchivo(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "tipo", defaultValue = "RECURSO") String tipo,
            @RequestParam(value = "rutUsuario", required = false) String rutUsuario) {
        try {
            ArchivoPlanificacionDTO dto = planificacionService.adjuntarArchivo(id, file, tipo, rutUsuario);
            return ResponseEntity.ok(dto);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        } catch (Exception e) {
            logger.error("Error al adjuntar archivo a planificación {}: {}", id, e.getMessage());
            return ResponseEntity.internalServerError().body(java.util.Map.of("error", "Error interno al adjuntar archivo: " + e.getMessage()));
        }
    }

    /**
     * Obtiene la lista de archivos asociados a una planificación.
     */
    @GetMapping("/{id}/archivos")
    public ResponseEntity<List<ArchivoPlanificacionDTO>> obtenerArchivosDePlanificacion(@PathVariable Long id) {
        return ResponseEntity.ok(planificacionService.obtenerArchivosDePlanificacion(id));
    }

    /**
     * Elimina un archivo adjunto de una planificación.
     */
    @DeleteMapping("/{id}/archivos/{idDocumento}")
    public ResponseEntity<Void> eliminarArchivo(@PathVariable Long id, @PathVariable Long idDocumento) {
        planificacionService.eliminarArchivo(id, idDocumento);
        return ResponseEntity.noContent().build();
    }

    /**
     * Descarga de un archivo adjunto de planificación.
     */
    @GetMapping("/archivos/{idDocumento}/descargar")
    public ResponseEntity<Resource> descargarArchivo(@PathVariable Long idDocumento) {
        try {
            Documento doc = planificacionService.obtenerDocumentoPorId(idDocumento);
            if (doc == null) {
                return ResponseEntity.notFound().build();
            }

            Resource recurso = planificacionService.obtenerRecursoArchivo(idDocumento);
            String nombreArchivo = doc.getNombre() != null ? doc.getNombre() : "archivo_planificacion";
            String encodedFilename = URLEncoder.encode(nombreArchivo, StandardCharsets.UTF_8).replace("+", "%20");

            MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
            String lower = nombreArchivo.toLowerCase();
            if (lower.endsWith(".pdf")) {
                mediaType = MediaType.APPLICATION_PDF;
            } else if (lower.endsWith(".png")) {
                mediaType = MediaType.IMAGE_PNG;
            } else if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
                mediaType = MediaType.IMAGE_JPEG;
            }

            return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + nombreArchivo + "\"; filename*=UTF-8''" + encodedFilename)
                .body(recurso);
        } catch (Exception e) {
            logger.error("Error al descargar archivo de planificación {}: {}", idDocumento, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}
