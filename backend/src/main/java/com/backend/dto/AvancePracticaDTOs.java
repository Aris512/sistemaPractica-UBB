package com.backend.dto;

import java.util.List;

import com.backend.dto.EvaluacionPautaDTO;
import com.backend.model.RubricaPractica;

/** Objetos de la API de avance de la práctica (/api/rubricas-practica). */
public final class AvancePracticaDTOs {

    private AvancePracticaDTOs() {
    }

    /**
     * Práctica actual del estudiante, sus profesores colaboradores y sus evaluaciones. En las prácticas hasta 8.°
     * semestre, «evaluaciones» trae las pautas con que lo evalúan (una por pauta y evaluador) y es lo que mide el
     * seguimiento; «rubricas» son las 6 evaluaciones anteriores a las pautas, que se usan si no hay pautas.
     */
    public record AvancePracticaDTO(Long idPractica, List<ColaboradorDTO> colaboradores, List<RubricaPractica> rubricas,
                                    List<EvaluacionPautaDTO> evaluaciones) {
    }

    public record ColaboradorDTO(String nombre, String correo, String centro) {
    }

    public record CompletarRubricaRequest(Double nota, String rutEvaluador) {
    }
}
