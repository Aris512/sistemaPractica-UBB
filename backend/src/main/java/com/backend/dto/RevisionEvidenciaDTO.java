package com.backend.dto;

public class RevisionEvidenciaDTO {

    private String rutProfesor;
    private String retroalimentacion;
    private Double calificacion;
    private String estado; // "REVISADO", "OBSERVADO"

    public RevisionEvidenciaDTO() {
    }

    public RevisionEvidenciaDTO(String rutProfesor, String retroalimentacion, Double calificacion, String estado) {
        this.rutProfesor = rutProfesor;
        this.retroalimentacion = retroalimentacion;
        this.calificacion = calificacion;
        this.estado = estado;
    }

    public String getRutProfesor() {
        return rutProfesor;
    }

    public void setRutProfesor(String rutProfesor) {
        this.rutProfesor = rutProfesor;
    }

    public String getRetroalimentacion() {
        return retroalimentacion;
    }

    public void setRetroalimentacion(String retroalimentacion) {
        this.retroalimentacion = retroalimentacion;
    }

    public Double getCalificacion() {
        return calificacion;
    }

    public void setCalificacion(Double calificacion) {
        this.calificacion = calificacion;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }
}
