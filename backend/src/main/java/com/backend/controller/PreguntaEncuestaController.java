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

import com.backend.model.PreguntaEncuesta;
import com.backend.service.PreguntaEncuestaService;

@RestController
@RequestMapping("/api/preguntas-encuesta")
public class PreguntaEncuestaController {

    private final PreguntaEncuestaService preguntaEncuestaService;

    public PreguntaEncuestaController(PreguntaEncuestaService preguntaEncuestaService) {
        this.preguntaEncuestaService = preguntaEncuestaService;
    }

    @GetMapping
    public ResponseEntity<List<PreguntaEncuesta>> obtenerTodos() {
        return ResponseEntity.ok(preguntaEncuestaService.obtenerTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PreguntaEncuesta> obtenerPorId(@PathVariable Long id) {
        PreguntaEncuesta preguntaEncuesta = preguntaEncuestaService.obtenerPorId(id);
        if (preguntaEncuesta == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(preguntaEncuesta);
    }

    @PostMapping
    public ResponseEntity<PreguntaEncuesta> crear(@RequestBody PreguntaEncuesta preguntaEncuesta) {
        return ResponseEntity.ok(preguntaEncuestaService.crear(preguntaEncuesta));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        preguntaEncuestaService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
