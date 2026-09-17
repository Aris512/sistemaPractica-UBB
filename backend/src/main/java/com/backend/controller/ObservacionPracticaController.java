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

import com.backend.model.ObservacionPractica;
import com.backend.service.ObservacionPracticaService;

@RestController
@RequestMapping("/api/observaciones-practica")
@CrossOrigin(origins = "*")
public class ObservacionPracticaController {

    private final ObservacionPracticaService observacionPracticaService;

    public ObservacionPracticaController(ObservacionPracticaService observacionPracticaService) {
        this.observacionPracticaService = observacionPracticaService;
    }

    @GetMapping
    public ResponseEntity<List<ObservacionPractica>> obtenerTodos() {
        return ResponseEntity.ok(observacionPracticaService.obtenerTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ObservacionPractica> obtenerPorId(@PathVariable Long id) {
        ObservacionPractica obs = observacionPracticaService.obtenerPorId(id);
        if (obs == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(obs);
    }

    @GetMapping("/estudiante/{rut}")
    public ResponseEntity<List<ObservacionPractica>> obtenerPorRutEstudiante(@PathVariable String rut) {
        return ResponseEntity.ok(observacionPracticaService.obtenerPorRutEstudiante(rut));
    }

    @PostMapping
    public ResponseEntity<ObservacionPractica> crear(@RequestBody ObservacionPractica observacion) {
        return ResponseEntity.ok(observacionPracticaService.crear(observacion));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        observacionPracticaService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
