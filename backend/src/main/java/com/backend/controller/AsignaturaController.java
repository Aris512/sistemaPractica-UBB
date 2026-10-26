package com.backend.controller;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.backend.model.Asignatura;
import com.backend.repository.AsignaturaRepository;
import com.backend.service.AsignaturaService;

@RestController
@RequestMapping("/api/asignaturas")
public class AsignaturaController {

    private final AsignaturaService asignaturaService;
    private final AsignaturaRepository asignaturaRepository;

    public AsignaturaController(AsignaturaService asignaturaService, AsignaturaRepository asignaturaRepository) {
        this.asignaturaService = asignaturaService;
        this.asignaturaRepository = asignaturaRepository;
    }

    @GetMapping
    public ResponseEntity<List<Asignatura>> obtenerTodos() {
        return ResponseEntity.ok(asignaturaService.obtenerTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Asignatura> obtenerPorId(@PathVariable Long id) {
        Asignatura asignatura = asignaturaService.obtenerPorId(id);
        if (asignatura == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(asignatura);
    }

    @PostMapping
    public ResponseEntity<?> crear(@RequestBody Asignatura asignatura) {
        String nombre = asignatura.getNombre() != null ? asignatura.getNombre().trim() : "";
        if (nombre.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "El nombre de la asignatura es obligatorio."));
        }

        if (asignaturaRepository.existsByNombreIgnoreCase(nombre)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Ya existe una asignatura con el nombre: " + nombre));
        }

        asignatura.setNombre(nombre);
        if (asignatura.getDescripcion() != null) {
            asignatura.setDescripcion(asignatura.getDescripcion().trim());
        }
        if (asignatura.getSemestre() != null) {
            asignatura.setSemestre(asignatura.getSemestre().trim());
        }

        return ResponseEntity.ok(asignaturaService.crear(asignatura));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizar(@PathVariable Long id, @RequestBody Asignatura asignatura) {
        Optional<Asignatura> existenteOpt = asignaturaRepository.findById(id);
        if (existenteOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        String nombre = asignatura.getNombre() != null ? asignatura.getNombre().trim() : "";
        if (nombre.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "El nombre de la asignatura es obligatorio."));
        }

        Optional<Asignatura> repetidaOpt = asignaturaRepository.findByNombreIgnoreCase(nombre);
        if (repetidaOpt.isPresent() && !repetidaOpt.get().getIdAsignatura().equals(id)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Ya existe otra asignatura con el nombre: " + nombre));
        }

        Asignatura actualizada = asignaturaService.actualizar(id, asignatura);
        return ResponseEntity.ok(actualizada);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Long id) {
        if (!asignaturaRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        try {
            asignaturaService.eliminar(id);
            return ResponseEntity.noContent().build();
        } catch (DataIntegrityViolationException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "No es posible eliminar la asignatura porque está vinculada a estudiantes, profesores o registros del sistema."
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "error", "Ocurrió un error al intentar eliminar la asignatura: " + e.getMessage()
            ));
        }
    }
}
