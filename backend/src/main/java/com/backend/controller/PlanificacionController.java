package com.backend.controller;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.function.Supplier;

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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.backend.model.Documento;
import com.backend.service.PlanificacionService;

/**
 * Planificaciones de clase del estudiante en práctica, cada una con 5 archivos obligatorios
 * (planificación, presentación, guía de actividades, rúbrica de evaluación y material didáctico).
 */
@RestController
@RequestMapping("/api/planificaciones")
@CrossOrigin(origins = "*")
public class PlanificacionController {

    private static final Logger logger = LoggerFactory.getLogger(PlanificacionController.class);

    private final PlanificacionService planificacionService;

    public PlanificacionController(PlanificacionService planificacionService) {
        this.planificacionService = planificacionService;
    }

    @GetMapping("/estudiante/{rut}")
    public ResponseEntity<?> obtenerPorEstudiante(@PathVariable String rut) {
        return responder(() -> planificacionService.obtenerPorEstudiante(rut));
    }

    @PostMapping("/estudiante/{rut}")
    public ResponseEntity<?> crear(@PathVariable String rut) {
        return responder(() -> planificacionService.crear(rut));
    }

    /** Sube varios archivos a la vez; categorias[i] es la categoría de archivos[i]. */
    @PostMapping("/{id}/archivos")
    public ResponseEntity<?> subirArchivos(
            @PathVariable Long id,
            @RequestParam("archivos") List<MultipartFile> archivos,
            @RequestParam("categorias") List<String> categorias,
            @RequestParam("rutUsuario") String rutUsuario) {
        return responder(() -> planificacionService.subirArchivos(id, archivos, categorias, rutUsuario));
    }

    @DeleteMapping("/{id}/archivos/{categoria}")
    public ResponseEntity<?> eliminarArchivo(@PathVariable Long id, @PathVariable String categoria,
                                             @RequestParam("rutUsuario") String rutUsuario) {
        return responder(() -> planificacionService.eliminarArchivo(id, categoria, rutUsuario));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Long id, @RequestParam("rutUsuario") String rutUsuario) {
        return responder(() -> {
            planificacionService.eliminar(id, rutUsuario);
            return Map.of("message", "Planificación eliminada.");
        });
    }

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

    /** Errores de validación como 400 con su mensaje; los demás como 500 sin detalles internos. */
    private ResponseEntity<?> responder(Supplier<Object> accion) {
        try {
            return ResponseEntity.ok(accion.get());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            logger.error("Error en planificaciones: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of("error", "No se pudo completar la operación de planificación."));
        }
    }
}
