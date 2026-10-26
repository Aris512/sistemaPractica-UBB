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

import com.backend.model.Practica;
import com.backend.service.PracticaService;

import org.springframework.web.bind.annotation.CrossOrigin;
import com.backend.dto.EstudianteTutorDTO;

@RestController
@RequestMapping("/api/practicas")
@CrossOrigin(origins = "*")
public class PracticaController {

    private final PracticaService practicaService;

    public PracticaController(PracticaService practicaService) {
        this.practicaService = practicaService;
    }

    @GetMapping("/seguimiento/{rut}")
    public ResponseEntity<List<EstudianteTutorDTO>> obtenerSeguimiento(@PathVariable String rut) {
        return ResponseEntity.ok(practicaService.obtenerSeguimientoTutorColaborador(rut));
    }

    @GetMapping
    public ResponseEntity<List<Practica>> obtenerTodos() {
        return ResponseEntity.ok(practicaService.obtenerTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Practica> obtenerPorId(@PathVariable Long id) {
        Practica practica = practicaService.obtenerPorId(id);
        if (practica == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(practica);
    }

    @PostMapping
    public ResponseEntity<Practica> crear(@RequestBody Practica practica) {
        return ResponseEntity.ok(practicaService.crear(practica));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        practicaService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
