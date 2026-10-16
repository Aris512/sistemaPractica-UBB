package com.backend;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

import com.backend.util.RutUtils;

class RutUtilsTest {

    @Test
    void limpiaRutEliminandoPuntosGuionesYEspacios() {
        assertEquals("12345678K", RutUtils.clean(" 12.345.678-k "));
        assertEquals("", RutUtils.clean(null));
    }

    @Test
    void formateaRutConPuntosYGuion() {
        assertEquals("12.345.678-5", RutUtils.formatWithDots("123456785"));
    }

    @Test
    void formateaRutEstandarSinPuntos() {
        assertEquals("12345678-5", RutUtils.formatStandard("123456785"));
    }

    @Test
    void validaRutCorrectoPorModulo11() {
        assertTrue(RutUtils.isValid("12.345.678-5"));
        assertTrue(RutUtils.isValid("123456785"));
    }

    @Test
    void rechazaRutInvalido() {
        assertFalse(RutUtils.isValid("12.345.678-1"));
        assertFalse(RutUtils.isValid("123"));
        assertFalse(RutUtils.isValid("abc"));
        assertFalse(RutUtils.isValid(null));
    }
}
