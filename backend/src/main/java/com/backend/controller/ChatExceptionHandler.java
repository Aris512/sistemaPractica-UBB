package com.backend.controller;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import com.backend.service.ChatException;

/**
 * Traduce los errores del chatbot a JSON { error, codigo, reintentarEnSegundos? }.
 * Solo aplica al chat y a la retroalimentación con IA para no alterar el comportamiento del resto de la API.
 */
@RestControllerAdvice(assignableTypes = { ChatController.class, RetroalimentacionIAController.class })
@Order(Ordered.HIGHEST_PRECEDENCE)
public class ChatExceptionHandler {

    private static final Logger logger = Logger.getLogger(ChatExceptionHandler.class.getName());

    @ExceptionHandler(ChatException.class)
    public ResponseEntity<Map<String, Object>> manejarChat(ChatException e) {
        Map<String, Object> body = cuerpo(e.getMessage(), e.getCodigo());
        ResponseEntity.BodyBuilder respuesta = ResponseEntity.status(e.getStatus());
        if (e.getReintentarEnSegundos() != null) {
            body.put("reintentarEnSegundos", e.getReintentarEnSegundos());
            respuesta.header(HttpHeaders.RETRY_AFTER, String.valueOf(e.getReintentarEnSegundos()));
        }
        return respuesta.body(body);
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class})
    public ResponseEntity<Map<String, Object>> manejarSolicitudInvalida(Exception e) {
        return ResponseEntity.badRequest().body(cuerpo("La solicitud no tiene un formato válido.", "CHAT_SOLICITUD_INVALIDA"));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> manejarInesperado(Exception e) {
        // Se registra solo el tipo de error: el mensaje podría contener datos de la conversación
        logger.log(Level.SEVERE, "[Chat] Error inesperado: " + e.getClass().getName());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(cuerpo("Ocurrió un error inesperado en el asistente de IA. Inténtalo nuevamente.", "CHAT_ERROR_INTERNO"));
    }

    private Map<String, Object> cuerpo(String mensaje, String codigo) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("error", mensaje);
        body.put("codigo", codigo);
        return body;
    }
}
