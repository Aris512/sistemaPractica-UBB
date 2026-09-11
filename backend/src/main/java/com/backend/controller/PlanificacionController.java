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

import com.backend.model.Planificacion;
import com.backend.service.PlanificacionService;

@RestController
@RequestMapping("/api/planificaciones")
public class PlanificacionController {

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

    @PostMapping
    public ResponseEntity<Planificacion> crear(@RequestBody Planificacion planificacion) {
        return ResponseEntity.ok(planificacionService.crear(planificacion));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        planificacionService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
