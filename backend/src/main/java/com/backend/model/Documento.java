package com.backend.model;

import java.time.LocalDateTime;
import java.util.Set;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "documento")
public class Documento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_documento")
    private Long idDocumento;

    private String nombre;

    private String tipo;

    private String ubicacion;

    @Column(name = "fecha_carga")
    private LocalDateTime fechaCarga;

    @ManyToOne
    @JoinColumn(name = "rut_usuario")
    private Usuario usuario;

    @ManyToMany
    @JoinTable(
        name = "documento_planificacion",
        joinColumns = @JoinColumn(name = "id_documento"),
        inverseJoinColumns = @JoinColumn(name = "id_planificacion")
    )
    private Set<Planificacion> planificaciones;

    public Documento() {
    }

    public Documento(String nombre, String tipo, String ubicacion, Usuario usuario) {
        this.nombre = nombre;
        this.tipo = tipo;
        this.ubicacion = ubicacion;
        this.usuario = usuario;
        this.fechaCarga = LocalDateTime.now();
    }

    public Long getIdDocumento() {
        return idDocumento;
    }

    public void setIdDocumento(Long idDocumento) {
        this.idDocumento = idDocumento;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public String getUbicacion() {
        return ubicacion;
    }

    public void setUbicacion(String ubicacion) {
        this.ubicacion = ubicacion;
    }

    public LocalDateTime getFechaCarga() {
        return fechaCarga;
    }

    public void setFechaCarga(LocalDateTime fechaCarga) {
        this.fechaCarga = fechaCarga;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }

    public Set<Planificacion> getPlanificaciones() {
        return planificaciones;
    }

    public void setPlanificaciones(Set<Planificacion> planificaciones) {
        this.planificaciones = planificaciones;
    }
}
