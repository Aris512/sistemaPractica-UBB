package com.backend.service;

import org.springframework.http.HttpStatus;

/**
 * Error controlado del chatbot: lleva el estado HTTP, un código estable para el frontend
 * y un mensaje en español apto para mostrarse al usuario (nunca incluye claves ni contenido).
 */
public class ChatException extends RuntimeException {

    private final HttpStatus status;
    private final String codigo;
    private final Long reintentarEnSegundos;

    public ChatException(HttpStatus status, String codigo, String mensaje) {
        this(status, codigo, mensaje, null);
    }

    public ChatException(HttpStatus status, String codigo, String mensaje, Long reintentarEnSegundos) {
        super(mensaje);
        this.status = status;
        this.codigo = codigo;
        this.reintentarEnSegundos = reintentarEnSegundos;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getCodigo() {
        return codigo;
    }

    public Long getReintentarEnSegundos() {
        return reintentarEnSegundos;
    }
}
