package com.backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.backend.dto.PautaDTOs.AplicacionDTO;
import com.backend.dto.PautaDTOs.GuardarAplicacionRequest;
import com.backend.dto.PautaDTOs.PautaDetalleDTO;
import com.backend.dto.PautaDTOs.PautaRequest;
import com.backend.dto.PautaDTOs.PautaResumenDTO;
import com.backend.dto.PautaDTOs.ResultadoDTO;
import com.backend.service.PautaService;

/**
 * Todas las rutas requieren el encabezado X-User-Rut con el RUT de quien consulta.
 * Los permisos se resuelven en PautaAccesoService según rol y relación con la práctica.
 */
@RestController
@RequestMapping("/api/pautas")
@CrossOrigin(origins = "*")
public class PautaController {

    private static final String HEADER_RUT = "X-User-Rut";

    private final PautaService pautaService;

    public PautaController(PautaService pautaService) {
        this.pautaService = pautaService;
    }

    // ---- Catálogo de pautas (HU-21): lectura para todos; crear, editar y activar solo coordinador

    @GetMapping
    public ResponseEntity<List<PautaResumenDTO>> listar(
            @RequestHeader(value = HEADER_RUT, required = false) String rut,
            @RequestParam(required = false) String asignatura,
            @RequestParam(required = false) String especialidad,
            @RequestParam(required = false) String momento,
            @RequestParam(required = false) String evaluador,
            @RequestParam(defaultValue = "false") boolean soloActivas) {
        return ResponseEntity.ok(pautaService.listar(rut, asignatura, especialidad, momento, evaluador, soloActivas));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PautaDetalleDTO> obtener(
            @RequestHeader(value = HEADER_RUT, required = false) String rut,
            @PathVariable Long id) {
        return ResponseEntity.ok(pautaService.obtenerDetalle(rut, id));
    }

    @PostMapping
    public ResponseEntity<PautaDetalleDTO> crear(
            @RequestHeader(value = HEADER_RUT, required = false) String rut,
            @RequestBody PautaRequest request) {
        return ResponseEntity.ok(pautaService.crear(rut, request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PautaDetalleDTO> actualizar(
            @RequestHeader(value = HEADER_RUT, required = false) String rut,
            @PathVariable Long id,
            @RequestBody PautaRequest request) {
        return ResponseEntity.ok(pautaService.actualizar(rut, id, request));
    }

    @PatchMapping("/{id}/activa")
    public ResponseEntity<PautaDetalleDTO> cambiarActiva(
            @RequestHeader(value = HEADER_RUT, required = false) String rut,
            @PathVariable Long id,
            @RequestParam boolean valor) {
        return ResponseEntity.ok(pautaService.cambiarActiva(rut, id, valor));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(
            @RequestHeader(value = HEADER_RUT, required = false) String rut,
            @PathVariable Long id) {
        pautaService.eliminar(rut, id);
        return ResponseEntity.noContent().build();
    }

    // ---- Evaluación digital (HU-05)

    @GetMapping("/practica/{practicaId}")
    public ResponseEntity<List<PautaResumenDTO>> pautasDePractica(
            @RequestHeader(value = HEADER_RUT, required = false) String rut,
            @PathVariable Long practicaId) {
        return ResponseEntity.ok(pautaService.listarParaPractica(rut, practicaId));
    }

    @GetMapping("/{pautaId}/practica/{practicaId}")
    public ResponseEntity<AplicacionDTO> obtenerAplicacion(
            @RequestHeader(value = HEADER_RUT, required = false) String rut,
            @PathVariable Long pautaId,
            @PathVariable Long practicaId) {
        AplicacionDTO dto = pautaService.obtenerAplicacion(rut, pautaId, practicaId);
        return dto == null ? ResponseEntity.noContent().build() : ResponseEntity.ok(dto);
    }

    @PutMapping("/{pautaId}/practica/{practicaId}")
    public ResponseEntity<AplicacionDTO> guardarAplicacion(
            @RequestHeader(value = HEADER_RUT, required = false) String rut,
            @PathVariable Long pautaId,
            @PathVariable Long practicaId,
            @RequestBody GuardarAplicacionRequest request) {
        return ResponseEntity.ok(pautaService.guardarAplicacion(rut, pautaId, practicaId, request));
    }

    @PostMapping("/{pautaId}/practica/{practicaId}/reabrir")
    public ResponseEntity<AplicacionDTO> reabrir(
            @RequestHeader(value = HEADER_RUT, required = false) String rut,
            @PathVariable Long pautaId,
            @PathVariable Long practicaId) {
        return ResponseEntity.ok(pautaService.reabrir(rut, pautaId, practicaId));
    }

    // ---- Resultados para estudiante, profesor de asignatura, coordinador y evaluadores

    @GetMapping("/resultados")
    public ResponseEntity<List<ResultadoDTO>> resultados(
            @RequestHeader(value = HEADER_RUT, required = false) String rut) {
        return ResponseEntity.ok(pautaService.listarResultados(rut));
    }
}
