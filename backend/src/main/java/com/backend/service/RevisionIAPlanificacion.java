package com.backend.service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import com.backend.model.RetroalimentacionIA;
import com.backend.model.RetroalimentacionIA.Estado;
import com.backend.repository.RetroalimentacionIARepository;

/**
 * Lo que el chat necesita para las conversaciones de revisión de planificación: el prompt RetroPlani
 * con la planificación adjunta, las reglas para seguir conversando y la lectura del veredicto de la IA.
 * Separado de RetroalimentacionIAService para que ChatService no dependa de él (este último sí usa el chat).
 */
@Component
public class RevisionIAPlanificacion {

    /** Última línea con el veredicto; la IA la escribe solo al cerrar una retroalimentación completa. */
    private static final Pattern VEREDICTO = Pattern.compile(
            "VEREDICTO\\s*:\\s*\\**\\s*(APTO PARA ENVIAR|REQUIERE CORRECCIONES)", Pattern.CASE_INSENSITIVE);

    private final RetroalimentacionIARepository repository;
    private final String promptRetroPlani;
    private final int maxCaracteresHistorial;

    public RevisionIAPlanificacion(RetroalimentacionIARepository repository,
                                   @Value("${retroalimentacion.max-caracteres-historial:6000}") int maxCaracteresHistorial)
            throws IOException {
        this.repository = repository;
        this.maxCaracteresHistorial = maxCaracteresHistorial;
        try (InputStream entrada = new ClassPathResource("ia/retroplani-sistema.md").getInputStream()) {
            this.promptRetroPlani = new String(entrada.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    public Optional<RetroalimentacionIA> deConversacion(Long idConversacion) {
        return repository.findFirstByConversacionIdConversacion(idConversacion);
    }

    /** Solo se conversa con la IA mientras la revisión está abierta y quedan revisiones en el ciclo. */
    public void validarPuedeConversar(RetroalimentacionIA retro) {
        if (retro.getEstado() != Estado.NO_REVISADO) {
            throw new ChatException(HttpStatus.CONFLICT, "RETRO_REVISION_CERRADA",
                    "La IA ya terminó la revisión de esta planificación. Revisa su estado en «Retroalimentación».");
        }
        if (retro.getRevisionesIa() >= RetroalimentacionIA.MAX_REVISIONES_IA) {
            throw new ChatException(HttpStatus.CONFLICT, "RETRO_REVISIONES_AGOTADAS",
                    "Ya recibiste las " + RetroalimentacionIA.MAX_REVISIONES_IA + " revisiones de la IA para esta versión. "
                            + "Corrige tu planificación, súbela de nuevo y reinicia la revisión en «Retroalimentación».");
        }
    }

    /**
     * Historial que cabe en una solicitud de revisión. Es menor que el del chat general porque el prompt y la
     * planificación ya ocupan buena parte del límite de tokens por minuto de Groq (8.000 en el plan gratuito).
     */
    public int maxCaracteresHistorial() {
        return maxCaracteresHistorial;
    }

    public String promptSistema(RetroalimentacionIA retro) {
        return promptRetroPlani + "\n\n---\n\nPLANIFICACIÓN ADJUNTA (archivo «" + retro.getNombreArchivoRevisado() + "»):\n\n"
                + retro.getTextoPlanificacion();
    }

    /**
     * Registra una respuesta de la IA: si trae veredicto, cuenta como una revisión y, con «APTO», habilita
     * el envío al profesor. Sin veredicto (preguntas diagnósticas, dudas) no cambia nada.
     */
    public void registrarRespuesta(RetroalimentacionIA retro, String respuesta) {
        Optional<Boolean> apto = veredicto(respuesta);
        if (apto.isEmpty() || retro.getEstado() != Estado.NO_REVISADO) {
            return;
        }
        retro.setRevisionesIa(retro.getRevisionesIa() + 1);
        retro.setUltimaRevisionIa(respuesta);
        if (apto.get()) {
            retro.setEstado(Estado.REVISADO_POR_IA);
        } else {
            retro.tocar();
        }
    }

    /** true = APTO PARA ENVIAR, false = REQUIERE CORRECCIONES, vacío = la respuesta no trae veredicto. */
    static Optional<Boolean> veredicto(String respuesta) {
        if (respuesta == null) return Optional.empty();
        Matcher m = VEREDICTO.matcher(respuesta);
        String ultimo = null;
        while (m.find()) ultimo = m.group(1);
        return ultimo == null ? Optional.empty() : Optional.of(ultimo.equalsIgnoreCase("APTO PARA ENVIAR"));
    }
}
