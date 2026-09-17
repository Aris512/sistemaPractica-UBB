package com.backend.dto;

import java.util.List;

public class GuardarPermisosRequest {

    private List<PermisoItemConfig> permisos;

    public GuardarPermisosRequest() {}

    public GuardarPermisosRequest(List<PermisoItemConfig> permisos) {
        this.permisos = permisos;
    }

    public List<PermisoItemConfig> getPermisos() {
        return permisos;
    }

    public void setPermisos(List<PermisoItemConfig> permisos) {
        this.permisos = permisos;
    }

    public static class PermisoItemConfig {
        private Long idPermiso;
        private String codigo;
        private Boolean activo;
        private String semestresPermitidos;

        public PermisoItemConfig() {}

        public PermisoItemConfig(Long idPermiso, String codigo, Boolean activo, String semestresPermitidos) {
            this.idPermiso = idPermiso;
            this.codigo = codigo;
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

        public Boolean getActivo() {
            return activo != null ? activo : false;
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
}
