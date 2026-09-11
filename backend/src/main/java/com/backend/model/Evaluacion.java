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
@Table(name = "evaluacion")
public class Evaluacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_evaluacion")
    private Long idEvaluacion;

    @ManyToOne
    @JoinColumn(name = "id_practica")
    private Practica practica;

    private LocalDateTime fecha;

    @Column(name = "tipo_evaluacion")
    private String tipoEvaluacion;

    @Column(name = "puntaje_minimo")
    private Double puntajeMinimo;

    @Column(name = "puntaje_maximo")
    private Double puntajeMaximo;

    private String observacion;

    public Evaluacion() {
    }

    public Evaluacion(Practica practica, String tipoEvaluacion, Double puntajeMinimo,
                      Double puntajeMaximo, String observacion) {
        this.practica = practica;
        this.fecha = LocalDateTime.now();
        this.tipoEvaluacion = tipoEvaluacion;
        this.puntajeMinimo = puntajeMinimo;
        this.puntajeMaximo = puntajeMaximo;
        this.observacion = observacion;
    }

    public Long getIdEvaluacion() {
        return idEvaluacion;
    }

    public void setIdEvaluacion(Long idEvaluacion) {
        this.idEvaluacion = idEvaluacion;
    }

    public Practica getPractica() {
        return practica;
    }

    public void setPractica(Practica practica) {
        this.practica = practica;
    }

    public LocalDateTime getFecha() {
        return fecha;
    }

    public void setFecha(LocalDateTime fecha) {
        this.fecha = fecha;
    }

    public String getTipoEvaluacion() {
        return tipoEvaluacion;
    }

    public void setTipoEvaluacion(String tipoEvaluacion) {
        this.tipoEvaluacion = tipoEvaluacion;
    }

    public Double getPuntajeMinimo() {
        return puntajeMinimo;
    }

    public void setPuntajeMinimo(Double puntajeMinimo) {
        this.puntajeMinimo = puntajeMinimo;
    }

    public Double getPuntajeMaximo() {
        return puntajeMaximo;
    }

    public void setPuntajeMaximo(Double puntajeMaximo) {
        this.puntajeMaximo = puntajeMaximo;
    }

    public String getObservacion() {
        return observacion;
    }

    public void setObservacion(String observacion) {
        this.observacion = observacion;
    }
}
