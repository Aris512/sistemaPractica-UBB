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

import com.backend.model.RespuestaPregunta;
import com.backend.service.RespuestaPreguntaService;

@RestController
@RequestMapping("/api/respuestas-preguntas")
public class RespuestaPreguntaController {

    private final RespuestaPreguntaService respuestaPreguntaService;

    public RespuestaPreguntaController(RespuestaPreguntaService respuestaPreguntaService) {
        this.respuestaPreguntaService = respuestaPreguntaService;
    }

    @GetMapping
    public ResponseEntity<List<RespuestaPregunta>> obtenerTodos() {
        return ResponseEntity.ok(respuestaPreguntaService.obtenerTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<RespuestaPregunta> obtenerPorId(@PathVariable Long id) {
        RespuestaPregunta respuestaPregunta = respuestaPreguntaService.obtenerPorId(id);
        if (respuestaPregunta == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(respuestaPregunta);
    }

    @PostMapping
    public ResponseEntity<RespuestaPregunta> crear(@RequestBody RespuestaPregunta respuestaPregunta) {
        return ResponseEntity.ok(respuestaPreguntaService.crear(respuestaPregunta));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        respuestaPreguntaService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
