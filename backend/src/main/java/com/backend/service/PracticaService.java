package com.backend.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.OptionalDouble;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.backend.dto.EstudianteTutorDTO;
import com.backend.model.Evaluacion;
import com.backend.model.Nota;
import com.backend.model.ObservacionPractica;
import com.backend.model.PautaAplicacion;
import com.backend.model.Practica;
import com.backend.model.Usuario;
import com.backend.repository.NotaRepository;
import com.backend.repository.ObservacionPracticaRepository;
import com.backend.repository.PautaAplicacionRepository;
import com.backend.repository.PracticaRepository;

import com.backend.repository.ProfesorRepository;
import java.util.Collections;

@Service
public class PracticaService {

    private final PracticaRepository practicaRepository;
    private final NotaRepository notaRepository;
    private final ObservacionPracticaRepository observacionPracticaRepository;
    private final JdbcTemplate jdbcTemplate;
    private final FileStorageService fileStorageService;
    private final ProfesorRepository profesorRepository;
    private final PautaAplicacionRepository pautaAplicacionRepository;

    public PracticaService(PracticaRepository practicaRepository,
                           NotaRepository notaRepository,
                           ObservacionPracticaRepository observacionPracticaRepository,
                           JdbcTemplate jdbcTemplate,
                           FileStorageService fileStorageService,
                           ProfesorRepository profesorRepository,
                           PautaAplicacionRepository pautaAplicacionRepository) {
        this.pautaAplicacionRepository = pautaAplicacionRepository;
        this.practicaRepository = practicaRepository;
        this.notaRepository = notaRepository;
        this.observacionPracticaRepository = observacionPracticaRepository;
        this.jdbcTemplate = jdbcTemplate;
        this.fileStorageService = fileStorageService;
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

    /**
     * Elimina la práctica junto con lo que solo existe por ella: sus evaluaciones (con notas, observaciones,
     * notas de voz y archivo adjunto), las pautas aplicadas con sus respuestas y el vínculo con sus
     * profesores colaboradores. Las encuestas,
     * planificaciones y proyectos de intervención son trabajo del alumno: se conservan desvinculados.
     * Las rúbricas de avance (rubrica_practica) se borran en cascada desde la base de datos.
     */
    @Transactional
    public void eliminar(Long id) {
        String evaluacionesDePractica = "SELECT id_evaluacion FROM evaluacion WHERE id_practica = ?";
        List<String> archivos = new ArrayList<>(jdbcTemplate.queryForList(
            "SELECT archivo_url FROM evaluacion WHERE id_practica = ? AND archivo_url IS NOT NULL", String.class, id));

        // Una entrega calificada con una de estas notas vuelve a quedar sin nota (como al eliminar una nota)
        jdbcTemplate.update("UPDATE evidencia SET id_nota = NULL, estado = IF(fecha_revision IS NULL, 'PENDIENTE', 'REVISADO') "
            + "WHERE id_nota IN (SELECT id_nota FROM nota WHERE id_evaluacion IN (" + evaluacionesDePractica + "))", id);
        jdbcTemplate.update("DELETE FROM nota WHERE id_evaluacion IN (" + evaluacionesDePractica + ")", id);
        jdbcTemplate.update("DELETE FROM observacion_evaluacion WHERE id_evaluacion IN (" + evaluacionesDePractica + ")", id);
        jdbcTemplate.update("DELETE FROM nota_de_voz WHERE id_evaluacion IN (" + evaluacionesDePractica + ")", id);
        jdbcTemplate.update("DELETE FROM evaluacion WHERE id_practica = ?", id);

        // Pautas aplicadas a la práctica: sus respuestas y audios primero (clave foránea a pauta_aplicacion),
        // y después la nota que cada una dejó al estudiante.
        String aplicacionesDePractica = "SELECT id FROM pauta_aplicacion WHERE id_practica = ?";
        List<Long> notasDePautas = jdbcTemplate.queryForList(
            "SELECT id_nota FROM pauta_aplicacion WHERE id_practica = ? AND id_nota IS NOT NULL", Long.class, id);
        archivos.addAll(jdbcTemplate.queryForList(
            "SELECT ubicacion_archivo FROM nota_de_voz WHERE ubicacion_archivo IS NOT NULL AND id_pauta_aplicacion IN ("
                + aplicacionesDePractica + ")", String.class, id));
        jdbcTemplate.update("DELETE FROM nota_de_voz WHERE id_pauta_aplicacion IN (" + aplicacionesDePractica + ")", id);
        jdbcTemplate.update("DELETE FROM pauta_respuesta WHERE aplicacion_id IN (" + aplicacionesDePractica + ")", id);
        jdbcTemplate.update("DELETE FROM pauta_aplicacion WHERE id_practica = ?", id);
        notasDePautas.forEach(idNota -> jdbcTemplate.update("DELETE FROM nota WHERE id_nota = ?", idNota));

        jdbcTemplate.update("UPDATE encuesta SET id_practica = NULL WHERE id_practica = ?", id);
        jdbcTemplate.update("UPDATE planificacion SET id_practica = NULL WHERE id_practica = ?", id);
        jdbcTemplate.update("UPDATE proyecto_intervencion SET id_practica = NULL WHERE id_practica = ?", id);
        jdbcTemplate.update("DELETE FROM profesor_colaborador_practica WHERE id_practica = ?", id);
        jdbcTemplate.update("DELETE FROM practica WHERE id_practica = ?", id);

        // Se eliminan tras el commit y solo si ningún otro registro usa el mismo archivo
        archivos.forEach(fileStorageService::deleteFile);
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

        if (!practicas.isEmpty()) {
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

                EstudianteTutorDTO dto = new EstudianteTutorDTO();
                dto.setIdEstudiante(p.getEstudiante().getIdEstudiante());
                dto.setIdPractica(p.getIdPractica());
                dto.setRut(u.getRut());
                dto.setNombre(nombreEstudiante);
                dto.setCorreo(u.getCorreo());
                dto.setAsignaturaNombre(asigNombre);
                dto.setCentroPractica(centro);

                // Poblar con la evaluación que este mismo evaluador registró para el estudiante
                completarDatosEvaluacionYObservacion(dto, p.getEstudiante().getIdEstudiante(), u.getRut(), rut);
                completarDesdePautas(dto, p.getIdPractica(), rut);

                resultado.add(dto);
            }
        }

        // Filtro estricto: Nunca retornar todos los estudiantes del sistema si el usuario no tiene asignación
        return resultado;
    }

