package com.backend.service;

import java.util.List;

/** Convierte textos en vectores (embeddings) para buscar por similitud. */
public interface ProveedorEmbeddings {

    /** Identificador del modelo: los vectores de modelos distintos no se comparan entre sí. */
    String modelo();

    /** Un vector normalizado (norma 1) por cada texto, en el mismo orden. */
    List<float[]> embeddings(List<String> textos);

    default float[] embedding(String texto) {
        return embeddings(List.of(texto)).get(0);
    }
}
