package com.backend.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "evidencia")
public class Evidencia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_evidencia")
    private Long idEvidencia;

    @ManyToOne
    @JoinColumn(name = "id_actividad", nullable = false)
    private Actividad actividad;

    @ManyToOne
    @JoinColumn(name = "id_estudiante", nullable = false)
    private Estudiante estudiante;

    @Column(name = "nombre_archivo")
    private String nombreArchivo;

    @Column(name = "archivo_url", length = 1000)
    private String archivoUrl;

    @Column(name = "comentario_estudiante", length = 2000)
    private String comentarioEstudiante;

    @Column(name = "fecha_entrega")
    private LocalDateTime fechaEntrega;

    private String estado; // "PENDIENTE", "REVISADO", "OBSERVADO"

    @Column(length = 2000)
    private String retroalimentacion;

    private Double calificacion;

    @Column(name = "fecha_revision")
    private LocalDateTime fechaRevision;

    @ManyToOne
    @JoinColumn(name = "id_profesor_revisor")
    private Profesor revisadoPor;

    public Evidencia() {
        this.fechaEntrega = LocalDateTime.now();
        this.estado = "PENDIENTE";
    }

    public Evidencia(Actividad actividad, Estudiante estudiante, String nombreArchivo,
                     String archivoUrl, String comentarioEstudiante) {
        this.actividad = actividad;
        this.estudiante = estudiante;
        this.nombreArchivo = nombreArchivo;
        this.archivoUrl = archivoUrl;
        this.comentarioEstudiante = comentarioEstudiante;
        this.fechaEntrega = LocalDateTime.now();
        this.estado = "PENDIENTE";
    }

    public Long getIdEvidencia() {
        return idEvidencia;
    }

    public void setIdEvidencia(Long idEvidencia) {
        this.idEvidencia = idEvidencia;
    }

    public Actividad getActividad() {
        return actividad;
    }

    public void setActividad(Actividad actividad) {
        this.actividad = actividad;
    }

    public Estudiante getEstudiante() {
        return estudiante;
    }

    public void setEstudiante(Estudiante estudiante) {
        this.estudiante = estudiante;
    }

    public String getNombreArchivo() {
        return nombreArchivo;
    }

    public void setNombreArchivo(String nombreArchivo) {
        this.nombreArchivo = nombreArchivo;
    }

    public String getArchivoUrl() {
        return archivoUrl;
    }

    public void setArchivoUrl(String archivoUrl) {
        this.archivoUrl = archivoUrl;
    }

    public String getComentarioEstudiante() {
        return comentarioEstudiante;
    }

    public void setComentarioEstudiante(String comentarioEstudiante) {
        this.comentarioEstudiante = comentarioEstudiante;
    }

    public LocalDateTime getFechaEntrega() {
        return fechaEntrega;
    }

    public void setFechaEntrega(LocalDateTime fechaEntrega) {
        this.fechaEntrega = fechaEntrega;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public String getRetroalimentacion() {
        return retroalimentacion;
    }

    public void setRetroalimentacion(String retroalimentacion) {
        this.retroalimentacion = retroalimentacion;
    }

    public Double getCalificacion() {
        return calificacion;
    }

    public void setCalificacion(Double calificacion) {
        this.calificacion = calificacion;
    }

    public LocalDateTime getFechaRevision() {
        return fechaRevision;
    }

    public void setFechaRevision(LocalDateTime fechaRevision) {
        this.fechaRevision = fechaRevision;
    }

    public Profesor getRevisadoPor() {
        return revisadoPor;
    }

    public void setRevisadoPor(Profesor revisadoPor) {
        this.revisadoPor = revisadoPor;
    }
}
