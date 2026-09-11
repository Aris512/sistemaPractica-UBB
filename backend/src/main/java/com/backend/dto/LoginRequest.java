package com.backend.dto;

public class LoginRequest {

    private String email;
    private String correo;
    private String password;
    private String contrasena;

    public LoginRequest() {
    }

    public LoginRequest(String email, String password) {
        this.email = email;
        this.password = password;
    }

    // Allows either 'email' or 'correo'
    public String getEmail() {
        if (email != null && !email.isBlank()) {
            return email.trim();
        }
        return correo != null ? correo.trim() : null;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getCorreo() {
        return getEmail();
    }

    public void setCorreo(String correo) {
        this.correo = correo;
    }

    // Allows either 'password' or 'contrasena'
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
