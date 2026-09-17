package com.backend.controller;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.backend.model.Asignatura;
import com.backend.model.CentroPractica;
import com.backend.model.Estudiante;
import com.backend.model.Evidencia;
import com.backend.model.Practica;
import com.backend.model.Profesor;
import com.backend.model.ProfesorColaborador;
import com.backend.model.Rol;
import com.backend.model.TutorPractica;
import com.backend.model.Usuario;
import com.backend.repository.AsignaturaRepository;
import com.backend.repository.CentroPracticaRepository;
import com.backend.repository.EstudianteRepository;
import com.backend.repository.EvidenciaRepository;
import com.backend.repository.PracticaRepository;
import com.backend.repository.ProfesorColaboradorRepository;
import com.backend.repository.ProfesorRepository;
import com.backend.repository.RolRepository;
import com.backend.repository.TutorPracticaRepository;
import com.backend.repository.UsuarioRepository;
import com.backend.util.RutUtils;

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
@org.springframework.web.bind.annotation.CrossOrigin(origins = "*")
public class AdminController {

    private final UsuarioRepository usuarioRepository;
    private final EstudianteRepository estudianteRepository;
    private final ProfesorRepository profesorRepository;
    private final ProfesorColaboradorRepository profesorColaboradorRepository;
    private final TutorPracticaRepository tutorPracticaRepository;
    private final EvidenciaRepository evidenciaRepository;
    private final RolRepository rolRepository;
    private final AsignaturaRepository asignaturaRepository;
    private final CentroPracticaRepository centroPracticaRepository;
    private final PracticaRepository practicaRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AdminController(UsuarioRepository usuarioRepository,
                           EstudianteRepository estudianteRepository,
                           ProfesorRepository profesorRepository,
                           ProfesorColaboradorRepository profesorColaboradorRepository,
                           TutorPracticaRepository tutorPracticaRepository,
                           EvidenciaRepository evidenciaRepository,
                           RolRepository rolRepository,
                           AsignaturaRepository asignaturaRepository,
                           CentroPracticaRepository centroPracticaRepository,
                           PracticaRepository practicaRepository) {
        this.usuarioRepository = usuarioRepository;
        this.estudianteRepository = estudianteRepository;
        this.profesorRepository = profesorRepository;
        this.profesorColaboradorRepository = profesorColaboradorRepository;
        this.tutorPracticaRepository = tutorPracticaRepository;
        this.evidenciaRepository = evidenciaRepository;
        this.rolRepository = rolRepository;
        this.asignaturaRepository = asignaturaRepository;
        this.centroPracticaRepository = centroPracticaRepository;
        this.practicaRepository = practicaRepository;
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
            String centroPracticaNombre = "—";
            Long idCentro = null;

            Optional<Estudiante> estudianteOpt = estudianteRepository.findByUsuario(u);
            if (estudianteOpt.isPresent() && estudianteOpt.get().getAsignatura() != null) {
                curso = estudianteOpt.get().getAsignatura().getNombre();
            } else {
                Optional<Profesor> profesorOpt = profesorRepository.findByUsuario(u);
                if (profesorOpt.isPresent() && profesorOpt.get().getAsignatura() != null) {
                    curso = profesorOpt.get().getAsignatura().getNombre();
                }
            }

            // Solo mostrar Centro de Práctica si es Profesor Colaborador o Tutor y no es Profesor de Asignatura
            boolean esColaboradorOTutor = roles.stream().anyMatch(r ->
                r != null && (r.toUpperCase().contains("COLABORADOR") || r.toUpperCase().contains("TUTOR"))
            ) && roles.stream().noneMatch(r -> r != null && r.toUpperCase().contains("ASIGNATURA"));

            if (esColaboradorOTutor) {
                Optional<ProfesorColaborador> colabOpt = profesorColaboradorRepository.findByUsuarioRut(u.getRut());
                if (colabOpt.isPresent() && colabOpt.get().getCentroPractica() != null) {
                    centroPracticaNombre = colabOpt.get().getCentroPractica().getNombre();
                    idCentro = colabOpt.get().getCentroPractica().getIdCentro();
                } else {
                    List<Practica> practicasTutor = practicaRepository.findByTutorPracticaUsuarioRut(u.getRut());
                    if (practicasTutor != null && !practicasTutor.isEmpty()) {
                        for (Practica p : practicasTutor) {
                            if (p.getCentroPractica() != null) {
                                centroPracticaNombre = p.getCentroPractica().getNombre();
                                idCentro = p.getCentroPractica().getIdCentro();
                                break;
                            }
                        }
                        if ("—".equals(curso)) {
                            for (Practica p : practicasTutor) {
                                if (p.getAsignatura() != null) {
                                    curso = p.getAsignatura().getNombre();
                                    break;
                                }
                            }
                        }
                    }
                }
            }

            dto.put("curso", curso);
            dto.put("centroPractica", centroPracticaNombre);
            dto.put("idCentro", idCentro);
            dto.put("estado", u.isActivo());
            dto.put("estadoTexto", u.getEstado());

            resultado.add(dto);
        }

