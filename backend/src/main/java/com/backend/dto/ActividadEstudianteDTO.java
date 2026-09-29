package com.backend.dto;

import java.time.LocalDateTime;

/**
 * DTO enriquecido para mostrar al estudiante sus actividades/evaluaciones
 * junto con el estado de su propia evidencia entregada.
 */
public class ActividadEstudianteDTO {

    // ── Datos de la Actividad ──
    private Long idActividad;
    private String titulo;
    private String descripcion;
    private String estado; // "ACTIVA" | "CERRADA"
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaLimite;

    // ── Datos de la Asignatura ──
    private Long idAsignatura;
    private String nombreAsignatura;

    // ── Datos del Profesor ──
    private Long idProfesor;
    private String nombreProfesor;
    private String apellidoProfesor;
    private String rutProfesor;

    // ── Datos de la Evidencia del estudiante (puede ser null si no entregó) ──
    private Long idEvidencia;
    private String estadoEvidencia; // "PENDIENTE" | "REVISADO" | "OBSERVADO" | null
    private LocalDateTime fechaEntrega;
    private String nombreArchivo;
    private String archivoUrl;
    private String comentarioEstudiante;
    private Double calificacion;
    private String retroalimentacion;
    private LocalDateTime fechaRevision;

    public ActividadEstudianteDTO() {}

    // ── Getters y Setters ──

    public Long getIdActividad() { return idActividad; }
    public void setIdActividad(Long idActividad) { this.idActividad = idActividad; }

    public String getTitulo() { return titulo; }
    public void setTitulo(String titulo) { this.titulo = titulo; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }

    public LocalDateTime getFechaLimite() { return fechaLimite; }
    public void setFechaLimite(LocalDateTime fechaLimite) { this.fechaLimite = fechaLimite; }

    public Long getIdAsignatura() { return idAsignatura; }
    public void setIdAsignatura(Long idAsignatura) { this.idAsignatura = idAsignatura; }

    public String getNombreAsignatura() { return nombreAsignatura; }
    public void setNombreAsignatura(String nombreAsignatura) { this.nombreAsignatura = nombreAsignatura; }

    public Long getIdProfesor() { return idProfesor; }
    public void setIdProfesor(Long idProfesor) { this.idProfesor = idProfesor; }

    public String getNombreProfesor() { return nombreProfesor; }
    public void setNombreProfesor(String nombreProfesor) { this.nombreProfesor = nombreProfesor; }

    public String getApellidoProfesor() { return apellidoProfesor; }
    public void setApellidoProfesor(String apellidoProfesor) { this.apellidoProfesor = apellidoProfesor; }

    public String getRutProfesor() { return rutProfesor; }
    public void setRutProfesor(String rutProfesor) { this.rutProfesor = rutProfesor; }

    public Long getIdEvidencia() { return idEvidencia; }
    public void setIdEvidencia(Long idEvidencia) { this.idEvidencia = idEvidencia; }

    public String getEstadoEvidencia() { return estadoEvidencia; }
    public void setEstadoEvidencia(String estadoEvidencia) { this.estadoEvidencia = estadoEvidencia; }

    public LocalDateTime getFechaEntrega() { return fechaEntrega; }
    public void setFechaEntrega(LocalDateTime fechaEntrega) { this.fechaEntrega = fechaEntrega; }

    public String getNombreArchivo() { return nombreArchivo; }
    public void setNombreArchivo(String nombreArchivo) { this.nombreArchivo = nombreArchivo; }

    public String getArchivoUrl() { return archivoUrl; }
    public void setArchivoUrl(String archivoUrl) { this.archivoUrl = archivoUrl; }

    public String getComentarioEstudiante() { return comentarioEstudiante; }
    public void setComentarioEstudiante(String comentarioEstudiante) { this.comentarioEstudiante = comentarioEstudiante; }

    public Double getCalificacion() { return calificacion; }
    public void setCalificacion(Double calificacion) { this.calificacion = calificacion; }

    public String getRetroalimentacion() { return retroalimentacion; }
    public void setRetroalimentacion(String retroalimentacion) { this.retroalimentacion = retroalimentacion; }

    public LocalDateTime getFechaRevision() { return fechaRevision; }
    public void setFechaRevision(LocalDateTime fechaRevision) { this.fechaRevision = fechaRevision; }
}
