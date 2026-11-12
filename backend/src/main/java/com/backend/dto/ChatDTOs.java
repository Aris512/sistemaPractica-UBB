package com.backend.dto;

import java.time.LocalDateTime;

import com.backend.model.ChatConversacion;
import com.backend.model.ChatMensaje;

/** Objetos de entrada y salida de la API del chatbot (/api/chat). */
public final class ChatDTOs {

    private ChatDTOs() {
    }

    /**
     * preguntasUsadas / maxPreguntas: mensajes que el alumno ya escribió en la conversación y máximo permitido.
     * Al llegar al máximo la conversación queda cerrada (en las de revisión, hasta que suba una versión nueva).
     */
    public record ConversacionDTO(Long id, String titulo, LocalDateTime fechaCreacion, LocalDateTime fechaActualizacion,
                                  int preguntasUsadas, int maxPreguntas) {
        public static ConversacionDTO de(ChatConversacion c, int preguntasUsadas, int maxPreguntas) {
            return new ConversacionDTO(c.getIdConversacion(), c.getTitulo(), c.getFechaCreacion(), c.getFechaActualizacion(),
                    preguntasUsadas, maxPreguntas);
        }
    }

    /**
     * automatico: mensaje que la plataforma escribió en nombre del alumno (no cuenta como pregunta).
     * proveedor: servicio de IA que generó la respuesta (GROQ o GEMINI); nulo en los mensajes del alumno.
     */
    public record MensajeDTO(Long id, String rol, String contenido, LocalDateTime fecha, Integer orden, boolean automatico,
                             String proveedor) {
        public static MensajeDTO de(ChatMensaje m) {
            return new MensajeDTO(m.getIdMensaje(), m.getRol().name(), m.getContenido(), m.getFecha(), m.getOrden(),
                    m.isAutomatico(), m.getProveedor());
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
