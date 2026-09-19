package com.backend.dto;

public class ProfesorContactoDTO {
    private String rut;
    private String nombre;
    private String correo;
    private String rol;
    private String asignatura;

    public ProfesorContactoDTO() {
    }

    public ProfesorContactoDTO(String rut, String nombre, String correo, String rol) {
        this.rut = rut;
        this.nombre = nombre;
        this.correo = correo;
        this.rol = rol;
    }

    public ProfesorContactoDTO(String rut, String nombre, String correo, String rol, String asignatura) {
        this.rut = rut;
        this.nombre = nombre;
        this.correo = correo;
        this.rol = rol;
        this.asignatura = asignatura;
    }

    public String getRut() {
        return rut;
    }

    public void setRut(String rut) {
        this.rut = rut;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getCorreo() {
        return correo;
    }

    public void setCorreo(String correo) {
        this.correo = correo;
    }

    public String getRol() {
        return rol;
    }

    public void setRol(String rol) {
        this.rol = rol;
    }

    public String getAsignatura() {
        return asignatura;
    }

    public void setAsignatura(String asignatura) {
        this.asignatura = asignatura;
    }
}
