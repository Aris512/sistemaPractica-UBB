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
@Table(name = "respuesta_pregunta")
public class RespuestaPregunta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_respuesta")
    private Long idRespuesta;

    @ManyToOne
    @JoinColumn(name = "id_pregunta")
    private PreguntaDiagnostica preguntaDiagnostica;

    @ManyToOne
    @JoinColumn(name = "id_estudiante")
    private Estudiante estudiante;

    private String respuesta;

    @Column(name = "fecha_respuesta")
    private LocalDateTime fechaRespuesta;

    public RespuestaPregunta() {
    }

    public RespuestaPregunta(PreguntaDiagnostica preguntaDiagnostica, Estudiante estudiante,
                              String respuesta) {
        this.preguntaDiagnostica = preguntaDiagnostica;
        this.estudiante = estudiante;
        this.respuesta = respuesta;
        this.fechaRespuesta = LocalDateTime.now();
    }

    public Long getIdRespuesta() {
        return idRespuesta;
    }

    public void setIdRespuesta(Long idRespuesta) {
        this.idRespuesta = idRespuesta;
    }

    public PreguntaDiagnostica getPreguntaDiagnostica() {
        return preguntaDiagnostica;
    }

    public void setPreguntaDiagnostica(PreguntaDiagnostica preguntaDiagnostica) {
        this.preguntaDiagnostica = preguntaDiagnostica;
    }

    public Estudiante getEstudiante() {
        return estudiante;
    }

    public void setEstudiante(Estudiante estudiante) {
        this.estudiante = estudiante;
    }

    public String getRespuesta() {
        return respuesta;
    }

    public void setRespuesta(String respuesta) {
        this.respuesta = respuesta;
    }

    public LocalDateTime getFechaRespuesta() {
        return fechaRespuesta;
    }

    public void setFechaRespuesta(LocalDateTime fechaRespuesta) {
        this.fechaRespuesta = fechaRespuesta;
    }
}
