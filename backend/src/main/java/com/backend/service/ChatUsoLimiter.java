package com.backend.service;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

/**
 * Control en memoria del uso del chatbot por usuario:
 * - una sola solicitud a Groq en curso por usuario (evita envíos duplicados o en paralelo);
 * - un máximo de solicitudes por minuto (ventana deslizante, cuenta también los intentos fallidos).
 * El límite diario se calcula en ChatService a partir de los mensajes guardados en MySQL.
 * Al ser en memoria, se reinicia con el servidor y no se comparte entre varias instancias.
 */
@Component
public class ChatUsoLimiter {

    private static final long VENTANA_MS = 60_000L;

    private final int maxPorMinuto;
    private final Set<String> enCurso = ConcurrentHashMap.newKeySet();
    private final Map<String, Deque<Long>> intentos = new ConcurrentHashMap<>();

    public ChatUsoLimiter(@Value("${chat.limite-mensajes-por-minuto:10}") int maxPorMinuto) {
        this.maxPorMinuto = maxPorMinuto;
    }

    /** Reserva el turno del usuario o lanza ChatException si debe esperar. Liberar siempre con {@link #liberar}. */
    public void adquirir(String rut) {
        if (!enCurso.add(rut)) {
            throw new ChatException(HttpStatus.CONFLICT, "CHAT_RESPUESTA_EN_CURSO",
                    "Ya hay una respuesta en curso. Espera a que termine antes de enviar otro mensaje.");
        }

        long ahora = System.currentTimeMillis();
        Deque<Long> ventana = intentos.computeIfAbsent(rut, k -> new ArrayDeque<>());
        synchronized (ventana) {
            while (!ventana.isEmpty() && ahora - ventana.peekFirst() >= VENTANA_MS) {
                ventana.pollFirst();
            }
            if (ventana.size() >= maxPorMinuto) {
                long esperar = (long) Math.ceil((VENTANA_MS - (ahora - ventana.peekFirst())) / 1000.0);
                enCurso.remove(rut);
                throw new ChatException(HttpStatus.TOO_MANY_REQUESTS, "CHAT_LIMITE_MINUTO",
                        "Enviaste demasiados mensajes en poco tiempo. Espera " + esperar + " s e inténtalo de nuevo.",
                        esperar);
            }
            ventana.addLast(ahora);
        }
    }

    public void liberar(String rut) {
        enCurso.remove(rut);
    }
}
