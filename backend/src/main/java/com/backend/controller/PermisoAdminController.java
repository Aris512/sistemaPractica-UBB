package com.backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.backend.dto.GuardarPermisosRequest;
import com.backend.dto.PermisoDTO;
import com.backend.dto.RolPermisoConfigDTO;
import com.backend.service.PermisoService;

@RestController
@RequestMapping("/admin/permisos")
@CrossOrigin(origins = "*")
public class PermisoAdminController {

    private final PermisoService permisoService;

    public PermisoAdminController(PermisoService permisoService) {
        this.permisoService = permisoService;
    }

    @GetMapping("/catalogo")
    public ResponseEntity<List<PermisoDTO>> obtenerCatalogo() {
        return ResponseEntity.ok(permisoService.obtenerCatalogo());
    }

    @GetMapping("/roles/{idRol}")
    public ResponseEntity<List<RolPermisoConfigDTO>> obtenerPorRol(@PathVariable Long idRol) {
        try {
            return ResponseEntity.ok(permisoService.obtenerConfiguracionPorRol(idRol));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/roles/nombre/{nombre}")
    public ResponseEntity<List<RolPermisoConfigDTO>> obtenerPorRolNombre(@PathVariable String nombre) {
        try {
            return ResponseEntity.ok(permisoService.obtenerConfiguracionPorRolNombre(nombre));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/roles/{idRol}")
    public ResponseEntity<List<RolPermisoConfigDTO>> guardarPermisos(
            @PathVariable Long idRol,
            @RequestBody GuardarPermisosRequest request) {
        try {
            List<RolPermisoConfigDTO> resultado = permisoService.guardarConfiguracionRol(idRol, request);
            return ResponseEntity.ok(resultado);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
