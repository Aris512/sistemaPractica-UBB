package com.backend.model;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;

/**
 * Instrumento de evaluación (HU-21). Se identifica por asignatura, especialidad, momento de aplicación
 * y evaluador, y contiene los criterios en el orden del instrumento original.
 */
@Entity
@Table(name = "pauta")
public class Pauta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String codigo;

    @Column(nullable = false)
    private String titulo;

    /** Nombre de la asignatura de práctica; debe coincidir con {@code Asignatura.nombre}. */
    private String asignatura;

    private String tipo;

    @Column(name = "criterios_count")
    private Integer criteriosCount;

    @Column(length = 1000)
    private String descripcion;

    private String ponderacion;

    private String version;

    /** ESPECIALIDAD | ORIENTACION. */
    private String especialidad;

    /** PRIMERA | SEGUNDA | UNICA. */
    private String momento;

    /** COLABORADOR | TUTOR | ACADEMICO: quién completa la pauta. */
    private String evaluador;

    @Column(name = "escala_min")
    private Integer escalaMin;

    @Column(name = "escala_max")
    private Integer escalaMax;

    /** ESCALA_EXIGENCIA (puntaje total → nota 2.0–7.0 con exigencia) | PROMEDIO (promedio de los puntajes). */
    @Column(name = "modo_calculo")
    private String modoCalculo;

    /** Porcentaje de exigencia para la nota 4.0 (ej. 60). Solo aplica a ESCALA_EXIGENCIA. */
    private Integer exigencia;

    @Column(length = 4000)
    private String instrucciones;

    private Boolean activa = Boolean.TRUE;

    @OneToMany(mappedBy = "pauta", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orden ASC")
    private List<PautaCriterio> criterios = new ArrayList<>();

    public Pauta() {
    }

    public Pauta(String codigo, String titulo, String asignatura, String tipo, Integer criteriosCount,
                 String descripcion, String ponderacion, String version) {
        this.codigo = codigo;
        this.titulo = titulo;
        this.asignatura = asignatura;
        this.tipo = tipo;
        this.criteriosCount = criteriosCount;
        this.descripcion = descripcion;
        this.ponderacion = ponderacion;
        this.version = version;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCodigo() { return codigo; }
    public void setCodigo(String codigo) { this.codigo = codigo; }
    public String getTitulo() { return titulo; }
    public void setTitulo(String titulo) { this.titulo = titulo; }
    public String getAsignatura() { return asignatura; }
    public void setAsignatura(String asignatura) { this.asignatura = asignatura; }
    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }
    public Integer getCriteriosCount() { return criteriosCount; }
    public void setCriteriosCount(Integer criteriosCount) { this.criteriosCount = criteriosCount; }
    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }
    public String getPonderacion() { return ponderacion; }
    public void setPonderacion(String ponderacion) { this.ponderacion = ponderacion; }
    public String getVersion() { return version; }
    public void setVersion(String version) { this.version = version; }
    public String getEspecialidad() { return especialidad; }
    public void setEspecialidad(String especialidad) { this.especialidad = especialidad; }
    public String getMomento() { return momento; }
    public void setMomento(String momento) { this.momento = momento; }
    public String getEvaluador() { return evaluador; }
    public void setEvaluador(String evaluador) { this.evaluador = evaluador; }
    public Integer getEscalaMin() { return escalaMin; }
    public void setEscalaMin(Integer escalaMin) { this.escalaMin = escalaMin; }
    public Integer getEscalaMax() { return escalaMax; }
    public void setEscalaMax(Integer escalaMax) { this.escalaMax = escalaMax; }
    public String getModoCalculo() { return modoCalculo; }
    public void setModoCalculo(String modoCalculo) { this.modoCalculo = modoCalculo; }
    public Integer getExigencia() { return exigencia; }
    public void setExigencia(Integer exigencia) { this.exigencia = exigencia; }
    public String getInstrucciones() { return instrucciones; }
    public void setInstrucciones(String instrucciones) { this.instrucciones = instrucciones; }
    public Boolean getActiva() { return activa; }
    public void setActiva(Boolean activa) { this.activa = activa; }
    public List<PautaCriterio> getCriterios() { return criterios; }
    public void setCriterios(List<PautaCriterio> criterios) { this.criterios = criterios; }
}
