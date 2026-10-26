package com.backend.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

/** Puntaje asignado a un criterio dentro de una aplicación de pauta. */
@Entity
@Table(name = "pauta_respuesta",
       uniqueConstraints = @UniqueConstraint(columnNames = {"aplicacion_id", "criterio_id"}))
public class PautaRespuesta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "aplicacion_id")
    private PautaAplicacion aplicacion;

    @ManyToOne(optional = false)
    @JoinColumn(name = "criterio_id")
    private PautaCriterio criterio;

    private Integer puntaje;

    public PautaRespuesta() {}

    public PautaRespuesta(PautaAplicacion aplicacion, PautaCriterio criterio, Integer puntaje) {
        this.aplicacion = aplicacion;
        this.criterio = criterio;
        this.puntaje = puntaje;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public PautaAplicacion getAplicacion() { return aplicacion; }
    public void setAplicacion(PautaAplicacion aplicacion) { this.aplicacion = aplicacion; }
    public PautaCriterio getCriterio() { return criterio; }
    public void setCriterio(PautaCriterio criterio) { this.criterio = criterio; }
    public Integer getPuntaje() { return puntaje; }
    public void setPuntaje(Integer puntaje) { this.puntaje = puntaje; }
}
