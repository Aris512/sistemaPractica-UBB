package com.backend.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

/** Conversión del semestre de una asignatura («8», «8.° semestre»…) al número con que se ordena y se filtra. */
class AvanceAcademicoServiceTest {

    @ParameterizedTest(name = "«{0}» → {1}")
    @CsvSource({
            "8, 8",
            "9, 9",
            "'8.° semestre', 8",
            "'Semestre 4', 4",
            "' 10 ', 10",
    })
    @DisplayName("extrae el número del semestre aunque venga con texto")
    void extraeElNumero(String semestre, int esperado) {
        assertThat(AvanceAcademicoService.semestreNumerico(semestre)).isEqualTo(esperado);
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"sin número", "   "})
    @DisplayName("sin número: queda al final (Integer.MAX_VALUE)")
    void sinNumeroVaAlFinal(String semestre) {
        assertThat(AvanceAcademicoService.semestreNumerico(semestre)).isEqualTo(Integer.MAX_VALUE);
    }

    @Test
    @DisplayName("un número demasiado grande no rompe: queda al final")
    void numeroDesbordado() {
        assertThat(AvanceAcademicoService.semestreNumerico("99999999999")).isEqualTo(Integer.MAX_VALUE);
    }
}
