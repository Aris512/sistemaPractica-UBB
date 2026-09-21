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

    @Column(name = "id_evaluador")
    private Long idEvaluador;

    @Column(name = "tipo_evaluador")
    private String tipoEvaluador;

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

    @Column(name = "fecha_limite")
    private LocalDateTime fechaLimite;

    public Evaluacion() {
    }

    /** Constructor original — mantiene compatibilidad con DataSeeder existente */
    public Evaluacion(Practica practica, String tipoEvaluacion, Double puntajeMinimo,
                      Double puntajeMaximo, String observacion) {
        this.practica = practica;
        this.fecha = LocalDateTime.now();
        this.tipoEvaluacion = tipoEvaluacion;
        this.puntajeMinimo = puntajeMinimo;
        this.puntajeMaximo = puntajeMaximo;
        this.observacion = observacion;
        this.fechaLimite = LocalDateTime.now().plusDays(7);
    }

    /** Constructor nuevo (módulo Pedro) — incluye evaluador y fecha límite */
    public Evaluacion(Practica practica, Long idEvaluador, String tipoEvaluador, String tipoEvaluacion,
                      Double puntajeMinimo, Double puntajeMaximo, LocalDateTime fechaLimite) {
        this.practica = practica;
        this.idEvaluador = idEvaluador;
        this.tipoEvaluador = tipoEvaluador;
        this.fecha = LocalDateTime.now();
        this.tipoEvaluacion = tipoEvaluacion;
        this.puntajeMinimo = puntajeMinimo;
        this.puntajeMaximo = puntajeMaximo;
        this.fechaLimite = fechaLimite != null ? fechaLimite : LocalDateTime.now().plusDays(7);
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

    public Long getIdEvaluador() {
        return idEvaluador;
    }

    public void setIdEvaluador(Long idEvaluador) {
        this.idEvaluador = idEvaluador;
    }

    public String getTipoEvaluador() {
        return tipoEvaluador;
    }

    public void setTipoEvaluador(String tipoEvaluador) {
        this.tipoEvaluador = tipoEvaluador;
    }

    public LocalDateTime getFechaLimite() {
        return fechaLimite;
    }

    public void setFechaLimite(LocalDateTime fechaLimite) {
        this.fechaLimite = fechaLimite;
    }
}
