package com.backend.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

/**
 * Embeddings calculados en el propio servidor, sin servicios externos ni costo por token: un «hashing vectorizer»
 * con palabras y pares de palabras del español. No entiende sinónimos como un modelo neuronal, pero ubica muy bien
 * los fragmentos que comparten términos con la consulta (objetivo, evaluación, ticket de salida, fracciones…), que es
 * lo que se necesita para recuperar partes de una planificación y reconocer preguntas repetidas.
 */
public class EmbeddingsLocales implements ProveedorEmbeddings {

    public static final String MODELO = "local-hash-512-v1";
    static final int DIMENSION = 512;

    private static final Set<String> VACIAS = Set.of(
            "a", "al", "ante", "con", "de", "del", "desde", "e", "el", "en", "entre", "es", "esta", "este", "esto",
            "ha", "hay", "la", "las", "le", "les", "lo", "los", "mas", "me", "mi", "mis", "muy", "no", "o", "para",
            "pero", "por", "que", "se", "si", "sin", "sobre", "su", "sus", "te", "tu", "tus", "u", "un", "una", "uno",
            "unos", "unas", "y", "ya", "yo", "como", "cual", "son", "ser", "fue", "han", "hace", "puede", "cada");

    @Override
    public String modelo() {
        return MODELO;
    }

    @Override
    public List<float[]> embeddings(List<String> textos) {
        List<float[]> vectores = new ArrayList<>(textos.size());
        for (String texto : textos) vectores.add(vector(texto));
        return vectores;
    }

    private float[] vector(String texto) {
        float[] v = new float[DIMENSION];
        List<String> terminos = new ArrayList<>();
        for (String palabra : TextoIA.normalizar(texto).split(" ")) {
            if (palabra.length() < 2 || VACIAS.contains(palabra)) continue;
            terminos.add(raiz(palabra));
        }
        for (int i = 0; i < terminos.size(); i++) {
            sumar(v, terminos.get(i), 1.0f);
            if (i + 1 < terminos.size()) sumar(v, terminos.get(i) + "_" + terminos.get(i + 1), 0.7f);
        }
        // Frecuencias amortiguadas: un término repetido diez veces no pesa diez veces más
        for (int i = 0; i < v.length; i++) {
            v[i] = (float) (Math.signum(v[i]) * Math.log1p(Math.abs(v[i])));
        }
        return TextoIA.normalizarL2(v);
    }

    private static void sumar(float[] v, String termino, float peso) {
        int h = mezclar(termino.hashCode());
        int indice = Math.floorMod(h, DIMENSION);
        v[indice] += ((h >>> 16) & 1) == 0 ? peso : -peso;
    }

    /** Dispersa mejor los bits del hash de String (finalizador de MurmurHash3). */
    private static int mezclar(int h) {
        h ^= h >>> 16;
        h *= 0x85ebca6b;
        h ^= h >>> 13;
        h *= 0xc2b2ae35;
        h ^= h >>> 16;
        return h;
    }

    /** Raíz simple: plurales y algunos sufijos comunes («evaluaciones» y «evaluación» comparten raíz). */
    static String raiz(String palabra) {
        String p = palabra;
        for (String sufijo : new String[] {"aciones", "iciones", "ciones", "mente", "acion", "icion", "cion", "es", "s"}) {
            if (p.length() - sufijo.length() >= 4 && p.endsWith(sufijo)) {
                p = p.substring(0, p.length() - sufijo.length());
                break;
            }
        }
        return p;
    }
}
