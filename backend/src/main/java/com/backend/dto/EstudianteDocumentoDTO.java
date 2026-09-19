package com.backend.dto;

import java.util.List;

public class EstudianteDocumentoDTO {
    private String rut;
    private String nombre;
    private String correo;
    private String asignatura;
    private Long idAsignatura;
    private String semestre;
    private int totalDocumentos; // documentos entregados
    private int documentosRequeridos; // normalmente 2
    private double progreso; // 0.0 - 100.0
    private String estado; // "COMPLETO", "EN_PROGRESO", "PENDIENTE"
    private List<ProfesorContactoDTO> profesores;

    public EstudianteDocumentoDTO() {
    }

    public EstudianteDocumentoDTO(String rut, String nombre, String correo, String asignatura,
                                  Long idAsignatura, String semestre, int totalDocumentos,
                                  int documentosRequeridos, double progreso, String estado,
                                  List<ProfesorContactoDTO> profesores) {
        this.rut = rut;
        this.nombre = nombre;
        this.correo = correo;
        this.asignatura = asignatura;
        this.idAsignatura = idAsignatura;
        this.semestre = semestre;
        this.totalDocumentos = totalDocumentos;
        this.documentosRequeridos = documentosRequeridos;
        this.progreso = progreso;
        this.estado = estado;
        this.profesores = profesores;
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

    public String getAsignatura() {
        return asignatura;
    }

    public void setAsignatura(String asignatura) {
        this.asignatura = asignatura;
    }

    public Long getIdAsignatura() {
        return idAsignatura;
    }

    public void setIdAsignatura(Long idAsignatura) {
        this.idAsignatura = idAsignatura;
    }

    public String getSemestre() {
        return semestre;
    }

    public void setSemestre(String semestre) {
        this.semestre = semestre;
    }

    public int getTotalDocumentos() {
        return totalDocumentos;
    }

    public void setTotalDocumentos(int totalDocumentos) {
        this.totalDocumentos = totalDocumentos;
    }

    public int getDocumentosRequeridos() {
        return documentosRequeridos;
    }

    public void setDocumentosRequeridos(int documentosRequeridos) {
        this.documentosRequeridos = documentosRequeridos;
    }

    public double getProgreso() {
        return progreso;
    }

    public void setProgreso(double progreso) {
        this.progreso = progreso;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public List<ProfesorContactoDTO> getProfesores() {
        return profesores;
    }

    public void setProfesores(List<ProfesorContactoDTO> profesores) {
        this.profesores = profesores;
    }
}