        return ResponseEntity.ok(resultado);
    }

    @PostMapping("/usuarios")
    @Transactional
    public ResponseEntity<?> crearUsuario(@RequestBody Map<String, Object> payload) {
        String rutRaw = payload.get("rut") != null ? payload.get("rut").toString().trim() : "";
        String nombre = payload.get("nombre") != null ? payload.get("nombre").toString().trim() : "";
        String apellido = payload.get("apellido") != null ? payload.get("apellido").toString().trim() : "";
        String correo = payload.get("correo") != null ? payload.get("correo").toString().trim() : "";
        String contrasena = payload.get("contrasena") != null ? payload.get("contrasena").toString().trim() : "";
        String rolNombre = payload.get("rol") != null ? payload.get("rol").toString().trim() : "";
        Object idAsignaturaObj = payload.get("idAsignatura");

        if (rutRaw.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "El RUT es obligatorio."));
        }

        if (!RutUtils.isValid(rutRaw)) {
            return ResponseEntity.badRequest().body(Map.of("error", "El RUT ingresado no es válido. Compruebe el formato y dígito verificador."));
        }

        final String rut = RutUtils.formatStandard(rutRaw);
        final String rutLimpio = RutUtils.clean(rutRaw);

        List<Usuario> todosUsuarios = usuarioRepository.findAll();
        boolean yaExiste = todosUsuarios.stream().anyMatch(u ->
            u.getRut() != null && (u.getRut().equalsIgnoreCase(rut) || RutUtils.clean(u.getRut()).equalsIgnoreCase(rutLimpio))
        );
        if (yaExiste) {
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

        // Vincular lugar de práctica (Centro de Práctica) y sincronizar con tabla practica
        Object idCentroObj = payload.get("idCentro");
        CentroPractica centroEncontrado = null;
        if (idCentroObj != null && !idCentroObj.toString().trim().isEmpty()) {
            try {
                Long idC = Long.valueOf(idCentroObj.toString());
                centroEncontrado = centroPracticaRepository.findById(idC).orElse(null);
            } catch (Exception ignored) {
            }
        }
        if (centroEncontrado == null && payload.get("centroPractica") != null) {
            String cNombre = payload.get("centroPractica").toString().trim();
            if (!cNombre.isEmpty() && !cNombre.equals("—")) {
                centroEncontrado = centroPracticaRepository.findByNombre(cNombre).orElse(null);
            }
        }

        boolean esColaborador = (rolNombre.toUpperCase().contains("COLABORADOR")
            || rolNombre.toUpperCase().contains("TUTOR"))
            && !rolNombre.toUpperCase().contains("ASIGNATURA");

        if (esColaborador) {
            try {
                if (rolNombre.toUpperCase().contains("TUTOR")) {
                    Optional<TutorPractica> tutorOpt = tutorPracticaRepository.findByUsuarioRut(guardado.getRut());
                    if (tutorOpt.isEmpty()) {
                        tutorPracticaRepository.save(new TutorPractica(guardado.getNombre() + " " + guardado.getApellido(), guardado));
                    }
                }

                Optional<ProfesorColaborador> colabOpt = profesorColaboradorRepository.findByUsuarioRut(guardado.getRut());
                ProfesorColaborador colab;
                if (colabOpt.isPresent()) {
                    colab = colabOpt.get();
                    colab.setCentroPractica(centroEncontrado);
                    colab = profesorColaboradorRepository.save(colab);
                } else {
                    colab = new ProfesorColaborador(guardado, centroEncontrado, "Pedagogía");
                    colab = profesorColaboradorRepository.save(colab);
                }

                // Sincronizar o crear en la tabla practica el id_centro_de_practica
                sincronizarPracticasColaborador(guardado, colab, centroEncontrado, asigEncontrada);
            } catch (Exception ignored) {
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
    @Transactional
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

        // Manejar vinculación de Centro de Práctica para Profesor Colaborador en edición
        Object editIdCentroObj = payload.get("idCentro");
        CentroPractica editCentroEncontrado = null;
        if (editIdCentroObj != null && !editIdCentroObj.toString().trim().isEmpty()) {
            try {
                Long idC = Long.valueOf(editIdCentroObj.toString());
                editCentroEncontrado = centroPracticaRepository.findById(idC).orElse(null);
            } catch (Exception ignored) {
            }
        }
        if (editCentroEncontrado == null && payload.get("centroPractica") != null) {
            String cNombre = payload.get("centroPractica").toString().trim();
            if (!cNombre.isEmpty() && !cNombre.equals("—")) {
                editCentroEncontrado = centroPracticaRepository.findByNombre(cNombre).orElse(null);
            }
        }

        boolean esColaboradorEdit = (rolNombre.toUpperCase().contains("COLABORADOR")
            || rolNombre.toUpperCase().contains("TUTOR")
            || (guardado.getRoles() != null && guardado.getRoles().stream().anyMatch(r -> r.getNombre() != null && (r.getNombre().toUpperCase().contains("COLABORADOR") || r.getNombre().toUpperCase().contains("TUTOR")))))
            && !rolNombre.toUpperCase().contains("ASIGNATURA");

        if (esColaboradorEdit) {
            try {
                if (rolNombre.toUpperCase().contains("TUTOR") || (guardado.getRoles() != null && guardado.getRoles().stream().anyMatch(r -> r.getNombre() != null && r.getNombre().toUpperCase().contains("TUTOR")))) {
                    Optional<TutorPractica> tutorOpt = tutorPracticaRepository.findByUsuarioRut(guardado.getRut());
                    if (tutorOpt.isEmpty()) {
                        tutorPracticaRepository.save(new TutorPractica(guardado.getNombre() + " " + guardado.getApellido(), guardado));
                    }
                }

                Optional<ProfesorColaborador> colabOpt = profesorColaboradorRepository.findByUsuarioRut(guardado.getRut());
                ProfesorColaborador colab;
                if (colabOpt.isPresent()) {
                    colab = colabOpt.get();
                    colab.setCentroPractica(editCentroEncontrado);
                    colab = profesorColaboradorRepository.save(colab);
                } else {
                    colab = new ProfesorColaborador(guardado, editCentroEncontrado, "Pedagogía");
                    colab = profesorColaboradorRepository.save(colab);
                }

                // Sincronizar o crear en la tabla practica el id_centro_de_practica
                sincronizarPracticasColaborador(guardado, colab, editCentroEncontrado, asigEncontrada);
            } catch (Exception ignored) {
            }
        } else if (rolNombre.toUpperCase().contains("ASIGNATURA")) {
            // Si el rol es Profesor de Asignatura, desvincular cualquier centro de práctica previo
            try {
                Optional<ProfesorColaborador> colabOpt = profesorColaboradorRepository.findByUsuarioRut(guardado.getRut());
                if (colabOpt.isPresent()) {
                    ProfesorColaborador colab = colabOpt.get();
                    colab.setCentroPractica(null);
                    profesorColaboradorRepository.save(colab);
                }
            } catch (Exception ignored) {
            }
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

    @DeleteMapping("/usuarios/{rut}")
    @Transactional
    public ResponseEntity<?> eliminarUsuario(@PathVariable String rut) {
        String decodedTemp = rut != null ? rut.trim() : "";
        try {
            decodedTemp = java.net.URLDecoder.decode(decodedTemp, java.nio.charset.StandardCharsets.UTF_8).trim();
        } catch (Exception ignored) {
        }
        final String rutDecoded = decodedTemp;

        final String rutStandard = RutUtils.formatStandard(rutDecoded);
        final String rutLimpio = RutUtils.clean(rutDecoded);

        // Buscar usuario por rut exacto, estándar o limpio
        Optional<Usuario> userOpt = usuarioRepository.findByRut(rutDecoded);
        if (userOpt.isEmpty() && !rutStandard.isEmpty()) {
            userOpt = usuarioRepository.findByRut(rutStandard);
        }
        if (userOpt.isEmpty() && !rutLimpio.isEmpty()) {
            userOpt = usuarioRepository.findByRut(rutLimpio);
        }
        if (userOpt.isEmpty()) {
            userOpt = usuarioRepository.findAll().stream()
                .filter(u -> (u.getRut() != null && RutUtils.clean(u.getRut()).equalsIgnoreCase(rutLimpio)) ||
                             (u.getRut() != null && u.getRut().equalsIgnoreCase(rutDecoded)))
                .findFirst();
        }

        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Usuario usuario = userOpt.get();

        // 1. Desvincular estudiante si existe
        Optional<Estudiante> estOpt = estudianteRepository.findByUsuario(usuario);
        if (estOpt.isEmpty()) {
            estOpt = estudianteRepository.findByUsuarioRut(usuario.getRut());
        }
        if (estOpt.isPresent()) {
            Estudiante est = estOpt.get();
            try {
                List<Evidencia> evidencias = evidenciaRepository.findByEstudianteUsuarioRutOrderByFechaEntregaDesc(usuario.getRut());
                if (evidencias != null && !evidencias.isEmpty()) {
                    evidenciaRepository.deleteAll(evidencias);
                }
            } catch (Exception ignored) {}
            estudianteRepository.delete(est);
        }

        // 2. Desvincular profesor si existe
        Optional<Profesor> profOpt = profesorRepository.findByUsuario(usuario);
        if (profOpt.isEmpty()) {
            profOpt = profesorRepository.findByUsuarioRut(usuario.getRut());
        }
        if (profOpt.isPresent()) {
            Profesor prof = profOpt.get();
            if (prof.getAsignaturas() != null) {
                prof.getAsignaturas().clear();
                profesorRepository.save(prof);
            }
            try {
                List<Evidencia> evidenciasProf = evidenciaRepository.findByActividadProfesorUsuarioRutOrderByFechaEntregaDesc(usuario.getRut());
                if (evidenciasProf != null) {
                    for (Evidencia ev : evidenciasProf) {
                        ev.setRevisadoPor(null);
                        evidenciaRepository.save(ev);
                    }
                }
            } catch (Exception ignored) {}
            profesorRepository.delete(prof);
        }

        // 3. Desvincular profesor colaborador si existe
        try {
            Optional<ProfesorColaborador> colabOpt = profesorColaboradorRepository.findByUsuarioRut(usuario.getRut());
            if (colabOpt.isPresent()) {
                ProfesorColaborador colab = colabOpt.get();
                if (colab.getPracticas() != null) {
                    colab.getPracticas().clear();
                    profesorColaboradorRepository.save(colab);
                }
                profesorColaboradorRepository.delete(colab);
            }
        } catch (Exception ignored) {}

        // 4. Desvincular tutor práctica si existe
        try {
            Optional<TutorPractica> tutorOpt = tutorPracticaRepository.findByUsuarioRut(usuario.getRut());
            tutorOpt.ifPresent(tutorPracticaRepository::delete);
        } catch (Exception ignored) {}

        // 5. Limpiar roles de la tabla intermedia usuario_rol
        if (usuario.getRoles() != null) {
            usuario.getRoles().clear();
            usuarioRepository.save(usuario);
        }

        // 6. Eliminar el usuario de la base de datos
        usuarioRepository.delete(usuario);

        return ResponseEntity.ok(Map.of(
            "message", "Usuario eliminado con éxito",
            "rut", usuario.getRut()
        ));
    }

    /**
     * Sincroniza o crea el registro en la tabla practica asociando el id_centro_de_practica
     * y la relación bidireccional entre ProfesorColaborador y Practica.
     */
    private void sincronizarPracticasColaborador(Usuario usuario, ProfesorColaborador colab, CentroPractica centro, Asignatura asignatura) {
        if (colab == null) {
            return;
        }

        if (colab.getPracticas() == null) {
            colab.setPracticas(new HashSet<>());
        }

        // 1. Recopilar prácticas existentes asociadas a este colaborador o tutor
        Set<Practica> practicasAfectadas = new HashSet<>();
        if (usuario != null && usuario.getRut() != null) {
            List<Practica> practicasPorRut = practicaRepository.findByProfesoresColaboradoresUsuarioRut(usuario.getRut());
            if (practicasPorRut != null) {
                practicasAfectadas.addAll(practicasPorRut);
            }
            List<Practica> practicasPorTutor = practicaRepository.findByTutorPracticaUsuarioRut(usuario.getRut());
            if (practicasPorTutor != null) {
                practicasAfectadas.addAll(practicasPorTutor);
            }
        }
        if (colab.getPracticas() != null) {
            practicasAfectadas.addAll(colab.getPracticas());
        }

        // 2. Si se asignó una asignatura, incluir todas las prácticas de esa asignatura
        if (asignatura != null && asignatura.getIdAsignatura() != null) {
            List<Practica> practicasPorAsig = practicaRepository.findByAsignaturaIdAsignatura(asignatura.getIdAsignatura());
            if (practicasPorAsig != null) {
                practicasAfectadas.addAll(practicasPorAsig);
            }
        }

        TutorPractica tutorUsuario = null;
        if (usuario != null && usuario.getRut() != null) {
            tutorUsuario = tutorPracticaRepository.findByUsuarioRut(usuario.getRut()).orElse(null);
        }

        // 3. Si no existe ninguna práctica para la asignatura / colaborador / tutor, crear una o más según corresponda
        if (practicasAfectadas.isEmpty()) {
            List<Estudiante> estudiantesCandidatos = new ArrayList<>();
            if (asignatura != null && asignatura.getIdAsignatura() != null) {
                estudiantesCandidatos = estudianteRepository.findAll().stream()
                    .filter(e -> e.getAsignatura() != null && asignatura.getIdAsignatura().equals(e.getAsignatura().getIdAsignatura()))
                    .filter(e -> (e.getUsuario() == null || (e.getUsuario().isActivo() && !"inactivo".equalsIgnoreCase(e.getUsuario().getEstado()))) && !"INACTIVO".equalsIgnoreCase(e.getEstado()))
                    .collect(Collectors.toList());
            }

            TutorPractica tutorDefault = tutorUsuario != null ? tutorUsuario : tutorPracticaRepository.findAll().stream().findFirst().orElse(null);

            if (!estudiantesCandidatos.isEmpty()) {
                for (Estudiante est : estudiantesCandidatos) {
                    Practica nueva = new Practica(est, tutorDefault, centro, asignatura, "EN_CURSO");
                    Set<ProfesorColaborador> colabs = new HashSet<>();
                    colabs.add(colab);
                    nueva.setProfesoresColaboradores(colabs);
                    nueva = practicaRepository.save(nueva);
                    colab.getPracticas().add(nueva);
                    practicasAfectadas.add(nueva);
                }
            } else if (centro != null) {
                Estudiante primerEstudiante = estudianteRepository.findAll().stream()
                    .filter(e -> (e.getUsuario() == null || (e.getUsuario().isActivo() && !"inactivo".equalsIgnoreCase(e.getUsuario().getEstado()))) && !"INACTIVO".equalsIgnoreCase(e.getEstado()))
                    .findFirst().orElse(null);
                if (primerEstudiante != null) {
                    Practica nueva = new Practica(primerEstudiante, tutorDefault, centro, asignatura, "EN_CURSO");
                    Set<ProfesorColaborador> colabs = new HashSet<>();
                    colabs.add(colab);
                    nueva.setProfesoresColaboradores(colabs);
                    nueva = practicaRepository.save(nueva);
                    colab.getPracticas().add(nueva);
                    practicasAfectadas.add(nueva);
                }
            }
        }

        // 4. Actualizar id_centro_de_practica en la tabla practica y vincular bidireccionalmente
        for (Practica p : practicasAfectadas) {
            p.setCentroPractica(centro);
            if (asignatura != null && p.getAsignatura() == null) {
                p.setAsignatura(asignatura);
            }
            if (tutorUsuario != null) {
                p.setTutorPractica(tutorUsuario);
            }

            if (p.getProfesoresColaboradores() == null) {
                p.setProfesoresColaboradores(new HashSet<>());
            }
            p.getProfesoresColaboradores().add(colab);
            colab.getPracticas().add(p);

            practicaRepository.save(p);
        }

        profesorColaboradorRepository.save(colab);
    }
}


