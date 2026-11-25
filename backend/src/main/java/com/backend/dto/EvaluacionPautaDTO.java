package com.backend.dto;

import java.time.LocalDateTime;

/**
 * Una evaluación con pauta que le corresponde al estudiante en una asignatura: una por cada pauta y evaluador
 * (profesor colaborador, tutor o profesor de asignatura). Sin aplicación registrada queda PENDIENTE.
 *
 * @param estado     FINALIZADA (cuenta con su nota), BORRADOR (en curso) o PENDIENTE (sin registrar)
 * @param evaluadorRol COLABORADOR, TUTOR o ACADEMICO
 * @param fecha      fecha de finalización o, si no está finalizada, de la última actualización
 */
public record EvaluacionPautaDTO(Long idPauta, Long idAplicacion, Long idPractica, String codigo, String titulo,
                                 String asignatura, String semestre, String evaluadorRol, String evaluadorNombre,
                                 String estado, Double nota, LocalDateTime fecha) {

    public static final String PENDIENTE = "PENDIENTE";
}
