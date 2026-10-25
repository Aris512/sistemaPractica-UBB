package com.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "nota")
public class Nota {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_nota")
    private Long idNota;

    @ManyToOne
    @JoinColumn(name = "id_evaluacion")
    private Evaluacion evaluacion;

    @ManyToOne
    @JoinColumn(name = "id_estudiante")
    private Estudiante estudiante;

    @Column(name = "puntaje_obtenido")
    private Double puntajeObtenido;

    @Column(name = "rut_evaluador")
    private String rutEvaluador;

    public Nota() {
    }

    public Nota(Evaluacion evaluacion, Estudiante estudiante, Double puntajeObtenido, String rutEvaluador) {
        this.evaluacion = evaluacion;
        this.estudiante = estudiante;
        this.puntajeObtenido = puntajeObtenido;
        this.rutEvaluador = rutEvaluador;
    }

    public Long getIdNota() {
        return idNota;
    }

    public void setIdNota(Long idNota) {
        this.idNota = idNota;
    }

    public Evaluacion getEvaluacion() {
        return evaluacion;
    }

    public void setEvaluacion(Evaluacion evaluacion) {
        this.evaluacion = evaluacion;
    }

    public Estudiante getEstudiante() {
        return estudiante;
    }

    public void setEstudiante(Estudiante estudiante) {
        this.estudiante = estudiante;
    }

    public Double getPuntajeObtenido() {
        return puntajeObtenido;
    }

    public void setPuntajeObtenido(Double puntajeObtenido) {
        this.puntajeObtenido = puntajeObtenido;
    }

    public String getRutEvaluador() {
        return rutEvaluador;
    }

    public void setRutEvaluador(String rutEvaluador) {
        this.rutEvaluador = rutEvaluador;
    }
}
