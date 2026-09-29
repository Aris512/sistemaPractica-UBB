package com.backend.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.backend.dto.LoginRequest;
import com.backend.dto.LoginResponse;
import com.backend.service.AuthService;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;
    private final UserDetailsService userDetailsService;
    private final PasswordEncoder passwordEncoder;

    public AuthController(AuthService authService,
                          UserDetailsService userDetailsService,
                          PasswordEncoder passwordEncoder) {
        this.authService = authService;
        this.userDetailsService = userDetailsService;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        LoginResponse response = authService.authenticate(request);
        if (!response.isSuccess()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
        return ResponseEntity.ok(response);
    }

    /**
     * Endpoint de autenticación para el panel administrativo.
     * Ruta pública (/api/auth/...) que valida credenciales contra el InMemoryUserDetailsManager
     * configurado en SecurityConfig con las variables ADMIN_BASIC_USERNAME / ADMIN_BASIC_PASSWORD del .env.
     *
     * El frontend llama este endpoint desde LoginForm (context="admin") para obtener autorización
     * sin triggear el popup nativo del navegador. Si las credenciales son correctas, el frontend
     * construye el header Authorization: Basic y lo almacena para llamadas posteriores a /admin/**.
     */
    @PostMapping("/admin-login")
    public ResponseEntity<Map<String, Object>> adminLogin(@RequestBody Map<String, String> body) {
        String username = body.getOrDefault("username", "").trim();
        String password = body.getOrDefault("password", "");

        if (username.isEmpty() || password.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                Map.of("success", false, "message", "Usuario y contraseña son requeridos.")
            );
        }

        try {
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);
            if (passwordEncoder.matches(password, userDetails.getPassword())) {
                return ResponseEntity.ok(Map.of("success", true, "message", "Autenticación exitosa."));
            }
        } catch (Exception e) {
            // Usuario no encontrado: se deja caer al error genérico para no revelar información
        }

        // Mensaje genérico: no indica si el usuario existe o si solo la contraseña es incorrecta
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
            Map.of("success", false, "message", "Usuario o contraseña incorrectos.")
        );
    }
}
