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

import com.backend.model.ProfesorColaborador;
import com.backend.service.ProfesorColaboradorService;

@RestController
@RequestMapping("/api/profesores-colaboradores")
public class ProfesorColaboradorController {

    private final ProfesorColaboradorService profesorColaboradorService;

    public ProfesorColaboradorController(ProfesorColaboradorService profesorColaboradorService) {
        this.profesorColaboradorService = profesorColaboradorService;
    }

    @GetMapping
    public ResponseEntity<List<ProfesorColaborador>> obtenerTodos() {
        return ResponseEntity.ok(profesorColaboradorService.obtenerTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProfesorColaborador> obtenerPorId(@PathVariable Long id) {
        ProfesorColaborador profesorColaborador = profesorColaboradorService.obtenerPorId(id);
        if (profesorColaborador == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(profesorColaborador);
    }

    @PostMapping
    public ResponseEntity<ProfesorColaborador> crear(@RequestBody ProfesorColaborador profesorColaborador) {
        return ResponseEntity.ok(profesorColaboradorService.crear(profesorColaborador));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        profesorColaboradorService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
