package com.backend.service;

import java.util.List;

/** Un servicio de IA que responde un chat (Groq, Gemini…). Los errores llegan como ChatException con código IA_*. */
public interface ProveedorChatIA {

    /** Nombre estable del proveedor (GROQ, GEMINI): se guarda en cada respuesta y aparece en los registros. */
    String nombre();

    boolean estaConfigurado();

    String completar(List<MensajeIA> mensajes);
}
