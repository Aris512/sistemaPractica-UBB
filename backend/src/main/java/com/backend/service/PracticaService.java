package com.backend.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    private final JdbcTemplate jdbcTemplate;
    private final FileStorageService fileStorageService;

    public PracticaService(PracticaRepository practicaRepository,
                           EstudianteRepository estudianteRepository,
                           JdbcTemplate jdbcTemplate,
                           FileStorageService fileStorageService) {
        this.practicaRepository = practicaRepository;
        this.estudianteRepository = estudianteRepository;
        this.jdbcTemplate = jdbcTemplate;
        this.fileStorageService = fileStorageService;
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

    /**
     * Elimina la práctica junto con lo que solo existe por ella: sus evaluaciones (con notas, observaciones,
     * notas de voz y archivo adjunto) y el vínculo con sus profesores colaboradores. Las encuestas,
     * planificaciones y proyectos de intervención son trabajo del alumno: se conservan desvinculados.
     * Las rúbricas de avance (rubrica_practica) se borran en cascada desde la base de datos.
     */
    @Transactional
    public void eliminar(Long id) {
        String evaluacionesDePractica = "SELECT id_evaluacion FROM evaluacion WHERE id_practica = ?";
        List<String> archivos = jdbcTemplate.queryForList(
            "SELECT archivo_url FROM evaluacion WHERE id_practica = ? AND archivo_url IS NOT NULL", String.class, id);

        // Una entrega calificada con una de estas notas vuelve a quedar sin nota (como al eliminar una nota)
        jdbcTemplate.update("UPDATE evidencia SET id_nota = NULL, estado = IF(fecha_revision IS NULL, 'PENDIENTE', 'REVISADO') "
            + "WHERE id_nota IN (SELECT id_nota FROM nota WHERE id_evaluacion IN (" + evaluacionesDePractica + "))", id);
        jdbcTemplate.update("DELETE FROM nota WHERE id_evaluacion IN (" + evaluacionesDePractica + ")", id);
        jdbcTemplate.update("DELETE FROM observacion_evaluacion WHERE id_evaluacion IN (" + evaluacionesDePractica + ")", id);
        jdbcTemplate.update("DELETE FROM nota_de_voz WHERE id_evaluacion IN (" + evaluacionesDePractica + ")", id);
        jdbcTemplate.update("DELETE FROM evaluacion WHERE id_practica = ?", id);

        jdbcTemplate.update("UPDATE encuesta SET id_practica = NULL WHERE id_practica = ?", id);
        jdbcTemplate.update("UPDATE planificacion SET id_practica = NULL WHERE id_practica = ?", id);
        jdbcTemplate.update("UPDATE proyecto_intervencion SET id_practica = NULL WHERE id_practica = ?", id);
        jdbcTemplate.update("DELETE FROM profesor_colaborador_practica WHERE id_practica = ?", id);
        jdbcTemplate.update("DELETE FROM practica WHERE id_practica = ?", id);

        // Se eliminan tras el commit y solo si ningún otro registro usa el mismo archivo
        archivos.forEach(fileStorageService::deleteFile);
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
