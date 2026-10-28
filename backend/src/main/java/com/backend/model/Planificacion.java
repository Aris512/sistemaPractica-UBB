package com.backend.model;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

/** Planificación de clase del estudiante en práctica (8.° semestre en adelante) con sus 5 archivos obligatorios. */
@Entity
@Table(name = "planificacion")
public class Planificacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_planificacion")
    private Long idPlanificacion;

    @ManyToOne
    @JoinColumn(name = "id_practica")
    private Practica practica;

    @ManyToOne
    @JoinColumn(name = "id_estudiante")
    private Estudiante estudiante;

    @ManyToOne
    @JoinColumn(name = "id_asignatura")
    private Asignatura asignatura;

    @Column(name = "fecha_creacion")
    private LocalDateTime fechaCreacion;

    @JsonIgnore
    @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "id_documento_planificacion")
    private DocumentoPlanificacion documentoPlanificacion;

    public Planificacion() {
    }

    public Planificacion(Practica practica, Estudiante estudiante, Asignatura asignatura) {
        this.practica = practica;
        this.estudiante = estudiante;
        this.asignatura = asignatura;
        this.fechaCreacion = LocalDateTime.now();
        this.documentoPlanificacion = new DocumentoPlanificacion();
    }

    public Long getIdPlanificacion() {
        return idPlanificacion;
    }

    public Practica getPractica() {
        return practica;
    }

    public void setPractica(Practica practica) {
        this.practica = practica;
    }

    public Estudiante getEstudiante() {
        return estudiante;
    }

    public void setEstudiante(Estudiante estudiante) {
        this.estudiante = estudiante;
    }

    public Asignatura getAsignatura() {
        return asignatura;
    }

    public void setAsignatura(Asignatura asignatura) {
        this.asignatura = asignatura;
    }

    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }

    public DocumentoPlanificacion getDocumentoPlanificacion() {
        return documentoPlanificacion;
    }

    public void setDocumentoPlanificacion(DocumentoPlanificacion documentoPlanificacion) {
        this.documentoPlanificacion = documentoPlanificacion;
    }
}
