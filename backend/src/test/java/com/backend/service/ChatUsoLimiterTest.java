package com.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.catchThrowableOfType;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

/** Límites en memoria del chatbot: una respuesta en curso por usuario y un máximo de solicitudes por minuto. */
class ChatUsoLimiterTest {

    private static final String RUT = "12345678-5";

    @Test
    @DisplayName("no permite una segunda solicitud mientras la primera sigue en curso")
    void unaSolicitudEnCursoPorUsuario() {
        ChatUsoLimiter limiter = new ChatUsoLimiter(10);
        limiter.adquirir(RUT);

        ChatException error = catchThrowableOfType(ChatException.class, () -> limiter.adquirir(RUT));

        assertThat(error.getStatus()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(error.getCodigo()).isEqualTo("CHAT_RESPUESTA_EN_CURSO");
    }

    @Test
    @DisplayName("al liberar, el usuario puede volver a enviar")
    void liberarPermiteOtraSolicitud() {
        ChatUsoLimiter limiter = new ChatUsoLimiter(10);
        limiter.adquirir(RUT);
        limiter.liberar(RUT);

        assertThatCode(() -> limiter.adquirir(RUT)).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("cada usuario tiene su propio turno")
    void usuariosIndependientes() {
        ChatUsoLimiter limiter = new ChatUsoLimiter(10);
        limiter.adquirir(RUT);

        assertThatCode(() -> limiter.adquirir("11111111-1")).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("al pasar el máximo por minuto responde 429 con los segundos de espera")
    void limitePorMinuto() {
        ChatUsoLimiter limiter = new ChatUsoLimiter(2);
        for (int i = 0; i < 2; i++) {
            limiter.adquirir(RUT);
            limiter.liberar(RUT);
        }

        ChatException error = catchThrowableOfType(ChatException.class, () -> limiter.adquirir(RUT));

        assertThat(error.getStatus()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
        assertThat(error.getCodigo()).isEqualTo("CHAT_LIMITE_MINUTO");
        assertThat(error.getReintentarEnSegundos()).isBetween(1L, 60L);
    }

    @Test
    @DisplayName("una solicitud rechazada por el límite no deja al usuario bloqueado como «en curso»")
    void rechazoPorLimiteLiberaElTurno() {
        ChatUsoLimiter limiter = new ChatUsoLimiter(1);
        limiter.adquirir(RUT);
        limiter.liberar(RUT);

        ChatException primero = catchThrowableOfType(ChatException.class, () -> limiter.adquirir(RUT));
        ChatException segundo = catchThrowableOfType(ChatException.class, () -> limiter.adquirir(RUT));

        // Si el turno quedara tomado, el segundo intento diría «respuesta en curso» en vez del límite por minuto
        assertThat(primero.getCodigo()).isEqualTo("CHAT_LIMITE_MINUTO");
        assertThat(segundo.getCodigo()).isEqualTo("CHAT_LIMITE_MINUTO");
    }
}
