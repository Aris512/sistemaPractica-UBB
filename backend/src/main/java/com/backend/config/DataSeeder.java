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

import com.backend.model.Rol;
import com.backend.model.Usuario;
import com.backend.repository.RolRepository;
import com.backend.repository.UsuarioRepository;

@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataSeeder.class);

    private final RolRepository rolRepository;
    private final UsuarioRepository usuarioRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public DataSeeder(RolRepository rolRepository, UsuarioRepository usuarioRepository) {
        this.rolRepository = rolRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        logger.info("=================================================");
        logger.info("Iniciando DataSeeder de datos iniciales...");
        logger.info("=================================================");

        seedRoles();
        seedUsuarios();

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

    private void seedUsuarios() {
        String contrasenaHasheada = passwordEncoder.encode("123456");

        // Diferentes RUTs chilenos válidos calculados mediante algoritmo Módulo 11
        List<UsuarioInfo> usuariosIniciales = List.of(
            new UsuarioInfo("12345678-5", "Estudiante", "Prueba", "estudiante@test.com", "ESTUDIANTE"),
            new UsuarioInfo("11111111-1", "Profesor", "Asignatura", "profesor@test.com", "PROFESOR_ASIGNATURA"),
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

    private record RolInfo(String nombre, String descripcion) {}
    private record UsuarioInfo(String rut, String nombre, String apellido, String correo, String rol) {}
}
