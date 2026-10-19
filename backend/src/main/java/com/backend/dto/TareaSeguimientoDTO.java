package com.backend.dto;

import java.time.LocalDateTime;

public record TareaSeguimientoDTO(
    Long idEvidencia,
    Long idActividad,
    String tituloActividad,
    String asignatura,
    String semestre,
    String estado,
    Double calificacion,
    LocalDateTime fechaEntrega,
    String nombreArchivoEstudiante,
    String nombreArchivoRevision,
    boolean tieneArchivoEstudiante,
    boolean tieneArchivoRevision
) {}
