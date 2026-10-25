package com.backend.controller;

import java.util.List;
import java.util.Map;

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
    public ResponseEntity<?> crear(@RequestBody CentroPractica centroPractica) {
        String nombre = centroPractica.getNombre() != null ? centroPractica.getNombre().trim() : "";
        if (nombre.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "El nombre del centro de práctica es obligatorio."));
        }
        centroPractica.setNombre(nombre);
        if (centroPractica.getDireccion() != null) {
            centroPractica.setDireccion(centroPractica.getDireccion().trim());
        }
        return ResponseEntity.ok(centroPracticaService.crear(centroPractica));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizar(@PathVariable Long id, @RequestBody CentroPractica centroPractica) {
        CentroPractica existente = centroPracticaService.obtenerPorId(id);
        if (existente == null) {
            return ResponseEntity.notFound().build();
        }
        String nombre = centroPractica.getNombre() != null ? centroPractica.getNombre().trim() : "";
        if (nombre.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "El nombre del centro de práctica es obligatorio."));
        }
        CentroPractica actualizado = centroPracticaService.actualizar(id, centroPractica);
        return ResponseEntity.ok(actualizado);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Long id) {
        CentroPractica centro = centroPracticaService.obtenerPorId(id);
        if (centro == null) {
            return ResponseEntity.notFound().build();
        }
        try {
            centroPracticaService.eliminar(id);
            return ResponseEntity.noContent().build();
        } catch (DataIntegrityViolationException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "No es posible eliminar el centro de práctica porque está vinculado a otros registros del sistema."
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "error", "Ocurrió un error al intentar eliminar el centro de práctica: " + e.getMessage()
            ));
        }
    }
}
