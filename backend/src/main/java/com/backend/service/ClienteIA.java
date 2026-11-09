package com.backend.service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

/**
 * Punto único por el que el chat consulta a la IA. Usa Groq y, si Groq se satura (límite de uso, solicitud que
 * supera sus tokens por minuto, caída, tiempo agotado o respuesta vacía), repite la misma solicitud con Gemini.
 * Ambos reciben exactamente los mismos mensajes (prompt, historial y archivo), así que siguen las mismas reglas.
 *
 * Cuando Groq responde 429 se deja de consultar durante el tiempo que indica (retry-after) y las solicitudes van
 * directo a Gemini, para no gastar una llamada que fallará.
 */
@Service
public class ClienteIA {

    private static final Logger logger = LoggerFactory.getLogger(ClienteIA.class);

    /** Pausa de Groq tras un 429 sin retry-after, y máximo de pausa aunque Groq pida más. */
    static final Duration PAUSA_POR_DEFECTO = Duration.ofSeconds(30);
    static final Duration PAUSA_MAXIMA = Duration.ofHours(1);
    /** Espera antes de reintentar una vez el respaldo cuando responde 503 (alta demanda). */
    static final Duration ESPERA_REINTENTO_RESPALDO = Duration.ofSeconds(2);

    /** Texto de la respuesta y proveedor que la generó (GROQ o GEMINI). */
    public record Respuesta(String texto, String proveedor) {
    }

    private final ProveedorChatIA principal;
    private final ProveedorChatIA respaldo;
    private final boolean respaldoHabilitado;
    private final Clock reloj;
    private volatile Instant principalPausadoHasta = Instant.EPOCH;

    @Autowired
    public ClienteIA(@Value("${groq.api.url}") String groqUrl,
                     @Value("${groq.api.key:}") String groqKey,
                     @Value("${groq.model}") String groqModelo,
                     @Value("${groq.timeout-segundos:60}") int groqTimeout,
                     @Value("${groq.max-completion-tokens:2048}") int groqMaxTokens,
                     @Value("${gemini.api.url:https://generativelanguage.googleapis.com/v1beta/openai/chat/completions}") String geminiUrl,
                     @Value("${gemini.api.key:}") String geminiKey,
                     @Value("${gemini.model:gemini-3.5-flash}") String geminiModelo,
                     @Value("${gemini.timeout-segundos:60}") int geminiTimeout,
                     @Value("${gemini.max-completion-tokens:4096}") int geminiMaxTokens,
                     @Value("${gemini.reasoning-effort:low}") String geminiReasoning,
                     @Value("${ia.respaldo.habilitado:true}") boolean respaldoHabilitado) {
        this(new ClienteChatCompatibleOpenAI(new ClienteChatCompatibleOpenAI.Config(
                        "GROQ", groqUrl, groqKey, groqModelo, groqTimeout, groqMaxTokens, "max_completion_tokens", null)),
                new ClienteChatCompatibleOpenAI(new ClienteChatCompatibleOpenAI.Config(
                        "GEMINI", geminiUrl, geminiKey, geminiModelo, geminiTimeout, geminiMaxTokens, "max_tokens", geminiReasoning)),
                respaldoHabilitado, Clock.systemUTC());
        if (!principal.estaConfigurado()) {
            logger.warn("[ClienteIA] GROQ_API_KEY no está configurada.");
        } else {
            logger.info("[ClienteIA] Chatbot de IA configurado con Groq ({}).", groqModelo);
        }
        if (respaldoActivo()) {
            logger.info("[ClienteIA] Respaldo con Gemini ({}) activo si Groq se satura.", geminiModelo);
        } else {
            logger.info("[ClienteIA] Sin respaldo de Gemini (GEMINI_API_KEY vacía o ia.respaldo.habilitado=false).");
        }
    }

