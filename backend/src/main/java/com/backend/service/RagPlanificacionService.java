package com.backend.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import com.backend.model.Documento;
import com.backend.model.FragmentoPlanificacion;
import com.backend.repository.DocumentoRepository;
import com.backend.repository.FragmentoPlanificacionRepository;

/**
 * RAG de las planificaciones: divide el archivo «Planificación» en fragmentos, calcula sus embeddings y los guarda
 * (tabla fragmento_planificacion). Al conversar, en vez de mandar siempre el documento entero (recortado a un
 * máximo), entrega a la IA:
 * <ul>
 *   <li>el documento completo cuando cabe en el presupuesto (la mayoría de las planificaciones);</li>
 *   <li>si no cabe, los fragmentos más parecidos a la consulta, en el orden del documento, sin pasar el presupuesto.</li>
 * </ul>
 * Así una planificación larga ya no se corta al final y cada pregunta del alumno gasta solo los tokens de lo relevante.
 *
 * La indexación es perezosa e idempotente: ocurre la primera vez que se necesita un archivo y se repite solo si
 * cambió el modelo de embeddings. Si algo falla (archivo ilegible, proveedor caído) se devuelve vacío y el chat usa
 * el texto ya guardado en la retroalimentación, como antes.
 */
@Service
public class RagPlanificacionService {

    private static final Logger logger = LoggerFactory.getLogger(RagPlanificacionService.class);

    /** Consulta base para una revisión completa: prioriza los componentes de toda planificación. */
    static final String CONSULTA_REVISION = "objetivo de aprendizaje habilidad inicio desarrollo cierre actividades "
            + "evaluacion ticket de salida recursos guia DUA conocimientos previos tiempos";

    /** Texto que se entrega a la IA y cuánto del documento incluye. */
    public record ContextoArchivo(String texto, boolean completo, int fragmentosUsados, int fragmentosTotales) {
    }

    private final FragmentoPlanificacionRepository fragmentoRepository;
    private final DocumentoRepository documentoRepository;
    private final PlanificacionTextoExtractor extractor;
    private final ServicioEmbeddings embeddings;
    private final TransactionTemplate transaccion;
    private final FragmentadorTexto fragmentador;
    private final boolean habilitado;
    private final int maxCaracteresRevision;
    private final int maxCaracteresConsulta;

    public RagPlanificacionService(FragmentoPlanificacionRepository fragmentoRepository,
                                   DocumentoRepository documentoRepository,
                                   PlanificacionTextoExtractor extractor,
                                   ServicioEmbeddings embeddings,
                                   PlatformTransactionManager transactionManager,
                                   @Value("${ia.rag.habilitado:true}") boolean habilitado,
                                   @Value("${ia.rag.tamano-fragmento:900}") int tamanoFragmento,
                                   @Value("${ia.rag.solape:150}") int solape,
                                   @Value("${ia.rag.max-caracteres-revision:8000}") int maxCaracteresRevision,
                                   @Value("${ia.rag.max-caracteres-consulta:5000}") int maxCaracteresConsulta) {
        this.fragmentoRepository = fragmentoRepository;
        this.documentoRepository = documentoRepository;
        this.extractor = extractor;
        this.embeddings = embeddings;
        this.transaccion = new TransactionTemplate(transactionManager);
        this.fragmentador = new FragmentadorTexto(tamanoFragmento, solape);
        this.habilitado = habilitado;
        this.maxCaracteresRevision = maxCaracteresRevision;
        this.maxCaracteresConsulta = maxCaracteresConsulta;
    }

    public boolean estaHabilitado() {
        return habilitado;
    }

    /**
     * Texto del archivo para este mensaje.
     *
     * @param consulta        lo que se busca (mensaje del alumno y la última respuesta de la IA)
     * @param revisionCompleta true al revisar un archivo nuevo: presupuesto mayor y prioridad a los componentes
     */
    public Optional<ContextoArchivo> contexto(Long idDocumento, String consulta, boolean revisionCompleta) {
        if (!habilitado || idDocumento == null) return Optional.empty();
        try {
            List<FragmentoPlanificacion> fragmentos = fragmentosDe(idDocumento);
            if (fragmentos.isEmpty()) return Optional.empty();
            int presupuesto = revisionCompleta ? maxCaracteresRevision : maxCaracteresConsulta;
            String busqueda = revisionCompleta ? CONSULTA_REVISION + " " + nulo(consulta) : nulo(consulta);
            return Optional.of(seleccionar(fragmentos, busqueda, presupuesto));
        } catch (RuntimeException e) {
            logger.warn("[RAG] No se pudo usar el RAG del documento {} ({}): se usa el texto guardado.",
                    idDocumento, e.getClass().getSimpleName());
            return Optional.empty();
        }
    }

