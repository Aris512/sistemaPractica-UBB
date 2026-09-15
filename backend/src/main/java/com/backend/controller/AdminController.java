package com.backend.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.backend.model.Estudiante;
import com.backend.model.Profesor;
import com.backend.model.Usuario;
import com.backend.repository.EstudianteRepository;
import com.backend.repository.ProfesorRepository;
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
    private final EstudianteRepository estudianteRepository;
    private final ProfesorRepository profesorRepository;

    public AdminController(UsuarioRepository usuarioRepository,
                           EstudianteRepository estudianteRepository,
                           ProfesorRepository profesorRepository) {
        this.usuarioRepository = usuarioRepository;
        this.estudianteRepository = estudianteRepository;
        this.profesorRepository = profesorRepository;
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
                    .filter(r -> r != null)
                    .map(r -> r.getNombre())
                    .collect(Collectors.toList());
            }
            dto.put("roles", roles);

            String curso = "—";
            Optional<Estudiante> estudianteOpt = estudianteRepository.findByUsuario(u);
            if (estudianteOpt.isPresent() && estudianteOpt.get().getAsignatura() != null) {
                curso = estudianteOpt.get().getAsignatura().getNombre();
            } else {
                Optional<Profesor> profesorOpt = profesorRepository.findByUsuario(u);
                if (profesorOpt.isPresent() && profesorOpt.get().getAsignatura() != null) {
                    curso = profesorOpt.get().getAsignatura().getNombre();
                }
            }
            dto.put("curso", curso);

            resultado.add(dto);
        }

        return ResponseEntity.ok(resultado);
    }
}
