package com.backend.service;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.MediaType;
import org.springframework.http.client.BufferingClientHttpRequestFactory;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

/**
 * Embeddings de un endpoint con el formato de OpenAI (/embeddings). Sirve para Gemini mediante su endpoint compatible
 * (modelo gemini-embedding-001) o para cualquier proveedor similar. Nunca registra la clave ni los textos.
 */
public class EmbeddingsCompatibleOpenAI implements ProveedorEmbeddings {

    /** Textos por solicitud: los proveedores limitan cuántos aceptan juntos. */
    private static final int LOTE = 50;

    private final String modelo;
    private final String apiKey;
    private final Integer dimensiones;
    private final RestClient restClient;

    public EmbeddingsCompatibleOpenAI(String url, String apiKey, String modelo, Integer dimensiones, int timeoutSegundos) {
        this.modelo = modelo == null ? "" : modelo.trim();
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.dimensiones = dimensiones != null && dimensiones > 0 ? dimensiones : null;
        HttpClient httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
        JdkClientHttpRequestFactory fabrica = new JdkClientHttpRequestFactory(httpClient);
        fabrica.setReadTimeout(Duration.ofSeconds(timeoutSegundos));
        this.restClient = RestClient.builder()
                .baseUrl(url)
                .requestFactory(new BufferingClientHttpRequestFactory(fabrica))
                .build();
    }

    public boolean estaConfigurado() {
        return !apiKey.isEmpty() && !modelo.isEmpty();
    }

    @Override
    public String modelo() {
        return "remoto:" + modelo + (dimensiones != null ? ":" + dimensiones : "");
    }

    @Override
    @SuppressWarnings("unchecked")
    public List<float[]> embeddings(List<String> textos) {
        List<float[]> resultado = new ArrayList<>(textos.size());
        for (int desde = 0; desde < textos.size(); desde += LOTE) {
            List<String> lote = textos.subList(desde, Math.min(textos.size(), desde + LOTE));
            Map<String, Object> cuerpo = new LinkedHashMap<>();
            cuerpo.put("model", modelo);
            cuerpo.put("input", lote);
            if (dimensiones != null) cuerpo.put("dimensions", dimensiones);

            Map<String, Object> respuesta = restClient.post()
                    .header("Authorization", "Bearer " + apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(cuerpo)
                    .retrieve()
                    .body(Map.class);
            List<Map<String, Object>> datos = respuesta == null ? null : (List<Map<String, Object>>) respuesta.get("data");
            if (datos == null || datos.size() != lote.size()) {
                throw new IllegalStateException("El proveedor de embeddings no devolvió un vector por texto.");
            }
            datos.sort((a, b) -> Integer.compare(((Number) a.getOrDefault("index", 0)).intValue(),
                    ((Number) b.getOrDefault("index", 0)).intValue()));
            for (Map<String, Object> dato : datos) {
                List<Number> valores = (List<Number>) dato.get("embedding");
                float[] v = new float[valores.size()];
                for (int i = 0; i < v.length; i++) v[i] = valores.get(i).floatValue();
                resultado.add(TextoIA.normalizarL2(v));
            }
        }
        return resultado;
    }
}
