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

import com.backend.model.CentroPractica;
import com.backend.service.CentroPracticaService;

@RestController
@RequestMapping("/api/centros-practica")
public class CentroPracticaController {

    private final CentroPracticaService centroPracticaService;

    public CentroPracticaController(CentroPracticaService centroPracticaService) {
        this.centroPracticaService = centroPracticaService;
    }

    @GetMapping
    public ResponseEntity<List<CentroPractica>> obtenerTodos() {
        return ResponseEntity.ok(centroPracticaService.obtenerTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CentroPractica> obtenerPorId(@PathVariable Long id) {
        CentroPractica centroPractica = centroPracticaService.obtenerPorId(id);
        if (centroPractica == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(centroPractica);
    }

    @PostMapping
    public ResponseEntity<CentroPractica> crear(@RequestBody CentroPractica centroPractica) {
        return ResponseEntity.ok(centroPracticaService.crear(centroPractica));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        centroPracticaService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
