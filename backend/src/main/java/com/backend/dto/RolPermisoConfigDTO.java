package com.backend.dto;

public class RolPermisoConfigDTO {
    private Long idPermiso;
    private String codigo;
    private String nombre;
    private String categoria;
    private String descripcion;
    private Boolean activo;
    private String semestresPermitidos;

    public RolPermisoConfigDTO() {}

    public RolPermisoConfigDTO(Long idPermiso, String codigo, String nombre, String categoria,
                               String descripcion, Boolean activo, String semestresPermitidos) {
        this.idPermiso = idPermiso;
        this.codigo = codigo;
        this.nombre = nombre;
        this.categoria = categoria;
        this.descripcion = descripcion;
        this.activo = activo;
        this.semestresPermitidos = semestresPermitidos;
    }

    public Long getIdPermiso() {
        return idPermiso;
    }

    public void setIdPermiso(Long idPermiso) {
        this.idPermiso = idPermiso;
    }

    public String getCodigo() {
        return codigo;
    }

    public void setCodigo(String codigo) {
        this.codigo = codigo;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getCategoria() {
        return categoria;
    }

    public void setCategoria(String categoria) {
        this.categoria = categoria;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public Boolean getActivo() {
        return activo;
    }

    public void setActivo(Boolean activo) {
        this.activo = activo;
    }

    public String getSemestresPermitidos() {
        return semestresPermitidos;
    }

    public void setSemestresPermitidos(String semestresPermitidos) {
        this.semestresPermitidos = semestresPermitidos;
    }
}
