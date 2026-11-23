package com.backend.service;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.text.Normalizer;
import java.util.HexFormat;
import java.util.Locale;

/** Utilidades de texto y vectores compartidas por el RAG, la caché y los guardrails de la IA. */
public final class TextoIA {

    private TextoIA() {
    }

    /**
     * Minúsculas, sin tildes ni signos, con espacios simples. «¿Qué es el DUA?» y «que es el dua» quedan iguales,
     * así una pregunta repetida con otra puntuación se reconoce como la misma.
     */
    public static String normalizar(String texto) {
        if (texto == null) return "";
        String sinTildes = Normalizer.normalize(texto, Normalizer.Form.NFD).replaceAll("\\p{M}+", "");
        return sinTildes.toLowerCase(Locale.ROOT)
                .replaceAll("[^\\p{L}\\p{N}]+", " ")
                .strip();
    }

    /** Similitud coseno; los vectores de este proyecto ya vienen normalizados, pero se calcula completa por seguridad. */
    public static double coseno(float[] a, float[] b) {
        if (a == null || b == null || a.length != b.length || a.length == 0) return 0;
        double punto = 0, na = 0, nb = 0;
        for (int i = 0; i < a.length; i++) {
            punto += a[i] * b[i];
            na += a[i] * a[i];
            nb += b[i] * b[i];
        }
        return (na == 0 || nb == 0) ? 0 : punto / (Math.sqrt(na) * Math.sqrt(nb));
    }

    public static float[] normalizarL2(float[] v) {
        double norma = 0;
        for (float x : v) norma += x * x;
        norma = Math.sqrt(norma);
        if (norma == 0) return v;
        for (int i = 0; i < v.length; i++) v[i] = (float) (v[i] / norma);
        return v;
    }

    /** Vector como bytes (float32, little endian) para guardarlo en la base. */
    public static byte[] aBytes(float[] vector) {
        ByteBuffer buffer = ByteBuffer.allocate(vector.length * Float.BYTES).order(ByteOrder.LITTLE_ENDIAN);
        for (float x : vector) buffer.putFloat(x);
        return buffer.array();
    }

    public static float[] deBytes(byte[] bytes) {
        if (bytes == null) return new float[0];
        ByteBuffer buffer = ByteBuffer.wrap(bytes).order(ByteOrder.LITTLE_ENDIAN);
        float[] vector = new float[bytes.length / Float.BYTES];
        for (int i = 0; i < vector.length; i++) vector[i] = buffer.getFloat();
        return vector;
    }

    public static String sha256(String texto) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest((texto == null ? "" : texto).getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 no disponible", e);
        }
    }
}
