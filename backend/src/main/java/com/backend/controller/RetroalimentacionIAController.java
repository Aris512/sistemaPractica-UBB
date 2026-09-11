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

import com.backend.model.RetroalimentacionIA;
import com.backend.service.RetroalimentacionIAService;

@RestController
@RequestMapping("/api/retroalimentaciones-ia")
public class RetroalimentacionIAController {

    private final RetroalimentacionIAService retroalimentacionIAService;

    public RetroalimentacionIAController(RetroalimentacionIAService retroalimentacionIAService) {
        this.retroalimentacionIAService = retroalimentacionIAService;
    }

    @GetMapping
    public ResponseEntity<List<RetroalimentacionIA>> obtenerTodos() {
        return ResponseEntity.ok(retroalimentacionIAService.obtenerTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<RetroalimentacionIA> obtenerPorId(@PathVariable Long id) {
        RetroalimentacionIA retroalimentacionIA = retroalimentacionIAService.obtenerPorId(id);
        if (retroalimentacionIA == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(retroalimentacionIA);
    }

    @PostMapping
    public ResponseEntity<RetroalimentacionIA> crear(@RequestBody RetroalimentacionIA retroalimentacionIA) {
        return ResponseEntity.ok(retroalimentacionIAService.crear(retroalimentacionIA));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        retroalimentacionIAService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
