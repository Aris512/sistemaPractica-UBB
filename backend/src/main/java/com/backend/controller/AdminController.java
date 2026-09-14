package com.backend.controller;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin")
public class AdminController {

    @GetMapping(produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> getAdminDashboard(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authHeader,
            @CookieValue(value = "ADMIN_SESSION", required = false) String adminSession,
            @CookieValue(value = "ADMIN_CHALLENGE", required = false) String adminChallenge) {

        // 1. Si ya tiene sesión administrativa activa, mostrar el panel
        if ("active".equals(adminSession)) {
            return ResponseEntity.ok(renderDashboardHtml());
        }

        // 2. Si vino con header Authorization y tiene el flag de desafío previo
        if (authHeader != null && authHeader.startsWith("Basic ") && "challenge_sent".equals(adminChallenge)) {
            String base64Credentials = authHeader.substring(6).trim();
            byte[] decodedBytes;
            try {
                decodedBytes = Base64.getDecoder().decode(base64Credentials);
            } catch (IllegalArgumentException e) {
                decodedBytes = new byte[0];
            }
            String credentials = new String(decodedBytes, StandardCharsets.UTF_8);
            String[] values = credentials.split(":", 2);

            if (values.length == 2 && "admin".equals(values[0]) && "admin123".equals(values[1])) {
                // Credenciales correctas tras responder al popup: crear sesión y limpiar desafío
                ResponseCookie sessionCookie = ResponseCookie.from("ADMIN_SESSION", "active")
                    .path("/")
                    .httpOnly(true)
                    .sameSite("Lax")
                    .build();

                ResponseCookie clearChallenge = ResponseCookie.from("ADMIN_CHALLENGE", "")
                    .path("/")
                    .maxAge(0)
                    .httpOnly(true)
                    .sameSite("Lax")
                    .build();

                return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, sessionCookie.toString())
                    .header(HttpHeaders.SET_COOKIE, clearChallenge.toString())
                    .body(renderDashboardHtml());
            }
        }

        // 3. No tiene sesión o credenciales inválidas: emitir 401 con WWW-Authenticate para abrir el popup nativo
        ResponseCookie challengeCookie = ResponseCookie.from("ADMIN_CHALLENGE", "challenge_sent")
            .path("/")
            .httpOnly(true)
            .sameSite("Lax")
            .build();

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .header(HttpHeaders.WWW_AUTHENTICATE, "Basic realm=\"Admin Area\"")
            .header(HttpHeaders.SET_COOKIE, challengeCookie.toString())
            .body("<h1>401 Unauthorized</h1><p>Se requieren credenciales de administrador.</p>");
    }

    @GetMapping("/logout")
    public ResponseEntity<Void> logout() {
        // Al cerrar sesión: eliminamos cookies y redirigimos con 302 Found (sin devolver 401, por lo que NO salta ningún popup)
        ResponseCookie deleteSession = ResponseCookie.from("ADMIN_SESSION", "")
            .path("/")
            .maxAge(0)
            .httpOnly(true)
            .sameSite("Lax")
            .build();

        ResponseCookie deleteChallenge = ResponseCookie.from("ADMIN_CHALLENGE", "")
            .path("/")
            .maxAge(0)
            .httpOnly(true)
            .sameSite("Lax")
            .build();

        return ResponseEntity.status(HttpStatus.FOUND)
            .header(HttpHeaders.LOCATION, "/")
            .header(HttpHeaders.SET_COOKIE, deleteSession.toString())
            .header(HttpHeaders.SET_COOKIE, deleteChallenge.toString())
            .build();
    }

    private String renderDashboardHtml() {
        return """
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Panel de Administración</title>
                <style>
                    * { box-sizing: border-box; margin: 0; padding: 0; }
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                        background: #0f172a;
                        color: #f8fafc;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 100vh;
                    }
                    .container {
                        background: #1e293b;
                        border: 1px solid #334155;
                        border-radius: 16px;
                        padding: 2.5rem;
                        max-width: 520px;
                        width: 90%;
                        text-align: center;
                        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
                    }
                    .badge {
                        display: inline-block;
                        background: #0284c7;
                        color: #ffffff;
                        font-size: 0.75rem;
                        font-weight: 700;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                        padding: 0.35rem 0.85rem;
                        border-radius: 9999px;
                        margin-bottom: 1.25rem;
                    }
                    h1 {
                        font-size: 1.75rem;
                        margin-bottom: 0.75rem;
                        color: #38bdf8;
                    }
                    p {
                        color: #94a3b8;
                        line-height: 1.6;
                        font-size: 0.95rem;
                    }
                    .details {
                        margin-top: 1.5rem;
                        padding: 1rem;
                        background: #0f172a;
                        border-radius: 8px;
                        border: 1px solid #1e293b;
                        font-family: monospace;
                        font-size: 0.85rem;
                        color: #a5f3fc;
                    }
                    .btn-logout {
                        margin-top: 1.75rem;
                        display: inline-block;
                        background: #dc2626;
                        color: white;
                        padding: 0.6rem 1.4rem;
                        border-radius: 8px;
                        text-decoration: none;
                        font-weight: 600;
                        font-size: 0.9rem;
                        transition: background 0.2s;
                    }
                    .btn-logout:hover {
                        background: #b91c1c;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <span class="badge">HTTP Basic Authentication</span>
                    <h1>Área Administrativa</h1>
                    <p>Has ingresado exitosamente con credenciales verificadas directamente por <strong>Spring Security</strong>.</p>
                    <div class="details">
                        Usuario autenticado: <strong>admin</strong><br>
                        Estado: 200 OK
                    </div>
                    <a href="/admin/logout" class="btn-logout">Cerrar Sesión Administrativa</a>
                </div>
            </body>
            </html>
            """;
    }
}
