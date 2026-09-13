package com.backend.dto;

public class LoginRequest {

    private String rut;
    private String password;
    private String contrasena;
    private String email;
    private String correo;

    public LoginRequest() {
    }

    public LoginRequest(String rut, String password) {
        this.rut = rut;
        this.password = password;
    }

    public String getRut() {
        if (rut != null && !rut.isBlank()) {
            return rut.trim();
        }
        if (email != null && !email.isBlank()) {
            return email.trim();
        }
        return correo != null ? correo.trim() : null;
    }

    public void setRut(String rut) {
        this.rut = rut;
    }

    public String getEmail() {
        return getRut();
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getCorreo() {
        return getRut();
    }

    public void setCorreo(String correo) {
        this.correo = correo;
    }

    public String getPassword() {
        if (password != null && !password.isBlank()) {
            return password;
        }
        return contrasena;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getContrasena() {
        return getPassword();
    }

    public void setContrasena(String contrasena) {
        this.contrasena = contrasena;
    }
}
