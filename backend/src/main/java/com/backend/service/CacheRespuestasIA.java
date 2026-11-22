package com.backend.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicInteger;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import com.backend.model.RespuestaCacheIA;
import com.backend.repository.RespuestaCacheIARepository;

/**
 * Caché de respuestas de la IA para no gastar tokens en preguntas repetidas.
 *
 * <ul>
 *   <li><b>Coincidencia exacta</b> (todas las solicitudes): la clave es el hash del prompt de sistema, el historial que
 *       se envía y la pregunta normalizada (sin mayúsculas, tildes ni signos). Si llega la misma solicitud, se responde
 *       desde la caché. En una revisión de planificación incluye el texto del archivo, así que solo se reutiliza
 *       para el mismo archivo y la misma conversación (p. ej. al reabrir la revisión de un archivo ya revisado).</li>
 *   <li><b>Preguntas parecidas</b> (solo preguntas independientes: primer mensaje de una conversación general, sin
 *       historial ni archivo): «¿Qué es el DUA?» y «Qué significa DUA» de distintos alumnos comparten respuesta si
 *       la similitud de sus embeddings supera {@code ia.cache.similitud-minima}.</li>
 * </ul>
 * Las respuestas vencen tras {@code ia.cache.ttl-horas}. Nunca se guardan errores ni respuestas bloqueadas por los
 * guardrails.
 */
@Service
public class CacheRespuestasIA {

    private static final Logger logger = LoggerFactory.getLogger(CacheRespuestasIA.class);
    private static final int LARGO_MAXIMO_PREGUNTA = 1000;
    /** Cada cuántas escrituras se borran las entradas vencidas. */
    private static final int LIMPIEZA_CADA = 50;

    /** Solicitud preparada: su clave exacta, su contexto y (si es independiente) la pregunta normalizada. */
    public record Consulta(String clave, String contexto, String preguntaNormalizada) {
    }

    /** Respuesta encontrada y si fue por coincidencia exacta o por similitud. */
    public record Acierto(String texto, String proveedor, boolean exacto) {
    }

    private final RespuestaCacheIARepository repository;
    private final ServicioEmbeddings embeddings;
    private final TransactionTemplate transaccion;
    private final boolean habilitada;
    private final long ttlHoras;
    private final double similitudMinima;
    private final int maxCandidatas;
    private final AtomicInteger escrituras = new AtomicInteger();

    public CacheRespuestasIA(RespuestaCacheIARepository repository,
                             ServicioEmbeddings embeddings,
                             PlatformTransactionManager transactionManager,
                             @Value("${ia.cache.habilitada:true}") boolean habilitada,
                             @Value("${ia.cache.ttl-horas:168}") long ttlHoras,
                             @Value("${ia.cache.similitud-minima:0.95}") double similitudMinima,
                             @Value("${ia.cache.max-candidatas:300}") int maxCandidatas) {
        this.repository = repository;
        this.embeddings = embeddings;
        this.transaccion = new TransactionTemplate(transactionManager);
        this.habilitada = habilitada;
        this.ttlHoras = Math.max(1, ttlHoras);
        this.similitudMinima = similitudMinima;
        this.maxCandidatas = Math.max(1, maxCandidatas);
    }

    public boolean estaHabilitada() {
        return habilitada;
    }

    /**
     * @param mensajes             lo que se enviaría a la IA (sistema, historial y mensaje nuevo)
     * @param preguntaIndependiente la pregunta del alumno si no depende de historial ni archivo; si no, null
     */
    public static Consulta preparar(List<MensajeIA> mensajes, String preguntaIndependiente) {
        StringBuilder contexto = new StringBuilder();
        for (int i = 0; i < mensajes.size() - 1; i++) {
            MensajeIA m = mensajes.get(i);
            contexto.append(m.role()).append('\u0000').append(m.content()).append('\u0001');
        }
        String hashContexto = TextoIA.sha256(contexto.toString());
        String ultimo = mensajes.isEmpty() ? "" : mensajes.get(mensajes.size() - 1).content();
        String clave = TextoIA.sha256(hashContexto + "|" + TextoIA.normalizar(ultimo));
        String pregunta = preguntaIndependiente == null ? null : recortar(TextoIA.normalizar(preguntaIndependiente));
        return new Consulta(clave, hashContexto, pregunta == null || pregunta.isBlank() ? null : pregunta);
    }

