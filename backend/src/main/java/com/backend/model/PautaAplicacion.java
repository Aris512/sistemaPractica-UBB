package com.backend.model;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

/** Una pauta completada (o en borrador) para la práctica de un estudiante. */
@Entity
@Table(name = "pauta_aplicacion",
       uniqueConstraints = @UniqueConstraint(columnNames = {"pauta_id", "id_practica"}))
public class PautaAplicacion {

    public static final String BORRADOR = "BORRADOR";
    public static final String FINALIZADA = "FINALIZADA";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "pauta_id")
    private Pauta pauta;

    @ManyToOne(optional = false)
    @JoinColumn(name = "id_practica")
    private Practica practica;

    @Column(name = "evaluador_rut")
    private String evaluadorRut;

    @Column(name = "evaluador_nombre")
    private String evaluadorNombre;

    private String estado = BORRADOR;

    @Column(length = 4000)
    private String observaciones;

    @Column(name = "puntaje_obtenido")
    private Double puntajeObtenido;

    @Column(name = "puntaje_maximo")
    private Double puntajeMaximo;

    private Double nota;

    @Column(name = "fecha_creacion")
    private LocalDateTime fechaCreacion = LocalDateTime.now();

    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion = LocalDateTime.now();

    @Column(name = "fecha_finalizacion")
    private LocalDateTime fechaFinalizacion;

    @OneToMany(mappedBy = "aplicacion", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PautaRespuesta> respuestas = new ArrayList<>();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Pauta getPauta() { return pauta; }
    public void setPauta(Pauta pauta) { this.pauta = pauta; }
    public Practica getPractica() { return practica; }
    public void setPractica(Practica practica) { this.practica = practica; }
    public String getEvaluadorRut() { return evaluadorRut; }
    public void setEvaluadorRut(String evaluadorRut) { this.evaluadorRut = evaluadorRut; }
    public String getEvaluadorNombre() { return evaluadorNombre; }
    public void setEvaluadorNombre(String evaluadorNombre) { this.evaluadorNombre = evaluadorNombre; }
    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }
    public Double getPuntajeObtenido() { return puntajeObtenido; }
    public void setPuntajeObtenido(Double puntajeObtenido) { this.puntajeObtenido = puntajeObtenido; }
    public Double getPuntajeMaximo() { return puntajeMaximo; }
    public void setPuntajeMaximo(Double puntajeMaximo) { this.puntajeMaximo = puntajeMaximo; }
    public Double getNota() { return nota; }
    public void setNota(Double nota) { this.nota = nota; }
    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }
    public LocalDateTime getFechaActualizacion() { return fechaActualizacion; }
    public void setFechaActualizacion(LocalDateTime fechaActualizacion) { this.fechaActualizacion = fechaActualizacion; }
    public LocalDateTime getFechaFinalizacion() { return fechaFinalizacion; }
    public void setFechaFinalizacion(LocalDateTime fechaFinalizacion) { this.fechaFinalizacion = fechaFinalizacion; }
    public List<PautaRespuesta> getRespuestas() { return respuestas; }
    public void setRespuestas(List<PautaRespuesta> respuestas) { this.respuestas = respuestas; }
}
