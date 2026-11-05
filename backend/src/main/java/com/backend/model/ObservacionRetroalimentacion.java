package com.backend.model;

import java.time.LocalDateTime;

import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/**
 * Historial de lo que el profesor le comunica al alumno sobre una planificación enviada: observaciones
 * mientras la revisa y su decisión (aprobación o rechazo). El alumno ve todas en su sección.
 */
@Entity
@Table(name = "observacion_retroalimentacion")
public class ObservacionRetroalimentacion {

    public enum Tipo {
        OBSERVACION, APROBACION, RECHAZO
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_observacion")
    private Long idObservacion;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_retroalimentacion", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private RetroalimentacionIA retroalimentacion;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", length = 20, nullable = false)
    private Tipo tipo;

    /** Solo va vacío en una aprobación sin comentario. */
    @Column(name = "texto", length = 2000)
    private String texto;

    @Column(name = "rut_profesor", length = 12)
    private String rutProfesor;

    /** Ciclo de la retroalimentación en que se escribió. */
    @Column(name = "ciclo", nullable = false)
    private int ciclo;

    @Column(name = "fecha", nullable = false)
    private LocalDateTime fecha;

    public ObservacionRetroalimentacion() {
    }

    public ObservacionRetroalimentacion(RetroalimentacionIA retroalimentacion, Tipo tipo, String texto, String rutProfesor) {
        this.retroalimentacion = retroalimentacion;
        this.tipo = tipo;
        this.texto = texto;
        this.rutProfesor = rutProfesor;
        this.ciclo = retroalimentacion.getCiclo();
        this.fecha = LocalDateTime.now();
    }

    public Long getIdObservacion() {
        return idObservacion;
    }

    public RetroalimentacionIA getRetroalimentacion() {
        return retroalimentacion;
    }

    public Tipo getTipo() {
        return tipo;
    }

    public String getTexto() {
        return texto;
    }

    public String getRutProfesor() {
        return rutProfesor;
    }

    public int getCiclo() {
        return ciclo;
    }

    public LocalDateTime getFecha() {
        return fecha;
    }
}
