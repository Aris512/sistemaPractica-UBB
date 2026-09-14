package com.backend.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.backend.model.Rol;
import com.backend.model.Usuario;
import com.backend.repository.UsuarioRepository;

/**
 * Endpoint de validación del área administrativa.
 * Protegido por Spring Security mediante HTTP Basic Authentication (SecurityConfig.java).
 *
 * Flujo de autenticación:
 * - Sin credenciales o erróneas -> Spring Security responde automáticamente 401 Unauthorized + WWW-Authenticate: Basic
 * - Credenciales correctas (admin / admin123) -> Este endpoint responde 200 OK
 *   y el middleware de Vite entrega el bundle React con el componente AdminPage (page.tsx).
 */
@RestController
@RequestMapping("/admin")
public class AdminController {

    private final UsuarioRepository usuarioRepository;

    public AdminController(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> checkAdminAuth() {
        return ResponseEntity.ok(Map.of(
            "status", "authenticated",
            "user", "admin",
            "role", "ROLE_ADMIN"
        ));
    }

    @GetMapping("/usuarios")
    public ResponseEntity<List<Map<String, Object>>> obtenerUsuarios() {
        List<Usuario> usuarios = usuarioRepository.findAll();
        List<Map<String, Object>> resultado = new ArrayList<>();

        for (Usuario u : usuarios) {
            Map<String, Object> dto = new HashMap<>();
            dto.put("rut", u.getRut());
            dto.put("nombre", u.getNombre() + " " + u.getApellido());
            dto.put("correo", u.getCorreo());

            List<String> roles = new ArrayList<>();
            if (u.getRoles() != null) {
                roles = u.getRoles().stream()
                    .map(Rol::getNombre)
                    .collect(Collectors.toList());
            }
            dto.put("roles", roles);

            resultado.add(dto);
        }

        return ResponseEntity.ok(resultado);
    }
}
