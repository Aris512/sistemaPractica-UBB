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

import com.backend.model.PreguntaDiagnostica;
import com.backend.service.PreguntaDiagnosticaService;

@RestController
@RequestMapping("/api/preguntas-diagnosticas")
public class PreguntaDiagnosticaController {

    private final PreguntaDiagnosticaService preguntaDiagnosticaService;

    public PreguntaDiagnosticaController(PreguntaDiagnosticaService preguntaDiagnosticaService) {
        this.preguntaDiagnosticaService = preguntaDiagnosticaService;
    }

    @GetMapping
    public ResponseEntity<List<PreguntaDiagnostica>> obtenerTodos() {
        return ResponseEntity.ok(preguntaDiagnosticaService.obtenerTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PreguntaDiagnostica> obtenerPorId(@PathVariable Long id) {
        PreguntaDiagnostica preguntaDiagnostica = preguntaDiagnosticaService.obtenerPorId(id);
        if (preguntaDiagnostica == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(preguntaDiagnostica);
    }

    @PostMapping
    public ResponseEntity<PreguntaDiagnostica> crear(@RequestBody PreguntaDiagnostica preguntaDiagnostica) {
        return ResponseEntity.ok(preguntaDiagnosticaService.crear(preguntaDiagnostica));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        preguntaDiagnosticaService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
