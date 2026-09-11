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

import com.backend.model.ProyectoIntervencion;
import com.backend.service.ProyectoIntervencionService;

@RestController
@RequestMapping("/api/proyectos-intervencion")
public class ProyectoIntervencionController {

    private final ProyectoIntervencionService proyectoIntervencionService;

    public ProyectoIntervencionController(ProyectoIntervencionService proyectoIntervencionService) {
        this.proyectoIntervencionService = proyectoIntervencionService;
    }

    @GetMapping
    public ResponseEntity<List<ProyectoIntervencion>> obtenerTodos() {
        return ResponseEntity.ok(proyectoIntervencionService.obtenerTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProyectoIntervencion> obtenerPorId(@PathVariable Long id) {
        ProyectoIntervencion proyectoIntervencion = proyectoIntervencionService.obtenerPorId(id);
        if (proyectoIntervencion == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(proyectoIntervencion);
    }

    @PostMapping
    public ResponseEntity<ProyectoIntervencion> crear(@RequestBody ProyectoIntervencion proyectoIntervencion) {
        return ResponseEntity.ok(proyectoIntervencionService.crear(proyectoIntervencion));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        proyectoIntervencionService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
