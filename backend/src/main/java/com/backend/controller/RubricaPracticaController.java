package com.backend.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.backend.dto.AvancePracticaDTOs.AvancePracticaDTO;
import com.backend.dto.AvancePracticaDTOs.CompletarRubricaRequest;
import com.backend.service.RubricaPracticaService;

/** Avance de la práctica según las rúbricas del profesor colaborador y las observaciones del tutor. */
@RestController
@RequestMapping("/api/rubricas-practica")
@CrossOrigin(origins = "*")
public class RubricaPracticaController {

    private final RubricaPracticaService rubricaPracticaService;

    public RubricaPracticaController(RubricaPracticaService rubricaPracticaService) {
        this.rubricaPracticaService = rubricaPracticaService;
    }

    @GetMapping("/estudiante/{rut}")
    public ResponseEntity<AvancePracticaDTO> obtenerAvance(@PathVariable String rut) {
        return ResponseEntity.ok(rubricaPracticaService.obtenerAvancePorEstudiante(rut));
    }

    @PutMapping("/{id}/completar")
    public ResponseEntity<?> completar(@PathVariable Long id, @RequestBody CompletarRubricaRequest request) {
        try {
            return ResponseEntity.ok(rubricaPracticaService.completar(id, request.nota(), request.rutEvaluador()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
