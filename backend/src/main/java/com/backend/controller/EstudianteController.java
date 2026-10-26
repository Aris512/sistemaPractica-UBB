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

import com.backend.model.Estudiante;
import com.backend.service.EstudianteService;
import org.springframework.web.bind.annotation.CrossOrigin;
import com.backend.dto.EstadoPracticaDTO;
import com.backend.dto.HistorialItemDTO;

@RestController
@RequestMapping("/api/estudiantes")
@CrossOrigin(origins = "*")
public class EstudianteController {

    private final EstudianteService estudianteService;

    public EstudianteController(EstudianteService estudianteService) {
        this.estudianteService = estudianteService;
    }

    @GetMapping
    public ResponseEntity<List<Estudiante>> obtenerTodos() {
        return ResponseEntity.ok(estudianteService.obtenerTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Estudiante> obtenerPorId(@PathVariable Long id) {
        Estudiante estudiante = estudianteService.obtenerPorId(id);
        if (estudiante == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(estudiante);
    }

    @GetMapping("/rut/{rut}")
    public ResponseEntity<Estudiante> obtenerPorRut(@PathVariable String rut) {
        Estudiante estudiante = estudianteService.obtenerPorRut(rut);
        if (estudiante == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(estudiante);
    }

    /**
     * Módulo 4 (HU-09): Historial consolidado de actividades y evaluaciones como "checks" completados.
     */
    @GetMapping("/rut/{rut}/historial")
    public ResponseEntity<List<HistorialItemDTO>> obtenerHistorialEstudiante(@PathVariable String rut) {
        return ResponseEntity.ok(estudianteService.obtenerHistorialEstudiante(rut));
    }

    /**
     * Módulo 4 (HU-10): Estado y progreso de práctica (permite renderizado condicional en frontend).
     */
    @GetMapping("/rut/{rut}/estado-practica")
    public ResponseEntity<EstadoPracticaDTO> obtenerEstadoPractica(@PathVariable String rut) {
        return ResponseEntity.ok(estudianteService.obtenerEstadoPractica(rut));
    }

    @PostMapping
    public ResponseEntity<Estudiante> crear(@RequestBody Estudiante estudiante) {
        return ResponseEntity.ok(estudianteService.crear(estudiante));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        estudianteService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
