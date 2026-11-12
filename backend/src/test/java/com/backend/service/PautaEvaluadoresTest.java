package com.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowableOfType;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.backend.model.Pauta;

/** Una pauta puede tener uno, dos o los tres evaluadores. */
class PautaEvaluadoresTest {

    @Test
    @DisplayName("se guardan sin repetidos y en orden fijo, sin importar cómo se elijan")
    void normalizaOrdenYRepetidos() {
        assertThat(PautaService.normalizarEvaluadores("tutor, colaborador,TUTOR")).isEqualTo("COLABORADOR,TUTOR");
        assertThat(PautaService.normalizarEvaluadores("ACADEMICO,TUTOR,COLABORADOR"))
            .isEqualTo("COLABORADOR,TUTOR,ACADEMICO");
        assertThat(PautaService.normalizarEvaluadores("tutor")).isEqualTo("TUTOR");
    }

    @Test
    @DisplayName("rechaza un evaluador desconocido o una lista vacía")
    void rechazaValoresNoValidos() {
        ResponseStatusException desconocido = catchThrowableOfType(ResponseStatusException.class,
            () -> PautaService.normalizarEvaluadores("TUTOR,DIRECTOR"));
        ResponseStatusException vacio = catchThrowableOfType(ResponseStatusException.class,
            () -> PautaService.normalizarEvaluadores(" , "));

        assertThat(desconocido.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(vacio.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("la pauta entrega la lista de sus evaluadores")
    void listaDeEvaluadores() {
        Pauta pauta = new Pauta();
        pauta.setEvaluador("COLABORADOR,TUTOR");

        assertThat(pauta.evaluadoresLista()).containsExactly("COLABORADOR", "TUTOR");
    }
}
