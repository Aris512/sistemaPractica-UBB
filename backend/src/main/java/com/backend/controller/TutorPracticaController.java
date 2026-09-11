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

import com.backend.model.TutorPractica;
import com.backend.service.TutorPracticaService;

@RestController
@RequestMapping("/api/tutores-practica")
public class TutorPracticaController {

    private final TutorPracticaService tutorPracticaService;

    public TutorPracticaController(TutorPracticaService tutorPracticaService) {
        this.tutorPracticaService = tutorPracticaService;
    }

    @GetMapping
    public ResponseEntity<List<TutorPractica>> obtenerTodos() {
        return ResponseEntity.ok(tutorPracticaService.obtenerTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TutorPractica> obtenerPorId(@PathVariable Long id) {
        TutorPractica tutorPractica = tutorPracticaService.obtenerPorId(id);
        if (tutorPractica == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(tutorPractica);
    }

    @PostMapping
    public ResponseEntity<TutorPractica> crear(@RequestBody TutorPractica tutorPractica) {
        return ResponseEntity.ok(tutorPracticaService.crear(tutorPractica));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        tutorPracticaService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
