package com.backend.model;

import java.time.LocalDateTime;

import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

/**
 * Fragmento del archivo «Planificación» con su embedding (RAG). Se borra junto con el documento.
 * Los vectores se guardan como float32 en bytes; «modelo» indica con qué proveedor se calcularon.
 */
@Entity
@Table(name = "fragmento_planificacion",
        uniqueConstraints = @UniqueConstraint(name = "uk_fragmento_doc_modelo_orden",
                columnNames = {"id_documento", "modelo", "orden"}),
        indexes = @Index(name = "idx_fragmento_doc_modelo", columnList = "id_documento, modelo"))
public class FragmentoPlanificacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_fragmento")
    private Long idFragmento;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_documento", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Documento documento;

    @Column(name = "modelo", nullable = false, length = 80)
    private String modelo;

    @Column(name = "orden", nullable = false)
    private int orden;

    @Lob
    @Column(name = "texto", nullable = false, columnDefinition = "TEXT")
    private String texto;

    @Lob
    @Column(name = "embedding", nullable = false, columnDefinition = "MEDIUMBLOB")
    private byte[] embedding;

    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion;

    protected FragmentoPlanificacion() {
    }

    public FragmentoPlanificacion(Documento documento, String modelo, int orden, String texto, byte[] embedding) {
        this.documento = documento;
        this.modelo = modelo;
        this.orden = orden;
        this.texto = texto;
        this.embedding = embedding;
        this.fechaCreacion = LocalDateTime.now();
    }

    public Long getIdFragmento() {
        return idFragmento;
    }

    public String getModelo() {
        return modelo;
    }

    public int getOrden() {
        return orden;
    }

    public String getTexto() {
        return texto;
    }

    public byte[] getEmbedding() {
        return embedding;
    }

    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }
}
