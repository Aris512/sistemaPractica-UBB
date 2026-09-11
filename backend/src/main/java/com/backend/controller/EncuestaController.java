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

import com.backend.model.Encuesta;
import com.backend.service.EncuestaService;

@RestController
@RequestMapping("/api/encuestas")
public class EncuestaController {

    private final EncuestaService encuestaService;

    public EncuestaController(EncuestaService encuestaService) {
        this.encuestaService = encuestaService;
    }

    @GetMapping
    public ResponseEntity<List<Encuesta>> obtenerTodos() {
        return ResponseEntity.ok(encuestaService.obtenerTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Encuesta> obtenerPorId(@PathVariable Long id) {
        Encuesta encuesta = encuestaService.obtenerPorId(id);
        if (encuesta == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(encuesta);
    }

    @PostMapping
    public ResponseEntity<Encuesta> crear(@RequestBody Encuesta encuesta) {
        return ResponseEntity.ok(encuestaService.crear(encuesta));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        encuestaService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
