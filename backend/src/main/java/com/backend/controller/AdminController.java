package com.backend.controller;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;

import com.backend.model.Asignatura;
import com.backend.model.CentroPractica;
import com.backend.model.Estudiante;
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
 * - Credenciales correctas (configuradas en .env) -> Este endpoint responde 200 OK
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

    private final RolRepository rolRepository;
    private final AsignaturaRepository asignaturaRepository;
    private final CentroPracticaRepository centroPracticaRepository;
    private final PracticaRepository practicaRepository;
    private final JdbcTemplate jdbcTemplate;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @PersistenceContext
    private EntityManager entityManager;

    public AdminController(UsuarioRepository usuarioRepository,
                           EstudianteRepository estudianteRepository,
                           ProfesorRepository profesorRepository,
                           ProfesorColaboradorRepository profesorColaboradorRepository,
                           TutorPracticaRepository tutorPracticaRepository,
                           EvidenciaRepository evidenciaRepository,
                           RolRepository rolRepository,
                           AsignaturaRepository asignaturaRepository,
                           CentroPracticaRepository centroPracticaRepository,
                           PracticaRepository practicaRepository,
                           JdbcTemplate jdbcTemplate) {
        this.usuarioRepository = usuarioRepository;
        this.estudianteRepository = estudianteRepository;
        this.profesorRepository = profesorRepository;
        this.profesorColaboradorRepository = profesorColaboradorRepository;
        this.tutorPracticaRepository = tutorPracticaRepository;
        this.rolRepository = rolRepository;
        this.asignaturaRepository = asignaturaRepository;
        this.centroPracticaRepository = centroPracticaRepository;
        this.practicaRepository = practicaRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> checkAdminAuth(org.springframework.security.core.Authentication authentication) {
        String username = (authentication != null && authentication.getName() != null)
            ? authentication.getName()
            : "admin";
        return ResponseEntity.ok(Map.of(
            "status", "authenticated",
            "user", username,
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

            // Solo mostrar Centro de Práctica si es Profesor Colaborador, Tutor o Coordinador y no es Profesor de Asignatura
            boolean esColaboradorOTutor = roles.stream().anyMatch(r ->
                r != null && (r.toUpperCase().contains("COLABORADOR") || r.toUpperCase().contains("TUTOR") || r.toUpperCase().contains("COORDINADOR"))
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
        String rolRaw = payload.get("rol") != null ? payload.get("rol").toString().trim() : "";
        String rolNombre = normalizarNombreRol(rolRaw);
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
            Optional<Rol> rolOpt = buscarRol(rolNombre);
            if (rolOpt.isPresent()) {
                nuevoUsuario.setRoles(new HashSet<>(Collections.singletonList(rolOpt.get())));
            }
        }

        // Validar compatibilidad de rol con campos opcionales
        boolean esColaborador = (rolNombre.toUpperCase().contains("COLABORADOR")
            || rolNombre.toUpperCase().contains("TUTOR")
            || rolNombre.toUpperCase().contains("COORDINADOR"))
            && !rolNombre.toUpperCase().contains("ASIGNATURA");

        Object idCentroObj = payload.get("idCentro");
        boolean tieneCentro = (idCentroObj != null && !idCentroObj.toString().trim().isEmpty())
            || (payload.get("centroPractica") != null && !payload.get("centroPractica").toString().trim().isEmpty() && !payload.get("centroPractica").toString().trim().equals("—"));

        if (tieneCentro && !esColaborador) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "El rol " + rolNombre + " no puede tener asignado un lugar de práctica."
            ));
        }

        boolean puedeTenerAsig = "ESTUDIANTE".equalsIgnoreCase(rolNombre)
            || rolNombre.toUpperCase().contains("PROFESOR")
            || rolNombre.toUpperCase().contains("DOCENTE");

        boolean tieneAsig = (idAsignaturaObj != null && !idAsignaturaObj.toString().trim().isEmpty())
            || (payload.get("asignatura") != null && !payload.get("asignatura").toString().trim().isEmpty() && !payload.get("asignatura").toString().trim().equals("—"));

        if (tieneAsig && !puedeTenerAsig) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "El rol " + rolNombre + " no puede tener asignada una asignatura."
            ));
        }

        Usuario guardado = usuarioRepository.saveAndFlush(nuevoUsuario);

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

        if (esColaborador) {
            try {
                if (rolNombre.toUpperCase().contains("TUTOR")) {
                    Optional<TutorPractica> tutorOpt = tutorPracticaRepository.findByUsuarioRut(guardado.getRut());
                    if (tutorOpt.isEmpty()) {
                        tutorPracticaRepository.saveAndFlush(new TutorPractica(guardado.getNombre() + " " + guardado.getApellido(), guardado));
                    }
                }

                Optional<ProfesorColaborador> colabOpt = profesorColaboradorRepository.findByUsuarioRut(guardado.getRut());
                ProfesorColaborador colab;
                if (colabOpt.isPresent()) {
                    colab = colabOpt.get();
                    colab.setCentroPractica(centroEncontrado);
                    colab = profesorColaboradorRepository.saveAndFlush(colab);
                } else {
                    colab = new ProfesorColaborador(guardado, centroEncontrado, "Pedagogía");
                    colab = profesorColaboradorRepository.saveAndFlush(colab);
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
        String rolRaw = payload.get("rol") != null ? payload.get("rol").toString().trim() : "";
        String rolNombre = normalizarNombreRol(rolRaw);
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
            Optional<Rol> rolOpt = buscarRol(rolNombre);
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
            || rolNombre.toUpperCase().contains("COORDINADOR")
            || (guardado.getRoles() != null && guardado.getRoles().stream().anyMatch(r -> r.getNombre() != null && (r.getNombre().toUpperCase().contains("COLABORADOR") || r.getNombre().toUpperCase().contains("TUTOR") || r.getNombre().toUpperCase().contains("COORDINADOR")))))
            && !rolNombre.toUpperCase().contains("ASIGNATURA");

        if (esColaboradorEdit) {
            try {
                if (rolNombre.toUpperCase().contains("TUTOR") || (guardado.getRoles() != null && guardado.getRoles().stream().anyMatch(r -> r.getNombre() != null && r.getNombre().toUpperCase().contains("TUTOR")))) {
                    Optional<TutorPractica> tutorOpt = tutorPracticaRepository.findByUsuarioRut(guardado.getRut());
                    if (tutorOpt.isEmpty()) {
                        tutorPracticaRepository.saveAndFlush(new TutorPractica(guardado.getNombre() + " " + guardado.getApellido(), guardado));
                    }
                }

                Optional<ProfesorColaborador> colabOpt = profesorColaboradorRepository.findByUsuarioRut(guardado.getRut());
                ProfesorColaborador colab;
                if (colabOpt.isPresent()) {
                    colab = colabOpt.get();
                    colab.setCentroPractica(editCentroEncontrado);
                    colab = profesorColaboradorRepository.saveAndFlush(colab);
                } else {
                    colab = new ProfesorColaborador(guardado, editCentroEncontrado, "Pedagogía");
                    colab = profesorColaboradorRepository.saveAndFlush(colab);
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
        String rutOficial = usuario.getRut();

        // Conjunto de todas las variantes de RUT posibles para este usuario
        Set<String> ruts = new LinkedHashSet<>();
        if (rutOficial != null && !rutOficial.isBlank()) {
            ruts.add(rutOficial.trim());
            String cleanOficial = RutUtils.clean(rutOficial);
            if (!cleanOficial.isEmpty()) ruts.add(cleanOficial);
            String stdOficial = RutUtils.formatStandard(rutOficial);
            if (!stdOficial.isEmpty()) ruts.add(stdOficial);
        }
        if (!rutDecoded.isBlank()) ruts.add(rutDecoded);
        if (!rutStandard.isBlank()) ruts.add(rutStandard);
        if (!rutLimpio.isBlank()) ruts.add(rutLimpio);

        List<Object> rutParams = new ArrayList<>(ruts);
        String inRutsClause = String.join(",", Collections.nCopies(rutParams.size(), "?"));

        // 1. Obtener identificadores relacionados si existen
        List<Long> idsEstudiante = jdbcTemplate.query(
            "SELECT id_estudiante FROM estudiante WHERE rut_usuario IN (" + inRutsClause + ")",
            (rs, rowNum) -> rs.getLong("id_estudiante"),
            rutParams.toArray()
        );

        List<Long> idsProfesor = jdbcTemplate.query(
            "SELECT id_profesor FROM profesor WHERE rut_usuario IN (" + inRutsClause + ")",
            (rs, rowNum) -> rs.getLong("id_profesor"),
            rutParams.toArray()
        );

        List<Long> idsColaborador = jdbcTemplate.query(
            "SELECT id_colaborador FROM profesor_colaborador WHERE rut_usuario IN (" + inRutsClause + ")",
            (rs, rowNum) -> rs.getLong("id_colaborador"),
            rutParams.toArray()
        );

        List<Long> idsTutor = jdbcTemplate.query(
            "SELECT id_tutor FROM tutor_practica WHERE rut_usuario IN (" + inRutsClause + ")",
            (rs, rowNum) -> rs.getLong("id_tutor"),
            rutParams.toArray()
        );

        // 2. DOCUMENTOS: eliminar todos los documentos asociados al usuario o estudiante
        List<Object> doubleRutParams = new ArrayList<>(rutParams);
        doubleRutParams.addAll(rutParams);
        List<Long> idsDocumento = jdbcTemplate.query(
            "SELECT id_documento FROM documento WHERE rut_usuario IN (" + inRutsClause + ") OR rut_estudiante IN (" + inRutsClause + ")",
            (rs, rowNum) -> rs.getLong("id_documento"),
            doubleRutParams.toArray()
        );

        if (!idsDocumento.isEmpty()) {
            String inDocsClause = String.join(",", Collections.nCopies(idsDocumento.size(), "?"));
            Object[] docArgs = idsDocumento.toArray();
            jdbcTemplate.update("DELETE FROM documento_planificacion WHERE id_documento IN (" + inDocsClause + ")", docArgs);
            jdbcTemplate.update("UPDATE proyecto_intervencion SET id_documento = NULL WHERE id_documento IN (" + inDocsClause + ")", docArgs);
            jdbcTemplate.update("UPDATE entrega_evidencia SET id_documento = NULL WHERE id_documento IN (" + inDocsClause + ")", docArgs);
            jdbcTemplate.update("DELETE FROM documento WHERE id_documento IN (" + inDocsClause + ")", docArgs);
        }

        // Eliminar directamente cualquier documento restante por RUT
        jdbcTemplate.update(
            "DELETE FROM documento WHERE rut_usuario IN (" + inRutsClause + ") OR rut_estudiante IN (" + inRutsClause + ")",
            doubleRutParams.toArray()
        );

        // Eliminar de documento_practica por RUT usuario o estudiante
        jdbcTemplate.update(
            "DELETE FROM documento_practica WHERE rut_usuario IN (" + inRutsClause + ") OR rut_estudiante IN (" + inRutsClause + ")",
            doubleRutParams.toArray()
        );

        // 3. ESTUDIANTE: Desvincular de práctica (conservando la práctica) y limpiar registros propios
        if (!idsEstudiante.isEmpty()) {
            String inEstClause = String.join(",", Collections.nCopies(idsEstudiante.size(), "?"));
            Object[] estArgs = idsEstudiante.toArray();

            // La práctica NO se elimina; únicamente se desvincula la relación del estudiante
            jdbcTemplate.update("UPDATE practica SET id_estudiante = NULL WHERE id_estudiante IN (" + inEstClause + ")", estArgs);
            jdbcTemplate.update("UPDATE planificacion SET id_estudiante = NULL WHERE id_estudiante IN (" + inEstClause + ")", estArgs);

            // Eliminar registros de entregas, evidencias y respuestas
            jdbcTemplate.update("DELETE FROM entrega_evidencia WHERE id_estudiante IN (" + inEstClause + ")", estArgs);
            jdbcTemplate.update("DELETE FROM evidencia WHERE id_estudiante IN (" + inEstClause + ")", estArgs);
            jdbcTemplate.update("DELETE FROM respuesta_encuesta WHERE id_estudiante IN (" + inEstClause + ")", estArgs);
            jdbcTemplate.update("DELETE FROM respuesta_pregunta WHERE id_estudiante IN (" + inEstClause + ")", estArgs);

            // Eliminar de estudiante
            jdbcTemplate.update("DELETE FROM estudiante WHERE id_estudiante IN (" + inEstClause + ")", estArgs);
        }
        jdbcTemplate.update("DELETE FROM estudiante WHERE rut_usuario IN (" + inRutsClause + ")", rutParams.toArray());

        // 4. PROFESOR: Desvincular de revisiones, asignaturas, actividades y eliminar profesor
        if (!idsProfesor.isEmpty()) {
            String inProfClause = String.join(",", Collections.nCopies(idsProfesor.size(), "?"));
            Object[] profArgs = idsProfesor.toArray();

            jdbcTemplate.update("UPDATE evidencia SET id_profesor_revisor = NULL WHERE id_profesor_revisor IN (" + inProfClause + ")", profArgs);
            jdbcTemplate.update("DELETE FROM profesor_asignatura WHERE id_profesor IN (" + inProfClause + ")", profArgs);

            List<Long> idsActividad = jdbcTemplate.query(
                "SELECT id_actividad FROM actividad WHERE id_profesor IN (" + inProfClause + ")",
                (rs, rowNum) -> rs.getLong("id_actividad"),
                profArgs
            );
            if (!idsActividad.isEmpty()) {
                String inActClause = String.join(",", Collections.nCopies(idsActividad.size(), "?"));
                Object[] actArgs = idsActividad.toArray();
                jdbcTemplate.update("DELETE FROM entrega_evidencia WHERE id_actividad IN (" + inActClause + ")", actArgs);
                jdbcTemplate.update("DELETE FROM evidencia WHERE id_actividad IN (" + inActClause + ")", actArgs);
                jdbcTemplate.update("DELETE FROM actividad WHERE id_actividad IN (" + inActClause + ")", actArgs);
            }

            jdbcTemplate.update("DELETE FROM profesor WHERE id_profesor IN (" + inProfClause + ")", profArgs);
        }
        jdbcTemplate.update("DELETE FROM profesor WHERE rut_usuario IN (" + inRutsClause + ")", rutParams.toArray());

        // 5. PROFESOR COLABORADOR: Desvincular de práctica (conservando la práctica) y eliminar colaborador
        if (!idsColaborador.isEmpty()) {
            String inColabClause = String.join(",", Collections.nCopies(idsColaborador.size(), "?"));
            Object[] colabArgs = idsColaborador.toArray();
            jdbcTemplate.update("DELETE FROM profesor_colaborador_practica WHERE id_colaborador IN (" + inColabClause + ")", colabArgs);
            jdbcTemplate.update("DELETE FROM profesor_colaborador WHERE id_colaborador IN (" + inColabClause + ")", colabArgs);
        }
        jdbcTemplate.update("DELETE FROM profesor_colaborador WHERE rut_usuario IN (" + inRutsClause + ")", rutParams.toArray());

        // 6. TUTOR PRÁCTICA: Desvincular de práctica (conservando la práctica) y eliminar tutor
        if (!idsTutor.isEmpty()) {
            String inTutorClause = String.join(",", Collections.nCopies(idsTutor.size(), "?"));
            Object[] tutorArgs = idsTutor.toArray();
            jdbcTemplate.update("UPDATE practica SET id_tutor_practica = NULL WHERE id_tutor_practica IN (" + inTutorClause + ")", tutorArgs);
            jdbcTemplate.update("DELETE FROM tutor_practica WHERE id_tutor IN (" + inTutorClause + ")", tutorArgs);
        }
        jdbcTemplate.update("DELETE FROM tutor_practica WHERE rut_usuario IN (" + inRutsClause + ")", rutParams.toArray());

        // 7. ROLES: Limpiar la tabla intermedia usuario_rol
        jdbcTemplate.update("DELETE FROM usuario_rol WHERE rut_usuario IN (" + inRutsClause + ")", rutParams.toArray());

        // 8. USUARIO: Eliminar definitivamente el registro en la tabla usuario
        jdbcTemplate.update("DELETE FROM usuario WHERE rut IN (" + inRutsClause + ")", rutParams.toArray());

        // Limpiar el contexto de persistencia JPA para evitar discrepancias
        if (entityManager != null) {
            entityManager.clear();
        }

        return ResponseEntity.ok(Map.of(
            "message", "Usuario eliminado con éxito",
            "rut", rutOficial
        ));
    }

    /**
     * Normaliza cualquier variación de nombre de rol (ej: "profesor colaborador",
     * "Profesor Colaborador", "colaborador", etc.) a la convención canónica de la BD
     * (ej: "PROFESOR_COLABORADOR").
     */
    private String normalizarNombreRol(String rolInput) {
        if (rolInput == null) {
            return "";
        }
        String limpio = rolInput.trim();
        if (limpio.isEmpty()) {
            return "";
        }
        // Quitar acentos/tildes y unificar separadores
        String sinTildes = java.text.Normalizer.normalize(limpio, java.text.Normalizer.Form.NFD)
            .replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        String upper = sinTildes.toUpperCase().replaceAll("[_\\-\\s]+", " ").trim();

        // 1. Profesor Colaborador
        if (upper.equals("PROFESOR COLABORADOR")
            || upper.equals("COLABORADOR")
            || (upper.contains("COLABORADOR") && !upper.contains("ASIGNATURA"))) {
            return "PROFESOR_COLABORADOR";
        }

        // 2. Profesor de Asignatura
        if (upper.equals("PROFESOR ASIGNATURA")
            || upper.equals("PROFESOR DE ASIGNATURA")
            || (upper.contains("PROFESOR") && upper.contains("ASIGNATURA"))) {
            return "PROFESOR_ASIGNATURA";
        }

        // 3. Tutor de Práctica
        if (upper.equals("TUTOR PRACTICA")
            || upper.equals("TUTOR DE PRACTICA")
            || upper.contains("TUTOR")) {
            return "TUTOR_PRACTICA";
        }

        // 4. Estudiante / Alumno
        if (upper.equals("ESTUDIANTE")
            || upper.equals("ALUMNO")
            || upper.contains("ESTUDIANTE")
            || upper.contains("ALUMNO")) {
            return "ESTUDIANTE";
        }

        // 5. Coordinador
        if (upper.equals("COORDINADOR")
            || upper.contains("COORDINADOR")) {
            return "COORDINADOR";
        }

        // 6. Administrador
        if (upper.equals("ADMINISTRADOR")
            || upper.equals("ADMIN")
            || upper.contains("ADMIN")) {
            return "ADMINISTRADOR";
        }

        return upper.replace(" ", "_");
    }

    private Optional<Rol> buscarRol(String rolInput) {
        if (rolInput == null || rolInput.trim().isEmpty()) {
            return Optional.empty();
        }
        String normalizado = normalizarNombreRol(rolInput);
        Optional<Rol> rolOpt = rolRepository.findByNombre(normalizado);
        if (rolOpt.isPresent()) {
            return rolOpt;
        }
        return rolRepository.findAll().stream()
            .filter(r -> r.getNombre() != null && (
                r.getNombre().equalsIgnoreCase(normalizado) ||
                r.getNombre().replace("_", " ").equalsIgnoreCase(normalizado.replace("_", " ")) ||
                r.getNombre().equalsIgnoreCase(rolInput.trim())
            ))
            .findFirst();
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
            if (tutorUsuario == null && usuario.getRoles() != null && usuario.getRoles().stream()
                .anyMatch(r -> r.getNombre() != null && r.getNombre().toUpperCase().contains("TUTOR"))) {
                tutorUsuario = tutorPracticaRepository.saveAndFlush(
                    new TutorPractica(usuario.getNombre() + " " + usuario.getApellido(), usuario)
                );
            }
        }

        TutorPractica tutorDefault = tutorUsuario;
        if (tutorDefault == null) {
            tutorDefault = tutorPracticaRepository.findAll().stream().findFirst().orElse(null);
        }
        if (tutorDefault != null && tutorDefault.getIdTutor() == null) {
            tutorDefault = tutorPracticaRepository.saveAndFlush(tutorDefault);
        }

        if (colab.getPracticas() == null) {
            colab.setPracticas(new HashSet<>());
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

            if (!estudiantesCandidatos.isEmpty()) {
                for (Estudiante est : estudiantesCandidatos) {
                    Practica nueva = new Practica(est, tutorDefault, centro, asignatura, "EN_CURSO");
                    Set<ProfesorColaborador> colabs = new HashSet<>();
                    colabs.add(colab);
                    nueva.setProfesoresColaboradores(colabs);
                    nueva = practicaRepository.saveAndFlush(nueva);
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
                    nueva = practicaRepository.saveAndFlush(nueva);
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
            } else if (p.getTutorPractica() == null && tutorDefault != null) {
                p.setTutorPractica(tutorDefault);
            }

            if (p.getProfesoresColaboradores() == null) {
                p.setProfesoresColaboradores(new HashSet<>());
            }
            p.getProfesoresColaboradores().add(colab);
            colab.getPracticas().add(p);

            practicaRepository.saveAndFlush(p);
        }

        profesorColaboradorRepository.saveAndFlush(colab);
    }

    /**
     * Endpoint para importación masiva de usuarios mediante archivo Excel (.xlsx / .xls).
     * Valida columnas obligatorias: rut, contrasena, rol, nombre, apellido, correo.
     * Soporta columnas opcionales: /asignatura, /lugar de practica.
     * Deduplica por RUT y correo (tanto en BD como en el mismo archivo).
     * Establece estado activo por defecto y encripta contraseñas con BCrypt.
     */
    @PostMapping(value = "/usuarios/importar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Transactional
    public ResponseEntity<?> importarUsuarios(@RequestParam("file") MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No se ha seleccionado ningún archivo."));
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Nombre de archivo no válido."));
        }

        String lowerFilename = originalFilename.toLowerCase();
        if (!lowerFilename.endsWith(".xlsx") && !lowerFilename.endsWith(".xls")) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Formato de archivo no válido. Solo se permiten archivos Excel (.xlsx, .xls)."
            ));
        }

        Workbook workbook;
        try {
            workbook = WorkbookFactory.create(file.getInputStream());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "El archivo proporcionado no es un archivo Excel válido o no se pudo procesar."
            ));
        }

        Sheet sheet = workbook.getSheetAt(0);
        if (sheet == null || sheet.getPhysicalNumberOfRows() == 0) {
            try { workbook.close(); } catch (Exception ignored) {}
            return ResponseEntity.badRequest().body(Map.of("error", "El archivo Excel está vacío."));
        }

        DataFormatter formatter = new DataFormatter();

        // 1. Localizar y validar la fila de encabezados
        Row headerRow = null;
        for (int r = 0; r <= sheet.getLastRowNum(); r++) {
            Row candidate = sheet.getRow(r);
            if (candidate != null && candidate.getPhysicalNumberOfCells() > 0) {
                headerRow = candidate;
                break;
            }
        }

        if (headerRow == null) {
            try { workbook.close(); } catch (Exception ignored) {}
            return ResponseEntity.badRequest().body(Map.of("error", "No se encontró fila de encabezados en el archivo."));
        }

        Map<String, Integer> colMap = new HashMap<>();
        for (int c = 0; c < headerRow.getLastCellNum(); c++) {
            Cell cell = headerRow.getCell(c);
            String headerVal = getCellStringValue(cell, formatter).toLowerCase();
            if (headerVal.startsWith("/")) {
                headerVal = headerVal.substring(1).trim();
            }
            if (!headerVal.isEmpty()) {
                colMap.put(headerVal, c);
            }
        }

        // Validar columnas obligatorias: rut, contrasena, rol, nombre, apellido, correo
        String[] mandatory = {"rut", "contrasena", "rol", "nombre", "apellido", "correo"};
        for (String m : mandatory) {
            if ("contrasena".equals(m)) {
                if (!colMap.containsKey("contrasena") && !colMap.containsKey("contraseña")) {
                    try { workbook.close(); } catch (Exception ignored) {}
                    return ResponseEntity.badRequest().body(Map.of(
                        "error", "No se puede importar el archivo. Falta la columna obligatoria: contrasena"
                    ));
                }
            } else if (!colMap.containsKey(m)) {
                try { workbook.close(); } catch (Exception ignored) {}
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "No se puede importar el archivo. Falta la columna obligatoria: " + m
                ));
            }
        }

        int rutCol = colMap.get("rut");
        int passCol = colMap.containsKey("contrasena") ? colMap.get("contrasena") : colMap.get("contraseña");
        int rolCol = colMap.get("rol");
        int nombreCol = colMap.get("nombre");
        int apellidoCol = colMap.get("apellido");
        int correoCol = colMap.get("correo");

        Integer asigCol = null;
        if (colMap.containsKey("asignatura")) {
            asigCol = colMap.get("asignatura");
        }

        Integer centroCol = null;
        if (colMap.containsKey("lugar de practica")) {
            centroCol = colMap.get("lugar de practica");
        } else if (colMap.containsKey("lugar de práctica")) {
            centroCol = colMap.get("lugar de práctica");
        } else if (colMap.containsKey("lugar_de_practica")) {
            centroCol = colMap.get("lugar_de_practica");
        } else if (colMap.containsKey("centro de practica")) {
            centroCol = colMap.get("centro de practica");
        }

        // Conjuntos en memoria para evitar duplicados dentro del mismo lote
        Set<String> rutsVistosEnLote = new HashSet<>();
        Set<String> correosVistosEnLote = new HashSet<>();

        // Traer usuarios existentes de la BD para chequeo rápido
        List<Usuario> todosUsuarios = usuarioRepository.findAll();
        Set<String> rutsEnBd = todosUsuarios.stream()
            .map(u -> RutUtils.clean(u.getRut()))
            .collect(Collectors.toSet());
        Set<String> correosEnBd = todosUsuarios.stream()
            .filter(u -> u.getCorreo() != null)
            .map(u -> u.getCorreo().trim().toLowerCase())
            .collect(Collectors.toSet());

        int totalProcesados = 0;
        int totalIngresados = 0;
        List<Map<String, String>> omitidos = new ArrayList<>();

        int startRow = headerRow.getRowNum() + 1;
        int lastRow = sheet.getLastRowNum();

        for (int r = startRow; r <= lastRow; r++) {
            Row row = sheet.getRow(r);
            if (row == null) {
                continue;
            }

            String rutRaw = getCellStringValue(row.getCell(rutCol), formatter);
            String passRaw = getCellStringValue(row.getCell(passCol), formatter);
            String rolRaw = getCellStringValue(row.getCell(rolCol), formatter);
            String nombreRaw = getCellStringValue(row.getCell(nombreCol), formatter);
            String apellidoRaw = getCellStringValue(row.getCell(apellidoCol), formatter);
            String correoRaw = getCellStringValue(row.getCell(correoCol), formatter);
            String asigRaw = asigCol != null ? getCellStringValue(row.getCell(asigCol), formatter) : "";
            String centroRaw = centroCol != null ? getCellStringValue(row.getCell(centroCol), formatter) : "";

            // Si la fila está completamente vacía, se ignora
            if (rutRaw.isEmpty() && passRaw.isEmpty() && rolRaw.isEmpty() &&
                nombreRaw.isEmpty() && apellidoRaw.isEmpty() && correoRaw.isEmpty()) {
                continue;
            }

            totalProcesados++;

            String rolNormalizado = normalizarNombreRol(rolRaw);
            String rolDisplay = rolNormalizado.isEmpty() ? (rolRaw.isEmpty() ? "SIN_ROL" : rolRaw.toUpperCase().trim()) : rolNormalizado;
            String nombreDisplay = (nombreRaw + " " + apellidoRaw).trim();
            if (nombreDisplay.isEmpty()) {
                nombreDisplay = "Usuario";
            }
            String usuarioLabel = nombreDisplay + " — " + (rolRaw.isEmpty() ? "SIN_ROL" : rolRaw);

            // Validación de RUT
            if (rutRaw.isEmpty()) {
                omitidos.add(Map.of("usuario", usuarioLabel, "motivo", "RUT no proporcionado."));
                continue;
            }

            if (!RutUtils.isValid(rutRaw)) {
                omitidos.add(Map.of("usuario", usuarioLabel, "motivo", "RUT no válido."));
                continue;
            }

            String cleanRut = RutUtils.clean(rutRaw);
            String standardRut = RutUtils.formatStandard(rutRaw);

            // Duplicado de RUT en el mismo archivo
            if (rutsVistosEnLote.contains(cleanRut)) {
                omitidos.add(Map.of("usuario", usuarioLabel, "motivo", "RUT ya registrado."));
                continue;
            }

            // Duplicado de RUT en la BD
            if (rutsEnBd.contains(cleanRut)) {
                omitidos.add(Map.of("usuario", usuarioLabel, "motivo", "RUT ya registrado."));
                continue;
            }

            // Validación de Correo
            String lowerCorreo = correoRaw.toLowerCase().trim();
            String emailRegex = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$";
            if (lowerCorreo.isEmpty() || !lowerCorreo.matches(emailRegex)) {
                omitidos.add(Map.of("usuario", usuarioLabel, "motivo", "formato de correo inválido."));
                continue;
            }

            // Duplicado de Correo en el mismo archivo
            if (correosVistosEnLote.contains(lowerCorreo)) {
                omitidos.add(Map.of("usuario", usuarioLabel, "motivo", "correo ya registrado."));
                continue;
            }

            // Duplicado de Correo en la BD
            if (correosEnBd.contains(lowerCorreo)) {
                omitidos.add(Map.of("usuario", usuarioLabel, "motivo", "correo ya registrado."));
                continue;
            }

            // Validación de Nombre y Apellido
            if (nombreRaw.trim().isEmpty() || apellidoRaw.trim().isEmpty()) {
                omitidos.add(Map.of("usuario", usuarioLabel, "motivo", "nombre y apellido son obligatorios."));
                continue;
            }

            // Validación de Contraseña
            if (passRaw.isEmpty() || passRaw.length() < 6) {
                omitidos.add(Map.of("usuario", usuarioLabel, "motivo", "la contraseña debe tener al menos 6 caracteres."));
                continue;
            }

            // Validación de Rol
            Optional<Rol> rolOpt = buscarRol(rolDisplay);
            if (rolOpt.isEmpty()) {
                omitidos.add(Map.of("usuario", usuarioLabel, "motivo", "el rol no existe en el sistema."));
                continue;
            }
            rolDisplay = rolOpt.get().getNombre();

            // Validaciones de campos opcionales según el rol
            boolean tieneCentro = centroCol != null && !centroRaw.isEmpty() && !centroRaw.equals("—") && !centroRaw.equals("-");
            boolean tieneAsig = asigCol != null && !asigRaw.isEmpty() && !asigRaw.equals("—") && !asigRaw.equals("-");

            boolean esColaborador = (rolDisplay.contains("COLABORADOR")
                || rolDisplay.contains("TUTOR")
                || rolDisplay.contains("COORDINADOR"))
                && !rolDisplay.contains("ASIGNATURA");

            // 1. Un rol que no sea colaborador, tutor o coordinador no puede tener lugar de práctica (ej. ESTUDIANTE, PROFESOR_ASIGNATURA)
            if (tieneCentro && !esColaborador) {
                omitidos.add(Map.of("usuario", usuarioLabel, "motivo", "el rol " + rolDisplay + " no puede tener lugar de práctica."));
                continue;
            }

            CentroPractica centroEncontrado = null;
            if (tieneCentro) {
                centroEncontrado = centroPracticaRepository.findByNombre(centroRaw)
                    .or(() -> centroPracticaRepository.findAll().stream()
                        .filter(c -> c.getNombre() != null && c.getNombre().equalsIgnoreCase(centroRaw.trim()))
                        .findFirst())
                    .orElse(null);
                if (centroEncontrado == null) {
                    omitidos.add(Map.of("usuario", usuarioLabel, "motivo", "el lugar de práctica '" + centroRaw + "' no existe en el sistema."));
                    continue;
                }
            }

            // 2. Solo Estudiantes y Profesores pueden tener asignatura
            boolean puedeTenerAsig = "ESTUDIANTE".equalsIgnoreCase(rolDisplay)
                || rolDisplay.contains("PROFESOR")
                || rolDisplay.contains("DOCENTE");

            if (tieneAsig && !puedeTenerAsig) {
                omitidos.add(Map.of("usuario", usuarioLabel, "motivo", "el rol " + rolDisplay + " no puede tener asignatura asignada."));
                continue;
            }

            Asignatura asigEncontrada = null;
            if (tieneAsig) {
                asigEncontrada = asignaturaRepository.findByNombreIgnoreCase(asigRaw).orElse(null);
                if (asigEncontrada == null) {
                    omitidos.add(Map.of("usuario", usuarioLabel, "motivo", "la asignatura '" + asigRaw + "' no existe en el sistema."));
                    continue;
                }
            }

            // Todo válido: registrar en lote
            rutsVistosEnLote.add(cleanRut);
            correosVistosEnLote.add(lowerCorreo);

            // Crear entidad Usuario con estado activo (HABILITADO)
            String hash = passwordEncoder.encode(passRaw);
            Usuario nuevoUsuario = new Usuario(standardRut, nombreRaw.trim(), apellidoRaw.trim(), lowerCorreo, hash, "activo");
            nuevoUsuario.setRoles(new HashSet<>(Collections.singletonList(rolOpt.get())));
            Usuario guardado = usuarioRepository.save(nuevoUsuario);

            // Sincronizar en conjuntos locales para futuras filas del mismo lote
            rutsEnBd.add(cleanRut);
            correosEnBd.add(lowerCorreo);

            // Vincular Asignatura opcional si aplica
            if (asigEncontrada != null) {
                try {
                    if ("ESTUDIANTE".equalsIgnoreCase(rolDisplay)) {
                        estudianteRepository.save(new Estudiante(guardado, asigEncontrada, "ACTIVO"));
                    } else if (rolDisplay.contains("PROFESOR")) {
                        profesorRepository.save(new Profesor(guardado, asigEncontrada));
                    }
                } catch (Exception ignored) {
                }
            }

            // Vincular Lugar de Práctica opcional si aplica
            if (esColaborador) {
                try {
                    if (rolDisplay.contains("TUTOR")) {
                        Optional<TutorPractica> tutorOpt = tutorPracticaRepository.findByUsuarioRut(guardado.getRut());
                        if (tutorOpt.isEmpty()) {
                            tutorPracticaRepository.saveAndFlush(new TutorPractica(guardado.getNombre() + " " + guardado.getApellido(), guardado));
                        }
                    }

                    Optional<ProfesorColaborador> colabOpt = profesorColaboradorRepository.findByUsuarioRut(guardado.getRut());
                    ProfesorColaborador colab;
                    if (colabOpt.isPresent()) {
                        colab = colabOpt.get();
                        if (centroEncontrado != null) {
                            colab.setCentroPractica(centroEncontrado);
                        }
                        colab = profesorColaboradorRepository.saveAndFlush(colab);
                    } else {
                        colab = new ProfesorColaborador(guardado, centroEncontrado, "Pedagogía");
                        colab = profesorColaboradorRepository.saveAndFlush(colab);
                    }

                    if (centroEncontrado != null) {
                        sincronizarPracticasColaborador(guardado, colab, centroEncontrado, asigEncontrada);
                    }
                } catch (Exception ignored) {
                }
            }

            totalIngresados++;
        }

        try {
            workbook.close();
        } catch (Exception ignored) {
        }

        Map<String, Object> response = new HashMap<>();
        response.put("totalProcesados", totalProcesados);
        response.put("totalIngresados", totalIngresados);
        response.put("totalOmitidos", omitidos.size());
        response.put("omitidos", omitidos);
        response.put("message", "Importación finalizada");

        return ResponseEntity.ok(response);
    }

    private String getCellStringValue(Cell cell, DataFormatter formatter) {
        if (cell == null) {
            return "";
        }
        return formatter.formatCellValue(cell).trim();
    }
}