package com.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

/** Objetos de la API de planificaciones (/api/planificaciones). */
public final class PlanificacionDTOs {

    private PlanificacionDTOs() {
    }

    /** Planificación con sus 5 categorías de archivo; pendientes lista las categorías aún sin archivo. */
    public record PlanificacionDTO(Long idPlanificacion, LocalDateTime fechaCreacion, String asignatura,
                                   List<ArchivoPlanificacionDTO> archivos, List<String> pendientes, boolean completa) {
    }

    /** Una categoría de la planificación; idDocumento es null si el archivo está pendiente de subir. */
    public record ArchivoPlanificacionDTO(String categoria, String etiqueta, Long idDocumento, String nombre,
                                          Long tamanioBytes, LocalDateTime fechaCarga, String urlDescarga) {
    }
}
