package com.backend.service;


import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.backend.dto.CrearActividadDTO;
import com.backend.model.Actividad;
import com.backend.model.Asignatura;
import com.backend.model.Estudiante;
import com.backend.model.Evidencia;
import com.backend.model.Profesor;
import com.backend.repository.ActividadRepository;
import com.backend.repository.AsignaturaRepository;
import com.backend.repository.EstudianteRepository;
import com.backend.repository.EvidenciaRepository;
import com.backend.repository.ProfesorRepository;

@Service
public class ActividadService {

    private final ActividadRepository actividadRepository;
    private final ProfesorRepository profesorRepository;
    private final AsignaturaRepository asignaturaRepository;
    private final EstudianteRepository estudianteRepository;
    private final EvidenciaRepository evidenciaRepository;

    public ActividadService(ActividadRepository actividadRepository,
                            ProfesorRepository profesorRepository,
                            AsignaturaRepository asignaturaRepository,
                            EstudianteRepository estudianteRepository,
                            EvidenciaRepository evidenciaRepository) {
        this.actividadRepository = actividadRepository;
        this.profesorRepository = profesorRepository;
        this.asignaturaRepository = asignaturaRepository;
        this.estudianteRepository = estudianteRepository;
        this.evidenciaRepository = evidenciaRepository;
    }

    public List<Actividad> obtenerTodas() {
        return actividadRepository.findAllByOrderByFechaCreacionDesc();
    }

    public Actividad obtenerPorId(Long id) {
        return actividadRepository.findById(id).orElse(null);
    }

    public List<Actividad> obtenerPorProfesor(String rut) {
        return actividadRepository.findByProfesorUsuarioRutOrderByFechaCreacionDesc(rut);
    }

    public List<Actividad> obtenerParaEstudiante(String rut) {
        Optional<Estudiante> estudianteOpt = estudianteRepository.findByUsuarioRut(rut);
        if (estudianteOpt.isPresent() && estudianteOpt.get().getAsignatura() != null) {
            Long idAsignatura = estudianteOpt.get().getAsignatura().getIdAsignatura();
            List<Actividad> actividades = actividadRepository.findByAsignaturaIdAsignaturaOrderByFechaCreacionDesc(idAsignatura);
            if (!actividades.isEmpty()) {
                return actividades;
            }
        }
        // Si no tiene asignatura asignada o la lista está vacía, retornar todas las actividades
        return actividadRepository.findAllByOrderByFechaCreacionDesc();
    }

    @Transactional
    public Actividad crear(CrearActividadDTO dto) {
        Profesor profesor = profesorRepository.findByUsuarioRut(dto.getRutProfesor())
                .orElseThrow(() -> new IllegalArgumentException("Profesor no encontrado con RUT: " + dto.getRutProfesor()));

        Asignatura asignatura = null;
        if (dto.getIdAsignatura() != null) {
            asignatura = asignaturaRepository.findById(dto.getIdAsignatura()).orElse(null);
        } else if (profesor.getAsignatura() != null) {
            asignatura = profesor.getAsignatura();
        }

        Actividad actividad = new Actividad(
                profesor,
                asignatura,
                dto.getTitulo(),
                dto.getDescripcion(),
                dto.getFechaLimite()
        );

        return actividadRepository.save(actividad);
    }

    @Transactional
    public Actividad actualizar(Long id, CrearActividadDTO dto) {
        Actividad actividad = actividadRepository.findById(id).orElse(null);
        if (actividad != null) {
            if (dto.getTitulo() != null && !dto.getTitulo().trim().isEmpty()) {
                actividad.setTitulo(dto.getTitulo().trim());
            }
            if (dto.getDescripcion() != null) {
                actividad.setDescripcion(dto.getDescripcion().trim());
            }
            if (dto.getFechaLimite() != null) {
                actividad.setFechaLimite(dto.getFechaLimite());
            }
            return actividadRepository.save(actividad);
        }
        return null;
    }

    @Transactional
    public Actividad cambiarEstado(Long id, String estado) {
        Actividad actividad = actividadRepository.findById(id).orElse(null);
        if (actividad != null) {
            actividad.setEstado(estado);
            return actividadRepository.save(actividad);
        }
        return null;
    }

    @Transactional
    public Actividad cerrar(Long id) {
        return cambiarEstado(id, "CERRADA");
    }

    @Transactional
    public void eliminar(Long id) {
        List<Evidencia> evidencias = evidenciaRepository.findByActividadIdActividadOrderByFechaEntregaDesc(id);
        if (evidencias != null && !evidencias.isEmpty()) {
            evidenciaRepository.deleteAll(evidencias);
        }
        actividadRepository.deleteById(id);
    }
}
