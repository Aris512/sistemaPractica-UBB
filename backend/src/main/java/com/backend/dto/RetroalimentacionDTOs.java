package com.backend.dto;

import java.time.LocalDateTime;

/** Objetos de la API de retroalimentación de planificaciones (/api/retroalimentaciones-ia). */
public final class RetroalimentacionDTOs {

    private RetroalimentacionDTOs() {
    }

    /** Una planificación del alumno con el archivo que revisaría la IA y su retroalimentación (null si no empezó). */
    public record PlanificacionRetroDTO(Long idPlanificacion, LocalDateTime fechaCreacion, String asignatura,
                                        Long idDocumento, String nombreArchivo, RetroDTO retroalimentacion) {
    }

    /**
     * Estado de la revisión. Los campos puede* dicen qué acciones habilita el backend; archivoCambiado indica
     * que la planificación actual no es la que revisó la IA en este ciclo.
     */
    public record RetroDTO(Long id, String estado, int revisionesIa, int maxRevisionesIa, int ciclo, Long idConversacion,
                           String nombreArchivoRevisado, boolean archivoCambiado, String comentarioProfesor,
                           String profesorRevisor, LocalDateTime fechaEnvioProfesor, LocalDateTime fechaRespuestaProfesor,
                           LocalDateTime fechaActualizacion, boolean puedeRevisarIa, boolean puedeEnviar, boolean puedeReiniciar) {
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

    /** Detalle para revisar: la fila más la última retroalimentación de la IA. */
    public record RetroProfesorDetalleDTO(RetroProfesorDTO retroalimentacion, String ultimaRevisionIa) {
    }

    public record RespuestaProfesorRequest(Boolean aprobado, String comentario) {
    }
}