    /**
     * El inicio del tutor y del colaborador evalúa con pautas: si el evaluador no tiene una nota del modal de
     * evaluación, el estado sale de sus pautas en esta práctica. Con pautas finalizadas queda evaluado, con el
     * promedio de sus notas; con pautas en borrador, en evaluación.
     */
    private void completarDesdePautas(EstudianteTutorDTO dto, Long idPractica, String rutEvaluador) {
        if (dto.getCalificacion() != null || idPractica == null) return;
        List<PautaAplicacion> propias = pautaAplicacionRepository.findByPracticaIdPractica(idPractica).stream()
                .filter(a -> rutEvaluador.equalsIgnoreCase(a.getEvaluadorRut()))
                .toList();
        if (propias.isEmpty()) return;
        OptionalDouble promedio = propias.stream()
                .filter(a -> PautaAplicacion.FINALIZADA.equals(a.getEstado()) && a.getNota() != null)
                .map(a -> a.getNota().getPuntajeObtenido())
                .filter(n -> n != null)
                .mapToDouble(n -> n)
                .average();
        if (promedio.isEmpty()) {
            dto.setEstadoEvaluacion("EN_EVALUACION");
            return;
        }
        dto.setCalificacion(Math.round(promedio.getAsDouble() * 10) / 10.0);
        dto.setEstadoEvaluacion("EVALUADO");
    }

    private void completarDatosEvaluacionYObservacion(EstudianteTutorDTO dto, Long idEstudiante, String rutEstudiante, String rutEvaluador) {
        // Solo la nota (y su evaluación) que emitió este evaluador: el tutor no debe ver ni
        // editar la del profesor de asignatura o la del colaborador, y viceversa.
        Optional<Nota> notaOpt = idEstudiante != null && rutEvaluador != null
                ? notaRepository.findByEstudianteIdEstudianteAndRutEvaluadorOrderByIdNotaDesc(idEstudiante, rutEvaluador)
                        .stream().findFirst()
                : Optional.empty();
        Evaluacion evaluacion = notaOpt.map(n -> n.getEvaluacion()).orElse(null);

        Double calificacion = notaOpt.map(n -> n.getPuntajeObtenido()).orElse(null);
        String obsTexto = evaluacion != null ? evaluacion.getObservacion() : null;

        dto.setCalificacion(calificacion);
        dto.setObservacionTexto(obsTexto);

        if (evaluacion != null) {
            dto.setIdEvaluacion(evaluacion.getIdEvaluacion());
            dto.setTipoEvaluacion(evaluacion.getTipoEvaluacion());
            dto.setEvaluadorRut(evaluacion.getRutEvaluador());
            dto.setEvaluadorNombre(evaluacion.getNombreEvaluador());
            dto.setTipoEvaluador(evaluacion.getTipoEvaluador());
            dto.setArchivoUrl(evaluacion.getArchivoUrl());
            dto.setNombreArchivo(evaluacion.getNombreArchivo());
            dto.setTieneArchivo(evaluacion.getArchivoUrl() != null && !evaluacion.getArchivoUrl().isBlank());
            dto.setFechaActualizacion(evaluacion.getFecha() != null ? evaluacion.getFecha() : LocalDateTime.now());
        } else {
            dto.setFechaActualizacion(LocalDateTime.now());
        }

        if (calificacion != null) {
            dto.setEstadoEvaluacion("EVALUADO");
        } else if (obsTexto != null && !obsTexto.trim().isEmpty()) {
            dto.setEstadoEvaluacion("EN_EVALUACION");
        } else {
            dto.setEstadoEvaluacion("PENDIENTE");
        }

        // Estado de Observación desde ObservacionPractica
        if (rutEstudiante != null) {
            List<ObservacionPractica> obsList = observacionPracticaRepository.findByRut(rutEstudiante);
            if (!obsList.isEmpty()) {
                ObservacionPractica ultimaObs = obsList.get(0);
                dto.setEstadoObservacion(ultimaObs.getEstado() != null ? ultimaObs.getEstado() : "OBSERVADO");
                if (dto.getObservacionTexto() == null || dto.getObservacionTexto().isBlank()) {
                    dto.setObservacionTexto(ultimaObs.getResumen());
                }
            } else {
                dto.setEstadoObservacion("SIN_OBSERVACION");
            }
        } else {
            dto.setEstadoObservacion("SIN_OBSERVACION");
        }
    }
}
