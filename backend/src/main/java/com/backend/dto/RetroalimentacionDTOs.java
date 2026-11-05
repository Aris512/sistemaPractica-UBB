package com.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.backend.dto.PlanificacionDTOs.ArchivoPlanificacionDTO;

/** Objetos de la API de retroalimentación de planificaciones (/api/retroalimentaciones-ia). */
public final class RetroalimentacionDTOs {

    private RetroalimentacionDTOs() {
    }

    /**
     * Una planificación del alumno con el archivo que revisaría la IA y su retroalimentación (null si no empezó).
     * completa: tiene sus 5 archivos; puedeEnviarDirecto: puede enviarla al profesor sin pasar por la IA.
     */
    public record PlanificacionRetroDTO(Long idPlanificacion, LocalDateTime fechaCreacion, String asignatura,
                                        Long idDocumento, String nombreArchivo, boolean completa, boolean puedeEnviarDirecto,
                                        RetroDTO retroalimentacion) {
    }

    /**
     * Estado de la revisión. Los campos puede* dicen qué acciones habilita el backend; archivoCambiado indica
     * que la planificación actual no es la que revisó la IA en este ciclo. observaciones: lo que escribió el profesor.
     */
    public record RetroDTO(Long id, String estado, int revisionesIa, int maxRevisionesIa, int ciclo, Long idConversacion,
                           String nombreArchivoRevisado, boolean archivoCambiado, String comentarioProfesor,
                           String profesorRevisor, LocalDateTime fechaEnvioProfesor, LocalDateTime fechaRespuestaProfesor,
                           LocalDateTime fechaActualizacion, boolean puedeRevisarIa, boolean puedeEnviar, boolean puedeReiniciar,
                           List<ObservacionDTO> observaciones) {
    }

    /** Resultado de abrir la revisión con la IA: la conversación a mostrar y si ya se envió el primer mensaje. */
    public record InicioRevisionDTO(Long idConversacion, boolean conversacionNueva, String aviso) {
    }

    /** Fila de la bandeja del profesor. */
    public record RetroProfesorDTO(Long id, String estado, String rutEstudiante, String nombreEstudiante,
                                   String asignatura, int ciclo, int revisionesIa, Long idDocumento, String nombreArchivo,
                                   boolean archivoCambiado, String comentarioProfesor, LocalDateTime fechaEnvioProfesor,
                                   LocalDateTime fechaRespuestaProfesor) {
    }

    /** Lo que el profesor le escribió al alumno: una observación o su decisión (APROBACION / RECHAZO). */
    public record ObservacionDTO(Long id, String tipo, String texto, String profesor, int ciclo, LocalDateTime fecha) {
    }

    /** Mensaje de la conversación de revisión del alumno con la IA (rol USER o ASSISTANT). */
    public record MensajeChatDTO(String rol, String contenido, LocalDateTime fecha) {
    }

    /**
     * Detalle para revisar: la fila, la última retroalimentación de la IA, los 5 archivos de la planificación, la
     * conversación del alumno con la IA y el historial de observaciones. puedeObservar: admite observaciones nuevas.
     */
    public record RetroProfesorDetalleDTO(RetroProfesorDTO retroalimentacion, String ultimaRevisionIa,
                                          List<ArchivoPlanificacionDTO> archivos, List<MensajeChatDTO> conversacion,
                                          List<ObservacionDTO> observaciones, boolean puedeObservar) {
    }

    public record RespuestaProfesorRequest(Boolean aprobado, String comentario) {
    }

    public record ObservacionRequest(String texto) {
    }
}
