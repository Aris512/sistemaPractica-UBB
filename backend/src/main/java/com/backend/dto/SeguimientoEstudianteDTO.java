package com.backend.dto;

import java.time.LocalDateTime;

public class SeguimientoEstudianteDTO {

    private Long idEstudiante;
    private Long idEvidencia;
    private Long idActividad;
    private String rut;
    private String nombre;
    private String correo;
    private String actividadTitulo;
    private String estadoEntrega; // "ENTREGADO", "PENDIENTE", "NO_ENTREGADO"
    private String estadoRevision; // "REVISADO", "PENDIENTE_REVISION", "OBSERVADO", "SIN_ENTREGA"
    private LocalDateTime fechaSubida;
    private String nombreArchivo;
    private String archivoUrl;
    private String comentarioEstudiante;
    private Double calificacion;
    private String retroalimentacion;
    private LocalDateTime fechaRevision;

    public SeguimientoEstudianteDTO() {
    }

    public SeguimientoEstudianteDTO(Long idEstudiante, Long idEvidencia, Long idActividad,
                                  String rut, String nombre, String correo, String actividadTitulo,
                                  String estadoEntrega, String estadoRevision, LocalDateTime fechaSubida,
                                  String nombreArchivo, String archivoUrl, String comentarioEstudiante,
                                  Double calificacion, String retroalimentacion, LocalDateTime fechaRevision) {
        this.idEstudiante = idEstudiante;
        this.idEvidencia = idEvidencia;
        this.idActividad = idActividad;
        this.rut = rut;
        this.nombre = nombre;
        this.correo = correo;
        this.actividadTitulo = actividadTitulo;
        this.estadoEntrega = estadoEntrega;
        this.estadoRevision = estadoRevision;
        this.fechaSubida = fechaSubida;
        this.nombreArchivo = nombreArchivo;
        this.archivoUrl = archivoUrl;
        this.comentarioEstudiante = comentarioEstudiante;
        this.calificacion = calificacion;
        this.retroalimentacion = retroalimentacion;
        this.fechaRevision = fechaRevision;
    }

    public Long getIdEstudiante() {
        return idEstudiante;
    }

    public void setIdEstudiante(Long idEstudiante) {
        this.idEstudiante = idEstudiante;
    }

    public Long getIdEvidencia() {
        return idEvidencia;
    }

    public void setIdEvidencia(Long idEvidencia) {
        this.idEvidencia = idEvidencia;
    }

    public Long getIdActividad() {
        return idActividad;
    }

    public void setIdActividad(Long idActividad) {
        this.idActividad = idActividad;
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

    public String getActividadTitulo() {
        return actividadTitulo;
    }

    public void setActividadTitulo(String actividadTitulo) {
        this.actividadTitulo = actividadTitulo;
    }

    public String getEstadoEntrega() {
        return estadoEntrega;
    }

    public void setEstadoEntrega(String estadoEntrega) {
        this.estadoEntrega = estadoEntrega;
    }

    public String getEstadoRevision() {
        return estadoRevision;
    }

    public void setEstadoRevision(String estadoRevision) {
        this.estadoRevision = estadoRevision;
    }

    public LocalDateTime getFechaSubida() {
        return fechaSubida;
    }

    public void setFechaSubida(LocalDateTime fechaSubida) {
        this.fechaSubida = fechaSubida;
    }

    public String getNombreArchivo() {
        return nombreArchivo;
    }

    public void setNombreArchivo(String nombreArchivo) {
        this.nombreArchivo = nombreArchivo;
    }

    public String getArchivoUrl() {
        return archivoUrl;
    }

    public void setArchivoUrl(String archivoUrl) {
        this.archivoUrl = archivoUrl;
    }

    public String getComentarioEstudiante() {
        return comentarioEstudiante;
    }

    public void setComentarioEstudiante(String comentarioEstudiante) {
        this.comentarioEstudiante = comentarioEstudiante;
    }

    public Double getCalificacion() {
        return calificacion;
    }

    public void setCalificacion(Double calificacion) {
        this.calificacion = calificacion;
    }

    public String getRetroalimentacion() {
        return retroalimentacion;
    }

    public void setRetroalimentacion(String retroalimentacion) {
        this.retroalimentacion = retroalimentacion;
    }

    public LocalDateTime getFechaRevision() {
        return fechaRevision;
    }

    public void setFechaRevision(LocalDateTime fechaRevision) {
        this.fechaRevision = fechaRevision;
    }
}
