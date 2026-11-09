package com.backend.service;

import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.client.BufferingClientHttpRequestFactory;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

/**
 * Transcripción de notas de voz con Groq Whisper. El chat de IA ya no pasa por aquí: lo atiende {@link ClienteIA}
 * (Groq con respaldo de Gemini). La clave se lee de GROQ_API_KEY. Nunca registra la clave ni el audio.
 */
@Service
public class GroqClient {

    private static final Logger logger = LoggerFactory.getLogger(GroqClient.class);

    private static final Pattern CODIGO_ERROR = Pattern.compile("\"code\"\\s*:\\s*\"([A-Za-z0-9_.-]{1,64})\"");

    private final String apiKey;
    private final String whisperUrl;
    private final String whisperModel;

    public GroqClient(
            @Value("${groq.api.key:}") String apiKey,
            @Value("${groq.whisper.url:https://api.groq.com/openai/v1/audio/transcriptions}") String whisperUrl,
            @Value("${groq.whisper.model:whisper-large-v3-turbo}") String whisperModel) {
        this.apiKey = apiKey != null ? apiKey.trim() : "";
        this.whisperUrl = whisperUrl != null && !whisperUrl.isBlank() ? whisperUrl.trim() : "https://api.groq.com/openai/v1/audio/transcriptions";
        this.whisperModel = whisperModel != null && !whisperModel.isBlank() ? whisperModel.trim() : "whisper-large-v3-turbo";
    }

    /** true si hay GROQ_API_KEY: sin ella no se pueden transcribir notas de voz. */
    public boolean estaConfigurado() {
        return !apiKey.isEmpty();
    }

    /** Extrae solo el campo error.code del cuerpo (p. ej. invalid_api_key), sin registrar el mensaje completo. */
    private String codigoErrorGroq(RestClientResponseException e) {
        String cuerpo = e.getResponseBodyAsString();
        if (cuerpo == null) return "desconocido";
        Matcher m = CODIGO_ERROR.matcher(cuerpo);
        return m.find() ? m.group(1) : "desconocido";
    }

    /**
     * Transcribe un archivo de audio a texto usando Groq Whisper (whisper-large-v3-turbo).
     * Retorna el texto transcrito o null si no se pudo transcribir o no hay API key configurada.
     */
    public String transcribirAudio(byte[] audioBytes, String nombreArchivo) {
        if (!estaConfigurado() || audioBytes == null || audioBytes.length == 0) {
            logger.warn("[GroqClient] No se puede transcribir audio: Groq no está configurado (GROQ_API_KEY vacía).");
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
            logger.info("[GroqClient] Enviando audio a Groq Whisper ({}) para transcripción...", this.whisperModel);
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
                logger.info("[GroqClient] Transcripción completada con éxito ({} caracteres).", transcripcion.length());
                return transcripcion;
            }
        } catch (RestClientResponseException e) {
            logger.warn("[GroqClient] Groq Whisper respondió HTTP {} (código: {}).", e.getStatusCode().value(), codigoErrorGroq(e));
        } catch (Exception e) {
            logger.warn("[GroqClient] Error al conectar con Groq Whisper: {}", e.getClass().getSimpleName());
        }
        return null;
    }
}
