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

@Service
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AuthService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @Transactional(readOnly = true)
    public LoginResponse authenticate(LoginRequest request) {
        if (request == null || request.getEmail() == null || request.getEmail().isBlank()) {
            return LoginResponse.error("El correo electrónico es requerido");
        }

        if (request.getPassword() == null || request.getPassword().isBlank()) {
            return LoginResponse.error("La contraseña es requerida");
        }

        String email = request.getEmail().trim();
        Optional<Usuario> usuarioOpt = usuarioRepository.findByCorreo(email);

        if (usuarioOpt.isEmpty()) {
            return LoginResponse.error("Credenciales inválidas: usuario no encontrado");
        }

        Usuario usuario = usuarioOpt.get();
        String storedPassword = usuario.getContrasenaEncriptada();
        boolean passwordMatches = false;

        if (storedPassword != null) {
            // Check BCrypt hash match
            try {
                passwordMatches = passwordEncoder.matches(request.getPassword(), storedPassword);
            } catch (Exception ignored) {
                // If not valid bcrypt pattern, fallback to plain text check
            }

            // Fallback for plain-text storage if any
            if (!passwordMatches && request.getPassword().equals(storedPassword)) {
                passwordMatches = true;
            }
        }

        if (!passwordMatches) {
            return LoginResponse.error("Credenciales inválidas: contraseña incorrecta");
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
            usuario.getIdUsuario(),
            usuario.getNombre(),
            usuario.getApellido(),
            usuario.getCorreo(),
            roles
        );
    }
}
