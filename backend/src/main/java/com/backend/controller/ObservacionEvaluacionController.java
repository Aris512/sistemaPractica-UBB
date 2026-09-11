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

import com.backend.model.ObservacionEvaluacion;
import com.backend.service.ObservacionEvaluacionService;

@RestController
@RequestMapping("/api/observaciones-evaluacion")
public class ObservacionEvaluacionController {

    private final ObservacionEvaluacionService observacionEvaluacionService;

    public ObservacionEvaluacionController(ObservacionEvaluacionService observacionEvaluacionService) {
        this.observacionEvaluacionService = observacionEvaluacionService;
    }

    @GetMapping
    public ResponseEntity<List<ObservacionEvaluacion>> obtenerTodos() {
        return ResponseEntity.ok(observacionEvaluacionService.obtenerTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ObservacionEvaluacion> obtenerPorId(@PathVariable Long id) {
        ObservacionEvaluacion observacionEvaluacion = observacionEvaluacionService.obtenerPorId(id);
        if (observacionEvaluacion == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(observacionEvaluacion);
    }

    @PostMapping
    public ResponseEntity<ObservacionEvaluacion> crear(@RequestBody ObservacionEvaluacion observacionEvaluacion) {
        return ResponseEntity.ok(observacionEvaluacionService.crear(observacionEvaluacion));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        observacionEvaluacionService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
