package com.backend.model;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

/**
 * Una pauta completada (o en borrador) para una práctica concreta: vincula pauta, práctica (y por ende
 * estudiante) y evaluador, y conserva las respuestas, el puntaje y la nota calculada.
 */
@Entity
@Table(name = "pauta_aplicacion",
       uniqueConstraints = @UniqueConstraint(columnNames = {"pauta_id", "id_practica"}))
public class PautaAplicacion {

    public static final String BORRADOR = "BORRADOR";
    public static final String FINALIZADA = "FINALIZADA";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pauta_id", nullable = false)
    private Pauta pauta;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_practica", nullable = false)
    private Practica practica;

    @Column(nullable = false, length = 20)
    private String estado = BORRADOR;

    @Column(name = "evaluador_rut", length = 20)
    private String evaluadorRut;

    @Column(name = "evaluador_nombre")
    private String evaluadorNombre;

    @Column(length = 4000)
    private String observaciones;

    @OneToMany(mappedBy = "aplicacion", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PautaRespuesta> respuestas = new ArrayList<>();

    @Column(name = "puntaje_obtenido")
    private Double puntajeObtenido;

    @Column(name = "puntaje_maximo")
    private Double puntajeMaximo;

    private Double nota;

    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    @Column(name = "fecha_finalizacion")
    private LocalDateTime fechaFinalizacion;

    public PautaAplicacion() {
    }

    public Long getId() { return id; }
    public Pauta getPauta() { return pauta; }
    public void setPauta(Pauta pauta) { this.pauta = pauta; }
    public Practica getPractica() { return practica; }
    public void setPractica(Practica practica) { this.practica = practica; }
    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
    public String getEvaluadorRut() { return evaluadorRut; }
    public void setEvaluadorRut(String evaluadorRut) { this.evaluadorRut = evaluadorRut; }
    public String getEvaluadorNombre() { return evaluadorNombre; }
    public void setEvaluadorNombre(String evaluadorNombre) { this.evaluadorNombre = evaluadorNombre; }
    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }
    public List<PautaRespuesta> getRespuestas() { return respuestas; }
    public void setRespuestas(List<PautaRespuesta> respuestas) { this.respuestas = respuestas; }
    public Double getPuntajeObtenido() { return puntajeObtenido; }
    public void setPuntajeObtenido(Double puntajeObtenido) { this.puntajeObtenido = puntajeObtenido; }
    public Double getPuntajeMaximo() { return puntajeMaximo; }
    public void setPuntajeMaximo(Double puntajeMaximo) { this.puntajeMaximo = puntajeMaximo; }
    public Double getNota() { return nota; }
    public void setNota(Double nota) { this.nota = nota; }
    public LocalDateTime getFechaActualizacion() { return fechaActualizacion; }
    public void setFechaActualizacion(LocalDateTime fechaActualizacion) { this.fechaActualizacion = fechaActualizacion; }
    public LocalDateTime getFechaFinalizacion() { return fechaFinalizacion; }
    public void setFechaFinalizacion(LocalDateTime fechaFinalizacion) { this.fechaFinalizacion = fechaFinalizacion; }
}
