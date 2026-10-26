package com.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

/** DTOs del módulo de pautas digitales. */
public final class PautaDTOs {

    private PautaDTOs() {}

    public record CriterioDTO(Long id, Integer orden, String dimension, String numero, String texto) {}

    public record PautaResumenDTO(Long id, String codigo, String titulo, String asignatura, String tipo,
                                  String especialidad, String momento, String evaluador,
                                  Integer criteriosCount, Integer puntajeMaximo, String ponderacion,
                                  String version, Boolean activa,
                                  // Estado de la aplicación para una práctica concreta (null si no aplica)
                                  Long aplicacionId, String estadoAplicacion, Double nota) {}

    public record PautaDetalleDTO(Long id, String codigo, String titulo, String asignatura, String tipo,
                                  String especialidad, String momento, String evaluador,
                                  Integer escalaMin, Integer escalaMax, String modoCalculo, Integer exigencia,
                                  Integer puntajeMaximo, String ponderacion, String instrucciones,
                                  String version, Boolean activa, List<CriterioDTO> criterios) {}

    /** Cuerpo para crear/editar una pauta (gestión de pautas). */
    public record PautaRequest(String codigo, String titulo, String asignatura, String tipo,
                               String especialidad, String momento, String evaluador,
                               Integer escalaMin, Integer escalaMax, String modoCalculo, Integer exigencia,
                               String ponderacion, String instrucciones, String version, Boolean activa,
                               List<CriterioRequest> criterios) {}

    public record CriterioRequest(String dimension, String numero, String texto) {}

    public record RespuestaDTO(Long criterioId, Integer puntaje) {}

    public record AplicacionDTO(Long id, Long pautaId, Long practicaId, String estado,
                                String evaluadorRut, String evaluadorNombre, String observaciones,
                                List<RespuestaDTO> respuestas, Integer respondidos, Integer totalCriterios,
                                Double puntajeObtenido, Double puntajeMaximo, Double nota,
                                LocalDateTime fechaActualizacion, LocalDateTime fechaFinalizacion) {}

    /** Guardado (borrador o definitivo) de una pauta; idempotente para autoguardado desde tablet/móvil. */
    public record GuardarAplicacionRequest(String evaluadorRut, String evaluadorNombre, String observaciones,
                                           List<RespuestaDTO> respuestas, Boolean finalizar) {}

    /** Fila de resultados de pautas para estudiante, profesor de asignatura y coordinador. */
    public record ResultadoDTO(Long aplicacionId, Long pautaId, String pautaCodigo, String pautaTitulo,
                               String asignatura, String evaluadorRol, String evaluadorNombre,
                               Long practicaId, String estudianteNombre, String estudianteRut,
                               String estado, Double puntajeObtenido, Double puntajeMaximo, Double nota,
                               String modoCalculo, String ponderacion,
                               LocalDateTime fechaActualizacion, LocalDateTime fechaFinalizacion) {}
}
