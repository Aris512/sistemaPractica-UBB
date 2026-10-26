package com.backend.model;

import java.time.LocalDateTime;
import java.util.Set;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;

@Entity
@Table(name = "usuario")
public class Usuario {

    @Id
    @Column(name = "rut", length = 12, nullable = false, unique = true)
    private String rut;

    private String nombre;

    private String apellido;

    private String correo;

    @Column(name = "contrasena_encriptada")
    private String contrasenaEncriptada;

    @Column(name = "fecha_creacion")
    private LocalDateTime fechaCreacion;

    @Column(name = "estado", length = 20, nullable = false)
    private String estado = "activo";

    @ManyToMany
    @JoinTable(
        name = "usuario_rol",
        joinColumns = @JoinColumn(name = "rut_usuario"),
        inverseJoinColumns = @JoinColumn(name = "id_rol")
    )
    private Set<Rol> roles;

    public Usuario() {
        this.estado = "activo";
    }

    public Usuario(String rut, String nombre, String apellido, String correo, String contrasenaEncriptada) {
        this.rut = rut;
        this.nombre = nombre;
        this.apellido = apellido;
        this.correo = correo;
        this.contrasenaEncriptada = contrasenaEncriptada;
        this.fechaCreacion = LocalDateTime.now();
        this.estado = "activo";
    }

    public Usuario(String rut, String nombre, String apellido, String correo, String contrasenaEncriptada, String estado) {
        this.rut = rut;
        this.nombre = nombre;
        this.apellido = apellido;
        this.correo = correo;
        this.contrasenaEncriptada = contrasenaEncriptada;
        this.fechaCreacion = LocalDateTime.now();
        this.estado = (estado != null && !estado.isBlank()) ? estado : "activo";
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

    public String getContrasenaEncriptada() {
        return contrasenaEncriptada;
    }

    public void setContrasenaEncriptada(String contrasenaEncriptada) {
        this.contrasenaEncriptada = contrasenaEncriptada;
    }

    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }

    public void setFechaCreacion(LocalDateTime fechaCreacion) {
        this.fechaCreacion = fechaCreacion;
    }

    public Set<Rol> getRoles() {
        return roles;
    }

    public void setRoles(Set<Rol> roles) {
        this.roles = roles;
    }

    public String getEstado() {
        return estado != null ? estado : "activo";
    }

    public void setEstado(String estado) {
        this.estado = (estado != null && !estado.isBlank()) ? estado : "activo";
    }

    public boolean isActivo() {
        return "activo".equalsIgnoreCase(this.estado);
    }

    public void setActivo(boolean activo) {
        this.estado = activo ? "activo" : "inactivo";
    }
}
