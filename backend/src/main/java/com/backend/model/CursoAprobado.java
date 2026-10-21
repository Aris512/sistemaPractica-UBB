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
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
    name = "cursos_aprobados",
    uniqueConstraints = @UniqueConstraint(columnNames = {"id_estudiante", "id_asignatura"})
)
public class CursoAprobado {

    public static final String EN_CURSO = "EN_CURSO";
    public static final String APROBADO = "APROBADO";
    public static final String REPROBADO = "REPROBADO";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "id_estudiante", nullable = false)
    private Estudiante estudiante;

    @ManyToOne(optional = false)
    @JoinColumn(name = "id_asignatura", nullable = false)
    private Asignatura asignatura;

    @Column(nullable = false, length = 20)
    private String estado;

    @Column(name = "promedio", nullable = false)
    private Double promedio = 0.0;

    @Column(name = "fecha_actualizacion", nullable = false)
    private LocalDateTime fechaActualizacion;

    public CursoAprobado() {
        this.promedio = 0.0;
        this.fechaActualizacion = LocalDateTime.now();
    }

    public CursoAprobado(Estudiante estudiante, Asignatura asignatura, String estado) {
        this.estudiante = estudiante;
        this.asignatura = asignatura;
        this.estado = estado;
        this.promedio = 0.0;
        this.fechaActualizacion = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public Estudiante getEstudiante() { return estudiante; }
    public void setEstudiante(Estudiante estudiante) { this.estudiante = estudiante; }
    public Asignatura getAsignatura() { return asignatura; }
    public void setAsignatura(Asignatura asignatura) { this.asignatura = asignatura; }
    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
    public Double getPromedio() { return promedio != null ? promedio : 0.0; }
    public void setPromedio(Double promedio) { this.promedio = (promedio != null) ? promedio : 0.0; }
    public LocalDateTime getFechaActualizacion() { return fechaActualizacion; }
    public void setFechaActualizacion(LocalDateTime fechaActualizacion) { this.fechaActualizacion = fechaActualizacion; }
}
