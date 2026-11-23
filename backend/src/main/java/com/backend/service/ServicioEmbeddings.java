package com.backend.service;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Elige el proveedor de embeddings según la configuración:
 * <ul>
 *   <li>{@code ia.embeddings.proveedor=local} (por defecto): se calculan en el servidor, sin claves ni costo.</li>
 *   <li>{@code ia.embeddings.proveedor=remoto}: un endpoint compatible con OpenAI (por defecto Gemini,
 *       {@code gemini-embedding-001}, con la misma GEMINI_API_KEY del respaldo del chat).</li>
 * </ul>
 * Si se pide el remoto pero no hay clave, se usa el local y se avisa en el log.
 */
@Service
public class ServicioEmbeddings {

    private static final Logger logger = LoggerFactory.getLogger(ServicioEmbeddings.class);

    private final ProveedorEmbeddings proveedor;
    private final EmbeddingsLocales locales = new EmbeddingsLocales();

    @Autowired
    public ServicioEmbeddings(@Value("${ia.embeddings.proveedor:local}") String tipo,
                              @Value("${ia.embeddings.url:https://generativelanguage.googleapis.com/v1beta/openai/embeddings}") String url,
                              @Value("${ia.embeddings.api-key:}") String apiKey,
                              @Value("${ia.embeddings.modelo:gemini-embedding-001}") String modelo,
                              @Value("${ia.embeddings.dimensiones:768}") Integer dimensiones,
                              @Value("${ia.embeddings.timeout-segundos:30}") int timeout) {
        ProveedorEmbeddings elegido = locales;
        if ("remoto".equalsIgnoreCase(tipo == null ? "" : tipo.trim())) {
            EmbeddingsCompatibleOpenAI remoto = new EmbeddingsCompatibleOpenAI(url, apiKey, modelo, dimensiones, timeout);
            if (remoto.estaConfigurado()) {
                elegido = remoto;
            } else {
                logger.warn("[RAG] ia.embeddings.proveedor=remoto sin clave: se usan embeddings locales.");
            }
        }
        this.proveedor = elegido;
        logger.info("[RAG] Embeddings: {}", proveedor.modelo());
    }

    ServicioEmbeddings(ProveedorEmbeddings proveedor) {
        this.proveedor = proveedor;
    }

    /** Modelo con que se indexan los fragmentos de planificación. */
    public String modelo() {
        return proveedor.modelo();
    }

    public List<float[]> embeddings(List<String> textos) {
        return proveedor.embeddings(textos);
    }

    public float[] embedding(String texto) {
        return proveedor.embedding(texto);
    }

    /** Siempre local (sin red): para comparar preguntas en la caché sin gastar llamadas. */
    public ProveedorEmbeddings locales() {
        return locales;
    }
}
