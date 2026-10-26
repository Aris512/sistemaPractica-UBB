package com.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/**
 * Los 5 archivos obligatorios de una planificación, cada uno un registro de la tabla documento.
 * Una columna vacía significa que ese archivo está pendiente de subir.
 */
@Entity
@Table(name = "documento_planificacion")
public class DocumentoPlanificacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_documento_planificacion")
    private Long idDocumentoPlanificacion;

    @ManyToOne
    @JoinColumn(name = "id_planificacion_archivo")
    private Documento planificacion;

    @ManyToOne
    @JoinColumn(name = "id_presentacion")
    private Documento presentacion;

    @ManyToOne
    @JoinColumn(name = "id_guia_actividades")
    private Documento guiaActividades;

    @ManyToOne
    @JoinColumn(name = "id_rubrica_evaluacion")
    private Documento rubricaEvaluacion;

    @ManyToOne
    @JoinColumn(name = "id_material_didactico")
    private Documento materialDidactico;

    public Long getIdDocumentoPlanificacion() {
        return idDocumentoPlanificacion;
    }

    /** Archivo de la categoría indicada (PLANIFICACION, PRESENTACION, GUIA_ACTIVIDADES, RUBRICA_EVALUACION, MATERIAL_DIDACTICO). */
    public Documento getArchivo(String categoria) {
        return switch (categoria) {
            case "PLANIFICACION" -> planificacion;
            case "PRESENTACION" -> presentacion;
            case "GUIA_ACTIVIDADES" -> guiaActividades;
            case "RUBRICA_EVALUACION" -> rubricaEvaluacion;
            case "MATERIAL_DIDACTICO" -> materialDidactico;
            default -> throw new IllegalArgumentException("Categoría de archivo no válida: " + categoria);
        };
    }

    public void setArchivo(String categoria, Documento documento) {
        switch (categoria) {
            case "PLANIFICACION" -> planificacion = documento;
            case "PRESENTACION" -> presentacion = documento;
            case "GUIA_ACTIVIDADES" -> guiaActividades = documento;
            case "RUBRICA_EVALUACION" -> rubricaEvaluacion = documento;
            case "MATERIAL_DIDACTICO" -> materialDidactico = documento;
            default -> throw new IllegalArgumentException("Categoría de archivo no válida: " + categoria);
        }
    }
}