    ClienteIA(ProveedorChatIA principal, ProveedorChatIA respaldo, boolean respaldoHabilitado, Clock reloj) {
        this.principal = principal;
        this.respaldo = respaldo;
        this.respaldoHabilitado = respaldoHabilitado;
        this.reloj = reloj;
    }

    public boolean estaConfigurado() {
        return principal.estaConfigurado() || respaldoActivo();
    }

    private boolean respaldoActivo() {
        return respaldoHabilitado && respaldo != null && respaldo.estaConfigurado();
    }

    public Respuesta completar(List<MensajeIA> mensajes) {
        boolean principalPausado = reloj.instant().isBefore(principalPausadoHasta);
        ChatException errorPrincipal = null;

        if (principal.estaConfigurado() && (!principalPausado || !respaldoActivo())) {
            try {
                return new Respuesta(principal.completar(mensajes), principal.nombre());
            } catch (ChatException e) {
                if (!respaldoActivo()) throw e;
                errorPrincipal = e;
                if ("IA_LIMITE_USO".equals(e.getCodigo())) pausarPrincipal(e.getReintentarEnSegundos());
                logger.warn("[ClienteIA] {} falló ({}): se usa {} como respaldo.", principal.nombre(), e.getCodigo(), respaldo.nombre());
            }
        }

        if (!respaldoActivo()) {
            // Solo llega aquí si Groq no está configurado y tampoco hay respaldo
            throw new ChatException(HttpStatus.SERVICE_UNAVAILABLE, "IA_NO_CONFIGURADA",
                    "El asistente de IA no está configurado en el servidor. Contacta al administrador.");
        }

        try {
            return new Respuesta(completarRespaldo(mensajes), respaldo.nombre());
        } catch (ChatException e) {
            logger.warn("[ClienteIA] El respaldo {} también falló ({}).", respaldo.nombre(), e.getCodigo());
            if (errorPrincipal != null) throw errorPrincipal;
            if (principalPausado) {
                // Groq seguía pausado por su límite de uso: se informa ese límite, con el tiempo que falta
                long segundos = Math.max(1, Duration.between(reloj.instant(), principalPausadoHasta).toSeconds());
                throw new ChatException(HttpStatus.TOO_MANY_REQUESTS, "IA_LIMITE_USO",
                        "El servicio de IA alcanzó su límite de uso. Espera un momento antes de volver a intentarlo.", segundos);
            }
            throw e;
        }
    }

    /**
     * Gemini responde 503 («alta demanda») con frecuencia y suele pasar en segundos: se reintenta una vez. Otros
     * errores (límite de uso, clave, tiempo agotado) no mejoran al reintentar enseguida.
     */
    private String completarRespaldo(List<MensajeIA> mensajes) {
        try {
            return respaldo.completar(mensajes);
        } catch (ChatException e) {
            if (!"IA_NO_DISPONIBLE".equals(e.getCodigo())) throw e;
            logger.info("[ClienteIA] {} no disponible por el momento: se reintenta una vez.", respaldo.nombre());
            esperar(ESPERA_REINTENTO_RESPALDO);
            return respaldo.completar(mensajes);
        }
    }

    void esperar(Duration duracion) {
        try {
            Thread.sleep(duracion.toMillis());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new ChatException(HttpStatus.SERVICE_UNAVAILABLE, "IA_NO_DISPONIBLE",
                    "El servicio de IA no está disponible en este momento. Inténtalo más tarde.");
        }
    }

    private void pausarPrincipal(Long segundosSugeridos) {
        Duration pausa = segundosSugeridos != null && segundosSugeridos > 0
                ? Duration.ofSeconds(segundosSugeridos) : PAUSA_POR_DEFECTO;
        if (pausa.compareTo(PAUSA_MAXIMA) > 0) pausa = PAUSA_MAXIMA;
        principalPausadoHasta = reloj.instant().plus(pausa);
        logger.info("[ClienteIA] {} pausado {} s por límite de uso; mientras tanto responde {}.",
                principal.nombre(), pausa.toSeconds(), respaldo.nombre());
    }
}
