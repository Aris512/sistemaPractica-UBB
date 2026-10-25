package com.backend.dto;

import java.time.LocalDateTime;

public record PortafolioItemDTO(
    Long idDocumento,
    String nombre,
    String tipo,
    String ubicacion,
    LocalDateTime fechaCarga,
    String tamanio,
    Long tamanioBytes,
    String rutEstudiante,
    String subidoPorRut,
    String subidoPorNombre,
    String urlDescarga
) {}
