package com.backend.controller;

import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
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
import com.backend.model.Documento;
import com.backend.model.Evidencia;
import com.backend.service.EvidenciaService;

@RestController
@RequestMapping("/api/evidencias")
@CrossOrigin(origins = "*")
public class EvidenciaController {

    private static final Logger logger = LoggerFactory.getLogger(EvidenciaController.class);

    private final EvidenciaService evidenciaService;

    public EvidenciaController(EvidenciaService evidenciaService) {
        this.evidenciaService = evidenciaService;
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
    public ResponseEntity<?> subirEvidencia(@RequestBody SubirEvidenciaDTO dto) {
        try {
            Evidencia guardada = evidenciaService.subirEvidencia(dto);
            return ResponseEntity.ok(guardada);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Endpoint multipart para que el estudiante suba un archivo vinculado a una actividad.
     * Registra el documento en la tabla documento con id_actividad y id_asignatura.
     */
    @PostMapping("/subir-archivo")
    public ResponseEntity<?> subirEvidenciaConArchivo(
            @RequestParam("file") MultipartFile file,
            @RequestParam("idActividad") Long idActividad,
            @RequestParam("rutEstudiante") String rutEstudiante,
            @RequestParam(value = "comentario", required = false) String comentario) {
        try {
            evidenciaService.validarPlazoEntrega(idActividad);
            Documento doc = evidenciaService.subirArchivoEstudiante(idActividad, rutEstudiante, comentario, file);
            return ResponseEntity.ok(Map.of(
                    "idDocumento", doc.getIdDocumento(),
                    "nombreArchivo", doc.getNombre(),
                    "estado", "ENTREGADO",
                    "mensaje", "Archivo entregado correctamente"
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            logger.error("Error al subir evidencia con archivo: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", "Error interno al procesar el archivo: " + e.getMessage()));
        }
    }

    /**
     * Endpoint para que el profesor califique la actividad de un estudiante:
     * crea el registro en la tabla Evidencia asociando:
     * - id_actividad
     * - id_estudiante
     * - id_asignatura
     * - id_archivo_alumno (subido previamente por el estudiante)
     * - id_archivo_profesor (subido en este acto por el profesor)
     * - id_nota (con la nota asignada y cálculo de si aprobó)
     */
    @PostMapping("/calificar")
    public ResponseEntity<?> calificarActividad(
            @RequestParam("idActividad") Long idActividad,
            @RequestParam("rutEstudiante") String rutEstudiante,
            @RequestParam("rutProfesor") String rutProfesor,
            @RequestParam("calificacion") Double calificacion,
            @RequestParam(value = "observacion", required = false) String observacion,
            @RequestParam(value = "archivoRevision", required = false) MultipartFile archivoRevision) {
        try {
            Evidencia guardada = evidenciaService.calificarORevisarActividad(
                    idActividad, rutEstudiante, rutProfesor, calificacion, observacion, archivoRevision
            );
            return ResponseEntity.ok(guardada);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            logger.error("Error al calificar actividad: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", "Error interno al calificar: " + e.getMessage()));
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

    /**
     * Guarda la revisión y, opcionalmente, un archivo de retroalimentación del profesor.
     */
    @PutMapping("/{id}/revisar-con-archivo")
    public ResponseEntity<?> revisarEvidenciaConArchivo(
            @PathVariable Long id,
            @RequestParam(value = "rutProfesor", required = false) String rutProfesor,
            @RequestParam(value = "retroalimentacion", required = false) String retroalimentacion,
            @RequestParam(value = "calificacion", required = false) Double calificacion,
            @RequestParam(value = "estado", required = false) String estado,
            @RequestParam(value = "archivoRevision", required = false) MultipartFile archivoRevision) {
        try {
            RevisionEvidenciaDTO dto = new RevisionEvidenciaDTO(rutProfesor, retroalimentacion, calificacion, estado);
            return ResponseEntity.ok(evidenciaService.revisarEvidenciaConArchivo(id, dto, archivoRevision));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            logger.error("Error al guardar revisión de evidencia {}: {}", id, e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", "No se pudo guardar la revisión."));
        }
    }

    @GetMapping("/{id}/archivo-alumno")
    public ResponseEntity<Resource> descargarArchivoAlumno(@PathVariable Long id) {
        try {
            Resource recurso = evidenciaService.obtenerRecursoArchivo(id, false);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + recurso.getFilename() + "\"")
                    .body(recurso);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{id}/archivo-profesor")
    public ResponseEntity<Resource> descargarArchivoProfesor(@PathVariable Long id) {
        try {
            Resource recurso = evidenciaService.obtenerRecursoArchivo(id, true);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + recurso.getFilename() + "\"")
                    .body(recurso);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{id}/archivo")
    public ResponseEntity<Resource> descargarArchivo(@PathVariable Long id, @RequestParam(value = "revision", defaultValue = "false") boolean revision) {
        try {
            Resource recurso = evidenciaService.obtenerRecursoArchivo(id, revision);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + recurso.getFilename() + "\"")
                    .body(recurso);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Long id) {
        try {
            evidenciaService.eliminar(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/actividad/{idActividad}/estudiante/{rutEstudiante}")
    public ResponseEntity<?> eliminarEntregaEstudiante(
            @PathVariable Long idActividad,
            @PathVariable String rutEstudiante) {
        try {
            evidenciaService.eliminarEntregaEstudiante(idActividad, rutEstudiante);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
