package com.backend.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "nota_de_voz")
public class NotaDeVoz {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_audio")
    private Long idAudio;

    @ManyToOne
    @JoinColumn(name = "id_evaluacion")
    private Evaluacion evaluacion;

    @Column(name = "ubicacion_archivo")
    private String ubicacionArchivo;

    private String duracion;

    @Column(name = "fecha_grabacion")
    private LocalDateTime fechaGrabacion;

    public NotaDeVoz() {
    }

    public NotaDeVoz(Evaluacion evaluacion, String ubicacionArchivo, String duracion) {
        this.evaluacion = evaluacion;
        this.ubicacionArchivo = ubicacionArchivo;
        this.duracion = duracion;
        this.fechaGrabacion = LocalDateTime.now();
    }

    public Long getIdAudio() {
        return idAudio;
    }

    public void setIdAudio(Long idAudio) {
        this.idAudio = idAudio;
    }

    public Evaluacion getEvaluacion() {
        return evaluacion;
    }

    public void setEvaluacion(Evaluacion evaluacion) {
        this.evaluacion = evaluacion;
    }

    public String getUbicacionArchivo() {
        return ubicacionArchivo;
    }

    public void setUbicacionArchivo(String ubicacionArchivo) {
        this.ubicacionArchivo = ubicacionArchivo;
    }

    public String getDuracion() {
        return duracion;
    }

    public void setDuracion(String duracion) {
        this.duracion = duracion;
    }

    public LocalDateTime getFechaGrabacion() {
        return fechaGrabacion;
    }

    public void setFechaGrabacion(LocalDateTime fechaGrabacion) {
        this.fechaGrabacion = fechaGrabacion;
    }
}
