package com.backend.dto;

import java.util.List;

public class EstadoPracticaDTO {

    private boolean esPractica;
    private String etapaActual; // "INSCRIPCION", "INICIO", "SEGUIMIENTO", "EVALUACION_FINAL"
    private int etapaIndex; // 0, 1, 2, 3
    private int progresoPorcentaje;
    private String asignaturaNombre;
    private String codigoAsignatura;
    private String semestre;
    private String centroPractica;
    private String tutorNombre;
    private String profesorNombre;
    private int horasRealizadas;
    private int horasTotales;
    private List<HistorialItemDTO> historial;

    public EstadoPracticaDTO() {
    }

    public boolean isEsPractica() {
        return esPractica;
    }

    public void setEsPractica(boolean esPractica) {
        this.esPractica = esPractica;
    }

    public String getEtapaActual() {
        return etapaActual;
    }

    public void setEtapaActual(String etapaActual) {
        this.etapaActual = etapaActual;
    }

    public int getEtapaIndex() {
        return etapaIndex;
    }

    public void setEtapaIndex(int etapaIndex) {
        this.etapaIndex = etapaIndex;
    }

    public int getProgresoPorcentaje() {
        return progresoPorcentaje;
    }

    public void setProgresoPorcentaje(int progresoPorcentaje) {
        this.progresoPorcentaje = progresoPorcentaje;
    }

    public String getAsignaturaNombre() {
        return asignaturaNombre;
    }

    public void setAsignaturaNombre(String asignaturaNombre) {
        this.asignaturaNombre = asignaturaNombre;
    }

    public String getCodigoAsignatura() {
        return codigoAsignatura;
    }

    public void setCodigoAsignatura(String codigoAsignatura) {
        this.codigoAsignatura = codigoAsignatura;
    }

    public String getSemestre() {
        return semestre;
    }

    public void setSemestre(String semestre) {
        this.semestre = semestre;
    }

    public String getCentroPractica() {
        return centroPractica;
    }

    public void setCentroPractica(String centroPractica) {
        this.centroPractica = centroPractica;
    }

    public String getTutorNombre() {
        return tutorNombre;
    }

    public void setTutorNombre(String tutorNombre) {
        this.tutorNombre = tutorNombre;
    }

    public String getProfesorNombre() {
        return profesorNombre;
    }

    public void setProfesorNombre(String profesorNombre) {
        this.profesorNombre = profesorNombre;
    }

    public int getHorasRealizadas() {
        return horasRealizadas;
    }

    public void setHorasRealizadas(int horasRealizadas) {
        this.horasRealizadas = horasRealizadas;
    }

    public int getHorasTotales() {
        return horasTotales;
    }

    public void setHorasTotales(int horasTotales) {
        this.horasTotales = horasTotales;
    }

    public List<HistorialItemDTO> getHistorial() {
        return historial;
    }

    public void setHistorial(List<HistorialItemDTO> historial) {
        this.historial = historial;
    }
}
