package com.backend.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.backend.dto.NotaDeVozDTO;
import com.backend.model.Evaluacion;
import com.backend.model.NotaDeVoz;
import com.backend.model.Practica;
import com.backend.repository.EvaluacionRepository;
import com.backend.repository.NotaDeVozRepository;
import com.backend.repository.PracticaRepository;

@Service
public class NotaDeVozService {

    private static final Logger logger = LoggerFactory.getLogger(NotaDeVozService.class);
    private static final List<String> FORMATOS_AUDIO = List.of(
            "webm", "mp3", "wav", "m4a", "ogg", "aac", "mp4", "weba", "flac"
    );

    private final NotaDeVozRepository notaDeVozRepository;
    private final EvaluacionRepository evaluacionRepository;
    private final PracticaRepository practicaRepository;
    private final FileStorageService fileStorageService;

    public NotaDeVozService(NotaDeVozRepository notaDeVozRepository,
                            EvaluacionRepository evaluacionRepository,
                            PracticaRepository practicaRepository,
                            FileStorageService fileStorageService) {
        this.notaDeVozRepository = notaDeVozRepository;
        this.evaluacionRepository = evaluacionRepository;
        this.practicaRepository = practicaRepository;
        this.fileStorageService = fileStorageService;
    }

    public List<NotaDeVoz> obtenerTodos() {
        return notaDeVozRepository.findAll();
    }

    public NotaDeVoz obtenerPorId(Long id) {
        return notaDeVozRepository.findById(id).orElse(null);
    }

    public NotaDeVoz crear(NotaDeVoz notaDeVoz) {
        return notaDeVozRepository.save(notaDeVoz);
    }

    @Transactional(readOnly = true)
    public List<NotaDeVozDTO> obtenerPorEvaluacion(Long idEvaluacion) {
        if (idEvaluacion == null) return List.of();
        List<NotaDeVoz> notas = notaDeVozRepository.findByEvaluacionIdEvaluacionOrderByFechaGrabacionDesc(idEvaluacion);
        return notas.stream().map(this::convertirADTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<NotaDeVozDTO> obtenerPorEstudiante(Long idEstudiante) {
        if (idEstudiante == null) return List.of();
        List<NotaDeVoz> notas = notaDeVozRepository.findByEstudianteId(idEstudiante);
        return notas.stream().map(this::convertirADTO).collect(Collectors.toList());
    }

    @Transactional
    public NotaDeVozDTO guardarNotaDeVoz(Long idEvaluacion,
                                         MultipartFile file,
                                         String duracion,
                                         String transcripcion,
                                         String rutGrabador) {
        return guardarNotaDeVoz(idEvaluacion, null, file, duracion, transcripcion, rutGrabador);
    }

    @Transactional
    public NotaDeVozDTO guardarNotaDeVoz(Long idEvaluacion,
                                         Long idEstudiante,
                                         MultipartFile file,
                                         String duracion,
                                         String transcripcion,
                                         String rutGrabador) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("El archivo de audio es requerido.");
        }

        Evaluacion evaluacion = null;
        if (idEvaluacion != null) {
            evaluacion = evaluacionRepository.findById(idEvaluacion).orElse(null);
        }

        if (evaluacion == null && idEstudiante != null) {
            evaluacion = evaluacionRepository.findFirstByPracticaEstudianteIdEstudianteOrderByFechaDesc(idEstudiante).orElse(null);

            if (evaluacion == null) {
                List<Practica> practicas = practicaRepository.findByEstudianteIdEstudiante(idEstudiante);
                Practica p = practicas.isEmpty() ? null : practicas.get(0);
                evaluacion = new Evaluacion();
                evaluacion.setPractica(p);
                evaluacion.setFecha(LocalDateTime.now());
                evaluacion.setTipoEvaluacion("Evaluación Práctica");
                evaluacion.setRutEvaluador(rutGrabador);
                evaluacion = evaluacionRepository.save(evaluacion);
            }
        }

        if (evaluacion == null) {
            throw new IllegalArgumentException("Se requiere el ID de la evaluación o el ID del estudiante para ligar la nota de voz.");
        }

        // Almacenar el archivo de audio usando FileStorageService en subdirectorio "notas_de_voz"
        FileStorageService.StoredFileResult stored = fileStorageService.storeFile(
                file,
                "notas_de_voz",
                FORMATOS_AUDIO,
                25L * 1024 * 1024 // 25 MB max para audio
        );

        String duracionFinal = (duracion != null && !duracion.trim().isEmpty()) ? duracion.trim() : "0:00";
        String transcripcionLimpia = (transcripcion != null && !transcripcion.trim().isEmpty()) ? transcripcion.trim() : null;

        NotaDeVoz nota = new NotaDeVoz(
                evaluacion,
                stored.relativePath(),
                stored.originalFilename(),
                duracionFinal,
                transcripcionLimpia,
                rutGrabador
        );
        nota = notaDeVozRepository.save(nota);
        logger.info("Nota de voz guardada con éxito (id: {}, evalId: {}, archivo: {})",
                nota.getIdAudio(), evaluacion.getIdEvaluacion(), stored.relativePath());

        return convertirADTO(nota);
    }

    @Transactional(readOnly = true)
    public Resource obtenerRecursoAudio(Long idAudio) {
        NotaDeVoz nota = notaDeVozRepository.findById(idAudio)
                .orElseThrow(() -> new IllegalArgumentException("Nota de voz no encontrada con ID: " + idAudio));

        if (nota.getUbicacionArchivo() == null || nota.getUbicacionArchivo().isBlank()) {
            throw new IllegalArgumentException("La nota de voz no tiene archivo físico asociado.");
        }

        return fileStorageService.loadFileAsResource(nota.getUbicacionArchivo());
    }

    @Transactional
    public NotaDeVozDTO actualizarTranscripcion(Long idAudio, String nuevaTranscripcion) {
        NotaDeVoz nota = notaDeVozRepository.findById(idAudio)
                .orElseThrow(() -> new IllegalArgumentException("Nota de voz no encontrada con ID: " + idAudio));
        nota.setTranscripcion(nuevaTranscripcion != null ? nuevaTranscripcion.trim() : null);
        nota = notaDeVozRepository.save(nota);
        return convertirADTO(nota);
    }

    @Transactional
    public void eliminar(Long idAudio) {
        NotaDeVoz nota = notaDeVozRepository.findById(idAudio).orElse(null);
        if (nota != null) {
            String ubicacion = nota.getUbicacionArchivo();
            notaDeVozRepository.delete(nota);
            notaDeVozRepository.flush();
            if (ubicacion != null && !ubicacion.isBlank()) {
                fileStorageService.deleteFile(ubicacion);
            }
            logger.info("Nota de voz eliminada (id: {})", idAudio);
        }
    }

    public NotaDeVozDTO convertirADTO(NotaDeVoz nota) {
        if (nota == null) return null;
        Long evalId = nota.getEvaluacion() != null ? nota.getEvaluacion().getIdEvaluacion() : null;
        String audioUrl = "/api/notas-de-voz/" + nota.getIdAudio() + "/audio";
        return new NotaDeVozDTO(
                nota.getIdAudio(),
                evalId,
                nota.getNombreArchivo(),
                nota.getDuracion(),
                nota.getTranscripcion(),
                nota.getFechaGrabacion(),
                nota.getRutGrabador(),
                audioUrl
        );
    }
}
