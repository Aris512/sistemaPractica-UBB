package com.backend.model;

import java.util.Set;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "practica")
public class Practica {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_practica")
    private Long idPractica;

    @ManyToOne
    @JoinColumn(name = "id_estudiante")
    private Estudiante estudiante;

    @ManyToOne
    @JoinColumn(name = "id_tutor_practica")
    private TutorPractica tutorPractica;

    @ManyToOne
    @JoinColumn(name = "id_centro_de_practica")
    private CentroPractica centroPractica;

    @ManyToOne
    @JoinColumn(name = "asignatura_id")
    private Asignatura asignatura;

    @Column(name = "estado_aprobacion")
    private String estadoAprobacion;

    @JsonIgnore
    @ManyToMany(mappedBy = "practicas")
    private Set<ProfesorColaborador> profesoresColaboradores;

    public Practica() {
    }

    public Practica(Estudiante estudiante, TutorPractica tutorPractica, CentroPractica centroPractica,
                    Asignatura asignatura, String estadoAprobacion) {
        this.estudiante = estudiante;
        this.tutorPractica = tutorPractica;
        this.centroPractica = centroPractica;
        this.asignatura = asignatura;
        this.estadoAprobacion = estadoAprobacion;
    }

    public Long getIdPractica() {
        return idPractica;
    }

    public void setIdPractica(Long idPractica) {
        this.idPractica = idPractica;
    }

    public Estudiante getEstudiante() {
        return estudiante;
    }

    public void setEstudiante(Estudiante estudiante) {
        this.estudiante = estudiante;
    }

    public TutorPractica getTutorPractica() {
        return tutorPractica;
    }

    public void setTutorPractica(TutorPractica tutorPractica) {
        this.tutorPractica = tutorPractica;
    }

    public CentroPractica getCentroPractica() {
        return centroPractica;
    }

    public void setCentroPractica(CentroPractica centroPractica) {
        this.centroPractica = centroPractica;
    }

    public Asignatura getAsignatura() {
        return asignatura;
    }

    public void setAsignatura(Asignatura asignatura) {
        this.asignatura = asignatura;
    }

    public String getEstadoAprobacion() {
        return estadoAprobacion;
    }

    public void setEstadoAprobacion(String estadoAprobacion) {
        this.estadoAprobacion = estadoAprobacion;
    }

    public Set<ProfesorColaborador> getProfesoresColaboradores() {
        return profesoresColaboradores;
    }

    public void setProfesoresColaboradores(Set<ProfesorColaborador> profesoresColaboradores) {
        this.profesoresColaboradores = profesoresColaboradores;
    }
}
