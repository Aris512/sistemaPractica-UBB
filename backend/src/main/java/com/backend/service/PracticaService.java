package com.backend.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.backend.dto.EstudianteTutorDTO;
import com.backend.model.Estudiante;
import com.backend.model.Evaluacion;
import com.backend.model.Nota;
import com.backend.model.ObservacionPractica;
import com.backend.model.Practica;
import com.backend.model.Usuario;
import com.backend.repository.EstudianteRepository;
import com.backend.repository.EvaluacionRepository;
import com.backend.repository.NotaRepository;
import com.backend.repository.ObservacionPracticaRepository;
import com.backend.repository.PracticaRepository;
import com.backend.repository.UsuarioRepository;

@Service
public class PracticaService {

    private final PracticaRepository practicaRepository;
    private final EstudianteRepository estudianteRepository;
    private final EvaluacionRepository evaluacionRepository;
    private final NotaRepository notaRepository;
    private final ObservacionPracticaRepository observacionPracticaRepository;
    private final UsuarioRepository usuarioRepository;

    public PracticaService(PracticaRepository practicaRepository,
                           EstudianteRepository estudianteRepository,
                           EvaluacionRepository evaluacionRepository,
                           NotaRepository notaRepository,
                           ObservacionPracticaRepository observacionPracticaRepository,
                           UsuarioRepository usuarioRepository) {
        this.practicaRepository = practicaRepository;
        this.estudianteRepository = estudianteRepository;
        this.evaluacionRepository = evaluacionRepository;
        this.notaRepository = notaRepository;
        this.observacionPracticaRepository = observacionPracticaRepository;
        this.usuarioRepository = usuarioRepository;
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

                EstudianteTutorDTO dto = new EstudianteTutorDTO();
                dto.setIdEstudiante(p.getEstudiante().getIdEstudiante());
                dto.setIdPractica(p.getIdPractica());
                dto.setRut(u.getRut());
                dto.setNombre(nombreEstudiante);
                dto.setCorreo(u.getCorreo());
                dto.setAsignaturaNombre(asigNombre);
                dto.setCentroPractica(centro);

                // Poblar con la evaluación más reciente de la práctica o del estudiante
                completarDatosEvaluacionYObservacion(dto, p.getIdPractica(), p.getEstudiante().getIdEstudiante(), u.getRut());

                resultado.add(dto);
            }
            return resultado;
        }

        // Fallback: listar estudiantes matriculados para el curso a evaluar
        List<Estudiante> estudiantes = estudianteRepository.findAll();
        for (Estudiante est : estudiantes) {
            if (est.getUsuario() == null) continue;
            Usuario u = est.getUsuario();
            if (!u.isActivo() || "inactivo".equalsIgnoreCase(u.getEstado()) || "INACTIVO".equalsIgnoreCase(est.getEstado())) {
                continue;
            }
            String asigNombre = est.getAsignatura() != null ? est.getAsignatura().getNombre() : "Práctica Pedagógica";

            // Buscar si tiene práctica asociada
            List<Practica> prList = practicaRepository.findByEstudianteIdEstudiante(est.getIdEstudiante());
            Long idPractica = !prList.isEmpty() ? prList.get(0).getIdPractica() : null;
            String centro = !prList.isEmpty() && prList.get(0).getCentroPractica() != null
                    ? prList.get(0).getCentroPractica().getNombre()
                    : "Colegio San Agustín";

            EstudianteTutorDTO dto = new EstudianteTutorDTO();
            dto.setIdEstudiante(est.getIdEstudiante());
            dto.setIdPractica(idPractica);
            dto.setRut(u.getRut());
            dto.setNombre(u.getNombre() + " " + u.getApellido());
            dto.setCorreo(u.getCorreo());
            dto.setAsignaturaNombre(asigNombre);
            dto.setCentroPractica(centro);

            completarDatosEvaluacionYObservacion(dto, idPractica, est.getIdEstudiante(), u.getRut());

            resultado.add(dto);
        }

        return resultado;
    }

    private void completarDatosEvaluacionYObservacion(EstudianteTutorDTO dto, Long idPractica, Long idEstudiante, String rutEstudiante) {
        Evaluacion evaluacion = null;
        if (idPractica != null) {
            evaluacion = evaluacionRepository.findFirstByPracticaIdPracticaOrderByFechaDesc(idPractica).orElse(null);
        }
        if (evaluacion == null && idEstudiante != null) {
            evaluacion = evaluacionRepository.findFirstByPracticaEstudianteIdEstudianteOrderByFechaDesc(idEstudiante).orElse(null);
        }

        Optional<Nota> notaOpt = idEstudiante != null
                ? notaRepository.findFirstByEstudianteIdEstudianteOrderByIdNotaDesc(idEstudiante)
                : Optional.empty();

        Double calificacion = notaOpt.map(Nota::getPuntajeObtenido).orElse(null);
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
