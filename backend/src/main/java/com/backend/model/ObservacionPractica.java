package com.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "observacion_practica")
public class ObservacionPractica {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String estudiante;

    @Column(nullable = false)
    private String rut;

    @Column(name = "centro_practica")
    private String centroPractica;

    private String fecha;

    @Column(name = "foco_observacion")
    private String focoObservacion;

    @Column(length = 2000)
    private String resumen;

    private String estado;

    @Column(name = "autor_rut")
    private String autorRut;

    public ObservacionPractica() {
    }

    public ObservacionPractica(String estudiante, String rut, String centroPractica, String fecha,
                               String focoObservacion, String resumen, String estado, String autorRut) {
        this.estudiante = estudiante;
        this.rut = rut;
        this.centroPractica = centroPractica;
        this.fecha = fecha;
        this.focoObservacion = focoObservacion;
        this.resumen = resumen;
        this.estado = estado;
        this.autorRut = autorRut;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEstudiante() {
        return estudiante;
    }

    public void setEstudiante(String estudiante) {
        this.estudiante = estudiante;
    }

    public String getRut() {
        return rut;
    }

    public void setRut(String rut) {
        this.rut = rut;
    }

    public String getCentroPractica() {
        return centroPractica;
    }

    public void setCentroPractica(String centroPractica) {
        this.centroPractica = centroPractica;
    }

    public String getFecha() {
        return fecha;
    }

    public void setFecha(String fecha) {
        this.fecha = fecha;
    }

    public String getFocoObservacion() {
        return focoObservacion;
    }

    public void setFocoObservacion(String focoObservacion) {
        this.focoObservacion = focoObservacion;
    }

    public String getResumen() {
        return resumen;
    }

    public void setResumen(String resumen) {
        this.resumen = resumen;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public String getAutorRut() {
        return autorRut;
    }

    public void setAutorRut(String autorRut) {
        this.autorRut = autorRut;
    }
}
