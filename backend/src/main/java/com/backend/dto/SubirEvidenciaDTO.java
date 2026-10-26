package com.backend.dto;

public class SubirEvidenciaDTO {

    private Long idActividad;
    private String rutEstudiante;
    private String comentario;
    private String nombreArchivo;
    private String archivoUrl;

    public SubirEvidenciaDTO() {
    }

    public SubirEvidenciaDTO(Long idActividad, String rutEstudiante, String comentario, String nombreArchivo, String archivoUrl) {
        this.idActividad = idActividad;
        this.rutEstudiante = rutEstudiante;
        this.comentario = comentario;
        this.nombreArchivo = nombreArchivo;
        this.archivoUrl = archivoUrl;
    }

    public Long getIdActividad() {
        return idActividad;
    }

    public void setIdActividad(Long idActividad) {
        this.idActividad = idActividad;
    }

    public String getRutEstudiante() {
        return rutEstudiante;
    }

    public void setRutEstudiante(String rutEstudiante) {
        this.rutEstudiante = rutEstudiante;
    }

    public String getComentario() {
        return comentario;
    }

    public void setComentario(String comentario) {
        this.comentario = comentario;
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
