package com.backend.dto;

import java.util.List;

import com.backend.model.RubricaPractica;

/** Objetos de la API de avance de la práctica (/api/rubricas-practica). */
public final class AvancePracticaDTOs {

    private AvancePracticaDTOs() {
    }

    /** Práctica actual del estudiante, sus profesores colaboradores y las 6 evaluaciones con su estado. */
    public record AvancePracticaDTO(Long idPractica, List<ColaboradorDTO> colaboradores, List<RubricaPractica> rubricas) {
    }

    public record ColaboradorDTO(String nombre, String correo, String centro) {
    }

    public record CompletarRubricaRequest(Double nota, String rutEvaluador) {
    }
}
