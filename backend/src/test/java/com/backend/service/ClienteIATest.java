package com.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowableOfType;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

/** Respaldo de la IA: Groq responde y, si se satura, Gemini recibe exactamente los mismos mensajes. */
class ClienteIATest {

    private static final List<MensajeIA> MENSAJES = List.of(
            new MensajeIA("system", "prompt RetroPlani"), new MensajeIA("user", "Hola, adjunto mi planificación"));

    /** Proveedor simulado: responde lo que se le programe y guarda lo que recibió. */
    static class ProveedorFalso implements ProveedorChatIA {
        final String nombre;
        final boolean configurado;
        final Deque<Object> resultados = new ArrayDeque<>();
        final List<List<MensajeIA>> recibidos = new ArrayList<>();

        ProveedorFalso(String nombre, boolean configurado) {
            this.nombre = nombre;
            this.configurado = configurado;
        }

        ProveedorFalso responde(Object... valores) {
            resultados.addAll(List.of(valores));
            return this;
        }

        @Override
        public String nombre() {
            return nombre;
        }

        @Override
        public boolean estaConfigurado() {
            return configurado;
        }

        @Override
        public String completar(List<MensajeIA> mensajes) {
            recibidos.add(mensajes);
            Object r = resultados.isEmpty() ? "ok " + nombre : resultados.poll();
            if (r instanceof ChatException e) throw e;
            return (String) r;
        }
    }

    /** Reloj que se puede adelantar a mano. */
    static class RelojManual extends Clock {
        Instant ahora = Instant.parse("2026-11-09T12:00:00Z");

        @Override
        public ZoneOffset getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(java.time.ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return ahora;
        }
    }

    /** ClienteIA sin la espera real antes de reintentar el respaldo. */
    private static ClienteIA cliente(ProveedorChatIA groq, ProveedorChatIA gemini, boolean habilitado, Clock reloj) {
        return new ClienteIA(groq, gemini, habilitado, reloj) {
            @Override
            void esperar(Duration duracion) {
                // sin espera en las pruebas
            }
        };
    }

    private static ChatException limite(Long segundos) {
        return new ChatException(HttpStatus.TOO_MANY_REQUESTS, "IA_LIMITE_USO", "límite", segundos);
    }

    private static ChatException error(String codigo) {
        return new ChatException(HttpStatus.SERVICE_UNAVAILABLE, codigo, "error");
    }

    @Test
    @DisplayName("si Groq responde, no se consulta a Gemini")
    void groqResponde() {
        ProveedorFalso groq = new ProveedorFalso("GROQ", true).responde("respuesta groq");
        ProveedorFalso gemini = new ProveedorFalso("GEMINI", true);

        ClienteIA.Respuesta r = cliente(groq, gemini, true, new RelojManual()).completar(MENSAJES);

        assertThat(r.texto()).isEqualTo("respuesta groq");
        assertThat(r.proveedor()).isEqualTo("GROQ");
        assertThat(gemini.recibidos).isEmpty();
    }

    @Test
    @DisplayName("si Groq se satura, Gemini recibe los mismos mensajes (mismas reglas)")
    void respaldoConMismosMensajes() {
        for (String codigo : List.of("IA_LIMITE_USO", "IA_SOLICITUD_MUY_GRANDE", "IA_NO_DISPONIBLE", "IA_TIEMPO_AGOTADO",
                "IA_RESPUESTA_INVALIDA")) {
            ProveedorFalso groq = new ProveedorFalso("GROQ", true)
                    .responde("IA_LIMITE_USO".equals(codigo) ? limite(null) : error(codigo));
            ProveedorFalso gemini = new ProveedorFalso("GEMINI", true).responde("respuesta gemini");

            ClienteIA.Respuesta r = cliente(groq, gemini, true, new RelojManual()).completar(MENSAJES);

            assertThat(r.proveedor()).as(codigo).isEqualTo("GEMINI");
            assertThat(r.texto()).isEqualTo("respuesta gemini");
            assertThat(gemini.recibidos).containsExactly(MENSAJES);
        }
    }

    @Test
    @DisplayName("tras un 429, Groq queda en pausa el tiempo que pidió y luego se vuelve a usar")
    void pausaTrasLimiteDeUso() {
        RelojManual reloj = new RelojManual();
        ProveedorFalso groq = new ProveedorFalso("GROQ", true).responde(limite(40L), "groq de vuelta");
        ProveedorFalso gemini = new ProveedorFalso("GEMINI", true);
        ClienteIA cliente = cliente(groq, gemini, true, reloj);

        assertThat(cliente.completar(MENSAJES).proveedor()).isEqualTo("GEMINI");
        reloj.ahora = reloj.ahora.plusSeconds(20);
        assertThat(cliente.completar(MENSAJES).proveedor()).isEqualTo("GEMINI");
        assertThat(groq.recibidos).hasSize(1); // durante la pausa no se gasta otra llamada a Groq

        reloj.ahora = reloj.ahora.plusSeconds(21);
        ClienteIA.Respuesta r = cliente.completar(MENSAJES);
        assertThat(r.proveedor()).isEqualTo("GROQ");
        assertThat(r.texto()).isEqualTo("groq de vuelta");
    }

