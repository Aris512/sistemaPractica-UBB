package com.backend.controller;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

/**
 * Devuelve como JSON { message, status } los errores previstos de las pautas (p. ej. "No le corresponde
 * esta pauta"), que el frontend muestra al usuario. Solo aplica a PautaController: así no hace falta
 * server.error.include-message=always, que expondría el mensaje de cualquier excepción de la API.
 */
@RestControllerAdvice(assignableTypes = PautaController.class)
@Order(Ordered.HIGHEST_PRECEDENCE)
public class PautaExceptionHandler {

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> manejar(ResponseStatusException e) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("message", e.getReason() != null ? e.getReason() : "No se pudo completar la operación.");
        body.put("status", e.getStatusCode().value());
        return ResponseEntity.status(e.getStatusCode()).body(body);
    }
}
