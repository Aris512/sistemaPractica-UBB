package com.backend.dto;

import java.time.LocalDateTime;

public record TareaSeguimientoDTO(
    Long idEvidencia,
    Long idActividad,
    String tituloActividad,
    String descripcionActividad,
    String asignatura,
    Long idAsignatura,
    String semestre,
    String estado,
    Double calificacion,
    String estadoAprobacion,
    LocalDateTime fechaEntrega,
    LocalDateTime fechaRevision,
    String retroalimentacion,
    String revisadoPorNombre,
    String revisadoPorRut,
    String nombreArchivoEstudiante,
    String nombreArchivoRevision,
    boolean tieneArchivoEstudiante,
    boolean tieneArchivoRevision
) {}
