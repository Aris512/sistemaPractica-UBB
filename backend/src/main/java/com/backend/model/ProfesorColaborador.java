package com.backend.model;

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
@Table(name = "profesor_colaborador")
public class ProfesorColaborador {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_colaborador")
    private Long idColaborador;

    @ManyToOne
    @JoinColumn(name = "rut_usuario")
    private Usuario usuario;

    @ManyToOne
    @JoinColumn(name = "id_centro")
    private CentroPractica centroPractica;

    private String especialidad;

    @ManyToMany
    @JoinTable(
        name = "profesor_colaborador_practica",
        joinColumns = @JoinColumn(name = "id_colaborador"),
        inverseJoinColumns = @JoinColumn(name = "id_practica")
    )
    private Set<Practica> practicas;

    public ProfesorColaborador() {
    }

    public ProfesorColaborador(Usuario usuario, CentroPractica centroPractica, String especialidad) {
        this.usuario = usuario;
        this.centroPractica = centroPractica;
        this.especialidad = especialidad;
    }

    public Long getIdColaborador() {
        return idColaborador;
    }

    public void setIdColaborador(Long idColaborador) {
        this.idColaborador = idColaborador;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }

    public CentroPractica getCentroPractica() {
        return centroPractica;
    }

    public void setCentroPractica(CentroPractica centroPractica) {
        this.centroPractica = centroPractica;
    }

    public String getEspecialidad() {
        return especialidad;
    }

    public void setEspecialidad(String especialidad) {
        this.especialidad = especialidad;
    }

    public Set<Practica> getPracticas() {
        return practicas;
    }

    public void setPracticas(Set<Practica> practicas) {
        this.practicas = practicas;
    }
}