    /** Indexa el documento si aún no lo está con el modelo actual y devuelve sus fragmentos en orden. */
    public List<FragmentoPlanificacion> fragmentosDe(Long idDocumento) {
        String modelo = embeddings.modelo();
        List<FragmentoPlanificacion> existentes =
                fragmentoRepository.findByDocumentoIdDocumentoAndModeloOrderByOrdenAsc(idDocumento, modelo);
        if (!existentes.isEmpty()) return existentes;

        Documento documento = documentoRepository.findById(idDocumento).orElse(null);
        if (documento == null) return List.of();

        // Lectura del archivo y embeddings fuera de la transacción: pueden tardar (o ir por red)
        List<FragmentadorTexto.Fragmento> partes = fragmentador.fragmentar(extractor.extraerCompleto(documento));
        if (partes.isEmpty()) return List.of();
        List<float[]> vectores = embeddings.embeddings(partes.stream().map(FragmentadorTexto.Fragmento::textoParaEmbedding).toList());

        try {
            transaccion.executeWithoutResult(status -> {
                fragmentoRepository.eliminarDeOtrosModelos(idDocumento, modelo);
                if (fragmentoRepository.existsByDocumentoIdDocumentoAndModelo(idDocumento, modelo)) return;
                Documento referencia = documentoRepository.getReferenceById(idDocumento);
                List<FragmentoPlanificacion> nuevos = new ArrayList<>();
                for (int i = 0; i < partes.size(); i++) {
                    nuevos.add(new FragmentoPlanificacion(referencia, modelo, partes.get(i).orden(), partes.get(i).texto(),
                            TextoIA.aBytes(vectores.get(i))));
                }
                fragmentoRepository.saveAll(nuevos);
            });
            logger.info("[RAG] Documento {} indexado: {} fragmentos ({}).", idDocumento, partes.size(), modelo);
        } catch (DataIntegrityViolationException e) {
            // Otra solicitud lo indexó al mismo tiempo: se usan sus fragmentos
            logger.debug("[RAG] Documento {} indexado en paralelo.", idDocumento);
        }
        return fragmentoRepository.findByDocumentoIdDocumentoAndModeloOrderByOrdenAsc(idDocumento, modelo);
    }

    ContextoArchivo seleccionar(List<FragmentoPlanificacion> fragmentos, String consulta, int presupuesto) {
        int total = fragmentos.stream().mapToInt(f -> f.getTexto().length() + 1).sum();
        if (total <= presupuesto) {
            String completo = String.join("\n", fragmentos.stream().map(FragmentoPlanificacion::getTexto).toList());
            return new ContextoArchivo(completo, true, fragmentos.size(), fragmentos.size());
        }

        float[] vectorConsulta = embeddings.embedding(consulta == null || consulta.isBlank() ? CONSULTA_REVISION : consulta);
        List<FragmentoPlanificacion> porSimilitud = new ArrayList<>(fragmentos);
        porSimilitud.sort(Comparator.comparingDouble(
                (FragmentoPlanificacion f) -> TextoIA.coseno(vectorConsulta, TextoIA.deBytes(f.getEmbedding()))).reversed());

        // El primer fragmento (título, curso, objetivo) siempre entra: da el marco de la clase
        Set<Integer> elegidos = new HashSet<>();
        int usados = 0;
        FragmentoPlanificacion primero = fragmentos.get(0);
        if (primero.getTexto().length() <= presupuesto) {
            elegidos.add(primero.getOrden());
            usados += primero.getTexto().length();
        }
        for (FragmentoPlanificacion f : porSimilitud) {
            if (elegidos.contains(f.getOrden())) continue;
            int costo = f.getTexto().length() + 40;
            if (usados + costo > presupuesto) continue;
            elegidos.add(f.getOrden());
            usados += costo;
        }

        StringBuilder texto = new StringBuilder();
        int anterior = -1;
        for (FragmentoPlanificacion f : fragmentos) {
            if (!elegidos.contains(f.getOrden())) continue;
            if (anterior >= 0 && f.getOrden() != anterior + 1) texto.append("\n[…]\n");
            else if (texto.length() > 0) texto.append('\n');
            texto.append(f.getTexto());
            anterior = f.getOrden();
        }
        return new ContextoArchivo(texto.toString(), false, elegidos.size(), fragmentos.size());
    }

    private static String nulo(String texto) {
        return texto == null ? "" : texto;
    }
}