    public Optional<Acierto> buscar(Consulta consulta) {
        if (!habilitada || consulta == null) return Optional.empty();
        try {
            LocalDateTime ahora = LocalDateTime.now();
            Optional<RespuestaCacheIA> exacta = repository.findByClaveAndExpiraAfter(consulta.clave(), ahora);
            if (exacta.isPresent()) {
                registrarAcierto(exacta.get().getIdCache());
                return Optional.of(new Acierto(exacta.get().getRespuesta(), exacta.get().getProveedor(), true));
            }
            if (consulta.preguntaNormalizada() == null) return Optional.empty();

            float[] vector = embeddings.locales().embedding(consulta.preguntaNormalizada());
            RespuestaCacheIA mejor = null;
            double mejorSimilitud = similitudMinima;
            for (RespuestaCacheIA c : repository.candidatas(consulta.contexto(), ahora, PageRequest.of(0, maxCandidatas))) {
                double s = TextoIA.coseno(vector, TextoIA.deBytes(c.getEmbedding()));
                if (s >= mejorSimilitud) {
                    mejor = c;
                    mejorSimilitud = s;
                }
            }
            if (mejor == null) return Optional.empty();
            registrarAcierto(mejor.getIdCache());
            return Optional.of(new Acierto(mejor.getRespuesta(), mejor.getProveedor(), false));
        } catch (RuntimeException e) {
            // La caché nunca debe impedir responder: ante un error se consulta a la IA
            logger.warn("[CacheIA] No se pudo consultar la caché ({}).", e.getClass().getSimpleName());
            return Optional.empty();
        }
    }

    public void guardar(Consulta consulta, String respuesta, String proveedor) {
        if (!habilitada || consulta == null || respuesta == null || respuesta.isBlank()) return;
        try {
            byte[] vector = consulta.preguntaNormalizada() == null ? null
                    : TextoIA.aBytes(embeddings.locales().embedding(consulta.preguntaNormalizada()));
            LocalDateTime expira = LocalDateTime.now().plusHours(ttlHoras);
            transaccion.executeWithoutResult(status -> {
                if (repository.findByClave(consulta.clave()).isPresent()) return;
                repository.save(new RespuestaCacheIA(consulta.clave(), consulta.contexto(), consulta.preguntaNormalizada(),
                        vector, respuesta, proveedor, expira));
            });
            if (escrituras.incrementAndGet() % LIMPIEZA_CADA == 0) {
                Integer borradas = transaccion.execute(status -> repository.eliminarVencidas(LocalDateTime.now()));
                if (borradas != null && borradas > 0) logger.info("[CacheIA] {} respuestas vencidas eliminadas.", borradas);
            }
        } catch (DataIntegrityViolationException e) {
            // Otra solicitud guardó la misma clave al mismo tiempo
            logger.debug("[CacheIA] Clave ya guardada en paralelo.");
        } catch (RuntimeException e) {
            logger.warn("[CacheIA] No se pudo guardar en la caché ({}).", e.getClass().getSimpleName());
        }
    }

    private void registrarAcierto(Long idCache) {
        try {
            transaccion.executeWithoutResult(status -> repository.findById(idCache).ifPresent(RespuestaCacheIA::registrarAcierto));
        } catch (RuntimeException e) {
            logger.debug("[CacheIA] No se pudo registrar el acierto.");
        }
    }

    private static String recortar(String texto) {
        return texto.length() <= LARGO_MAXIMO_PREGUNTA ? texto : texto.substring(0, LARGO_MAXIMO_PREGUNTA);
    }
}
