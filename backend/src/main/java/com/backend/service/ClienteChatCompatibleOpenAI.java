package com.backend.service;

import java.net.http.HttpClient;
import java.net.http.HttpTimeoutException;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.BufferingClientHttpRequestFactory;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

/**
 * Cliente de un endpoint de chat completions con el formato de OpenAI. Lo usan Groq y Gemini (este último
 * mediante su endpoint compatible con OpenAI), así ambos reciben exactamente los mismos mensajes y reglas.
 * Nunca registra la clave ni el contenido de los mensajes: solo estados y códigos de error.
 */
public class ClienteChatCompatibleOpenAI implements ProveedorChatIA {

    private static final Logger logger = LoggerFactory.getLogger(ClienteChatCompatibleOpenAI.class);

    private static final Pattern CODIGO_ERROR = Pattern.compile("\"(?:code|status)\"\\s*:\\s*\"?([A-Za-z0-9_.-]{1,64})");

    /** Parámetros que cambian de un proveedor a otro. */
    public record Config(String nombre, String apiUrl, String apiKey, String modelo, int timeoutSegundos,
                         int maxTokens, String parametroMaxTokens, String reasoningEffort) {
    }

    private final Config config;
    private final String apiKey;
    private final String modelo;
    private final RestClient restClient;

    public ClienteChatCompatibleOpenAI(Config config) {
        this.config = config;
        this.apiKey = config.apiKey() != null ? config.apiKey().trim() : "";
        this.modelo = config.modelo() != null ? config.modelo().trim() : "";

        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(Duration.ofSeconds(config.timeoutSegundos()));

        // Buffering: envía Content-Length en lugar de transferencia chunked (el cuerpo es pequeño)
        this.restClient = RestClient.builder()
                .baseUrl(config.apiUrl())
                .requestFactory(new BufferingClientHttpRequestFactory(requestFactory))
                .build();
    }

    @Override
    public String nombre() {
        return config.nombre();
    }

    @Override
    public boolean estaConfigurado() {
        return !apiKey.isEmpty() && !modelo.isEmpty();
    }

    public String modelo() {
        return modelo;
    }

