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

import com.backend.model.NotaDeVoz;
import com.backend.service.NotaDeVozService;

@RestController
@RequestMapping("/api/notas-de-voz")
public class NotaDeVozController {

    private final NotaDeVozService notaDeVozService;

    public NotaDeVozController(NotaDeVozService notaDeVozService) {
        this.notaDeVozService = notaDeVozService;
    }

    @GetMapping
    public ResponseEntity<List<NotaDeVoz>> obtenerTodos() {
        return ResponseEntity.ok(notaDeVozService.obtenerTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<NotaDeVoz> obtenerPorId(@PathVariable Long id) {
        NotaDeVoz notaDeVoz = notaDeVozService.obtenerPorId(id);
        if (notaDeVoz == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(notaDeVoz);
    }

    @PostMapping
    public ResponseEntity<NotaDeVoz> crear(@RequestBody NotaDeVoz notaDeVoz) {
        return ResponseEntity.ok(notaDeVozService.crear(notaDeVoz));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        notaDeVozService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
