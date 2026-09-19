package com.backend.dto;

import java.time.LocalDateTime;

public class DocumentoItemDTO {
    private Long id;
    private String nombreDocumento;
    private String nombreArchivo;
    private String tipoDocumento; // "ESTUDIANTE" o "PROFESOR"
    private LocalDateTime fechaCarga;
    private String estado; // "ENTREGADO" o "PENDIENTE"
    private String tamanio;
    private String subidoPor;
    private String correoSubidoPor;
    private String downloadUrl;

    public DocumentoItemDTO() {
    }

    public DocumentoItemDTO(Long id, String nombreDocumento, String nombreArchivo,
                            String tipoDocumento, LocalDateTime fechaCarga, String estado,
                            String tamanio, String subidoPor, String correoSubidoPor, String downloadUrl) {
        this.id = id;
        this.nombreDocumento = nombreDocumento;
        this.nombreArchivo = nombreArchivo;
        this.tipoDocumento = tipoDocumento;
        this.fechaCarga = fechaCarga;
        this.estado = estado;
        this.tamanio = tamanio;
        this.subidoPor = subidoPor;
        this.correoSubidoPor = correoSubidoPor;
        this.downloadUrl = downloadUrl;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNombreDocumento() {
        return nombreDocumento;
    }

    public void setNombreDocumento(String nombreDocumento) {
        this.nombreDocumento = nombreDocumento;
    }

    public String getNombreArchivo() {
        return nombreArchivo;
    }

    public void setNombreArchivo(String nombreArchivo) {
        this.nombreArchivo = nombreArchivo;
    }

    public String getTipoDocumento() {
        return tipoDocumento;
    }

    public void setTipoDocumento(String tipoDocumento) {
        this.tipoDocumento = tipoDocumento;
    }

    public LocalDateTime getFechaCarga() {
        return fechaCarga;
    }

    public void setFechaCarga(LocalDateTime fechaCarga) {
        this.fechaCarga = fechaCarga;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public String getTamanio() {
        return tamanio;
    }

    public void setTamanio(String tamanio) {
        this.tamanio = tamanio;
    }

    public String getSubidoPor() {
        return subidoPor;
    }

    public void setSubidoPor(String subidoPor) {
        this.subidoPor = subidoPor;
    }

    public String getCorreoSubidoPor() {
        return correoSubidoPor;
    }

    public void setCorreoSubidoPor(String correoSubidoPor) {
        this.correoSubidoPor = correoSubidoPor;
    }

    public String getDownloadUrl() {
        return downloadUrl;
    }

    public void setDownloadUrl(String downloadUrl) {
        this.downloadUrl = downloadUrl;
    }
}
