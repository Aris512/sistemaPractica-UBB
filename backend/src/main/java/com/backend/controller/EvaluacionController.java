package com.backend.controller;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.backend.dto.EstudianteEvaluacionDTO;
import com.backend.dto.GuardarEvaluacionProfesorRequest;
import com.backend.dto.HistorialItemDTO;
import com.backend.model.Evaluacion;
import com.backend.model.Nota;
import com.backend.service.EstudianteService;
import com.backend.service.EvaluacionService;

import org.springframework.web.bind.annotation.CrossOrigin;

@RestController
@RequestMapping("/api/evaluaciones")
@CrossOrigin(origins = "*")
public class EvaluacionController {

    private final EvaluacionService evaluacionService;
    private final EstudianteService estudianteService;

    public EvaluacionController(EvaluacionService evaluacionService,
                                EstudianteService estudianteService) {
        this.evaluacionService = evaluacionService;
        this.estudianteService = estudianteService;
    }

    /**
     * HU-25: Filtro de privilegios por rol.
     * Si se envía 'rutProfesor', retorna EXCLUSIVAMENTE las evaluaciones de los estudiantes
     * que tiene asignados el profesor. Si no se envía (ej. rol Administrador), retorna todas.
     */
    @GetMapping
    public ResponseEntity<List<Evaluacion>> obtenerTodos(
            @RequestParam(value = "rutProfesor", required = false) String rutProfesor) {
        if (rutProfesor != null && !rutProfesor.isBlank()) {
            return ResponseEntity.ok(evaluacionService.obtenerEvaluacionesPorProfesor(rutProfesor));
        }
        return ResponseEntity.ok(evaluacionService.obtenerTodos());
    }

