package com.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

/** Puntaje marcado por el evaluador en un criterio de una pauta aplicada. */
@Entity
@Table(name = "pauta_respuesta",
       uniqueConstraints = @UniqueConstraint(columnNames = {"aplicacion_id", "criterio_id"}))
public class PautaRespuesta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "aplicacion_id", nullable = false)
    private PautaAplicacion aplicacion;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "criterio_id", nullable = false)
    private PautaCriterio criterio;

    @Column(nullable = false)
    private Integer puntaje;

    public PautaRespuesta() {
    }

    public PautaRespuesta(PautaAplicacion aplicacion, PautaCriterio criterio, Integer puntaje) {
        this.aplicacion = aplicacion;
        this.criterio = criterio;
        this.puntaje = puntaje;
    }

    public Long getId() { return id; }
    public PautaAplicacion getAplicacion() { return aplicacion; }
    public void setAplicacion(PautaAplicacion aplicacion) { this.aplicacion = aplicacion; }
    public PautaCriterio getCriterio() { return criterio; }
    public void setCriterio(PautaCriterio criterio) { this.criterio = criterio; }
    public Integer getPuntaje() { return puntaje; }
    public void setPuntaje(Integer puntaje) { this.puntaje = puntaje; }
}
