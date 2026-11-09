package com.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowableOfType;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.concurrent.atomic.AtomicReference;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.sun.net.httpserver.HttpServer;

/** Formato de la solicitud (Groq y Gemini) y traducción de errores, contra un servidor HTTP local. */
class ClienteChatCompatibleOpenAITest {

    private HttpServer servidor;
    private final AtomicReference<String> cuerpoRecibido = new AtomicReference<>();
    private final AtomicReference<String> autorizacion = new AtomicReference<>();
    private volatile int estado = 200;
    private volatile String respuesta = "";
    private volatile String retryAfter;

    @BeforeEach
    void iniciar() throws IOException {
        servidor = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        servidor.createContext("/chat/completions", intercambio -> {
            cuerpoRecibido.set(new String(intercambio.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
            autorizacion.set(intercambio.getRequestHeaders().getFirst("Authorization"));
            byte[] datos = respuesta.getBytes(StandardCharsets.UTF_8);
            intercambio.getResponseHeaders().add("Content-Type", "application/json");
            if (retryAfter != null) intercambio.getResponseHeaders().add("retry-after", retryAfter);
            intercambio.sendResponseHeaders(estado, datos.length);
            try (OutputStream os = intercambio.getResponseBody()) {
                os.write(datos);
            }
        });
        servidor.start();
    }

    @AfterEach
    void detener() {
        servidor.stop(0);
    }

    private ClienteChatCompatibleOpenAI cliente(String nombre, String parametro, String reasoning) {
        String url = "http://127.0.0.1:" + servidor.getAddress().getPort() + "/chat/completions";
        return new ClienteChatCompatibleOpenAI(new ClienteChatCompatibleOpenAI.Config(
                nombre, url, "clave-de-prueba", "modelo-x", 5, 1234, parametro, reasoning));
    }

    private static final List<MensajeIA> MENSAJES = List.of(new MensajeIA("system", "reglas"), new MensajeIA("user", "hola"));

    @Test
    @DisplayName("Gemini: envía max_tokens y reasoning_effort, con los mismos mensajes")
    void solicitudGemini() {
        respuesta = "{\"choices\":[{\"message\":{\"role\":\"assistant\",\"content\":\"  respuesta gemini  \"}}]}";

        String texto = cliente("GEMINI", "max_tokens", "low").completar(MENSAJES);

        assertThat(texto).isEqualTo("respuesta gemini");
        assertThat(autorizacion.get()).isEqualTo("Bearer clave-de-prueba");
        assertThat(cuerpoRecibido.get())
                .contains("\"model\":\"modelo-x\"")
                .contains("\"max_tokens\":1234")
                .contains("\"reasoning_effort\":\"low\"")
                .contains("{\"role\":\"system\",\"content\":\"reglas\"}")
                .contains("{\"role\":\"user\",\"content\":\"hola\"}")
                .doesNotContain("max_completion_tokens");
    }

    @Test
    @DisplayName("Groq: envía max_completion_tokens y no envía reasoning_effort")
    void solicitudGroq() {
        respuesta = "{\"choices\":[{\"message\":{\"content\":\"ok\"}}]}";

        cliente("GROQ", "max_completion_tokens", null).completar(MENSAJES);

        assertThat(cuerpoRecibido.get()).contains("\"max_completion_tokens\":1234").doesNotContain("reasoning_effort");
    }

    @Test
    @DisplayName("429 se traduce a IA_LIMITE_USO con el retry-after")
    void limiteDeUso() {
        estado = 429;
        retryAfter = "12.3";
        respuesta = "[{\"error\":{\"code\":429,\"status\":\"RESOURCE_EXHAUSTED\"}}]";

        ChatException e = catchThrowableOfType(ChatException.class, () -> cliente("GEMINI", "max_tokens", "low").completar(MENSAJES));

        assertThat(e.getCodigo()).isEqualTo("IA_LIMITE_USO");
        assertThat(e.getReintentarEnSegundos()).isEqualTo(13L);
    }

    @Test
    @DisplayName("respuesta sin contenido (razonamiento agotó los tokens) es IA_RESPUESTA_INVALIDA")
    void respuestaVacia() {
        respuesta = "{\"choices\":[{\"finish_reason\":\"length\",\"message\":{\"content\":\"\"}}]}";

        ChatException e = catchThrowableOfType(ChatException.class, () -> cliente("GROQ", "max_completion_tokens", null).completar(MENSAJES));

        assertThat(e.getCodigo()).isEqualTo("IA_RESPUESTA_INVALIDA");
    }

    @Test
    @DisplayName("sin clave no llama al servidor")
    void sinClave() {
        ClienteChatCompatibleOpenAI sinClave = new ClienteChatCompatibleOpenAI(new ClienteChatCompatibleOpenAI.Config(
                "GEMINI", "http://127.0.0.1:1/x", " ", "modelo", 5, 10, "max_tokens", null));

        assertThat(sinClave.estaConfigurado()).isFalse();
        assertThat(catchThrowableOfType(ChatException.class, () -> sinClave.completar(MENSAJES)).getCodigo())
                .isEqualTo("IA_NO_CONFIGURADA");
        assertThat(cuerpoRecibido.get()).isNull();
    }
}
