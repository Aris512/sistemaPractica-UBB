package com.backend.dto;

import java.util.Set;

public class LoginResponse {

    private boolean success;
    private String message;
    private String rut;
    private String nombre;
    private String apellido;
    private String correo;
    private Set<String> roles;
    private Boolean estado;

    public LoginResponse() {
    }

    public LoginResponse(boolean success, String message, String rut, String nombre, String apellido, String correo, Set<String> roles) {
        this.success = success;
        this.message = message;
        this.rut = rut;
        this.nombre = nombre;
        this.apellido = apellido;
        this.correo = correo;
        this.roles = roles;
        this.estado = true;
    }

    public static LoginResponse error(String message) {
        LoginResponse resp = new LoginResponse();
        resp.setSuccess(false);
        resp.setMessage(message);
        return resp;
    }

    public static LoginResponse success(String rut, String nombre, String apellido, String correo, Set<String> roles) {
        return new LoginResponse(true, "Inicio de sesión exitoso", rut, nombre, apellido, correo, roles);
    }

    public static LoginResponse success(String rut, String nombre, String apellido, String correo, Set<String> roles, Boolean estado) {
        LoginResponse resp = new LoginResponse(true, "Inicio de sesión exitoso", rut, nombre, apellido, correo, roles);
        resp.setEstado(estado);
        return resp;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
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

    public String getApellido() {
        return apellido;
    }

    public void setApellido(String apellido) {
        this.apellido = apellido;
    }

    public String getCorreo() {
        return correo;
    }

    public void setCorreo(String correo) {
        this.correo = correo;
    }

    public Set<String> getRoles() {
        return roles;
    }

    public void setRoles(Set<String> roles) {
        this.roles = roles;
    }

    public Boolean getEstado() {
        return estado;
    }

    public void setEstado(Boolean estado) {
        this.estado = estado;
    }
}
