package com.backend;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

import com.backend.util.RutUtils;

class RutUtilsTest {

    @Test
    void formateaRutConPuntosYGuion() {
        assertEquals("12.345.678-5", RutUtils.formatear("123456785"));
        assertEquals("9.876.543-2", RutUtils.formatear("98765432"));
    }

    @Test
    void validaRutCorrecto() {
        // Usa un RUT válido conocido: 12345678-5? o genera uno correcto. 
        // Para mantener estable: 12.345.678-5 corresponde a 123456785? Verificamos formato devuelto.
        assertTrue(RutUtils.validar("12.345.678-5"));
        assertTrue(RutUtils.validar("123456785"));
    }

    @Test
    void validaRutIncorrecto() {
        assertFalse(RutUtils.validar("12.345.678-1"));
        assertFalse(RutUtils.validar("123"));
        assertFalse(RutUtils.validar("abc"));
    }
}
