package com.backend.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.backend.dto.EstudianteTutorDTO;
import com.backend.model.Estudiante;
import com.backend.model.Practica;
import com.backend.model.Usuario;
import com.backend.repository.EstudianteRepository;
import com.backend.repository.PracticaRepository;

import com.backend.repository.ProfesorRepository;
import java.util.Collections;

@Service
public class PracticaService {

    private final PracticaRepository practicaRepository;
    private final EstudianteRepository estudianteRepository;
    private final ProfesorRepository profesorRepository;

    public PracticaService(PracticaRepository practicaRepository,
                           EstudianteRepository estudianteRepository,
                           ProfesorRepository profesorRepository) {
        this.practicaRepository = practicaRepository;
        this.estudianteRepository = estudianteRepository;
        this.profesorRepository = profesorRepository;
    }

    public List<Practica> obtenerTodos() {
        return practicaRepository.findAll();
    }

    public Practica obtenerPorId(Long id) {
        return practicaRepository.findById(id).orElse(null);
    }

    public Practica crear(Practica practica) {
        return practicaRepository.save(practica);
    }

    public void eliminar(Long id) {
        practicaRepository.deleteById(id);
    }

    public List<EstudianteTutorDTO> obtenerSeguimientoTutorColaborador(String rut) {
        if (rut == null || rut.isBlank()) {
            return Collections.emptyList();
        }

        List<Practica> practicas = new ArrayList<>();
        List<Practica> byTutor = practicaRepository.findByTutorPracticaUsuarioRut(rut);
        if (byTutor != null && !byTutor.isEmpty()) {
            practicas.addAll(byTutor);
        } else {
            List<Practica> byColab = practicaRepository.findByProfesoresColaboradoresUsuarioRut(rut);
            if (byColab != null && !byColab.isEmpty()) {
                practicas.addAll(byColab);
            }
        }

        if (practicas.isEmpty()) {
            // Verificar si el usuario es un profesor de asignatura asignado a una práctica
            profesorRepository.findByUsuarioRut(rut).ifPresent(prof -> {
                if (prof.getAsignatura() != null && prof.getAsignatura().getIdAsignatura() != null) {
                    List<Practica> practicasAsig = practicaRepository.findByAsignaturaIdAsignatura(prof.getAsignatura().getIdAsignatura());
                    if (practicasAsig != null && !practicasAsig.isEmpty()) {
                        practicas.addAll(practicasAsig);
                    }
                }
            });
        }

        List<EstudianteTutorDTO> resultado = new ArrayList<>();

        if (practicas != null && !practicas.isEmpty()) {
            for (Practica p : practicas) {
                if (p.getEstudiante() == null || p.getEstudiante().getUsuario() == null) continue;

                Usuario u = p.getEstudiante().getUsuario();
                // Restricción: No incluir alumnos en estado inactivo
                if (!u.isActivo() || "inactivo".equalsIgnoreCase(u.getEstado()) || "INACTIVO".equalsIgnoreCase(p.getEstudiante().getEstado())) {
                    continue;
                }

                String nombreEstudiante = u.getNombre() + " " + u.getApellido();
                String asigNombre = p.getAsignatura() != null ? p.getAsignatura().getNombre() : "Práctica Profesional";
                String centro = p.getCentroPractica() != null ? p.getCentroPractica().getNombre() : "Colegio Concepción";

                resultado.add(new EstudianteTutorDTO(
                    p.getEstudiante().getIdEstudiante(),
                    p.getIdPractica(),
                    u.getRut(),
                    nombreEstudiante,
                    u.getCorreo(),
                    asigNombre,
                    centro,
                    "SIN_OBSERVACION",
                    "PENDIENTE",
                    null,
                    null,
                    LocalDateTime.now()
                ));
            }
        }

        // Filtro estricto: Nunca retornar todos los estudiantes del sistema si el usuario no tiene asignación
        return resultado;
    }
}
