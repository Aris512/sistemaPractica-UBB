package com.backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.backend.model.Pauta;
import com.backend.service.PautaService;

@RestController
@RequestMapping("/api/pautas")
@CrossOrigin(origins = "*")
public class PautaController {

    private final PautaService pautaService;

    public PautaController(PautaService pautaService) {
        this.pautaService = pautaService;
    }

    @GetMapping
    public ResponseEntity<List<Pauta>> obtenerTodos() {
        return ResponseEntity.ok(pautaService.obtenerTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Pauta> obtenerPorId(@PathVariable Long id) {
        Pauta pauta = pautaService.obtenerPorId(id);
        if (pauta == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(pauta);
    }

    @PostMapping
    public ResponseEntity<Pauta> crear(@RequestBody Pauta pauta) {
        return ResponseEntity.ok(pautaService.crear(pauta));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        pautaService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
