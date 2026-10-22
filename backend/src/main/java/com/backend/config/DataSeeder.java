package com.backend.config;

import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.backend.model.Asignatura;
import com.backend.model.Rol;
import com.backend.model.Usuario;
import com.backend.repository.AsignaturaRepository;
import com.backend.repository.RolRepository;
import com.backend.repository.UsuarioRepository;
import com.backend.util.RutUtils;

/**
 * Datos mínimos para que el sistema arranque: roles, permisos, asignaturas y un usuario
 * administrador. No crea estudiantes, profesores, prácticas, documentos, evaluaciones ni otros
 * datos de ejemplo.
 *
 * Los permisos y su asignación por rol se definen de forma fija en {@link PermisosCatalogo}.
 * El administrador se toma del archivo .env (o de las variables de entorno del sistema):
 * SEED_ADMIN_RUT y SEED_ADMIN_PASSWORD son obligatorias; SEED_ADMIN_NOMBRE, SEED_ADMIN_APELLIDO y
 * SEED_ADMIN_CORREO son opcionales.
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataSeeder.class);

    private static final String ROL_ADMINISTRADOR = "ADMINISTRADOR";

    private final RolRepository rolRepository;
    private final UsuarioRepository usuarioRepository;
    private final AsignaturaRepository asignaturaRepository;
    private final PermisosCatalogo permisosCatalogo;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    private final String adminRut;
    private final String adminPassword;
    private final String adminNombre;
    private final String adminApellido;
    private final String adminCorreo;

    public DataSeeder(RolRepository rolRepository,
                      UsuarioRepository usuarioRepository,
                      AsignaturaRepository asignaturaRepository,
                      PermisosCatalogo permisosCatalogo,
                      @Value("${SEED_ADMIN_RUT:}") String adminRut,
                      @Value("${SEED_ADMIN_PASSWORD:}") String adminPassword,
                      @Value("${SEED_ADMIN_NOMBRE:Administrador}") String adminNombre,
                      @Value("${SEED_ADMIN_APELLIDO:Sistema}") String adminApellido,
                      @Value("${SEED_ADMIN_CORREO:admin@sistema.local}") String adminCorreo) {
        this.rolRepository = rolRepository;
        this.usuarioRepository = usuarioRepository;
        this.asignaturaRepository = asignaturaRepository;
        this.permisosCatalogo = permisosCatalogo;
        this.adminRut = adminRut;
        this.adminPassword = adminPassword;
        this.adminNombre = adminNombre;
        this.adminApellido = adminApellido;
        this.adminCorreo = adminCorreo;
    }

    @Override
    @Transactional
    public void run(String... args) {
        logger.info("=================================================");
        logger.info("Iniciando DataSeeder de datos iniciales...");
        logger.info("=================================================");

        seedRoles();
        permisosCatalogo.sincronizar();
        seedAsignaturas();
        seedUsuario();

        logger.info("=================================================");
        logger.info("DataSeeder finalizado con éxito.");
        logger.info("=================================================");
    }

    private void seedRoles() {
        List<RolInfo> rolesIniciales = List.of(
            new RolInfo("ESTUDIANTE", "Rol para estudiantes que realizan prácticas"),
            new RolInfo("PROFESOR_ASIGNATURA", "Rol para profesores a cargo de asignaturas"),
            new RolInfo("PROFESOR_COLABORADOR", "Rol para profesores colaboradores en centros de práctica"),
            new RolInfo("TUTOR_PRACTICA", "Rol para tutores de práctica profesional"),
            new RolInfo("COORDINADOR", "Rol para coordinadores de práctica"),
            new RolInfo(ROL_ADMINISTRADOR, "rol administrador")
        );

        for (RolInfo info : rolesIniciales) {
            if (!rolRepository.existsByNombre(info.nombre())) {
                Rol nuevoRol = new Rol(info.nombre(), info.descripcion());
                rolRepository.save(nuevoRol);
                logger.info("Rol creado: {}", info.nombre());
            } else {
                logger.info("Rol '{}' ya existe. Omitiendo creación.", info.nombre());
            }
        }
    }

    private void seedAsignaturas() {
        List<AsignaturaInfo> asignaturasIniciales = List.of(
            new AsignaturaInfo("Curriculum Educacional", "Asignatura del área curricular pedagógica", "4"),
            new AsignaturaInfo("Ambientes de Aprendizaje", "Gestión y diseño de ambientes de aprendizaje", "5"),
            new AsignaturaInfo("Trabajo Colaborativo en Aula", "Estrategias de trabajo colaborativo en aula", "6"),
            new AsignaturaInfo("Investigación en Aula", "Metodologías de investigación aplicadas al aula", "7"),
            new AsignaturaInfo("Práctica Pedagógica", "Práctica pedagógica en centros educativos", "8"),
            new AsignaturaInfo("Práctica Profesional", "Práctica profesional terminal de la carrera", "9")
        );

        for (AsignaturaInfo info : asignaturasIniciales) {
            if (!asignaturaRepository.existsByNombreIgnoreCase(info.nombre())) {
                Asignatura nuevaAsignatura = new Asignatura(info.nombre(), info.descripcion(), info.semestre());
                asignaturaRepository.save(nuevaAsignatura);
                logger.info("Asignatura creada: {} (Semestre {})", info.nombre(), info.semestre());
            } else {
                logger.info("Asignatura '{}' ya existe. Omitiendo creación.", info.nombre());
            }
        }
    }

    /**
     * Crea el usuario administrador a partir de SEED_ADMIN_RUT y SEED_ADMIN_PASSWORD. Si falta
     * alguna de las dos no se crea ningún usuario y no se usa una contraseña por defecto. Si el
     * usuario ya existe solo se le asegura el rol; nunca se le cambia la contraseña.
     */
    private void seedUsuario() {
        if (adminRut.isBlank() || adminPassword.isBlank()) {
            logger.warn("SEED_ADMIN_RUT y SEED_ADMIN_PASSWORD no están definidas en el .env: no se crea el usuario administrador.");
            return;
        }
        if (!RutUtils.isValid(adminRut)) {
            logger.error("SEED_ADMIN_RUT no es un RUT válido: no se crea el usuario administrador.");
            return;
        }

        String rut = RutUtils.formatStandard(adminRut);
        Rol rolAdministrador = rolRepository.findByNombre(ROL_ADMINISTRADOR)
            .orElseThrow(() -> new IllegalStateException("Rol no encontrado: " + ROL_ADMINISTRADOR));

        Optional<Usuario> usuarioOpt = usuarioRepository.findByRut(rut);
        if (usuarioOpt.isEmpty()) {
            Usuario nuevoUsuario = new Usuario(
                rut,
                adminNombre,
                adminApellido,
                adminCorreo,
                passwordEncoder.encode(adminPassword)
            );
            nuevoUsuario.setRoles(new HashSet<>(Collections.singletonList(rolAdministrador)));
            usuarioRepository.save(nuevoUsuario);
            logger.info("Usuario administrador creado: RUT {}", rut);
            return;
        }

        Usuario usuarioExistente = usuarioOpt.get();
        if (usuarioExistente.getRoles() == null) {
            usuarioExistente.setRoles(new HashSet<>());
        }
        boolean yaEsAdministrador = usuarioExistente.getRoles().stream()
            .anyMatch(r -> r.getNombre().equalsIgnoreCase(ROL_ADMINISTRADOR));
        if (yaEsAdministrador) {
            logger.info("Usuario con RUT '{}' ya existe y ya es administrador. Omitiendo.", rut);
        } else {
            usuarioExistente.getRoles().add(rolAdministrador);
            usuarioRepository.save(usuarioExistente);
            logger.info("Rol {} asignado al usuario existente con RUT: {}", ROL_ADMINISTRADOR, rut);
        }
    }

    private record RolInfo(String nombre, String descripcion) {}
    private record AsignaturaInfo(String nombre, String descripcion, String semestre) {}
}
