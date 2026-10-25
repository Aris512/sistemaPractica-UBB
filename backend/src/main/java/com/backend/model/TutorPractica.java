package com.backend.model;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "tutor_practica")
public class TutorPractica {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_tutor")
    private Long idTutor;

    private String nombre;

    @ManyToOne(cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinColumn(name = "rut_usuario")
    private Usuario usuario;

    public TutorPractica() {
    }

    public TutorPractica(String nombre, Usuario usuario) {
        this.nombre = nombre;
        this.usuario = usuario;
    }

    public Long getIdTutor() {
        return idTutor;
    }

    public void setIdTutor(Long idTutor) {
        this.idTutor = idTutor;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }
}
