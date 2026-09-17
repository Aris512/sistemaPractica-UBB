package com.backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.backend.dto.DireccionDTO;
import com.backend.service.DireccionService;

@RestController
@RequestMapping("/api/direcciones")
public class DireccionController {

    private final DireccionService direccionService;

    public DireccionController(DireccionService direccionService) {
        this.direccionService = direccionService;
    }

    @GetMapping
    public ResponseEntity<List<DireccionDTO>> sugerencias(
            @RequestParam(name = "q", required = false) String query,
            @RequestParam(name = "limit", required = false, defaultValue = "5") Integer limit) {
        List<DireccionDTO> resultados = direccionService.buscarDirecciones(query, limit);
        return ResponseEntity.ok(resultados);
    }
}
