package com.backend.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.backend.dto.RevisionEvidenciaDTO;
import com.backend.dto.SeguimientoEstudianteDTO;
import com.backend.dto.SubirEvidenciaDTO;
import com.backend.model.Actividad;
import com.backend.model.Estudiante;
import com.backend.model.Evidencia;
import com.backend.model.Profesor;
import com.backend.repository.ActividadRepository;
import com.backend.repository.EstudianteRepository;
import com.backend.repository.EvidenciaRepository;
import com.backend.repository.ProfesorRepository;

@Service
public class EvidenciaService {

    private final EvidenciaRepository evidenciaRepository;
    private final ActividadRepository actividadRepository;
    private final EstudianteRepository estudianteRepository;
    private final ProfesorRepository profesorRepository;

    public EvidenciaService(EvidenciaRepository evidenciaRepository,
                            ActividadRepository actividadRepository,
                            EstudianteRepository estudianteRepository,
                            ProfesorRepository profesorRepository) {
        this.evidenciaRepository = evidenciaRepository;
        this.actividadRepository = actividadRepository;
        this.estudianteRepository = estudianteRepository;
        this.profesorRepository = profesorRepository;
    }

    public List<Evidencia> obtenerTodas() {
        return evidenciaRepository.findAllByOrderByFechaEntregaDesc();
    }

    public Evidencia obtenerPorId(Long id) {
        return evidenciaRepository.findById(id).orElse(null);
    }

    public List<Evidencia> obtenerHistorialEstudiante(String rutEstudiante) {
        return evidenciaRepository.findByEstudianteUsuarioRutOrderByFechaEntregaDesc(rutEstudiante);
    }

    public List<Evidencia> obtenerPorActividad(Long idActividad) {
        return evidenciaRepository.findByActividadIdActividadOrderByFechaEntregaDesc(idActividad);
    }

    public List<Evidencia> obtenerPorProfesor(String rutProfesor) {
        return evidenciaRepository.findByActividadProfesorUsuarioRutOrderByFechaEntregaDesc(rutProfesor);
    }

    public List<SeguimientoEstudianteDTO> obtenerSeguimientoProfesor(String rutProfesor) {
        Profesor profesor = profesorRepository.findByUsuarioRut(rutProfesor).orElse(null);
        List<Estudiante> estudiantes;

        if (profesor != null && profesor.getAsignatura() != null) {
            estudiantes = estudianteRepository.findByAsignaturaIdAsignatura(profesor.getAsignatura().getIdAsignatura());
            if (estudiantes.isEmpty()) {
                estudiantes = estudianteRepository.findAll();
            }
        } else {
            estudiantes = estudianteRepository.findAll();
        }

        List<Evidencia> evidenciasProfesor = evidenciaRepository.findByActividadProfesorUsuarioRutOrderByFechaEntregaDesc(rutProfesor);

        List<SeguimientoEstudianteDTO> resultado = new ArrayList<>();

        for (Estudiante est : estudiantes) {
            if (est.getUsuario() == null) continue;

            Evidencia ev = evidenciasProfesor.stream()
                    .filter(e -> e.getEstudiante() != null && e.getEstudiante().getIdEstudiante().equals(est.getIdEstudiante()))
                    .findFirst()
                    .orElse(null);

            String nombreCompleto = est.getUsuario().getNombre() + " " + est.getUsuario().getApellido();
            String rut = est.getUsuario().getRut();
            String correo = est.getUsuario().getCorreo();

            if (ev != null) {
                String estadoRevision = ev.getEstado() != null ? ev.getEstado() : "PENDIENTE_REVISION";
                resultado.add(new SeguimientoEstudianteDTO(
                        est.getIdEstudiante(),
                        ev.getIdEvidencia(),
                        ev.getActividad() != null ? ev.getActividad().getIdActividad() : null,
                        rut,
                        nombreCompleto,
                        correo,
                        ev.getActividad() != null ? ev.getActividad().getTitulo() : "Evidencia de Práctica",
                        "ENTREGADO",
                        estadoRevision,
                        ev.getFechaEntrega(),
                        ev.getNombreArchivo(),
                        ev.getArchivoUrl(),
                        ev.getComentarioEstudiante(),
                        ev.getCalificacion(),
                        ev.getRetroalimentacion(),
                        ev.getFechaRevision()
                ));
            } else {
                resultado.add(new SeguimientoEstudianteDTO(
                        est.getIdEstudiante(),
                        null,
                        null,
                        rut,
                        nombreCompleto,
                        correo,
                        "Evidencia de Práctica",
                        "PENDIENTE",
                        "SIN_ENTREGA",
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null
                ));
            }
        }

        return resultado;
    }

    @Transactional
    public Evidencia subirEvidencia(SubirEvidenciaDTO dto) {
        Actividad actividad = actividadRepository.findById(dto.getIdActividad())
                .orElseThrow(() -> new IllegalArgumentException("Actividad no encontrada con ID: " + dto.getIdActividad()));

        Estudiante estudiante = estudianteRepository.findByUsuarioRut(dto.getRutEstudiante())
                .orElseThrow(() -> new IllegalArgumentException("Estudiante no encontrado con RUT: " + dto.getRutEstudiante()));

        // Verificar si el estudiante ya había subido una entrega para esta actividad (actualización)
        Optional<Evidencia> existenteOpt = evidenciaRepository
                .findByActividadIdActividadAndEstudianteUsuarioRut(actividad.getIdActividad(), dto.getRutEstudiante());

        Evidencia evidencia;
        if (existenteOpt.isPresent()) {
            evidencia = existenteOpt.get();
            evidencia.setNombreArchivo(dto.getNombreArchivo());
            evidencia.setArchivoUrl(dto.getArchivoUrl());
            evidencia.setComentarioEstudiante(dto.getComentario());
            evidencia.setFechaEntrega(LocalDateTime.now());
            evidencia.setEstado("PENDIENTE");
        } else {
            evidencia = new Evidencia(
                    actividad,
                    estudiante,
                    dto.getNombreArchivo(),
                    dto.getArchivoUrl(),
                    dto.getComentario()
            );
        }

        return evidenciaRepository.save(evidencia);
    }

    @Transactional
    public Evidencia revisarEvidencia(Long idEvidencia, RevisionEvidenciaDTO dto) {
        Evidencia evidencia = evidenciaRepository.findById(idEvidencia)
                .orElseThrow(() -> new IllegalArgumentException("Evidencia no encontrada con ID: " + idEvidencia));

        if (dto.getRutProfesor() != null) {
            Profesor profesor = profesorRepository.findByUsuarioRut(dto.getRutProfesor()).orElse(null);
            evidencia.setRevisadoPor(profesor);
        }

        evidencia.setRetroalimentacion(dto.getRetroalimentacion());
        evidencia.setCalificacion(dto.getCalificacion());
        evidencia.setFechaRevision(LocalDateTime.now());

        String nuevoEstado = dto.getEstado() != null && !dto.getEstado().isBlank()
                ? dto.getEstado().toUpperCase()
                : "REVISADO";
        evidencia.setEstado(nuevoEstado);

        return evidenciaRepository.save(evidencia);
    }

    @Transactional
    public void eliminar(Long id) {
        evidenciaRepository.deleteById(id);
    }
}
