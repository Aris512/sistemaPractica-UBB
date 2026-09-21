package com.backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.backend.dto.EstudianteEvaluacionDTO;
import com.backend.dto.GuardarEvaluacionProfesorRequest;
import com.backend.model.Evaluacion;
import com.backend.model.Nota;
import com.backend.service.EvaluacionService;

@RestController
@RequestMapping("/api/evaluaciones")
public class EvaluacionController {

    private final EvaluacionService evaluacionService;

    public EvaluacionController(EvaluacionService evaluacionService) {
        this.evaluacionService = evaluacionService;
    }

    @GetMapping
    public ResponseEntity<List<Evaluacion>> obtenerTodos() {
        return ResponseEntity.ok(evaluacionService.obtenerTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Evaluacion> obtenerPorId(@PathVariable Long id) {
        Evaluacion evaluacion = evaluacionService.obtenerPorId(id);
        if (evaluacion == null) {
            return ResponseEntity.notFound().build();
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

    @PostMapping("/guardar")
    public ResponseEntity<EstudianteEvaluacionDTO> guardarEvaluacionProfesor(@RequestBody GuardarEvaluacionProfesorRequest req) {
        return ResponseEntity.ok(evaluacionService.guardarEvaluacionProfesor(req));
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
}
