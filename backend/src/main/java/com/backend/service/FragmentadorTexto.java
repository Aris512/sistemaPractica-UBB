package com.backend.service;

import java.util.ArrayList;
import java.util.List;

/**
 * Divide el texto de una planificación en fragmentos para el RAG.
 *
 * Corta por párrafos (y, si un párrafo es muy largo, por oraciones y luego por palabras) hasta un tamaño máximo.
 * Cada fragmento guarda su texto propio, sin repetir el anterior, para que al unir todos se recupere el documento
 * tal cual; el solape (el final del fragmento anterior) se entrega aparte y solo se usa al calcular el embedding,
 * para que un fragmento no pierda el contexto de lo que venía justo antes.
 */
public class FragmentadorTexto {

    /** texto: contenido propio del fragmento; contextoPrevio: final del fragmento anterior (solo para el embedding). */
    public record Fragmento(int orden, String texto, String contextoPrevio) {

        public String textoParaEmbedding() {
            return contextoPrevio.isEmpty() ? texto : contextoPrevio + "\n" + texto;
        }
    }

    private final int tamanoMaximo;
    private final int solape;

    public FragmentadorTexto(int tamanoMaximo, int solape) {
        if (tamanoMaximo < 100) throw new IllegalArgumentException("El tamaño de fragmento debe ser de al menos 100 caracteres.");
        this.tamanoMaximo = tamanoMaximo;
        this.solape = Math.max(0, Math.min(solape, tamanoMaximo / 2));
    }

    public List<Fragmento> fragmentar(String texto) {
        List<String> piezas = new ArrayList<>();
        if (texto == null || texto.isBlank()) return List.of();
        for (String parrafo : texto.strip().split("\\n")) {
            String p = parrafo.strip();
            if (p.isEmpty()) continue;
            if (p.length() <= tamanoMaximo) {
                piezas.add(p);
            } else {
                piezas.addAll(dividirLargo(p));
            }
        }

        List<String> bloques = new ArrayList<>();
        StringBuilder actual = new StringBuilder();
        for (String pieza : piezas) {
            if (actual.length() > 0 && actual.length() + 1 + pieza.length() > tamanoMaximo) {
                bloques.add(actual.toString());
                actual.setLength(0);
            }
            if (actual.length() > 0) actual.append('\n');
            actual.append(pieza);
        }
        if (actual.length() > 0) bloques.add(actual.toString());

        List<Fragmento> fragmentos = new ArrayList<>();
        for (int i = 0; i < bloques.size(); i++) {
            String previo = i == 0 ? "" : finalDe(bloques.get(i - 1));
            fragmentos.add(new Fragmento(i, bloques.get(i), previo));
        }
        return fragmentos;
    }

    /** Un párrafo que no cabe: primero por oraciones; una oración que tampoco cabe, por palabras. */
    private List<String> dividirLargo(String parrafo) {
        List<String> partes = new ArrayList<>();
        StringBuilder actual = new StringBuilder();
        for (String oracion : parrafo.split("(?<=[.!?;:])\\s+")) {
            for (String trozo : oracion.length() <= tamanoMaximo ? List.of(oracion) : porPalabras(oracion)) {
                if (actual.length() > 0 && actual.length() + 1 + trozo.length() > tamanoMaximo) {
                    partes.add(actual.toString());
                    actual.setLength(0);
                }
                if (actual.length() > 0) actual.append(' ');
                actual.append(trozo);
            }
        }
        if (actual.length() > 0) partes.add(actual.toString());
        return partes;
    }

    private List<String> porPalabras(String texto) {
        List<String> partes = new ArrayList<>();
        StringBuilder actual = new StringBuilder();
        for (String palabra : texto.split("\\s+")) {
            // Una «palabra» más larga que el máximo (p. ej. una URL) se corta a la fuerza
            while (palabra.length() > tamanoMaximo) {
                if (actual.length() > 0) {
                    partes.add(actual.toString());
                    actual.setLength(0);
                }
                partes.add(palabra.substring(0, tamanoMaximo));
                palabra = palabra.substring(tamanoMaximo);
            }
            if (actual.length() > 0 && actual.length() + 1 + palabra.length() > tamanoMaximo) {
                partes.add(actual.toString());
                actual.setLength(0);
            }
            if (actual.length() > 0) actual.append(' ');
            actual.append(palabra);
        }
        if (actual.length() > 0) partes.add(actual.toString());
        return partes;
    }

    /** Últimos caracteres del bloque, empezando en un límite de palabra. */
    private String finalDe(String bloque) {
        if (solape == 0 || bloque.length() <= solape) return solape == 0 ? "" : bloque;
        String cola = bloque.substring(bloque.length() - solape);
        int espacio = cola.indexOf(' ');
        return (espacio > 0 && espacio < cola.length() - 1 ? cola.substring(espacio + 1) : cola).strip();
    }
}
