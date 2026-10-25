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

@Service
public class PracticaService {

    private final PracticaRepository practicaRepository;
    private final EstudianteRepository estudianteRepository;

    public PracticaService(PracticaRepository practicaRepository,
                           EstudianteRepository estudianteRepository) {
        this.practicaRepository = practicaRepository;
        this.estudianteRepository = estudianteRepository;
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
        List<Practica> practicas = practicaRepository.findByTutorPracticaUsuarioRut(rut);
        if (practicas == null || practicas.isEmpty()) {
            practicas = practicaRepository.findByProfesoresColaboradoresUsuarioRut(rut);
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
            return resultado;
        }

        // Fallback: listar estudiantes matriculados para el curso a evaluar
        List<Estudiante> estudiantes = estudianteRepository.findAll();
        for (Estudiante est : estudiantes) {
            if (est.getUsuario() == null) continue;
            Usuario u = est.getUsuario();
            // Restricción: No incluir alumnos en estado inactivo
            if (!u.isActivo() || "inactivo".equalsIgnoreCase(u.getEstado()) || "INACTIVO".equalsIgnoreCase(est.getEstado())) {
                continue;
            }
            String asigNombre = est.getAsignatura() != null ? est.getAsignatura().getNombre() : "Práctica Pedagógica";
            resultado.add(new EstudianteTutorDTO(
                est.getIdEstudiante(),
                null,
                u.getRut(),
                u.getNombre() + " " + u.getApellido(),
                u.getCorreo(),
                asigNombre,
                "Colegio San Agustín",
                "SIN_OBSERVACION",
                "PENDIENTE",
                null,
                null,
                LocalDateTime.now()
            ));
        }

        return resultado;
    }
}
