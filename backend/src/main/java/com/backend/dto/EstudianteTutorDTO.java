package com.backend.dto;

import java.time.LocalDateTime;

public class EstudianteTutorDTO {

    private Long idEstudiante;
    private Long idPractica;
    private Long idEvaluacion;
    private String rut;
    private String nombre;
    private String correo;
    private String asignaturaNombre;
    private String centroPractica;
    private String estadoObservacion; // "SIN_OBSERVACION", "OBSERVADO", "VISITA_PENDIENTE"
    private String estadoEvaluacion;  // "PENDIENTE", "EN_EVALUACION", "EVALUADO"
    private Double calificacion;
    private String observacionTexto;
    private String tipoEvaluacion;
    private String evaluadorRut;
    private String evaluadorNombre;
    private String tipoEvaluador;
    private String archivoUrl;
    private String nombreArchivo;
    private Boolean tieneArchivo;
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

    public Long getIdEvaluacion() {
        return idEvaluacion;
    }

    public void setIdEvaluacion(Long idEvaluacion) {
        this.idEvaluacion = idEvaluacion;
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

    public String getTipoEvaluacion() {
        return tipoEvaluacion;
    }

    public void setTipoEvaluacion(String tipoEvaluacion) {
        this.tipoEvaluacion = tipoEvaluacion;
    }

    public String getEvaluadorRut() {
        return evaluadorRut;
    }

    public void setEvaluadorRut(String evaluadorRut) {
        this.evaluadorRut = evaluadorRut;
    }

    public String getEvaluadorNombre() {
        return evaluadorNombre;
    }

    public void setEvaluadorNombre(String evaluadorNombre) {
        this.evaluadorNombre = evaluadorNombre;
    }

    public String getTipoEvaluador() {
        return tipoEvaluador;
    }

    public void setTipoEvaluador(String tipoEvaluador) {
        this.tipoEvaluador = tipoEvaluador;
    }

    public String getArchivoUrl() {
        return archivoUrl;
    }

    public void setArchivoUrl(String archivoUrl) {
        this.archivoUrl = archivoUrl;
    }

    public String getNombreArchivo() {
        return nombreArchivo;
    }

    public void setNombreArchivo(String nombreArchivo) {
        this.nombreArchivo = nombreArchivo;
    }

    public Boolean getTieneArchivo() {
        return tieneArchivo;
    }

    public void setTieneArchivo(Boolean tieneArchivo) {
        this.tieneArchivo = tieneArchivo;
    }

    public LocalDateTime getFechaActualizacion() {
        return fechaActualizacion;
    }

    public void setFechaActualizacion(LocalDateTime fechaActualizacion) {
        this.fechaActualizacion = fechaActualizacion;
    }
}
