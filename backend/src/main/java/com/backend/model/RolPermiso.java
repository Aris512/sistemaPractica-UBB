package com.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "rol_permiso")
public class RolPermiso {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "id_rol", nullable = false)
    private Rol rol;

    @ManyToOne(optional = false)
    @JoinColumn(name = "id_permiso", nullable = false)
    private Permiso permiso;

    @Column(name = "activo", nullable = false)
    private Boolean activo = true;

    /**
     * Semestres permitidos para este permiso y rol.
     * "ALL" o null: aplica a todos los semestres.
     * Lista separada por comas ej: "3,4,5,6,7,8,9,10" para restringir a ciertos semestres.
     */
    @Column(name = "semestres_permitidos", length = 150)
    private String semestresPermitidos = "ALL";

    public RolPermiso() {
        this.activo = true;
        this.semestresPermitidos = "ALL";
    }

    public RolPermiso(Rol rol, Permiso permiso, Boolean activo, String semestresPermitidos) {
        this.rol = rol;
        this.permiso = permiso;
        this.activo = activo != null ? activo : true;
        this.semestresPermitidos = (semestresPermitidos != null && !semestresPermitidos.isBlank())
                ? semestresPermitidos.trim()
                : "ALL";
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Rol getRol() {
        return rol;
    }

    public void setRol(Rol rol) {
        this.rol = rol;
    }

    public Permiso getPermiso() {
        return permiso;
    }

    public void setPermiso(Permiso permiso) {
        this.permiso = permiso;
    }

    public Boolean getActivo() {
        return activo != null ? activo : false;
    }

    public void setActivo(Boolean activo) {
        this.activo = activo != null ? activo : false;
    }

    public String getSemestresPermitidos() {
        return (semestresPermitidos != null && !semestresPermitidos.isBlank())
                ? semestresPermitidos
                : "ALL";
    }

    public void setSemestresPermitidos(String semestresPermitidos) {
        this.semestresPermitidos = (semestresPermitidos != null && !semestresPermitidos.isBlank())
                ? semestresPermitidos.trim()
                : "ALL";
    }

    /**
     * Verifica si un semestre específico está permitido bajo esta regla.
     */
    public boolean permiteSemestre(String semestre) {
        if (!getActivo()) {
            return false;
        }
        if (semestresPermitidos == null || semestresPermitidos.equalsIgnoreCase("ALL") || semestresPermitidos.isBlank()) {
            return true;
        }
        if (semestre == null || semestre.isBlank()) {
            return true;
        }
        String[] partes = semestresPermitidos.split(",");
        String target = semestre.trim();
        for (String p : partes) {
            if (p.trim().equalsIgnoreCase(target)) {
                return true;
            }
        }
        return false;
    }
}
