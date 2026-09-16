package com.backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.backend.dto.CrearActividadDTO;
import com.backend.model.Actividad;
import com.backend.service.ActividadService;

@RestController
@RequestMapping("/api/actividades")
@CrossOrigin(origins = "*")
public class ActividadController {

    private final ActividadService actividadService;

    public ActividadController(ActividadService actividadService) {
        this.actividadService = actividadService;
    }

    @GetMapping
    public ResponseEntity<List<Actividad>> obtenerTodas() {
        return ResponseEntity.ok(actividadService.obtenerTodas());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Actividad> obtenerPorId(@PathVariable Long id) {
        Actividad actividad = actividadService.obtenerPorId(id);
        if (actividad == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(actividad);
    }

    @GetMapping("/profesor/{rut}")
    public ResponseEntity<List<Actividad>> obtenerPorProfesor(@PathVariable String rut) {
        return ResponseEntity.ok(actividadService.obtenerPorProfesor(rut));
    }

    @GetMapping("/estudiante/{rut}")
    public ResponseEntity<List<Actividad>> obtenerParaEstudiante(@PathVariable String rut) {
        return ResponseEntity.ok(actividadService.obtenerParaEstudiante(rut));
    }

    @PostMapping
    public ResponseEntity<Actividad> crear(@RequestBody CrearActividadDTO dto) {
        try {
            Actividad creada = actividadService.crear(dto);
            return ResponseEntity.ok(creada);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}/cerrar")
    public ResponseEntity<Actividad> cerrar(@PathVariable Long id) {
        Actividad cerrada = actividadService.cerrar(id);
        if (cerrada == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(cerrada);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        actividadService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
