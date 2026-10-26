package com.backend.dto;

import java.time.LocalDateTime;

public class EstudianteTutorDTO {

    private Long idEstudiante;
    private Long idPractica;
    private String rut;
    private String nombre;
    private String correo;
    private String asignaturaNombre;
    private String centroPractica;
    private String estadoObservacion; // "SIN_OBSERVACION", "OBSERVADO", "VISITA_PENDIENTE"
    private String estadoEvaluacion;  // "PENDIENTE", "EN_EVALUACION", "EVALUADO"
    private Double calificacion;
    private String observacionTexto;
    private LocalDateTime fechaActualizacion;

    public EstudianteTutorDTO() {
    }

    public EstudianteTutorDTO(Long idEstudiante, Long idPractica, String rut, String nombre, String correo,
                              String asignaturaNombre, String centroPractica, String estadoObservacion,
                              String estadoEvaluacion, Double calificacion, String observacionTexto,
                              LocalDateTime fechaActualizacion) {
        this.idEstudiante = idEstudiante;
        this.idPractica = idPractica;
        this.rut = rut;
        this.nombre = nombre;
        this.correo = correo;
        this.asignaturaNombre = asignaturaNombre;
        this.centroPractica = centroPractica;
        this.estadoObservacion = estadoObservacion;
        this.estadoEvaluacion = estadoEvaluacion;
        this.calificacion = calificacion;
        this.observacionTexto = observacionTexto;
        this.fechaActualizacion = fechaActualizacion;
    }

    public Long getIdEstudiante() {
        return idEstudiante;
    }

    public void setIdEstudiante(Long idEstudiante) {
        this.idEstudiante = idEstudiante;
    }

    public Long getIdPractica() {
        return idPractica;
    }

    public void setIdPractica(Long idPractica) {
        this.idPractica = idPractica;
    }

    public String getRut() {
        return rut;
    }

    public void setRut(String rut) {
        this.rut = rut;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getCorreo() {
        return correo;
    }

    public void setCorreo(String correo) {
        this.correo = correo;
    }

    public String getAsignaturaNombre() {
        return asignaturaNombre;
    }

    public void setAsignaturaNombre(String asignaturaNombre) {
        this.asignaturaNombre = asignaturaNombre;
    }

    public String getCentroPractica() {
        return centroPractica;
    }

    public void setCentroPractica(String centroPractica) {
        this.centroPractica = centroPractica;
    }

    public String getEstadoObservacion() {
        return estadoObservacion;
    }

    public void setEstadoObservacion(String estadoObservacion) {
        this.estadoObservacion = estadoObservacion;
    }

    public String getEstadoEvaluacion() {
        return estadoEvaluacion;
    }

    public void setEstadoEvaluacion(String estadoEvaluacion) {
        this.estadoEvaluacion = estadoEvaluacion;
    }

    public Double getCalificacion() {
        return calificacion;
    }

    public void setCalificacion(Double calificacion) {
        this.calificacion = calificacion;
    }

    public String getObservacionTexto() {
        return observacionTexto;
    }

    public void setObservacionTexto(String observacionTexto) {
        this.observacionTexto = observacionTexto;
    }

    public LocalDateTime getFechaActualizacion() {
        return fechaActualizacion;
    }

    public void setFechaActualizacion(LocalDateTime fechaActualizacion) {
        this.fechaActualizacion = fechaActualizacion;
    }
}
