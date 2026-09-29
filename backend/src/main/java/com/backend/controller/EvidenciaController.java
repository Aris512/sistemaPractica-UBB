package com.backend.controller;

import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.backend.dto.RevisionEvidenciaDTO;
import com.backend.dto.SeguimientoEstudianteDTO;
import com.backend.dto.SubirEvidenciaDTO;
import com.backend.model.Evidencia;
import com.backend.service.EvidenciaService;
import com.backend.service.FileStorageService;

@RestController
@RequestMapping("/api/evidencias")
@CrossOrigin(origins = "*")
public class EvidenciaController {

    private static final Logger logger = LoggerFactory.getLogger(EvidenciaController.class);

    private final EvidenciaService evidenciaService;
    private final FileStorageService fileStorageService;

    public EvidenciaController(EvidenciaService evidenciaService, FileStorageService fileStorageService) {
        this.evidenciaService = evidenciaService;
        this.fileStorageService = fileStorageService;
    }

    @GetMapping
    public ResponseEntity<List<Evidencia>> obtenerTodas() {
        return ResponseEntity.ok(evidenciaService.obtenerTodas());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Evidencia> obtenerPorId(@PathVariable Long id) {
        Evidencia evidencia = evidenciaService.obtenerPorId(id);
        if (evidencia == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(evidencia);
    }

    @GetMapping("/estudiante/{rut}")
    public ResponseEntity<List<Evidencia>> obtenerHistorialEstudiante(@PathVariable String rut) {
        return ResponseEntity.ok(evidenciaService.obtenerHistorialEstudiante(rut));
    }

    @GetMapping("/actividad/{idActividad}")
    public ResponseEntity<List<Evidencia>> obtenerPorActividad(@PathVariable Long idActividad) {
        return ResponseEntity.ok(evidenciaService.obtenerPorActividad(idActividad));
    }

    @GetMapping("/profesor/{rut}")
    public ResponseEntity<List<Evidencia>> obtenerPorProfesor(@PathVariable String rut) {
        return ResponseEntity.ok(evidenciaService.obtenerPorProfesor(rut));
    }

    @GetMapping("/seguimiento/profesor/{rut}")
    public ResponseEntity<List<SeguimientoEstudianteDTO>> obtenerSeguimientoProfesor(@PathVariable String rut) {
        return ResponseEntity.ok(evidenciaService.obtenerSeguimientoProfesor(rut));
    }

    @PostMapping
    public ResponseEntity<Evidencia> subirEvidencia(@RequestBody SubirEvidenciaDTO dto) {
        try {
            Evidencia guardada = evidenciaService.subirEvidencia(dto);
            return ResponseEntity.ok(guardada);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Endpoint multipart para que el estudiante suba un archivo real vinculado a una actividad.
     * Acepta: file (MultipartFile), idActividad (Long), rutEstudiante (String), comentario (String opcional).
     */
    @PostMapping("/subir-archivo")
    public ResponseEntity<?> subirEvidenciaConArchivo(
            @RequestParam("file") MultipartFile file,
            @RequestParam("idActividad") Long idActividad,
            @RequestParam("rutEstudiante") String rutEstudiante,
            @RequestParam(value = "comentario", required = false) String comentario) {
        try {
            FileStorageService.StoredFileResult stored = fileStorageService.storeFile(
                    file,
                    "evidencias",
                    java.util.List.of("pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "png", "jpg", "jpeg", "zip")
            );

            SubirEvidenciaDTO dto = new SubirEvidenciaDTO(
                    idActividad,
                    rutEstudiante,
                    comentario,
                    stored.originalFilename(),
                    stored.relativePath()
            );

            Evidencia guardada = evidenciaService.subirEvidencia(dto);
            return ResponseEntity.ok(guardada);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            logger.error("Error al subir evidencia con archivo: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", "Error interno al procesar el archivo: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}/revisar")
    public ResponseEntity<Evidencia> revisarEvidencia(@PathVariable Long id, @RequestBody RevisionEvidenciaDTO dto) {
        try {
            Evidencia revisada = evidenciaService.revisarEvidencia(id, dto);
            return ResponseEntity.ok(revisada);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        evidenciaService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
