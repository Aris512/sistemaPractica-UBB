package com.backend.dto;

public class DireccionDTO {

    private String direccion;
    private String calle;
    private String numero;
    private String ciudad;
    private String region;
    private String pais;
    private Double latitud;
    private Double longitud;

    public DireccionDTO() {
    }

    public DireccionDTO(String direccion, String calle, String numero, String ciudad, String region, String pais, Double latitud, Double longitud) {
        this.direccion = direccion;
        this.calle = calle;
        this.numero = numero;
        this.ciudad = ciudad;
        this.region = region;
        this.pais = pais;
        this.latitud = latitud;
        this.longitud = longitud;
    }

    public String getDireccion() {
        return direccion;
    }

    public void setDireccion(String direccion) {
        this.direccion = direccion;
    }

    public String getCalle() {
        return calle;
    }

    public void setCalle(String calle) {
        this.calle = calle;
    }

    public String getNumero() {
        return numero;
    }

    public void setNumero(String numero) {
        this.numero = numero;
    }

    public String getCiudad() {
        return ciudad;
    }

    public void setCiudad(String ciudad) {
        this.ciudad = ciudad;
    }

    public String getRegion() {
        return region;
    }

    public void setRegion(String region) {
        this.region = region;
    }

    public String getPais() {
        return pais;
    }

    public void setPais(String pais) {
        this.pais = pais;
    }

    public Double getLatitud() {
        return latitud;
    }

    public void setLatitud(Double latitud) {
        this.latitud = latitud;
    }

    public Double getLongitud() {
        return longitud;
    }

    public void setLongitud(Double longitud) {
        this.longitud = longitud;
    }
}