    /** Envía el historial y devuelve el texto de la respuesta del asistente. */
    @Override
    @SuppressWarnings("unchecked")
    public String completar(List<MensajeIA> mensajes) {
        if (!estaConfigurado()) {
            throw new ChatException(HttpStatus.SERVICE_UNAVAILABLE, "IA_NO_CONFIGURADA",
                    "El asistente de IA no está configurado en el servidor. Contacta al administrador.");
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", modelo);
        body.put("messages", mensajes);
        body.put(config.parametroMaxTokens(), config.maxTokens());
        if (config.reasoningEffort() != null && !config.reasoningEffort().isBlank()) {
            body.put("reasoning_effort", config.reasoningEffort().trim());
        }

        Map<String, Object> respuesta;
        try {
            respuesta = restClient.post()
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .header("Authorization", "Bearer " + apiKey)
                    .body(body)
                    .retrieve()
                    .body(Map.class);
        } catch (RestClientResponseException e) {
            throw traducirErrorHttp(e);
        } catch (ResourceAccessException e) {
            if (esTimeout(e)) {
                logger.warn("[IA {}] Tiempo de espera agotado.", nombre());
                throw new ChatException(HttpStatus.GATEWAY_TIMEOUT, "IA_TIEMPO_AGOTADO",
                        "El asistente de IA tardó demasiado en responder. Inténtalo nuevamente.");
            }
            logger.warn("[IA {}] No se pudo conectar: {}", nombre(), e.getClass().getSimpleName());
            throw new ChatException(HttpStatus.SERVICE_UNAVAILABLE, "IA_NO_DISPONIBLE",
                    "No se pudo conectar con el servicio de IA. Inténtalo más tarde.");
        } catch (RestClientException e) {
            logger.warn("[IA {}] Respuesta ilegible: {}", nombre(), e.getClass().getSimpleName());
            throw respuestaInvalida();
        }

        return extraerContenido(respuesta);
    }

    @SuppressWarnings("unchecked")
    private String extraerContenido(Map<String, Object> respuesta) {
        if (respuesta == null || !(respuesta.get("choices") instanceof List<?> choices) || choices.isEmpty()) {
            throw respuestaInvalida();
        }
        if (!(choices.get(0) instanceof Map<?, ?> choice) || !(choice.get("message") instanceof Map<?, ?> message)) {
            throw respuestaInvalida();
        }
        Object content = ((Map<String, Object>) message).get("content");
        if (!(content instanceof String texto) || texto.isBlank()) {
            // Ocurre, por ejemplo, si el razonamiento del modelo consumió todos los tokens (finish_reason=length)
            logger.warn("[IA {}] Respuesta sin contenido (finish_reason={}).", nombre(),
                    ((Map<String, Object>) choice).get("finish_reason"));
            throw respuestaInvalida();
        }
        return texto.trim();
    }

    private ChatException respuestaInvalida() {
        return new ChatException(HttpStatus.BAD_GATEWAY, "IA_RESPUESTA_INVALIDA",
                "El asistente de IA no devolvió una respuesta válida. Inténtalo nuevamente.");
    }

    private ChatException traducirErrorHttp(RestClientResponseException e) {
        int status = e.getStatusCode().value();
        logger.warn("[IA {}] HTTP {} (código: {}).", nombre(), status, codigoError(e));

        if (status == 401 || status == 403) {
            return new ChatException(HttpStatus.BAD_GATEWAY, "IA_AUTENTICACION",
                    "El servidor no pudo autenticarse con el servicio de IA. Contacta al administrador.");
        }
        if (status == 429) {
            Long reintentar = null;
            String retryAfter = e.getResponseHeaders() != null ? e.getResponseHeaders().getFirst("retry-after") : null;
            if (retryAfter != null) {
                try {
                    reintentar = (long) Math.ceil(Double.parseDouble(retryAfter.trim()));
                } catch (NumberFormatException ignored) {
                    // Formato de fecha HTTP: se omite el tiempo sugerido
                }
            }
            return new ChatException(HttpStatus.TOO_MANY_REQUESTS, "IA_LIMITE_USO",
                    "El servicio de IA alcanzó su límite de uso. Espera un momento antes de volver a intentarlo.", reintentar);
        }
        if (status == 413) {
            // Groq responde 413 cuando una sola solicitud supera el límite de tokens por minuto del plan
            return new ChatException(HttpStatus.BAD_GATEWAY, "IA_SOLICITUD_MUY_GRANDE",
                    "El mensaje y su contexto superan lo que el servicio de IA acepta de una vez. Escribe un mensaje más breve o inicia una nueva conversación.");
        }
        if (status >= 400 && status < 500 && status != 408) {
            return new ChatException(HttpStatus.BAD_GATEWAY, "IA_SOLICITUD_INVALIDA",
                    "El servicio de IA rechazó la solicitud. Si persiste, inicia una nueva conversación o contacta al administrador.");
        }
        if (status == 408 || status == 504) {
            return new ChatException(HttpStatus.GATEWAY_TIMEOUT, "IA_TIEMPO_AGOTADO",
                    "El asistente de IA tardó demasiado en responder. Inténtalo nuevamente.");
        }
        return new ChatException(HttpStatus.SERVICE_UNAVAILABLE, "IA_NO_DISPONIBLE",
                "El servicio de IA no está disponible en este momento. Inténtalo más tarde.");
    }

    /** Extrae solo el código de error del cuerpo (p. ej. invalid_api_key), sin registrar el mensaje completo. */
    private String codigoError(RestClientResponseException e) {
        String cuerpo = e.getResponseBodyAsString();
        if (cuerpo == null) return "desconocido";
        Matcher m = CODIGO_ERROR.matcher(cuerpo);
        return m.find() ? m.group(1) : "desconocido";
    }

    private boolean esTimeout(Throwable e) {
        for (Throwable t = e; t != null; t = t.getCause()) {
            if (t instanceof HttpTimeoutException || t instanceof java.net.SocketTimeoutException) {
                return true;
            }
        }
        return false;
    }
}
