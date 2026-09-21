package com.backend.dto;

import java.time.LocalDateTime;

public class ArchivoPlanificacionDTO {
    private Long idDocumento;
    private String nombre;
    private String tipo; // "GUIA", "RECURSO", "POWERPOINT", "PAUTA_EVALUACION"
    private String ubicacion;
    private LocalDateTime fechaCarga;
    private String tamanio;
    private String urlDescarga;

    public ArchivoPlanificacionDTO() {
    }

    public ArchivoPlanificacionDTO(Long idDocumento, String nombre, String tipo, String ubicacion,
                                 LocalDateTime fechaCarga, String tamanio, String urlDescarga) {
        this.idDocumento = idDocumento;
        this.nombre = nombre;
        this.tipo = tipo;
        this.ubicacion = ubicacion;
        this.fechaCarga = fechaCarga;
        this.tamanio = tamanio;
        this.urlDescarga = urlDescarga;
    }

    public Long getIdDocumento() {
        return idDocumento;
    }

    public void setIdDocumento(Long idDocumento) {
        this.idDocumento = idDocumento;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public String getUbicacion() {
        return ubicacion;
    }

    public void setUbicacion(String ubicacion) {
        this.ubicacion = ubicacion;
    }

    public LocalDateTime getFechaCarga() {
        return fechaCarga;
    }

    public void setFechaCarga(LocalDateTime fechaCarga) {
        this.fechaCarga = fechaCarga;
    }

    public String getTamanio() {
        return tamanio;
    }

    public void setTamanio(String tamanio) {
        this.tamanio = tamanio;
    }

    public String getUrlDescarga() {
        return urlDescarga;
    }

    public void setUrlDescarga(String urlDescarga) {
        this.urlDescarga = urlDescarga;
    }
}
