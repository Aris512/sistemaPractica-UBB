package com.backend.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "documento_practica")
public class DocumentoPractica {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_documento_practica")
    private Long idDocumentoPractica;

    @ManyToOne
    @JoinColumn(name = "rut_usuario", nullable = false)
    private Usuario usuario; // Quien subió el documento

    @ManyToOne
    @JoinColumn(name = "rut_estudiante", nullable = false)
    private Usuario estudiante; // Estudiante al que corresponde la práctica

    @ManyToOne
    @JoinColumn(name = "id_asignatura", nullable = false)
    private Asignatura asignatura; // Asignatura de la práctica

    @Column(name = "nombre_archivo", nullable = false, length = 500)
    private String nombreArchivo;

    @Column(name = "nombre_documento", length = 255)
    private String nombreDocumento;

    @Column(name = "tipo_documento", nullable = false, length = 50)
    private String tipoDocumento; // "ESTUDIANTE" o "PROFESOR"

    @Column(name = "ubicacion", nullable = false, length = 1000)
    private String ubicacion; // Ruta local en el servidor

    @Column(name = "fecha_carga")
    private LocalDateTime fechaCarga;

    @Column(name = "estado", length = 50)
    private String estado; // "ENTREGADO", "PENDIENTE", "REVISADO"

    @Column(name = "tamanio_bytes")
    private Long tamanioBytes;

    public DocumentoPractica() {
    }

    public DocumentoPractica(Usuario usuario, Usuario estudiante, Asignatura asignatura,
                             String nombreArchivo, String nombreDocumento, String tipoDocumento,
                             String ubicacion, LocalDateTime fechaCarga, String estado, Long tamanioBytes) {
        this.usuario = usuario;
        this.estudiante = estudiante;
        this.asignatura = asignatura;
        this.nombreArchivo = nombreArchivo;
        this.nombreDocumento = nombreDocumento;
        this.tipoDocumento = tipoDocumento;
        this.ubicacion = ubicacion;
        this.fechaCarga = fechaCarga;
        this.estado = estado;
        this.tamanioBytes = tamanioBytes;
    }

    public Long getIdDocumentoPractica() {
        return idDocumentoPractica;
    }

    public void setIdDocumentoPractica(Long idDocumentoPractica) {
        this.idDocumentoPractica = idDocumentoPractica;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }

    public Usuario getEstudiante() {
        return estudiante;
    }

    public void setEstudiante(Usuario estudiante) {
        this.estudiante = estudiante;
    }

    public Asignatura getAsignatura() {
        return asignatura;
    }

    public void setAsignatura(Asignatura asignatura) {
        this.asignatura = asignatura;
    }

    public String getNombreArchivo() {
        return nombreArchivo;
    }

    public void setNombreArchivo(String nombreArchivo) {
        this.nombreArchivo = nombreArchivo;
    }

    public String getNombreDocumento() {
        return nombreDocumento;
    }

    public void setNombreDocumento(String nombreDocumento) {
        this.nombreDocumento = nombreDocumento;
    }

    public String getTipoDocumento() {
        return tipoDocumento;
    }

    public void setTipoDocumento(String tipoDocumento) {
        this.tipoDocumento = tipoDocumento;
    }

    public String getUbicacion() {
        return ubicacion;
    }

    public void setUbicacion(String ubicacion) {
        this.ubicacion = ubicacion;
    }

    public LocalDateTime getFechaCarga() {
        return fechaCarga;
    }

    public void setFechaCarga(LocalDateTime fechaCarga) {
        this.fechaCarga = fechaCarga;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public Long getTamanioBytes() {
        return tamanioBytes;
    }

    public void setTamanioBytes(Long tamanioBytes) {
        this.tamanioBytes = tamanioBytes;
    }
}
