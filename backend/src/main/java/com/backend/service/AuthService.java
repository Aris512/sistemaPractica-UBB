package com.backend.service;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.backend.dto.LoginRequest;
import com.backend.dto.LoginResponse;
import com.backend.model.Rol;
import com.backend.model.Usuario;
import com.backend.repository.UsuarioRepository;
import com.backend.util.RutUtils;

@Service
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AuthService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @Transactional(readOnly = true)
    public LoginResponse authenticate(LoginRequest request) {
        if (request == null || request.getRut() == null || request.getRut().isBlank()) {
            return LoginResponse.error("El RUT es requerido para iniciar sesión");
        }

        if (request.getPassword() == null || request.getPassword().isBlank()) {
            return LoginResponse.error("La contraseña es requerida");
        }

        String rawRut = request.getRut().trim();

        // Validación de formato y dígito verificador según Módulo 11
        if (!RutUtils.isValid(rawRut)) {
            return LoginResponse.error("El RUT ingresado no es válido. Verifique el formato y dígito verificador (ej: 12345678-9)");
        }

        // Búsqueda en formato estándar (ej: 12345678-9) o variantes
        String standardRut = RutUtils.formatStandard(rawRut);
        Optional<Usuario> usuarioOpt = usuarioRepository.findByRut(standardRut);

        if (usuarioOpt.isEmpty()) {
            // Intentar con RUT limpio sin guión por tolerancia
            usuarioOpt = usuarioRepository.findByRut(RutUtils.clean(rawRut));
        }

        if (usuarioOpt.isEmpty()) {
            // Intentar con RUT tal cual se envió
            usuarioOpt = usuarioRepository.findByRut(rawRut);
        }

        if (usuarioOpt.isEmpty()) {
            return LoginResponse.error("Credenciales inválidas: el RUT no se encuentra registrado en el sistema");
        }

        Usuario usuario = usuarioOpt.get();
        String storedPassword = usuario.getContrasenaEncriptada();
        boolean passwordMatches = false;

        if (storedPassword != null) {
            // Comprobar hash BCrypt
            try {
                passwordMatches = passwordEncoder.matches(request.getPassword(), storedPassword);
            } catch (Exception ignored) {
                // Fallback a texto plano si no fuera un hash BCrypt válido
            }

            // Fallback para contraseñas sin hashear
            if (!passwordMatches && request.getPassword().equals(storedPassword)) {
                passwordMatches = true;
            }
        }

        if (!passwordMatches) {
            return LoginResponse.error("Credenciales inválidas: contraseña incorrecta");
        }

        if (!usuario.isActivo()) {
            return LoginResponse.error("Acceso denegado: su cuenta de usuario se encuentra inactiva. Contacte al administrador.");
        }

        Set<String> roles = new HashSet<>();
        if (usuario.getRoles() != null) {
            for (Rol rol : usuario.getRoles()) {
                if (rol != null && rol.getNombre() != null) {
                    roles.add(rol.getNombre());
                }
            }
        }

        return LoginResponse.success(
            usuario.getRut(),
            usuario.getNombre(),
            usuario.getApellido(),
            usuario.getCorreo(),
            roles,
            usuario.isActivo()
        );
    }
}
