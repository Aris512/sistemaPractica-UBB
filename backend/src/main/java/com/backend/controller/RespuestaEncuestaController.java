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

import com.backend.model.RespuestaEncuesta;
import com.backend.service.RespuestaEncuestaService;

@RestController
@RequestMapping("/api/respuestas-encuesta")
public class RespuestaEncuestaController {

    private final RespuestaEncuestaService respuestaEncuestaService;

    public RespuestaEncuestaController(RespuestaEncuestaService respuestaEncuestaService) {
        this.respuestaEncuestaService = respuestaEncuestaService;
    }

    @GetMapping
    public ResponseEntity<List<RespuestaEncuesta>> obtenerTodos() {
        return ResponseEntity.ok(respuestaEncuestaService.obtenerTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<RespuestaEncuesta> obtenerPorId(@PathVariable Long id) {
        RespuestaEncuesta respuestaEncuesta = respuestaEncuestaService.obtenerPorId(id);
        if (respuestaEncuesta == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(respuestaEncuesta);
    }

    @PostMapping
    public ResponseEntity<RespuestaEncuesta> crear(@RequestBody RespuestaEncuesta respuestaEncuesta) {
        return ResponseEntity.ok(respuestaEncuestaService.crear(respuestaEncuesta));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        respuestaEncuestaService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
