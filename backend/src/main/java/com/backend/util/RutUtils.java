package com.backend.util;

public final class RutUtils {

    private RutUtils() {
        // Utility class
    }

    /**
     * Limpia un RUT eliminando puntos, guiones y espacios en blanco, y convirtiendo a mayúsculas.
     * Ejemplo: " 12.345.678-k " -> "12345678K"
     */
    public static String clean(String rut) {
        if (rut == null) {
            return "";
        }
        return rut.replace(".", "")
                  .replace("-", "")
                  .trim()
                  .toUpperCase();
    }

    /**
     * Valida si un RUT chileno es válido según el algoritmo Módulo 11.
     */
    public static boolean isValid(String rut) {
        if (rut == null || rut.isBlank()) {
            return false;
        }

        String cleaned = clean(rut);

        // Longitud mínima 8 caracteres (7 dígitos + DV) y máxima 9 (8 dígitos + DV)
        if (!cleaned.matches("^[0-9]{7,8}[0-9K]$")) {
            return false;
        }

        String body = cleaned.substring(0, cleaned.length() - 1);
        char dv = cleaned.charAt(cleaned.length() - 1);

        return calculateDv(body) == dv;
    }

    /**
     * Calcula el dígito verificador para un cuerpo de RUT numérico mediante Módulo 11.
     */
    public static char calculateDv(String body) {
        int sum = 0;
        int multiplier = 2;

        for (int i = body.length() - 1; i >= 0; i--) {
            int digit = Character.getNumericValue(body.charAt(i));
            sum += digit * multiplier;
            multiplier = (multiplier == 7) ? 2 : multiplier + 1;
        }

        int remainder = 11 - (sum % 11);
        if (remainder == 11) {
            return '0';
        } else if (remainder == 10) {
            return 'K';
        } else {
            return Character.forDigit(remainder, 10);
        }
    }

    /**
     * Formatea un RUT a formato estándar sin puntos y con guión: "12345678-9".
     */
    public static String formatStandard(String rut) {
        if (rut == null || rut.isBlank()) {
            return "";
        }
        String cleaned = clean(rut);
        if (cleaned.length() < 2) {
            return cleaned;
        }
        String body = cleaned.substring(0, cleaned.length() - 1);
        char dv = cleaned.charAt(cleaned.length() - 1);
        return body + "-" + dv;
    }

    /**
     * Formatea un RUT con puntos y guión: "12.345.678-9".
     */
    public static String formatWithDots(String rut) {
        if (rut == null || rut.isBlank()) {
            return "";
        }
        String cleaned = clean(rut);
        if (cleaned.length() < 2) {
            return cleaned;
        }
        String body = cleaned.substring(0, cleaned.length() - 1);
        char dv = cleaned.charAt(cleaned.length() - 1);

        StringBuilder sb = new StringBuilder();
        int count = 0;
        for (int i = body.length() - 1; i >= 0; i--) {
            sb.append(body.charAt(i));
            count++;
            if (count % 3 == 0 && i > 0) {
                sb.append('.');
            }
        }
        return sb.reverse().toString() + "-" + dv;
    }
}