    @Test
    @DisplayName("la pausa no supera una hora aunque Groq pida más")
    void pausaMaxima() {
        RelojManual reloj = new RelojManual();
        ProveedorFalso groq = new ProveedorFalso("GROQ", true).responde(limite(Duration.ofHours(5).toSeconds()));
        ClienteIA cliente = cliente(groq, new ProveedorFalso("GEMINI", true), true, reloj);
        cliente.completar(MENSAJES);

        reloj.ahora = reloj.ahora.plus(ClienteIA.PAUSA_MAXIMA).plusSeconds(1);
        assertThat(cliente.completar(MENSAJES).proveedor()).isEqualTo("GROQ");
    }

    @Test
    @DisplayName("si ambos fallan se informa el error de Groq")
    void ambosFallan() {
        ProveedorFalso groq = new ProveedorFalso("GROQ", true).responde(limite(30L));
        ProveedorFalso gemini = new ProveedorFalso("GEMINI", true).responde(error("IA_LIMITE_USO"));

        ChatException e = catchThrowableOfType(ChatException.class,
                () -> cliente(groq, gemini, true, new RelojManual()).completar(MENSAJES));

        assertThat(e.getCodigo()).isEqualTo("IA_LIMITE_USO");
        assertThat(e.getReintentarEnSegundos()).isEqualTo(30L);
    }

    @Test
    @DisplayName("con Groq en pausa y Gemini caído se informa el límite con el tiempo que falta")
    void pausaYRespaldoCaido() {
        RelojManual reloj = new RelojManual();
        ProveedorFalso groq = new ProveedorFalso("GROQ", true).responde(limite(60L));
        ProveedorFalso gemini = new ProveedorFalso("GEMINI", true)
                .responde("primera", error("IA_NO_DISPONIBLE"), error("IA_NO_DISPONIBLE"));
        ClienteIA cliente = cliente(groq, gemini, true, reloj);
        cliente.completar(MENSAJES);
        reloj.ahora = reloj.ahora.plusSeconds(15);

        ChatException e = catchThrowableOfType(ChatException.class, () -> cliente.completar(MENSAJES));

        assertThat(e.getCodigo()).isEqualTo("IA_LIMITE_USO");
        assertThat(e.getReintentarEnSegundos()).isEqualTo(45L);
    }

    @Test
    @DisplayName("si Gemini responde 503 (alta demanda) se reintenta una vez")
    void reintentoRespaldo() {
        ProveedorFalso groq = new ProveedorFalso("GROQ", true).responde(limite(10L));
        ProveedorFalso gemini = new ProveedorFalso("GEMINI", true).responde(error("IA_NO_DISPONIBLE"), "segundo intento");

        ClienteIA.Respuesta r = cliente(groq, gemini, true, new RelojManual()).completar(MENSAJES);

        assertThat(r.texto()).isEqualTo("segundo intento");
        assertThat(gemini.recibidos).hasSize(2).containsOnly(MENSAJES);
    }

    @Test
    @DisplayName("otros errores de Gemini no se reintentan")
    void sinReintentoPorLimite() {
        ProveedorFalso groq = new ProveedorFalso("GROQ", true).responde(error("IA_TIEMPO_AGOTADO"));
        ProveedorFalso gemini = new ProveedorFalso("GEMINI", true).responde(limite(5L), "no debería llegar");

        ChatException e = catchThrowableOfType(ChatException.class,
                () -> cliente(groq, gemini, true, new RelojManual()).completar(MENSAJES));

        assertThat(e.getCodigo()).isEqualTo("IA_TIEMPO_AGOTADO");
        assertThat(gemini.recibidos).hasSize(1);
    }

    @Test
    @DisplayName("sin respaldo configurado o deshabilitado, el error de Groq llega tal cual")
    void sinRespaldo() {
        for (ProveedorFalso gemini : List.of(new ProveedorFalso("GEMINI", false), new ProveedorFalso("GEMINI", true))) {
            boolean habilitado = !gemini.estaConfigurado();
            ProveedorFalso groq = new ProveedorFalso("GROQ", true).responde(limite(10L));

            ChatException e = catchThrowableOfType(ChatException.class,
                    () -> cliente(groq, gemini, habilitado, new RelojManual()).completar(MENSAJES));

            assertThat(e.getCodigo()).isEqualTo("IA_LIMITE_USO");
            assertThat(gemini.recibidos).isEmpty();
        }
    }

    @Test
    @DisplayName("sin clave de Groq responde Gemini; sin ninguna, IA_NO_CONFIGURADA")
    void sinGroq() {
        ProveedorFalso gemini = new ProveedorFalso("GEMINI", true).responde("solo gemini");
        assertThat(cliente(new ProveedorFalso("GROQ", false), gemini, true, new RelojManual())
                .completar(MENSAJES).proveedor()).isEqualTo("GEMINI");

        ChatException e = catchThrowableOfType(ChatException.class, () -> cliente(
                new ProveedorFalso("GROQ", false), new ProveedorFalso("GEMINI", false), true, new RelojManual()).completar(MENSAJES));
        assertThat(e.getCodigo()).isEqualTo("IA_NO_CONFIGURADA");
    }
}
