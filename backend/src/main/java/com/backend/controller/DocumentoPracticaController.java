package com.backend.controller;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.backend.dto.DetalleEstudianteDocumentosDTO;
import com.backend.model.DocumentoPractica;
import com.backend.service.DocumentoPracticaService;

@RestController
@RequestMapping("/api/documentos-practica")
@CrossOrigin(origins = "*")
public class DocumentoPracticaController {

    private static final Logger logger = LoggerFactory.getLogger(DocumentoPracticaController.class);

    private final DocumentoPracticaService documentoPracticaService;

    public DocumentoPracticaController(DocumentoPracticaService documentoPracticaService) {
        this.documentoPracticaService = documentoPracticaService;
    }

    /**
     * Permite a un estudiante subir o actualizar su informe de práctica (límite 20MB).
     */
    @PostMapping("/estudiante/subir")
    public ResponseEntity<?> subirInformeEstudiante(
            @RequestParam("file") MultipartFile file,
            @RequestParam("rutEstudiante") String rutEstudiante,
            @RequestParam(value = "nombreDocumento", required = false) String nombreDocumento) {
        try {
            DocumentoPractica guardado = documentoPracticaService.subirDocumentoEstudiante(rutEstudiante, file, nombreDocumento);
            return ResponseEntity.ok(guardado);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        } catch (Exception e) {
            logger.error("Error al subir informe de estudiante: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(java.util.Map.of("error", "Error interno al procesar el archivo: " + e.getMessage()));
        }
    }

    /**
     * Permite a un profesor subir la pauta o evaluación final de un estudiante (límite 20MB).
     */
    @PostMapping("/profesor/subir")
    public ResponseEntity<?> subirEvaluacionProfesor(
            @RequestParam("file") MultipartFile file,
            @RequestParam("rutProfesor") String rutProfesor,
            @RequestParam("rutEstudiante") String rutEstudiante,
            @RequestParam(value = "idAsignatura", required = false) Long idAsignatura,
            @RequestParam(value = "nombreDocumento", required = false) String nombreDocumento) {
        try {
            DocumentoPractica guardado = documentoPracticaService.subirDocumentoProfesor(rutProfesor, rutEstudiante, idAsignatura, file, nombreDocumento);
            return ResponseEntity.ok(guardado);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        } catch (Exception e) {
            logger.error("Error al subir evaluación del profesor: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(java.util.Map.of("error", "Error interno al procesar el archivo: " + e.getMessage()));
        }
    }

    /**
     * Obtiene el estado consolidado de los documentos del estudiante (Informe Estudiante + Evaluación Profesor).
     */
    @GetMapping("/estudiante/{rut}")
    public ResponseEntity<?> obtenerDocumentosEstudiante(@PathVariable String rut) {
        DetalleEstudianteDocumentosDTO detalle = documentoPracticaService.obtenerDetalleEstudiante(rut);
        if (detalle == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(detalle);
    }

    /**
     * Descarga segura de un documento del proceso de práctica.
     */
    @GetMapping("/descargar/{id}")
    public ResponseEntity<Resource> descargarArchivo(@PathVariable Long id) {
        DocumentoPractica doc = documentoPracticaService.obtenerDocumentoPorId(id);
        if (doc == null) {
            return ResponseEntity.notFound().build();
        }

        try {
            Resource recurso = documentoPracticaService.obtenerRecursoArchivo(doc);
            String nombreArchivo = doc.getNombreArchivo() != null ? doc.getNombreArchivo() : "documento.pdf";
            String encodedFilename = URLEncoder.encode(nombreArchivo, StandardCharsets.UTF_8).replace("+", "%20");

            MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
            if (nombreArchivo.toLowerCase().endsWith(".pdf")) {
                mediaType = MediaType.APPLICATION_PDF;
            }

            return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + nombreArchivo + "\"; filename*=UTF-8''" + encodedFilename)
                .body(recurso);
        } catch (IOException e) {
            logger.error("Error al descargar archivo {}: {}", id, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}
