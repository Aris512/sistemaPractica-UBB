package com.backend.dto;

public class EstudianteEvaluacionDTO {

    private Long idEstudiante;
    private String nombre;
    private String apellido;
    private String rut;
    private String correo;
    private String asignatura;
    private Long idAsignatura;
    private String estadoEntrega;    // "ENTREGADO" | "NO_ENTREGADO"
    private String estadoEvaluacion;  // "EVALUADO" | "NO_EVALUADO" | "SIN_OBSERVACION"
    private Long idPractica;
    private String centroPractica;
    private Double nota;
    private String observacion;
    private Long idEvaluacion;
    private String fechaEvaluacion;
    private Double puntajeMinimo;
    private Double puntajeMaximo;
    private String tipoEvaluacion;
    private String evaluadorRut;
    private String evaluadorNombre;
    private String archivoUrl;
    private String nombreArchivo;
    private Boolean tieneArchivo;
    // Entrega (evidencia) que el estudiante subió a la actividad del profesor
    private Long idEvidencia;
    private String nombreArchivoEntrega;
    private String tituloActividad;
    private String fechaEntrega;
    private Boolean tieneArchivoEntrega;

    public EstudianteEvaluacionDTO() {
    }

    public Long getIdEstudiante() {
        return idEstudiante;
    }

    public void setIdEstudiante(Long idEstudiante) {
        this.idEstudiante = idEstudiante;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getApellido() {
        return apellido;
    }

    public void setApellido(String apellido) {
        this.apellido = apellido;
    }

    public String getRut() {
        return rut;
    }

    public void setRut(String rut) {
        this.rut = rut;
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

    public String getEstadoEntrega() {
        return estadoEntrega;
    }

    public void setEstadoEntrega(String estadoEntrega) {
        this.estadoEntrega = estadoEntrega;
    }

    public String getEstadoEvaluacion() {
        return estadoEvaluacion;
    }

    public void setEstadoEvaluacion(String estadoEvaluacion) {
        this.estadoEvaluacion = estadoEvaluacion;
    }

    public Long getIdPractica() {
        return idPractica;
    }

    public void setIdPractica(Long idPractica) {
        this.idPractica = idPractica;
    }

    public String getCentroPractica() {
        return centroPractica;
    }

    public void setCentroPractica(String centroPractica) {
        this.centroPractica = centroPractica;
    }

    public Double getNota() {
        return nota;
    }

    public void setNota(Double nota) {
        this.nota = nota;
    }

    public String getObservacion() {
        return observacion;
    }

    public void setObservacion(String observacion) {
        this.observacion = observacion;
    }

    public Long getIdEvaluacion() {
        return idEvaluacion;
    }

    public void setIdEvaluacion(Long idEvaluacion) {
        this.idEvaluacion = idEvaluacion;
    }

    public String getFechaEvaluacion() {
        return fechaEvaluacion;
    }

    public void setFechaEvaluacion(String fechaEvaluacion) {
        this.fechaEvaluacion = fechaEvaluacion;
    }

    public Double getPuntajeMinimo() {
        return puntajeMinimo;
    }

    public void setPuntajeMinimo(Double puntajeMinimo) {
        this.puntajeMinimo = puntajeMinimo;
    }

    public Double getPuntajeMaximo() {
        return puntajeMaximo;
    }

    public void setPuntajeMaximo(Double puntajeMaximo) {
        this.puntajeMaximo = puntajeMaximo;
    }

    public String getTipoEvaluacion() {
        return tipoEvaluacion;
    }

    public void setTipoEvaluacion(String tipoEvaluacion) {
        this.tipoEvaluacion = tipoEvaluacion;
    }

    public String getEvaluadorRut() {
        return evaluadorRut;
    }

    public void setEvaluadorRut(String evaluadorRut) {
        this.evaladorRut(evaluadorRut);
    }

    private void evaladorRut(String evaluadorRut) {
        this.evaluadorRut = evaluadorRut;
    }

    public String getEvaluadorNombre() {
        return evaluadorNombre;
    }

    public void setEvaluadorNombre(String evaluadorNombre) {
        this.evaluadorNombre = evaluadorNombre;
    }

    public String getArchivoUrl() {
        return archivoUrl;
    }

    public void setArchivoUrl(String archivoUrl) {
        this.archivoUrl = archivoUrl;
    }

    public String getNombreArchivo() {
        return nombreArchivo;
    }

    public void setNombreArchivo(String nombreArchivo) {
        this.nombreArchivo = nombreArchivo;
    }

    public Boolean getTieneArchivo() {
        return tieneArchivo;
    }

    public void setTieneArchivo(Boolean tieneArchivo) {
        this.tieneArchivo = tieneArchivo;
    }

    public Long getIdEvidencia() {
        return idEvidencia;
    }

    public void setIdEvidencia(Long idEvidencia) {
        this.idEvidencia = idEvidencia;
    }

    public String getNombreArchivoEntrega() {
        return nombreArchivoEntrega;
    }

    public void setNombreArchivoEntrega(String nombreArchivoEntrega) {
        this.nombreArchivoEntrega = nombreArchivoEntrega;
    }

    public String getTituloActividad() {
        return tituloActividad;
    }

    public void setTituloActividad(String tituloActividad) {
        this.tituloActividad = tituloActividad;
    }

    public String getFechaEntrega() {
        return fechaEntrega;
    }

    public void setFechaEntrega(String fechaEntrega) {
        this.fechaEntrega = fechaEntrega;
    }

    public Boolean getTieneArchivoEntrega() {
        return tieneArchivoEntrega;
    }

    public void setTieneArchivoEntrega(Boolean tieneArchivoEntrega) {
        this.tieneArchivoEntrega = tieneArchivoEntrega;
    }
}
