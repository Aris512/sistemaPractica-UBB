package com.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

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

    private String asignatura;

    private String tipo;

    @Column(name = "criterios_count")
    private Integer criteriosCount;

    @Column(length = 1000)
    private String descripcion;

    private String ponderacion;

    private String version;

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

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCodigo() {
        return codigo;
    }

    public void setCodigo(String codigo) {
        this.codigo = codigo;
    }

    public String getTitulo() {
        return titulo;
    }

    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    public String getAsignatura() {
        return asignatura;
    }

    public void setAsignatura(String asignatura) {
        this.asignatura = asignatura;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public Integer getCriteriosCount() {
        return criteriosCount;
    }

    public void setCriteriosCount(Integer criteriosCount) {
        this.criteriosCount = criteriosCount;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getPonderacion() {
        return ponderacion;
    }

    public void setPonderacion(String ponderacion) {
        this.ponderacion = ponderacion;
    }

    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }
}
