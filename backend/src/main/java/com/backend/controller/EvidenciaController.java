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

import com.backend.dto.RevisionEvidenciaDTO;
import com.backend.dto.SeguimientoEstudianteDTO;
import com.backend.dto.SubirEvidenciaDTO;
import com.backend.model.Evidencia;
import com.backend.service.EvidenciaService;

@RestController
@RequestMapping("/api/evidencias")
@CrossOrigin(origins = "*")
public class EvidenciaController {

    private final EvidenciaService evidenciaService;

    public EvidenciaController(EvidenciaService evidenciaService) {
        this.evidenciaService = evidenciaService;
    }

    @GetMapping
    public ResponseEntity<List<Evidencia>> obtenerTodas() {
        return ResponseEntity.ok(evidenciaService.obtenerTodas());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Evidencia> obtenerPorId(@PathVariable Long id) {
        Evidencia evidencia = evidenciaService.obtenerPorId(id);
        if (evidencia == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(evidencia);
    }

    @GetMapping("/estudiante/{rut}")
    public ResponseEntity<List<Evidencia>> obtenerHistorialEstudiante(@PathVariable String rut) {
        return ResponseEntity.ok(evidenciaService.obtenerHistorialEstudiante(rut));
    }

    @GetMapping("/actividad/{idActividad}")
    public ResponseEntity<List<Evidencia>> obtenerPorActividad(@PathVariable Long idActividad) {
        return ResponseEntity.ok(evidenciaService.obtenerPorActividad(idActividad));
    }

    @GetMapping("/profesor/{rut}")
    public ResponseEntity<List<Evidencia>> obtenerPorProfesor(@PathVariable String rut) {
        return ResponseEntity.ok(evidenciaService.obtenerPorProfesor(rut));
    }

    @GetMapping("/seguimiento/profesor/{rut}")
    public ResponseEntity<List<SeguimientoEstudianteDTO>> obtenerSeguimientoProfesor(@PathVariable String rut) {
        return ResponseEntity.ok(evidenciaService.obtenerSeguimientoProfesor(rut));
    }

    @PostMapping
    public ResponseEntity<Evidencia> subirEvidencia(@RequestBody SubirEvidenciaDTO dto) {
        try {
            Evidencia guardada = evidenciaService.subirEvidencia(dto);
            return ResponseEntity.ok(guardada);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}/revisar")
    public ResponseEntity<Evidencia> revisarEvidencia(@PathVariable Long id, @RequestBody RevisionEvidenciaDTO dto) {
        try {
            Evidencia revisada = evidenciaService.revisarEvidencia(id, dto);
            return ResponseEntity.ok(revisada);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        evidenciaService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
