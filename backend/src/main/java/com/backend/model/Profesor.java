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
@Table(name = "profesor")
public class Profesor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_profesor")
    private Long idProfesor;

    @ManyToOne
    @JoinColumn(name = "rut_usuario")
    private Usuario usuario;

    @ManyToOne
    @JoinColumn(name = "id_asignatura")
    private Asignatura asignatura;

    @ManyToMany
    @JoinTable(
        name = "profesor_asignatura",
        joinColumns = @JoinColumn(name = "id_profesor"),
        inverseJoinColumns = @JoinColumn(name = "id_asignatura")
    )
    private Set<Asignatura> asignaturas;

    public Profesor() {
    }

    public Profesor(Usuario usuario, Asignatura asignatura) {
        this.usuario = usuario;
        this.asignatura = asignatura;
    }

    public Long getIdProfesor() {
        return idProfesor;
    }

    public void setIdProfesor(Long idProfesor) {
        this.idProfesor = idProfesor;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }

    public Asignatura getAsignatura() {
        return asignatura;
    }

    public void setAsignatura(Asignatura asignatura) {
        this.asignatura = asignatura;
    }

    public Set<Asignatura> getAsignaturas() {
        return asignaturas;
    }

    public void setAsignaturas(Set<Asignatura> asignaturas) {
        this.asignaturas = asignaturas;
    }
}
