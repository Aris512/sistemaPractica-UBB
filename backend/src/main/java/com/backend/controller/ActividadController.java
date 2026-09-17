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

    @PutMapping("/{id}")
    public ResponseEntity<Actividad> actualizar(@PathVariable Long id, @RequestBody CrearActividadDTO dto) {
        Actividad actualizada = actividadService.actualizar(id, dto);
        if (actualizada == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(actualizada);
    }

    @PutMapping("/{id}/estado")
    public ResponseEntity<Actividad> cambiarEstado(@PathVariable Long id, @RequestBody java.util.Map<String, String> body) {
        String nuevoEstado = body.get("estado");
        if (nuevoEstado == null || (!nuevoEstado.equalsIgnoreCase("ACTIVA") && !nuevoEstado.equalsIgnoreCase("CERRADA"))) {
            return ResponseEntity.badRequest().build();
        }
        Actividad actualizada = actividadService.cambiarEstado(id, nuevoEstado.toUpperCase());
        if (actualizada == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(actualizada);
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
