package com.backend.config;

import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

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

@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataSeeder.class);

    private final RolRepository rolRepository;
    private final UsuarioRepository usuarioRepository;
    private final AsignaturaRepository asignaturaRepository;
    private final EstudianteRepository estudianteRepository;
    private final ProfesorRepository profesorRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public DataSeeder(RolRepository rolRepository,
                      UsuarioRepository usuarioRepository,
                      AsignaturaRepository asignaturaRepository,
                      EstudianteRepository estudianteRepository,
                      ProfesorRepository profesorRepository) {
        this.rolRepository = rolRepository;
        this.usuarioRepository = usuarioRepository;
        this.asignaturaRepository = asignaturaRepository;
        this.estudianteRepository = estudianteRepository;
        this.profesorRepository = profesorRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        logger.info("=================================================");
        logger.info("Iniciando DataSeeder de datos iniciales...");
        logger.info("=================================================");

        seedRoles();
        seedAsignaturas();
        seedUsuarios();
        seedEstudiantesYProfesores();

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
            new RolInfo("COORDINADOR", "Rol para coordinadores de práctica")
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

    private void seedUsuarios() {
        String contrasenaHasheada = passwordEncoder.encode("123456");

        // Diferentes RUTs chilenos válidos calculados mediante algoritmo Módulo 11
        List<UsuarioInfo> usuariosIniciales = List.of(
            new UsuarioInfo("12345678-5", "Estudiante", "Prueba", "estudiante@test.com", "ESTUDIANTE"),
            new UsuarioInfo("15432109-8", "Camila", "Valenzuela", "camila.valenzuela@test.com", "ESTUDIANTE"),
            new UsuarioInfo("16543210-K", "Matías", "Morales", "matias.morales@test.com", "ESTUDIANTE"),
            new UsuarioInfo("17654321-3", "Valentina", "Rojas", "valentina.rojas@test.com", "ESTUDIANTE"),
            new UsuarioInfo("19876543-0", "Diego", "Castro", "diego.castro@test.com", "ESTUDIANTE"),
            new UsuarioInfo("14234567-6", "Sofía", "Herrera", "sofia.herrera@test.com", "ESTUDIANTE"),
            new UsuarioInfo("11111111-1", "Profesor", "Asignatura", "profesor@test.com", "PROFESOR_ASIGNATURA"),
            new UsuarioInfo("13876543-1", "Andrés", "Muñoz", "andres.munoz@test.com", "PROFESOR_ASIGNATURA"),
            new UsuarioInfo("10987654-2", "Patricia", "Navarro", "patricia.navarro@test.com", "PROFESOR_ASIGNATURA"),
            new UsuarioInfo("10000013-K", "Profesor", "Colaborador", "colaborador@test.com", "PROFESOR_COLABORADOR"),
            new UsuarioInfo("18765432-7", "Tutor", "Practica", "tutor@test.com", "TUTOR_PRACTICA"),
            new UsuarioInfo("20123456-5", "Coordinador", "General", "coordinador@test.com", "COORDINADOR")
        );

        for (UsuarioInfo info : usuariosIniciales) {
            Optional<Usuario> usuarioOpt = usuarioRepository.findByRut(info.rut());
            Rol rolAsociado = rolRepository.findByNombre(info.rol())
                .orElseThrow(() -> new IllegalStateException("Rol no encontrado: " + info.rol()));

            if (usuarioOpt.isEmpty()) {
                Usuario nuevoUsuario = new Usuario(
                    info.rut(),
                    info.nombre(),
                    info.apellido(),
                    info.correo(),
                    contrasenaHasheada
                );
                nuevoUsuario.setRoles(new HashSet<>(Collections.singletonList(rolAsociado)));
                usuarioRepository.save(nuevoUsuario);
                logger.info("Usuario creado: RUT {} ({}) con rol {}", info.rut(), info.correo(), info.rol());
            } else {
                Usuario usuarioExistente = usuarioOpt.get();
                if (usuarioExistente.getRoles() == null) {
                    usuarioExistente.setRoles(new HashSet<>());
                }

                boolean yaTieneRol = usuarioExistente.getRoles().stream()
                    .anyMatch(r -> r.getNombre().equalsIgnoreCase(info.rol()));

                if (!yaTieneRol) {
                    usuarioExistente.getRoles().add(rolAsociado);
                    usuarioRepository.save(usuarioExistente);
                    logger.info("Rol {} asignado al usuario existente con RUT: {}", info.rol(), info.rut());
                } else {
                    logger.info("Usuario con RUT '{}' ya existe y ya tiene asignado el rol '{}'. Omitiendo.", info.rut(), info.rol());
                }
            }
        }
    }

    private void seedEstudiantesYProfesores() {
        // Relación de estudiantes con asignaturas
        List<EstudianteSeedInfo> estudiantesInfo = List.of(
            new EstudianteSeedInfo("12345678-5", "Práctica Pedagógica", "ACTIVO"),
            new EstudianteSeedInfo("15432109-8", "Curriculum Educacional", "ACTIVO"),
            new EstudianteSeedInfo("16543210-K", "Ambientes de Aprendizaje", "ACTIVO"),
            new EstudianteSeedInfo("17654321-3", "Trabajo Colaborativo en Aula", "ACTIVO"),
            new EstudianteSeedInfo("19876543-0", "Investigación en Aula", "ACTIVO"),
            new EstudianteSeedInfo("14234567-6", "Práctica Profesional", "ACTIVO")
        );

        for (EstudianteSeedInfo info : estudiantesInfo) {
            Optional<Usuario> usuarioOpt = usuarioRepository.findByRut(info.rut());
            Optional<Asignatura> asignaturaOpt = asignaturaRepository.findByNombreIgnoreCase(info.asignaturaNombre());

            if (usuarioOpt.isPresent() && asignaturaOpt.isPresent()) {
                Usuario usuario = usuarioOpt.get();
                Asignatura asignatura = asignaturaOpt.get();

                Optional<Estudiante> estudianteExistente = estudianteRepository.findByUsuario(usuario);
                if (estudianteExistente.isEmpty()) {
                    Estudiante nuevoEstudiante = new Estudiante(usuario, asignatura, info.estado());
                    estudianteRepository.save(nuevoEstudiante);
                    logger.info("Estudiante vinculado: RUT {} con Asignatura '{}'", info.rut(), asignatura.getNombre());
                } else {
                    Estudiante est = estudianteExistente.get();
                    if (est.getAsignatura() == null) {
                        est.setAsignatura(asignatura);
                        estudianteRepository.save(est);
                        logger.info("Estudiante RUT {} actualizado con Asignatura '{}'", info.rut(), asignatura.getNombre());
                    }
                }
            }
        }

        // Relación de profesores con asignaturas
        List<ProfesorSeedInfo> profesoresInfo = List.of(
            new ProfesorSeedInfo("11111111-1", "Práctica Pedagógica"),
            new ProfesorSeedInfo("13876543-1", "Curriculum Educacional"),
            new ProfesorSeedInfo("10987654-2", "Trabajo Colaborativo en Aula")
        );

        for (ProfesorSeedInfo info : profesoresInfo) {
            Optional<Usuario> usuarioOpt = usuarioRepository.findByRut(info.rut());
            Optional<Asignatura> asignaturaOpt = asignaturaRepository.findByNombreIgnoreCase(info.asignaturaNombre());

            if (usuarioOpt.isPresent() && asignaturaOpt.isPresent()) {
                Usuario usuario = usuarioOpt.get();
                Asignatura asignatura = asignaturaOpt.get();

                Optional<Profesor> profesorExistente = profesorRepository.findByUsuario(usuario);
                if (profesorExistente.isEmpty()) {
                    Profesor nuevoProfesor = new Profesor(usuario, asignatura);
                    if (nuevoProfesor.getAsignaturas() == null) {
                        nuevoProfesor.setAsignaturas(new HashSet<>());
                    }
                    nuevoProfesor.getAsignaturas().add(asignatura);
                    profesorRepository.save(nuevoProfesor);
                    logger.info("Profesor vinculado: RUT {} con Asignatura '{}'", info.rut(), asignatura.getNombre());
                } else {
                    Profesor prof = profesorExistente.get();
                    boolean modificado = false;
                    if (prof.getAsignatura() == null) {
                        prof.setAsignatura(asignatura);
                        modificado = true;
                    }
                    if (prof.getAsignaturas() == null) {
                        prof.setAsignaturas(new HashSet<>());
                    }
                    if (!prof.getAsignaturas().contains(asignatura)) {
                        prof.getAsignaturas().add(asignatura);
                        modificado = true;
                    }
                    if (modificado) {
                        profesorRepository.save(prof);
                        logger.info("Profesor RUT {} actualizado con Asignatura '{}'", info.rut(), asignatura.getNombre());
                    }
                }
            }
        }
    }

    private record RolInfo(String nombre, String descripcion) {}
    private record AsignaturaInfo(String nombre, String descripcion, String semestre) {}
    private record UsuarioInfo(String rut, String nombre, String apellido, String correo, String rol) {}
    private record EstudianteSeedInfo(String rut, String asignaturaNombre, String estado) {}
    private record ProfesorSeedInfo(String rut, String asignaturaNombre) {}
}
