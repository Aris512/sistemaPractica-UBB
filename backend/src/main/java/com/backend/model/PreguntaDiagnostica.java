package com.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "pregunta_diagnostica")
public class PreguntaDiagnostica {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_pregunta")
    private Long idPregunta;

    @ManyToOne
    @JoinColumn(name = "id_retroalimentacion")
    private RetroalimentacionIA retroalimentacionIA;

    private String pregunta;

    public PreguntaDiagnostica() {
    }

    public PreguntaDiagnostica(RetroalimentacionIA retroalimentacionIA, String pregunta) {
        this.retroalimentacionIA = retroalimentacionIA;
        this.pregunta = pregunta;
    }

    public Long getIdPregunta() {
        return idPregunta;
    }

    public void setIdPregunta(Long idPregunta) {
        this.idPregunta = idPregunta;
    }

    public RetroalimentacionIA getRetroalimentacionIA() {
        return retroalimentacionIA;
    }

    public void setRetroalimentacionIA(RetroalimentacionIA retroalimentacionIA) {
        this.retroalimentacionIA = retroalimentacionIA;
    }

    public String getPregunta() {
        return pregunta;
    }

    public void setPregunta(String pregunta) {
        this.pregunta = pregunta;
    }
}
