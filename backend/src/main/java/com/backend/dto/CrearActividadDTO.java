package com.backend.dto;

import java.time.LocalDateTime;

public class CrearActividadDTO {

    private String rutProfesor;
    private Long idAsignatura;
    private String titulo;
    private String descripcion;
    private LocalDateTime fechaLimite;

    public CrearActividadDTO() {
    }

    public CrearActividadDTO(String rutProfesor, Long idAsignatura, String titulo, String descripcion, LocalDateTime fechaLimite) {
        this.rutProfesor = rutProfesor;
        this.idAsignatura = idAsignatura;
        this.titulo = titulo;
        this.descripcion = descripcion;
        this.fechaLimite = fechaLimite;
    }

    public String getRutProfesor() {
        return rutProfesor;
    }

    public void setRutProfesor(String rutProfesor) {
        this.rutProfesor = rutProfesor;
    }

    public Long getIdAsignatura() {
        return idAsignatura;
    }

    public void setIdAsignatura(Long idAsignatura) {
        this.idAsignatura = idAsignatura;
    }

    public String getTitulo() {
        return titulo;
    }

    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public LocalDateTime getFechaLimite() {
        return fechaLimite;
    }

    public void setFechaLimite(LocalDateTime fechaLimite) {
        this.fechaLimite = fechaLimite;
    }
}
