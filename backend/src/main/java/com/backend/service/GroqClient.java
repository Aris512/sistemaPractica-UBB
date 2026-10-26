package com.backend.service;

import java.net.http.HttpClient;
import java.net.http.HttpTimeoutException;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.logging.Logger;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.BufferingClientHttpRequestFactory;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

/**
 * Cliente del endpoint de chat completions y transcripción Whisper de Groq (compatible con OpenAI).
 * La clave se lee de GROQ_API_KEY y el modelo de GROQ_MODEL (ver application.properties).
 * Nunca registra la clave ni el contenido de los mensajes: solo estados y códigos de error.
 */
@Service
public class GroqClient {

    private static final Logger logger = Logger.getLogger(GroqClient.class.getName());

    private static final Pattern CODIGO_ERROR = Pattern.compile("\"code\"\\s*:\\s*\"([A-Za-z0-9_.-]{1,64})\"");

    public record Mensaje(String role, String content) {
    }

    private final RestClient restClient;
    private final String apiKey;
    private final String model;
    private final String whisperUrl;
    private final String whisperModel;
    private final int maxCompletionTokens;

    public GroqClient(
            @Value("${groq.api.url}") String apiUrl,
            @Value("${groq.api.key:}") String apiKey,
            @Value("${groq.model}") String model,
            @Value("${groq.whisper.url:https://api.groq.com/openai/v1/audio/transcriptions}") String whisperUrl,
            @Value("${groq.whisper.model:whisper-large-v3-turbo}") String whisperModel,
            @Value("${groq.timeout-segundos:60}") int timeoutSegundos,
            @Value("${groq.max-completion-tokens:2048}") int maxCompletionTokens) {
        this.apiKey = apiKey != null ? apiKey.trim() : "";
        this.model = model != null ? model.trim() : "";
        this.whisperUrl = whisperUrl != null && !whisperUrl.isBlank() ? whisperUrl.trim() : "https://api.groq.com/openai/v1/audio/transcriptions";
        this.whisperModel = whisperModel != null && !whisperModel.isBlank() ? whisperModel.trim() : "whisper-large-v3-turbo";
        this.maxCompletionTokens = maxCompletionTokens;

        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(Duration.ofSeconds(timeoutSegundos));

        // Buffering: envía Content-Length en lugar de transferencia chunked (el cuerpo es pequeño)
        this.restClient = RestClient.builder()
                .baseUrl(apiUrl)
                .requestFactory(new BufferingClientHttpRequestFactory(requestFactory))
                .build();

        if (this.apiKey.isEmpty()) {
            logger.warning("[GroqClient] GROQ_API_KEY no está configurada: el chatbot de IA responderá que el servicio no está disponible.");
        } else {
            logger.info("[GroqClient] Chatbot de IA configurado con el modelo " + this.model + ".");
        }
    }

    public boolean estaConfigurado() {
        return !apiKey.isEmpty() && !model.isEmpty();
    }

    /** Envía el historial a Groq y devuelve el texto de la respuesta del asistente. */
    @SuppressWarnings("unchecked")
    public String completar(List<Mensaje> mensajes) {
        if (!estaConfigurado()) {
            throw new ChatException(HttpStatus.SERVICE_UNAVAILABLE, "IA_NO_CONFIGURADA",
                    "El asistente de IA no está configurado en el servidor. Contacta al administrador.");
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", model);
        body.put("messages", mensajes);
        body.put("max_completion_tokens", maxCompletionTokens);

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
                logger.warning("[GroqClient] Tiempo de espera agotado al consultar Groq.");
                throw new ChatException(HttpStatus.GATEWAY_TIMEOUT, "IA_TIEMPO_AGOTADO",
                        "El asistente de IA tardó demasiado en responder. Inténtalo nuevamente.");
            }
            logger.warning("[GroqClient] No se pudo conectar con Groq: " + e.getClass().getSimpleName());
            throw new ChatException(HttpStatus.SERVICE_UNAVAILABLE, "IA_NO_DISPONIBLE",
                    "No se pudo conectar con el servicio de IA. Inténtalo más tarde.");
        } catch (RestClientException e) {
            logger.warning("[GroqClient] Respuesta ilegible de Groq: " + e.getClass().getSimpleName());
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
            logger.warning("[GroqClient] Groq devolvió una respuesta sin contenido (finish_reason="
                    + ((Map<String, Object>) choice).get("finish_reason") + ").");
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
        logger.warning("[GroqClient] Groq respondió HTTP " + status + " (código: " + codigoErrorGroq(e) + ").");

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

    /** Extrae solo el campo error.code del cuerpo (p. ej. invalid_api_key), sin registrar el mensaje completo. */
    private String codigoErrorGroq(RestClientResponseException e) {
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

    /**
     * Transcribe un archivo de audio a texto usando Groq Whisper (whisper-large-v3-turbo).
     * Retorna el texto transcrito o null si no se pudo transcribir o no hay API key configurada.
     */
    public String transcribirAudio(byte[] audioBytes, String nombreArchivo) {
        if (!estaConfigurado() || audioBytes == null || audioBytes.length == 0) {
            logger.warning("[GroqClient] No se puede transcribir audio: Groq no está configurado (GROQ_API_KEY vacía).");
            return null;
        }

        final String filename = (nombreArchivo != null && !nombreArchivo.isBlank()) ? nombreArchivo : "audio.webm";

        ByteArrayResource fileResource = new ByteArrayResource(audioBytes) {
            @Override
            public String getFilename() {
                return filename;
            }
        };

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", fileResource);
        body.add("model", this.whisperModel);
        body.add("language", "es");
        body.add("response_format", "json");

        try {
            logger.info("[GroqClient] Enviando audio a Groq Whisper (" + this.whisperModel + ") para transcripción...");
            Map<?, ?> respuesta = RestClient.builder()
                    .baseUrl(this.whisperUrl)
                    .requestFactory(new BufferingClientHttpRequestFactory(new JdkClientHttpRequestFactory()))
                    .build()
                    .post()
                    .header("Authorization", "Bearer " + this.apiKey)
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(body)
                    .retrieve()
                    .body(Map.class);

            if (respuesta != null && respuesta.get("text") != null) {
                String transcripcion = respuesta.get("text").toString().trim();
                logger.info("[GroqClient] Transcripción completada con éxito (" + transcripcion.length() + " caracteres).");
                return transcripcion;
            }
        } catch (RestClientResponseException e) {
            logger.warning("[GroqClient] Groq Whisper respondió error HTTP " + e.getStatusCode() + ": " + e.getResponseBodyAsString());
        } catch (Exception e) {
            logger.warning("[GroqClient] Error al conectar con Groq Whisper: " + e.getMessage());
        }
        return null;
    }
}
