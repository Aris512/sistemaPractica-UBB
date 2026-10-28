package com.backend.dto;

import java.time.LocalDateTime;

public class HistorialItemDTO {

    private Long id;
    private String titulo;
    private String tipo; // "ACTIVIDAD" | "EVALUACION"
    private LocalDateTime fecha;
    private String fechaFormateada;
    private String estado; // "CALIFICADA", "ENTREGADA", "REVISADA", "COMPLETADA", "PENDIENTE"
    private boolean completado;
    private Double calificacion;
    private String evaluadorNombre;
    private String evaluadorRol;
    private String observacion;
    private String nombreArchivo;
    private String archivoUrl;

    public HistorialItemDTO() {
    }

    public HistorialItemDTO(Long id, String titulo, String tipo, LocalDateTime fecha, String fechaFormateada,
                            String estado, boolean completado, Double calificacion, String evaluadorNombre,
                            String evaluadorRol, String observacion, String nombreArchivo, String archivoUrl) {
        this.id = id;
        this.titulo = titulo;
        this.tipo = tipo;
        this.fecha = fecha;
        this.fechaFormateada = fechaFormateada;
        this.estado = estado;
        this.completado = completado;
        this.calificacion = calificacion;
        this.evaluadorNombre = evaluadorNombre;
        this.evaluadorRol = evaluadorRol;
        this.observacion = observacion;
        this.nombreArchivo = nombreArchivo;
        this.archivoUrl = archivoUrl;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitulo() {
        return titulo;
    }

    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public LocalDateTime getFecha() {
        return fecha;
    }

    public void setFecha(LocalDateTime fecha) {
        this.fecha = fecha;
    }

    public String getFechaFormateada() {
        return fechaFormateada;
    }

    public void setFechaFormateada(String fechaFormateada) {
        this.fechaFormateada = fechaFormateada;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public boolean isCompletado() {
        return completado;
    }

    public void setCompletado(boolean completado) {
        this.completado = completado;
    }

    public Double getCalificacion() {
        return calificacion;
    }

    public void setCalificacion(Double calificacion) {
        this.calificacion = calificacion;
    }

    public String getEvaluadorNombre() {
        return evaluadorNombre;
    }

    public void setEvaluadorNombre(String evaluadorNombre) {
        this.evaluadorNombre = evaluadorNombre;
    }

    public String getEvaluadorRol() {
        return evaluadorRol;
    }

    public void setEvaluadorRol(String evaluadorRol) {
        this.evaluadorRol = evaluadorRol;
    }

    public String getObservacion() {
        return observacion;
    }

    public void setObservacion(String observacion) {
        this.observacion = observacion;
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
}
