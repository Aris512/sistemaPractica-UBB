package com.backend.controller;

import java.io.IOException;
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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.backend.dto.DetalleEstudianteDocumentosDTO;
import com.backend.dto.EstudianteDocumentoDTO;
import com.backend.model.DocumentoPractica;
import com.backend.model.Evidencia;
import com.backend.service.DocumentoPracticaService;
import com.backend.service.EvidenciaService;

import jakarta.servlet.http.HttpServletResponse;

@RestController
@RequestMapping("/admin/documentos")
@CrossOrigin(origins = "*")
public class AdminDocumentoController {

    private static final Logger logger = LoggerFactory.getLogger(AdminDocumentoController.class);

    private final DocumentoPracticaService documentoPracticaService;
    private final EvidenciaService evidenciaService;

    public AdminDocumentoController(DocumentoPracticaService documentoPracticaService,
                                   EvidenciaService evidenciaService) {
        this.documentoPracticaService = documentoPracticaService;
        this.evidenciaService = evidenciaService;
    }

    /** Descarga el archivo entregado o la revisión adjunta de una evidencia real. */
    @GetMapping("/evidencias/{idEvidencia}/archivo")
    public ResponseEntity<Resource> descargarArchivoEvidencia(
            @PathVariable Long idEvidencia,
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "ESTUDIANTE") String tipo) {
        Evidencia evidencia = evidenciaService.obtenerPorId(idEvidencia);
        if (evidencia == null) return ResponseEntity.notFound().build();

        boolean esRevision = "PROFESOR".equalsIgnoreCase(tipo);
        String nombre = esRevision ? evidencia.getNombreArchivoRevision() : evidencia.getNombreArchivo();
        if (nombre == null || nombre.isBlank()) return ResponseEntity.notFound().build();

        try {
            Resource recurso = evidenciaService.obtenerRecursoArchivo(idEvidencia, esRevision);
            String encodedFilename = URLEncoder.encode(nombre, StandardCharsets.UTF_8).replace("+", "%20");
            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + nombre + "\"; filename*=UTF-8''" + encodedFilename)
                .body(recurso);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Obtiene el listado consolidado de estudiantes con su progreso de documentación.
     */
    @GetMapping("/estudiantes")
    public ResponseEntity<List<EstudianteDocumentoDTO>> obtenerEstudiantes() {
        return ResponseEntity.ok(documentoPracticaService.obtenerEstudiantesConProgreso());
    }

    /**
     * Obtiene el detalle de documentación de un estudiante específico (documentos entregados/pendientes y correos de contacto).
     */
    @GetMapping("/estudiantes/{rut}")
    public ResponseEntity<?> obtenerDetalleEstudiante(@PathVariable String rut) {
        DetalleEstudianteDocumentosDTO detalle = documentoPracticaService.obtenerDetalleEstudiante(rut);
        if (detalle == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(detalle);
    }

    /**
     * Descarga un archivo individual de documento de práctica.
     */
    @GetMapping("/archivo/{id}")
    public ResponseEntity<Resource> descargarArchivo(@PathVariable Long id) {
        DocumentoPractica doc = documentoPracticaService.obtenerDocumentoPorId(id);
        if (doc == null) {
            return ResponseEntity.notFound().build();
        }

        try {
            Resource recurso = documentoPracticaService.obtenerRecursoArchivo(doc);
            String nombreArchivo = doc.getNombreArchivo() != null ? doc.getNombreArchivo() : "documento.pdf";
            String encodedFilename = URLEncoder.encode(nombreArchivo, StandardCharsets.UTF_8).replace("+", "%20");

            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + nombreArchivo + "\"; filename*=UTF-8''" + encodedFilename)
                .body(recurso);
        } catch (IOException e) {
            logger.error("Error al leer archivo {}: {}", id, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Descarga toda la documentación del estudiante comprimida en formato .zip, organizada por asignatura.
     */
    @GetMapping("/estudiantes/{rut}/descargar")
    public void descargarZipEstudiante(@PathVariable String rut, HttpServletResponse response) {
        try {
            DetalleEstudianteDocumentosDTO detalle = documentoPracticaService.obtenerDetalleEstudiante(rut);
            String baseNombre = detalle != null && detalle.getNombre() != null
                ? detalle.getNombre().trim().replaceAll("\\s+", "_")
                : "estudiante_" + rut;
            String zipFilename = baseNombre + "_expediente.zip";
            String encodedFilename = URLEncoder.encode(zipFilename, StandardCharsets.UTF_8).replace("+", "%20");

            response.setContentType("application/zip");
            response.setHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + zipFilename + "\"; filename*=UTF-8''" + encodedFilename);

            documentoPracticaService.escribirZipEstudiante(rut, response.getOutputStream());
            response.flushBuffer();
        } catch (Exception e) {
            logger.error("Error al generar archivo ZIP para estudiante {}: {}", rut, e.getMessage());
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }
}
