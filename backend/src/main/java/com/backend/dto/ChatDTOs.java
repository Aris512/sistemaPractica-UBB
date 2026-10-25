package com.backend.dto;

import java.time.LocalDateTime;

import com.backend.model.ChatConversacion;
import com.backend.model.ChatMensaje;

/** Objetos de entrada y salida de la API del chatbot (/api/chat). */
public final class ChatDTOs {

    private ChatDTOs() {
    }

    public record ConversacionDTO(Long id, String titulo, LocalDateTime fechaCreacion, LocalDateTime fechaActualizacion) {
        public static ConversacionDTO de(ChatConversacion c) {
            return new ConversacionDTO(c.getIdConversacion(), c.getTitulo(), c.getFechaCreacion(), c.getFechaActualizacion());
        }
    }

    public record MensajeDTO(Long id, String rol, String contenido, LocalDateTime fecha, Integer orden) {
        public static MensajeDTO de(ChatMensaje m) {
            return new MensajeDTO(m.getIdMensaje(), m.getRol().name(), m.getContenido(), m.getFecha(), m.getOrden());
        }
    }

    /** Resultado de enviar un mensaje: ambos mensajes se guardan juntos solo si Groq respondió. */
    public record IntercambioDTO(ConversacionDTO conversacion, MensajeDTO mensajeUsuario, MensajeDTO mensajeAsistente) {
    }

    public record TituloRequest(String titulo) {
    }

    public record MensajeRequest(String contenido) {
    }
}
