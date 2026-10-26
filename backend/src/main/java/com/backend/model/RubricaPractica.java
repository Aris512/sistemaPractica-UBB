package com.backend.model;

import java.time.LocalDateTime;

import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

/**
 * Evaluación de la práctica que completa un evaluador externo: el profesor colaborador aplica 4 rúbricas
 * (Matemática 1 y 2, Orientación 1 y 2) y el tutor de práctica 2 observaciones. Su avance mueve la línea
 * de tiempo del estudiante. Se elimina junto con la práctica.
 */
@Entity
@Table(name = "rubrica_practica",
       uniqueConstraints = @UniqueConstraint(columnNames = {"id_practica", "tipo_evaluador", "area", "numero"}))
public class RubricaPractica {

    public static final String PROFESOR_COLABORADOR = "PROFESOR_COLABORADOR";
    public static final String TUTOR_PRACTICA = "TUTOR_PRACTICA";
    public static final String PENDIENTE = "PENDIENTE";
    public static final String COMPLETADA = "COMPLETADA";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_rubrica")
    private Long idRubrica;

    @JsonIgnore
    @ManyToOne(optional = false)
    @JoinColumn(name = "id_practica", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Practica practica;

    @Column(name = "tipo_evaluador", nullable = false, length = 30)
    private String tipoEvaluador;

    /** MATEMATICA u ORIENTACION para el profesor colaborador; OBSERVACION para el tutor. */
    @Column(name = "area", nullable = false, length = 30)
    private String area;

    @Column(name = "numero", nullable = false)
    private Integer numero;

    @Column(name = "estado", nullable = false, length = 20)
    private String estado = PENDIENTE;

    @Column(name = "nota")
    private Double nota;

    @Column(name = "rut_evaluador", length = 12)
    private String rutEvaluador;

    @Column(name = "fecha_completada")
    private LocalDateTime fechaCompletada;

    public RubricaPractica() {
    }

    public RubricaPractica(Practica practica, String tipoEvaluador, String area, Integer numero) {
        this.practica = practica;
        this.tipoEvaluador = tipoEvaluador;
        this.area = area;
        this.numero = numero;
    }

    /** Nombre legible, p. ej. "Rúbrica de Matemática 1" u "Observación del tutor 2". */
    public String getTitulo() {
        return switch (area) {
            case "MATEMATICA" -> "Rúbrica de Matemática " + numero;
            case "ORIENTACION" -> "Rúbrica de Orientación " + numero;
            default -> "Observación del tutor " + numero;
        };
    }

    public Long getIdRubrica() {
        return idRubrica;
    }

    public Practica getPractica() {
        return practica;
    }

    public String getTipoEvaluador() {
        return tipoEvaluador;
    }

    public String getArea() {
        return area;
    }

    public Integer getNumero() {
        return numero;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public Double getNota() {
        return nota;
    }

    public void setNota(Double nota) {
        this.nota = nota;
    }

    public String getRutEvaluador() {
        return rutEvaluador;
    }

    public void setRutEvaluador(String rutEvaluador) {
        this.rutEvaluador = rutEvaluador;
    }

    public LocalDateTime getFechaCompletada() {
        return fechaCompletada;
    }

    public void setFechaCompletada(LocalDateTime fechaCompletada) {
        this.fechaCompletada = fechaCompletada;
    }
}
