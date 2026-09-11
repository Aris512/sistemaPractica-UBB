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
@Table(name = "retroalimentacion_ia")
public class RetroalimentacionIA {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_retroalimentacion")
    private Long idRetroalimentacion;

    @ManyToOne
    @JoinColumn(name = "id_planificacion")
    private Planificacion planificacion;

    private LocalDateTime fecha;

    private String estado;

    @Column(name = "resultado_general")
    private String resultadoGeneral;

    @Column(name = "observacion_general")
    private String observacionGeneral;

    public RetroalimentacionIA() {
    }

    public RetroalimentacionIA(Planificacion planificacion, String estado,
                                String resultadoGeneral, String observacionGeneral) {
        this.planificacion = planificacion;
        this.fecha = LocalDateTime.now();
        this.estado = estado;
        this.resultadoGeneral = resultadoGeneral;
        this.observacionGeneral = observacionGeneral;
    }

    public Long getIdRetroalimentacion() {
        return idRetroalimentacion;
    }

    public void setIdRetroalimentacion(Long idRetroalimentacion) {
        this.idRetroalimentacion = idRetroalimentacion;
    }

    public Planificacion getPlanificacion() {
        return planificacion;
    }

    public void setPlanificacion(Planificacion planificacion) {
        this.planificacion = planificacion;
    }

    public LocalDateTime getFecha() {
        return fecha;
    }

    public void setFecha(LocalDateTime fecha) {
        this.fecha = fecha;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public String getResultadoGeneral() {
        return resultadoGeneral;
    }

    public void setResultadoGeneral(String resultadoGeneral) {
        this.resultadoGeneral = resultadoGeneral;
    }

    public String getObservacionGeneral() {
        return observacionGeneral;
    }

    public void setObservacionGeneral(String observacionGeneral) {
        this.observacionGeneral = observacionGeneral;
    }
}
