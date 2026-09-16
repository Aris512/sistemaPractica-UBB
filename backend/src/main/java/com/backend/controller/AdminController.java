package com.backend.controller;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.backend.model.Asignatura;
import com.backend.model.Estudiante;
import com.backend.model.Profesor;
import com.backend.model.Rol;
import com.backend.model.Usuario;
import com.backend.repository.AsignaturaRepository;
import com.backend.repository.EstudianteRepository;
import com.backend.repository.ProfesorRepository;
import com.backend.repository.RolRepository;
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
    private final RolRepository rolRepository;
    private final AsignaturaRepository asignaturaRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AdminController(UsuarioRepository usuarioRepository,
                           EstudianteRepository estudianteRepository,
                           ProfesorRepository profesorRepository,
                           RolRepository rolRepository,
                           AsignaturaRepository asignaturaRepository) {
        this.usuarioRepository = usuarioRepository;
        this.estudianteRepository = estudianteRepository;
        this.profesorRepository = profesorRepository;
        this.rolRepository = rolRepository;
        this.asignaturaRepository = asignaturaRepository;
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
            dto.put("estado", u.isActivo());
            dto.put("estadoTexto", u.getEstado());

            resultado.add(dto);
        }

        return ResponseEntity.ok(resultado);
    }

    @PostMapping("/usuarios")
    public ResponseEntity<?> crearUsuario(@RequestBody Map<String, Object> payload) {
        String rut = payload.get("rut") != null ? payload.get("rut").toString().trim() : "";
        String nombre = payload.get("nombre") != null ? payload.get("nombre").toString().trim() : "";
        String apellido = payload.get("apellido") != null ? payload.get("apellido").toString().trim() : "";
        String correo = payload.get("correo") != null ? payload.get("correo").toString().trim() : "";
        String contrasena = payload.get("contrasena") != null ? payload.get("contrasena").toString().trim() : "";
        String rolNombre = payload.get("rol") != null ? payload.get("rol").toString().trim() : "";
        Object idAsignaturaObj = payload.get("idAsignatura");

        if (rut.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "El RUT es obligatorio."));
        }
        if (usuarioRepository.existsByRut(rut)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Ya existe un usuario registrado con el RUT: " + rut));
        }

        if (nombre.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "El nombre es obligatorio."));
        }
        if (apellido.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "El apellido es obligatorio."));
        }

        if (correo.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "El correo electrónico es obligatorio."));
        }
        if (usuarioRepository.existsByCorreo(correo)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Ya existe un usuario registrado con el correo: " + correo));
        }

        if (contrasena.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "La contraseña es obligatoria."));
        }

        String estadoStr = "activo";
        if (payload.containsKey("estado")) {
            Object estadoObj = payload.get("estado");
            if (estadoObj instanceof Boolean) {
                estadoStr = (Boolean) estadoObj ? "activo" : "inactivo";
            } else if (estadoObj != null) {
                String s = estadoObj.toString().trim();
                estadoStr = ("false".equalsIgnoreCase(s) || "inactivo".equalsIgnoreCase(s)) ? "inactivo" : "activo";
            }
        }

        String hash = passwordEncoder.encode(contrasena);
        Usuario nuevoUsuario = new Usuario(rut, nombre, apellido, correo, hash, estadoStr);

        if (!rolNombre.isEmpty()) {
            Optional<Rol> rolOpt = rolRepository.findByNombre(rolNombre);
            if (rolOpt.isPresent()) {
                nuevoUsuario.setRoles(new HashSet<>(Collections.singletonList(rolOpt.get())));
            }
        }

        Usuario guardado = usuarioRepository.save(nuevoUsuario);

        // Si se seleccionó una asignatura, vincular según el rol
        Asignatura asigEncontrada = null;
        if (idAsignaturaObj != null && !idAsignaturaObj.toString().trim().isEmpty()) {
            try {
                Long idAsig = Long.valueOf(idAsignaturaObj.toString());
                asigEncontrada = asignaturaRepository.findById(idAsig).orElse(null);
            } catch (Exception ignored) {
            }
        }

        String asignaturaNombre = payload.get("asignatura") != null ? payload.get("asignatura").toString().trim() : "";
        if (asigEncontrada == null && !asignaturaNombre.isEmpty() && !asignaturaNombre.equals("—")) {
            asigEncontrada = asignaturaRepository.findByNombreIgnoreCase(asignaturaNombre).orElse(null);
        }

        if (asigEncontrada != null) {
            try {
                if ("ESTUDIANTE".equalsIgnoreCase(rolNombre)) {
                    Estudiante estudiante = new Estudiante(guardado, asigEncontrada, "ACTIVO");
                    estudianteRepository.save(estudiante);
                } else {
                    Profesor profesor = new Profesor(guardado, asigEncontrada);
                    profesorRepository.save(profesor);
                }
            } catch (Exception e) {
                // ignorar si ocurre algún problema al vincular
            }
        }

        return ResponseEntity.ok(Map.of(
            "message", "Usuario creado con éxito",
            "rut", guardado.getRut(),
            "nombre", guardado.getNombre() + " " + guardado.getApellido(),
            "correo", guardado.getCorreo(),
            "estado", guardado.isActivo()
        ));
    }

    @PutMapping("/usuarios/{rut}")
    public ResponseEntity<?> editarUsuario(@PathVariable String rut, @RequestBody Map<String, Object> payload) {
        Optional<Usuario> userOpt = usuarioRepository.findByRut(rut);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Usuario usuario = userOpt.get();

        String nombre = payload.get("nombre") != null ? payload.get("nombre").toString().trim() : "";
        String apellido = payload.get("apellido") != null ? payload.get("apellido").toString().trim() : "";
        String correo = payload.get("correo") != null ? payload.get("correo").toString().trim() : "";
        String contrasena = payload.get("contrasena") != null ? payload.get("contrasena").toString().trim() : "";
        String rolNombre = payload.get("rol") != null ? payload.get("rol").toString().trim() : "";
        Object idAsignaturaObj = payload.get("idAsignatura");

        if (payload.containsKey("nombre")) {
            if (nombre.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "El nombre es obligatorio."));
            }
            usuario.setNombre(nombre);
        }

        if (payload.containsKey("apellido")) {
            if (apellido.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "El apellido es obligatorio."));
            }
            usuario.setApellido(apellido);
        }

        if (payload.containsKey("correo")) {
            if (correo.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "El correo electrónico es obligatorio."));
            }
            if (!correo.equalsIgnoreCase(usuario.getCorreo()) && usuarioRepository.existsByCorreo(correo)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Ya existe otro usuario registrado con el correo: " + correo));
            }
            usuario.setCorreo(correo);
        }

        // Si se especificó una nueva contraseña, actualizarla
        if (!contrasena.isEmpty()) {
            usuario.setContrasenaEncriptada(passwordEncoder.encode(contrasena));
        }

        // Actualizar rol si viene especificado
        if (!rolNombre.isEmpty()) {
            Optional<Rol> rolOpt = rolRepository.findByNombre(rolNombre);
            if (rolOpt.isPresent()) {
                usuario.setRoles(new HashSet<>(Collections.singletonList(rolOpt.get())));
            }
        }

        // Actualizar estado si viene especificado
        if (payload.containsKey("estado")) {
            Object estadoObj = payload.get("estado");
            if (estadoObj instanceof Boolean) {
                usuario.setActivo((Boolean) estadoObj);
            } else if (estadoObj != null) {
                String s = estadoObj.toString().trim();
                usuario.setActivo(!"false".equalsIgnoreCase(s) && !"inactivo".equalsIgnoreCase(s));
            }
        }

        Usuario guardado = usuarioRepository.save(usuario);

        // Actualizar asignatura
        Asignatura asigEncontrada = null;
        if (idAsignaturaObj != null && !idAsignaturaObj.toString().trim().isEmpty()) {
            try {
                Long idAsig = Long.valueOf(idAsignaturaObj.toString());
                asigEncontrada = asignaturaRepository.findById(idAsig).orElse(null);
            } catch (Exception ignored) {
            }
        }

        String asignaturaNombre = payload.get("asignatura") != null ? payload.get("asignatura").toString().trim() : "";
        if (asigEncontrada == null && !asignaturaNombre.isEmpty() && !asignaturaNombre.equals("—")) {
            asigEncontrada = asignaturaRepository.findByNombreIgnoreCase(asignaturaNombre).orElse(null);
        }

        Optional<Estudiante> estOpt = estudianteRepository.findByUsuario(guardado);
        Optional<Profesor> profOpt = profesorRepository.findByUsuario(guardado);

        if (asigEncontrada != null) {
            if ("ESTUDIANTE".equalsIgnoreCase(rolNombre)) {
                if (estOpt.isPresent()) {
                    Estudiante est = estOpt.get();
                    est.setAsignatura(asigEncontrada);
                    estudianteRepository.save(est);
                } else {
                    estudianteRepository.save(new Estudiante(guardado, asigEncontrada, "ACTIVO"));
                }
                profOpt.ifPresent(profesorRepository::delete);
            } else {
                if (profOpt.isPresent()) {
                    Profesor prof = profOpt.get();
                    prof.setAsignatura(asigEncontrada);
                    profesorRepository.save(prof);
                } else {
                    profesorRepository.save(new Profesor(guardado, asigEncontrada));
                }
                estOpt.ifPresent(estudianteRepository::delete);
            }
        } else {
            // Usuario sin asignatura
            estOpt.ifPresent(estudianteRepository::delete);
            profOpt.ifPresent(profesorRepository::delete);
        }

        return ResponseEntity.ok(Map.of(
            "message", "Usuario actualizado con éxito",
            "rut", guardado.getRut(),
            "nombre", guardado.getNombre() + " " + guardado.getApellido(),
            "correo", guardado.getCorreo(),
            "estado", guardado.isActivo()
        ));
    }

    @PutMapping("/usuarios/{rut}/estado")
    public ResponseEntity<?> cambiarEstadoPut(@PathVariable String rut, @RequestBody Map<String, Object> payload) {
        return actualizarEstadoUsuario(rut, payload);
    }

    @PatchMapping("/usuarios/{rut}/estado")
    public ResponseEntity<?> cambiarEstadoPatch(@PathVariable String rut, @RequestBody Map<String, Object> payload) {
        return actualizarEstadoUsuario(rut, payload);
    }

    private ResponseEntity<?> actualizarEstadoUsuario(String rut, Map<String, Object> payload) {
        Optional<Usuario> userOpt = usuarioRepository.findByRut(rut);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Usuario usuario = userOpt.get();

        boolean nuevoEstado = true;
        if (payload.containsKey("estado")) {
            Object estadoObj = payload.get("estado");
            if (estadoObj instanceof Boolean) {
                nuevoEstado = (Boolean) estadoObj;
            } else if (estadoObj != null) {
                String s = estadoObj.toString().trim();
                nuevoEstado = !"false".equalsIgnoreCase(s) && !"inactivo".equalsIgnoreCase(s);
            }
        }

        usuario.setActivo(nuevoEstado);
        Usuario guardado = usuarioRepository.save(usuario);

        return ResponseEntity.ok(Map.of(
            "message", "Estado actualizado con éxito",
            "rut", guardado.getRut(),
            "estado", guardado.isActivo()
        ));
    }
}


