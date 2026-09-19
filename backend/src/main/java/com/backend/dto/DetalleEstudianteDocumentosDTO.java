package com.backend.dto;

import java.util.List;

public class DetalleEstudianteDocumentosDTO {
    private String rut;
    private String nombre;
    private String correo;
    private String asignatura;
    private Long idAsignatura;
    private String semestre;
    private double progreso;
    private int totalDocumentos;
    private int documentosRequeridos;
    private List<ProfesorContactoDTO> profesores;
    private List<DocumentoItemDTO> documentos;

    public DetalleEstudianteDocumentosDTO() {
    }

    public DetalleEstudianteDocumentosDTO(String rut, String nombre, String correo, String asignatura,
                                         Long idAsignatura, String semestre, double progreso,
                                         int totalDocumentos, int documentosRequeridos,
                                         List<ProfesorContactoDTO> profesores,
                                         List<DocumentoItemDTO> documentos) {
        this.rut = rut;
        this.nombre = nombre;
        this.correo = correo;
        this.asignatura = asignatura;
        this.idAsignatura = idAsignatura;
        this.semestre = semestre;
        this.progreso = progreso;
        this.totalDocumentos = totalDocumentos;
        this.documentosRequeridos = documentosRequeridos;
        this.profesores = profesores;
        this.documentos = documentos;
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

    public double getProgreso() {
        return progreso;
    }

    public void setProgreso(double progreso) {
        this.progreso = progreso;
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

    public List<ProfesorContactoDTO> getProfesores() {
        return profesores;
    }

    public void setProfesores(List<ProfesorContactoDTO> profesores) {
        this.profesores = profesores;
    }

    public List<DocumentoItemDTO> getDocumentos() {
        return documentos;
    }

    public void setDocumentos(List<DocumentoItemDTO> documentos) {
        this.documentos = documentos;
    }
}
