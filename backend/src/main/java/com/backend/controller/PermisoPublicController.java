package com.backend.controller;

import java.util.Set;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.backend.service.PermisoService;

@RestController
@RequestMapping("/api/permisos")
@CrossOrigin(origins = "*")
public class PermisoPublicController {

    private final PermisoService permisoService;

    public PermisoPublicController(PermisoService permisoService) {
        this.permisoService = permisoService;
    }

    /**
     * Consulta los permisos activos para un rol (opcionalmente filtrado por semestre).
     * Ejemplo: GET /api/permisos/rol/ESTUDIANTE?semestre=4
     */
    @GetMapping("/rol/{rolNombre}")
    public ResponseEntity<Set<String>> obtenerPermisosPorRol(
            @PathVariable String rolNombre,
            @RequestParam(required = false) String semestre) {
        return ResponseEntity.ok(permisoService.obtenerPermisosActivosPorRolYSemestre(rolNombre, semestre));
    }

    /**
     * Consulta los permisos efectivos de un usuario dado su RUT (considera todos sus roles y semestre si es alumno).
     * Ejemplo: GET /api/permisos/usuario/12345678-5
     */
    @GetMapping("/usuario/{rut}")
    public ResponseEntity<Set<String>> obtenerPermisosPorUsuario(@PathVariable String rut) {
        return ResponseEntity.ok(permisoService.obtenerPermisosEfectivosUsuario(rut));
    }
}
