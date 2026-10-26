package com.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/** Indicador / criterio de una pauta, en el mismo orden y texto que la pauta en papel. */
@Entity
@Table(name = "pauta_criterio")
public class PautaCriterio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "pauta_id")
    private Pauta pauta;

    /** Posición global dentro de la pauta (1..n). */
    private Integer orden;

    /** Dimensión o bloque al que pertenece (ej. "Dimensión A: CONOCIMIENTO ..."). */
    @Column(length = 500)
    private String dimension;

    /** Numeración tal como aparece en el papel (ej. "A.1" o "7"). */
    private String numero;

    @Column(length = 1500, nullable = false)
    private String texto;

    public PautaCriterio() {}

    public PautaCriterio(Pauta pauta, Integer orden, String dimension, String numero, String texto) {
        this.pauta = pauta;
        this.orden = orden;
        this.dimension = dimension;
        this.numero = numero;
        this.texto = texto;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
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
