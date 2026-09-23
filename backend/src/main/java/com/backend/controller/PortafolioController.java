package com.backend.controller;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

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

import com.backend.dto.PortafolioItemDTO;
import com.backend.model.Documento;
import com.backend.service.PortafolioService;

@RestController
@RequestMapping("/api/portafolio")
@CrossOrigin(origins = "*")
public class PortafolioController {

    private static final Logger logger = LoggerFactory.getLogger(PortafolioController.class);

    private final PortafolioService portafolioService;

    public PortafolioController(PortafolioService portafolioService) {
        this.portafolioService = portafolioService;
    }

    /**
     * Obtiene todos los documentos y evidencias del portafolio del estudiante indicado.
     */
    @GetMapping("/estudiante/{rut}")
    public ResponseEntity<List<PortafolioItemDTO>> obtenerDocumentosEstudiante(@PathVariable String rut) {
        return ResponseEntity.ok(portafolioService.obtenerDocumentosPorEstudiante(rut));
    }

    /**
     * Lista estudiantes con portafolios para supervisión de docentes o coordinadores.
     * Opcionalmente filtrado por idAsignatura.
     */
    @GetMapping("/estudiantes")
    public ResponseEntity<List<Map<String, Object>>> obtenerEstudiantesSupervision(
            @RequestParam(value = "idAsignatura", required = false) Long idAsignatura) {
        return ResponseEntity.ok(portafolioService.obtenerEstudiantesConPortafolio(idAsignatura));
    }

    /**
     * Carga un archivo al portafolio de un estudiante (límite 20 MB).
     */
    @PostMapping("/subir")
    public ResponseEntity<?> subirDocumento(
            @RequestParam("file") MultipartFile file,
            @RequestParam("rutEstudiante") String rutEstudiante,
            @RequestParam(value = "tipo", defaultValue = "EVIDENCIA") String tipo,
            @RequestParam(value = "rutUsuarioSubio", required = false) String rutUsuarioSubio,
            @RequestParam(value = "descripcion", required = false) String descripcion,
            @RequestParam(value = "idAsignatura", required = false) Long idAsignatura) {
        try {
            PortafolioItemDTO guardado = portafolioService.subirDocumentoPortafolio(
                file, rutEstudiante, tipo, rutUsuarioSubio, descripcion, idAsignatura
            );
            return ResponseEntity.ok(guardado);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            logger.error("Error al subir archivo a portafolio: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", "Error interno al procesar el archivo: " + e.getMessage()));
        }
    }

    /**
     * Elimina un archivo del portafolio y su archivo físico en disco.
     */
    @DeleteMapping("/{idDocumento}")
    public ResponseEntity<?> eliminarDocumento(@PathVariable Long idDocumento) {
        try {
            portafolioService.eliminarDocumento(idDocumento);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            logger.error("Error al eliminar documento {}: {}", idDocumento, e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", "Error al eliminar archivo: " + e.getMessage()));
        }
    }

    /**
     * Descarga de un archivo del portafolio.
     */
    @GetMapping("/archivos/{idDocumento}/descargar")
    public ResponseEntity<Resource> descargarArchivo(@PathVariable Long idDocumento) {
        Documento doc = portafolioService.obtenerDocumentoPorId(idDocumento);
        if (doc == null) {
            return ResponseEntity.notFound().build();
        }

        try {
            Resource recurso = portafolioService.obtenerRecursoArchivo(idDocumento);
            String nombreArchivo = doc.getNombre() != null ? doc.getNombre() : "archivo_portafolio";
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
            logger.error("Error al descargar archivo {} del portafolio: {}", idDocumento, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}
