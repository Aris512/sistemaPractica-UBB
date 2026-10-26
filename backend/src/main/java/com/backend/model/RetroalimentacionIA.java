package com.backend.model;

import java.time.LocalDateTime;

import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/**
 * Revisión de una planificación del alumno en práctica: primero la IA (en una conversación del
 * asistente) y, si la aprueba, el profesor de asignatura. Hay una por planificación y se reutiliza
 * en cada ciclo de corrección.
 */
@Entity
@Table(name = "retroalimentacion_ia")
public class RetroalimentacionIA {

    /** Máximo de revisiones con veredicto que la IA entrega por ciclo. */
    public static final int MAX_REVISIONES_IA = 2;

    public enum Estado {
        NO_REVISADO, REVISADO_POR_IA, ESPERANDO_PROFESOR, RECHAZADO, APROBADO
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_retroalimentacion")
    private Long idRetroalimentacion;

    @ManyToOne
    @JoinColumn(name = "id_planificacion")
    private Planificacion planificacion;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", length = 30)
    private Estado estado = Estado.NO_REVISADO;

    /** Conversación del asistente donde la IA revisa este ciclo. Si el alumno la borra, queda en null. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_conversacion")
    @OnDelete(action = OnDeleteAction.SET_NULL)
    private ChatConversacion conversacion;

    /** Documento de planificación revisado en este ciclo (sin FK: al reemplazar el archivo, el documento se borra). */
    @Column(name = "id_documento_revisado")
    private Long idDocumentoRevisado;

    @Column(name = "nombre_archivo_revisado")
    private String nombreArchivoRevisado;

    /** Texto extraído del archivo revisado; es lo que lee la IA. */
    @Lob
    @Column(name = "texto_planificacion", columnDefinition = "LONGTEXT")
    private String textoPlanificacion;

    @Column(name = "revisiones_ia", nullable = false)
    private int revisionesIa = 0;

    @Column(name = "ciclo", nullable = false)
    private int ciclo = 1;

    /** Última retroalimentación de la IA que trajo veredicto; la ve el profesor. */
    @Lob
    @Column(name = "ultima_revision_ia", columnDefinition = "LONGTEXT")
    private String ultimaRevisionIa;

    @Column(name = "comentario_profesor", length = 2000)
    private String comentarioProfesor;

    @Column(name = "rut_profesor_revisor", length = 12)
    private String rutProfesorRevisor;

    @Column(name = "fecha_envio_profesor")
    private LocalDateTime fechaEnvioProfesor;

    @Column(name = "fecha_respuesta_profesor")
    private LocalDateTime fechaRespuestaProfesor;

    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    public RetroalimentacionIA() {
    }

    public RetroalimentacionIA(Planificacion planificacion) {
        this.planificacion = planificacion;
        this.fechaActualizacion = LocalDateTime.now();
    }

    public Long getIdRetroalimentacion() {
        return idRetroalimentacion;
    }

    public Planificacion getPlanificacion() {
        return planificacion;
    }

    public Estado getEstado() {
        return estado;
    }

    public void setEstado(Estado estado) {
        this.estado = estado;
        this.fechaActualizacion = LocalDateTime.now();
    }

    public ChatConversacion getConversacion() {
        return conversacion;
    }

    public void setConversacion(ChatConversacion conversacion) {
        this.conversacion = conversacion;
    }

    public Long getIdDocumentoRevisado() {
        return idDocumentoRevisado;
    }

    public void setIdDocumentoRevisado(Long idDocumentoRevisado) {
        this.idDocumentoRevisado = idDocumentoRevisado;
    }

    public String getNombreArchivoRevisado() {
        return nombreArchivoRevisado;
    }

    public void setNombreArchivoRevisado(String nombreArchivoRevisado) {
        this.nombreArchivoRevisado = nombreArchivoRevisado;
    }

    public String getTextoPlanificacion() {
        return textoPlanificacion;
    }

    public void setTextoPlanificacion(String textoPlanificacion) {
        this.textoPlanificacion = textoPlanificacion;
    }

    public int getRevisionesIa() {
        return revisionesIa;
    }

    public void setRevisionesIa(int revisionesIa) {
        this.revisionesIa = revisionesIa;
    }

    public int getCiclo() {
        return ciclo;
    }

    public void setCiclo(int ciclo) {
        this.ciclo = ciclo;
    }

    public String getUltimaRevisionIa() {
        return ultimaRevisionIa;
    }

    public void setUltimaRevisionIa(String ultimaRevisionIa) {
        this.ultimaRevisionIa = ultimaRevisionIa;
    }

    public String getComentarioProfesor() {
        return comentarioProfesor;
    }

    public void setComentarioProfesor(String comentarioProfesor) {
        this.comentarioProfesor = comentarioProfesor;
    }

    public String getRutProfesorRevisor() {
        return rutProfesorRevisor;
    }

    public void setRutProfesorRevisor(String rutProfesorRevisor) {
        this.rutProfesorRevisor = rutProfesorRevisor;
    }

    public LocalDateTime getFechaEnvioProfesor() {
        return fechaEnvioProfesor;
    }

    public void setFechaEnvioProfesor(LocalDateTime fechaEnvioProfesor) {
        this.fechaEnvioProfesor = fechaEnvioProfesor;
    }

    public LocalDateTime getFechaRespuestaProfesor() {
        return fechaRespuestaProfesor;
    }

    public void setFechaRespuestaProfesor(LocalDateTime fechaRespuestaProfesor) {
        this.fechaRespuestaProfesor = fechaRespuestaProfesor;
    }

    public LocalDateTime getFechaActualizacion() {
        return fechaActualizacion;
    }

    public void tocar() {
        this.fechaActualizacion = LocalDateTime.now();
    }
}