    /**
     * Endpoint directo para listar evaluaciones acotadas a un profesor.
     */
    @GetMapping("/profesor/{rutProfesor}/listado")
    public ResponseEntity<List<Evaluacion>> obtenerEvaluacionesPorProfesor(@PathVariable String rutProfesor) {
        return ResponseEntity.ok(evaluacionService.obtenerEvaluacionesPorProfesor(rutProfesor));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> obtenerPorId(
            @PathVariable Long id,
            @RequestParam(value = "rutProfesor", required = false) String rutProfesor) {
        Evaluacion evaluacion = evaluacionService.obtenerPorId(id);
        if (evaluacion == null) {
            return ResponseEntity.notFound().build();
        }
        if (rutProfesor != null && !rutProfesor.isBlank()) {
            if (!evaluacionService.profesorTieneAccesoAEvaluacion(id, rutProfesor)) {
                return ResponseEntity.status(403).body("Acceso denegado: No tiene permisos sobre esta evaluación.");
            }
        }
        return ResponseEntity.ok(evaluacion);
    }

    @PostMapping
    public ResponseEntity<Evaluacion> crear(@RequestBody Evaluacion evaluacion) {
        return ResponseEntity.ok(evaluacionService.crear(evaluacion));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        evaluacionService.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/profesor/{rutProfesor}")
    public ResponseEntity<List<EstudianteEvaluacionDTO>> obtenerEstudiantesParaProfesor(@PathVariable String rutProfesor) {
        return ResponseEntity.ok(evaluacionService.obtenerEstudiantesParaProfesor(rutProfesor));
    }

    @GetMapping("/estudiante/rut/{rutEstudiante}")
    public ResponseEntity<List<EstudianteEvaluacionDTO>> obtenerEvaluacionesParaEstudiante(@PathVariable String rutEstudiante) {
        return ResponseEntity.ok(evaluacionService.obtenerEvaluacionesParaEstudiante(rutEstudiante));
    }

    /**
     * HU-09: Historial consolidado del estudiante con checks de completitud.
     */
    @GetMapping("/estudiante/rut/{rutEstudiante}/historial")
    public ResponseEntity<List<HistorialItemDTO>> obtenerHistorialEstudiante(@PathVariable String rutEstudiante) {
        return ResponseEntity.ok(estudianteService.obtenerHistorialEstudiante(rutEstudiante));
    }

    @PostMapping("/guardar")
    public ResponseEntity<EstudianteEvaluacionDTO> guardarEvaluacionProfesor(@RequestBody GuardarEvaluacionProfesorRequest req) {
        return ResponseEntity.ok(evaluacionService.guardarEvaluacionProfesor(req));
    }

    @PostMapping(value = "/guardar-con-archivo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<EstudianteEvaluacionDTO> guardarEvaluacionMultipart(
            @RequestParam("idEstudiante") Long idEstudiante,
            @RequestParam("rutProfesor") String rutProfesor,
            @RequestParam(value = "idEvaluacion", required = false) Long idEvaluacion,
            @RequestParam(value = "tipoEvaluacion", required = false) String tipoEvaluacion,
            @RequestParam(value = "puntajeObtenido", required = false) Double puntajeObtenido,
            @RequestParam(value = "observacion", required = false) String observacion,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "eliminarArchivo", required = false, defaultValue = "false") Boolean eliminarArchivo) {
        return ResponseEntity.ok(evaluacionService.guardarEvaluacionConArchivo(
                idEstudiante, rutProfesor, idEvaluacion, tipoEvaluacion, puntajeObtenido, observacion, file, eliminarArchivo
        ));
    }

    @GetMapping("/{idEvaluacion}/archivo")
    public ResponseEntity<Resource> descargarArchivoEvaluacion(@PathVariable Long idEvaluacion) {
        try {
            Evaluacion evaluacion = evaluacionService.obtenerPorId(idEvaluacion);
            Resource recurso = evaluacionService.obtenerRecursoArchivo(idEvaluacion);
            String nombre = (evaluacion != null && evaluacion.getNombreArchivo() != null)
                    ? evaluacion.getNombreArchivo()
                    : "evaluacion_" + idEvaluacion + ".pdf";
            String encodedFilename = URLEncoder.encode(nombre, StandardCharsets.UTF_8).replace("+", "%20");
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + nombre + "\"; filename*=UTF-8''" + encodedFilename)
                    .body(recurso);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/estudiante/{idEstudiante}/archivo")
    public ResponseEntity<Resource> descargarArchivoPorEstudiante(@PathVariable Long idEstudiante) {
        try {
            Resource recurso = evaluacionService.obtenerRecursoArchivoPorEstudiante(idEstudiante);
            String nombre = "documento_evaluacion_estudiante_" + idEstudiante + ".pdf";
            String encodedFilename = URLEncoder.encode(nombre, StandardCharsets.UTF_8).replace("+", "%20");
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + nombre + "\"; filename*=UTF-8''" + encodedFilename)
                    .body(recurso);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{idEvaluacion}/archivo")
    public ResponseEntity<EstudianteEvaluacionDTO> eliminarArchivoEvaluacion(@PathVariable Long idEvaluacion) {
        try {
            return ResponseEntity.ok(evaluacionService.eliminarArchivoEvaluacion(idEvaluacion));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/nota/{idEstudiante}")
    public ResponseEntity<Nota> obtenerNotaPorEstudiante(@PathVariable Long idEstudiante) {
        return evaluacionService.obtenerNotaPorEstudiante(idEstudiante)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/estudiante/{idEstudiante}/nota")
    public ResponseEntity<EstudianteEvaluacionDTO> eliminarNotaEstudiante(@PathVariable Long idEstudiante) {
        return ResponseEntity.ok(evaluacionService.eliminarNotaEstudiante(idEstudiante));
    }

    @DeleteMapping("/estudiante/{idEstudiante}/observacion")
    public ResponseEntity<EstudianteEvaluacionDTO> eliminarObservacionEstudiante(@PathVariable Long idEstudiante) {
        return ResponseEntity.ok(evaluacionService.eliminarObservacionEstudiante(idEstudiante));
    }

    @DeleteMapping("/estudiante/{idEstudiante}/completa")
    public ResponseEntity<EstudianteEvaluacionDTO> eliminarEvaluacionYEntregasCompletas(@PathVariable Long idEstudiante) {
        return ResponseEntity.ok(evaluacionService.eliminarEvaluacionYEntregasCompletas(idEstudiante));
    }
}
