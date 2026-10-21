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
@Table(name = "evidencia")
public class Evidencia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_evidencia")
    private Long idEvidencia;

    @ManyToOne
    @JoinColumn(name = "id_actividad", nullable = false)
    private Actividad actividad;

    @ManyToOne
    @JoinColumn(name = "id_estudiante", nullable = false)
    private Estudiante estudiante;

    @ManyToOne
    @JoinColumn(name = "id_asignatura")
    private Asignatura asignatura;

    @ManyToOne
    @JoinColumn(name = "id_archivo_alumno")
    private Documento archivoAlumno;

    @ManyToOne
    @JoinColumn(name = "id_archivo_profesor")
    private Documento archivoProfesor;

    @ManyToOne
    @JoinColumn(name = "id_nota")
    private Nota nota;

    @Column(name = "nombre_archivo")
    private String nombreArchivo;

    /**
     * Ruta relativa del archivo del estudiante. Se mantiene como respaldo para
     * entregas antiguas; las entregas nuevas se vinculan mediante archivoAlumno.
     */
    @Column(name = "archivo_url")
    private String archivoUrl;

    @Column(name = "nombre_archivo_revision")
    private String nombreArchivoRevision;

    /** Ruta relativa del archivo adjuntado por el profesor al revisar. */
    @Column(name = "archivo_revision_url")
    private String archivoRevisionUrl;

    @Column(name = "comentario_estudiante", length = 2000)
    private String comentarioEstudiante;

    @Column(name = "retroalimentacion", length = 2000)
    private String retroalimentacion;

    @Column(name = "fecha_entrega")
    private LocalDateTime fechaEntrega;

    @Column(name = "fecha_revision")
    private LocalDateTime fechaRevision;

    private String estado; // "PENDIENTE", "REVISADO", "OBSERVADO", "APROBADO", "REPROBADO"

    private Double calificacion;

    @ManyToOne
    @JoinColumn(name = "id_profesor_revisor")
    private Profesor revisadoPor;

    public Evidencia() {
        this.fechaEntrega = LocalDateTime.now();
        this.estado = "PENDIENTE";
    }

    public Evidencia(Actividad actividad, Estudiante estudiante, Documento archivoAlumno, Documento archivoProfesor, Nota nota) {
        this.actividad = actividad;
        this.estudiante = estudiante;
        if (actividad != null) {
            this.asignatura = actividad.getAsignatura();
        }
        this.archivoAlumno = archivoAlumno;
        this.archivoProfesor = archivoProfesor;
        this.nota = nota;
        this.fechaEntrega = LocalDateTime.now();
        if (nota != null && nota.getPuntajeObtenido() != null) {
            this.calificacion = nota.getPuntajeObtenido();
            this.estado = nota.getPuntajeObtenido() >= 4.0 ? "APROBADO" : "REPROBADO";
        } else {
            this.estado = "PENDIENTE";
        }
        if (archivoAlumno != null) {
            this.nombreArchivo = archivoAlumno.getNombre();
        }
    }

    public Evidencia(Actividad actividad, Estudiante estudiante, String nombreArchivo,
                     String comentarioEstudiante) {
        this.actividad = actividad;
        this.estudiante = estudiante;
        if (actividad != null) {
            this.asignatura = actividad.getAsignatura();
        }
        this.nombreArchivo = nombreArchivo;
        this.comentarioEstudiante = comentarioEstudiante;
        this.fechaEntrega = LocalDateTime.now();
        this.estado = "PENDIENTE";
    }

    public Evidencia(Actividad actividad, Estudiante estudiante, String nombreArchivo,
                     String archivoUrl, String comentarioEstudiante) {
        this(actividad, estudiante, nombreArchivo, comentarioEstudiante);
        this.archivoUrl = archivoUrl;
    }

    public Long getIdEvidencia() {
        return idEvidencia;
    }

    public void setIdEvidencia(Long idEvidencia) {
        this.idEvidencia = idEvidencia;
    }

    public Actividad getActividad() {
        return actividad;
    }

    public void setActividad(Actividad actividad) {
        this.actividad = actividad;
        if (actividad != null && this.asignatura == null) {
            this.asignatura = actividad.getAsignatura();
        }
    }

    public Estudiante getEstudiante() {
        return estudiante;
    }

    public void setEstudiante(Estudiante estudiante) {
        this.estudiante = estudiante;
    }

    public Asignatura getAsignatura() {
        return asignatura;
    }

    public void setAsignatura(Asignatura asignatura) {
        this.asignatura = asignatura;
    }

    public Long getIdAsignatura() {
        return asignatura != null ? asignatura.getIdAsignatura() : null;
    }

    public Long getIdAsigntura() {
        return getIdAsignatura();
    }

    public Documento getArchivoAlumno() {
        return archivoAlumno;
    }

    public void setArchivoAlumno(Documento archivoAlumno) {
        this.archivoAlumno = archivoAlumno;
        if (archivoAlumno != null && this.nombreArchivo == null) {
            this.nombreArchivo = archivoAlumno.getNombre();
        }
    }

    public Long getIdArchivoAlumno() {
        return archivoAlumno != null ? archivoAlumno.getIdDocumento() : null;
    }

    public Documento getArchivoProfesor() {
        return archivoProfesor;
    }

    public void setArchivoProfesor(Documento archivoProfesor) {
        this.archivoProfesor = archivoProfesor;
    }

    public Long getIdArchivoProfesor() {
        return archivoProfesor != null ? archivoProfesor.getIdDocumento() : null;
    }

    public Nota getNota() {
        return nota;
    }

    public void setNota(Nota nota) {
        this.nota = nota;
        if (nota != null && nota.getPuntajeObtenido() != null) {
            this.calificacion = nota.getPuntajeObtenido();
            this.estado = nota.getPuntajeObtenido() >= 4.0 ? "APROBADO" : "REPROBADO";
        }
    }

    public Long getIdNota() {
        return nota != null ? nota.getIdNota() : null;
    }

    public String getNombreArchivo() {
        if (this.archivoAlumno != null && this.archivoAlumno.getNombre() != null) {
            return this.archivoAlumno.getNombre();
        }
        return nombreArchivo;
    }

    public void setNombreArchivo(String nombreArchivo) {
        this.nombreArchivo = nombreArchivo;
    }

    public String getArchivoUrl() {
        if (archivoAlumno != null && archivoAlumno.getUbicacion() != null) {
            return archivoAlumno.getUbicacion();
        }
        return archivoUrl;
    }

    public void setArchivoUrl(String archivoUrl) {
        this.archivoUrl = archivoUrl;
    }

    public String getNombreArchivoRevision() {
        if (archivoProfesor != null && archivoProfesor.getNombre() != null) {
            return archivoProfesor.getNombre();
        }
        return nombreArchivoRevision;
    }

    public void setNombreArchivoRevision(String nombreArchivoRevision) {
        this.nombreArchivoRevision = nombreArchivoRevision;
    }

    public String getArchivoRevisionUrl() {
        if (archivoProfesor != null && archivoProfesor.getUbicacion() != null) {
            return archivoProfesor.getUbicacion();
        }
        return archivoRevisionUrl;
    }

    public void setArchivoRevisionUrl(String archivoRevisionUrl) {
        this.archivoRevisionUrl = archivoRevisionUrl;
    }

    public String getComentarioEstudiante() {
        return comentarioEstudiante;
    }

    public void setComentarioEstudiante(String comentarioEstudiante) {
        this.comentarioEstudiante = comentarioEstudiante;
    }

    public String getRetroalimentacion() {
        return retroalimentacion;
    }

    public void setRetroalimentacion(String retroalimentacion) {
        this.retroalimentacion = retroalimentacion;
    }

    public LocalDateTime getFechaEntrega() {
        return fechaEntrega;
    }

    public void setFechaEntrega(LocalDateTime fechaEntrega) {
        this.fechaEntrega = fechaEntrega;
    }

    public LocalDateTime getFechaRevision() {
        return fechaRevision;
    }

    public void setFechaRevision(LocalDateTime fechaRevision) {
        this.fechaRevision = fechaRevision;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public Double getCalificacion() {
        if (this.nota != null && this.nota.getPuntajeObtenido() != null) {
            return this.nota.getPuntajeObtenido();
        }
        return calificacion;
    }

    public void setCalificacion(Double calificacion) {
        this.calificacion = calificacion;
        if (this.nota != null) {
            this.nota.setPuntajeObtenido(calificacion);
        }
        if (calificacion != null) {
            this.estado = calificacion >= 4.0 ? "APROBADO" : "REPROBADO";
        }
    }

    public Boolean isAprobado() {
        Double val = getCalificacion();
        return val != null ? val >= 4.0 : null;
    }

    public Boolean getAprobado() {
        return isAprobado();
    }

    public Profesor getRevisadoPor() {
        return revisadoPor;
    }

    public void setRevisadoPor(Profesor revisadoPor) {
        this.revisadoPor = revisadoPor;
    }
}
