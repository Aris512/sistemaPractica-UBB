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

/** Indicador/criterio de una pauta, en el mismo orden y con el mismo texto que el instrumento en papel. */
@Entity
@Table(name = "pauta_criterio")
public class PautaCriterio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pauta_id", nullable = false)
    private Pauta pauta;

    /** Posición global dentro de la pauta (1..n); define el orden en que se muestran. */
    @Column(nullable = false)
    private Integer orden;

    /** Dimensión o sección a la que pertenece (ej. "DIMENSIÓN A CONOCIMIENTO Y PREPARACIÓN DE LA ENSEÑANZA"). */
    @Column(length = 400)
    private String dimension;

    /** Número impreso en la pauta original (se reinicia en cada dimensión). */
    @Column(length = 20)
    private String numero;

    @Column(nullable = false, length = 1000)
    private String texto;

    public PautaCriterio() {
    }

    public PautaCriterio(Pauta pauta, Integer orden, String dimension, String numero, String texto) {
        this.pauta = pauta;
        this.orden = orden;
        this.dimension = dimension;
        this.numero = numero;
        this.texto = texto;
    }

    public Long getId() { return id; }
    public Pauta getPauta() { return pauta; }
    public void setPauta(Pauta pauta) { this.pauta = pauta; }
    public Integer getOrden() { return orden; }
    public void setOrden(Integer orden) { this.orden = orden; }
    public String getDimension() { return dimension; }
    public void setDimension(String dimension) { this.dimension = dimension; }
    public String getNumero() { return numero; }
    public void setNumero(String numero) { this.numero = numero; }
    public String getTexto() { return texto; }
    public void setTexto(String texto) { this.texto = texto; }
}
