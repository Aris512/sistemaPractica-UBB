package com.backend.dto;

import java.time.LocalDateTime;

public class NotaDeVozDTO {

    private Long idAudio;
    private Long idEvaluacion;
    private String nombreArchivo;
    private String duracion;
    private String transcripcion;
    private LocalDateTime fechaGrabacion;
    private String rutGrabador;
    private String nombreGrabador;
    private String audioUrl;

    public NotaDeVozDTO() {
    }

    public NotaDeVozDTO(Long idAudio, Long idEvaluacion, String nombreArchivo, String duracion,
                          String transcripcion, LocalDateTime fechaGrabacion, String rutGrabador, String audioUrl) {
        this(idAudio, idEvaluacion, nombreArchivo, duracion, transcripcion, fechaGrabacion, rutGrabador, null, audioUrl);
    }

    public NotaDeVozDTO(Long idAudio, Long idEvaluacion, String nombreArchivo, String duracion,
                          String transcripcion, LocalDateTime fechaGrabacion, String rutGrabador, String nombreGrabador, String audioUrl) {
        this.idAudio = idAudio;
        this.idEvaluacion = idEvaluacion;
        this.nombreArchivo = nombreArchivo;
        this.duracion = duracion;
        this.transcripcion = transcripcion;
        this.fechaGrabacion = fechaGrabacion;
        this.rutGrabador = rutGrabador;
        this.nombreGrabador = nombreGrabador;
        this.audioUrl = audioUrl;
    }

    public Long getIdAudio() {
        return idAudio;
    }

    public void setIdAudio(Long idAudio) {
        this.idAudio = idAudio;
    }

    public Long getIdEvaluacion() {
        return idEvaluacion;
    }

    public void setIdEvaluacion(Long idEvaluacion) {
        this.idEvaluacion = idEvaluacion;
    }

    public String getNombreArchivo() {
        return nombreArchivo;
    }

    public void setNombreArchivo(String nombreArchivo) {
        this.nombreArchivo = nombreArchivo;
    }

    public String getDuracion() {
        return duracion;
    }

    public void setDuracion(String duracion) {
        this.duracion = duracion;
    }

    public String getTranscripcion() {
        return transcripcion;
    }

    public void setTranscripcion(String transcripcion) {
        this.transcripcion = transcripcion;
    }

    public LocalDateTime getFechaGrabacion() {
        return fechaGrabacion;
    }

    public void setFechaGrabacion(LocalDateTime fechaGrabacion) {
        this.fechaGrabacion = fechaGrabacion;
    }

    public String getRutGrabador() {
        return rutGrabador;
    }

    public void setRutGrabador(String rutGrabador) {
        this.rutGrabador = rutGrabador;
    }

    public String getNombreGrabador() {
        return nombreGrabador;
    }

    public void setNombreGrabador(String nombreGrabador) {
        this.nombreGrabador = nombreGrabador;
    }

    public String getAudioUrl() {
        return audioUrl;
    }

    public void setAudioUrl(String audioUrl) {
        this.audioUrl = audioUrl;
    }
}
