package com.backend.service;

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
import com.backend.model.Usuario;
import com.backend.repository.EvaluacionRepository;
import com.backend.repository.NotaDeVozRepository;
import com.backend.repository.NotaRepository;
import com.backend.repository.UsuarioRepository;

@Service
public class NotaDeVozService {

    private static final Logger logger = LoggerFactory.getLogger(NotaDeVozService.class);
    private static final List<String> FORMATOS_AUDIO = List.of(
            "webm", "mp3", "wav", "m4a", "ogg", "aac", "mp4", "weba", "flac"
    );
    private static final long TAMANO_MAXIMO_AUDIO = 25L * 1024 * 1024;

    private final NotaDeVozRepository notaDeVozRepository;
    private final EvaluacionRepository evaluacionRepository;
    private final NotaRepository notaRepository;
    private final UsuarioRepository usuarioRepository;
    private final FileStorageService fileStorageService;
    private final GroqClient groqClient;

    public NotaDeVozService(NotaDeVozRepository notaDeVozRepository,
                            EvaluacionRepository evaluacionRepository,
                            NotaRepository notaRepository,
                            UsuarioRepository usuarioRepository,
                            FileStorageService fileStorageService,
                            GroqClient groqClient) {
        this.notaDeVozRepository = notaDeVozRepository;
        this.evaluacionRepository = evaluacionRepository;
        this.notaRepository = notaRepository;
        this.usuarioRepository = usuarioRepository;
        this.fileStorageService = fileStorageService;
        this.groqClient = groqClient;
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

    /**
     * Adjunta una nota de voz a una evaluación ya guardada del propio evaluador. No se crean
     * evaluaciones implícitas: quedaban sin puntajes ni tipo y duplicaban la evaluación real.
     */
    @Transactional
    public NotaDeVozDTO guardarNotaDeVoz(Long idEvaluacion,
                                         MultipartFile file,
                                         String duracion,
                                         String transcripcion,
                                         String rutGrabador,
                                         String nombreGrabador) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("El archivo de audio es requerido.");
        }
        if (idEvaluacion == null) {
            throw new IllegalArgumentException("Guarde la evaluación antes de adjuntarle notas de voz.");
        }
        if (rutGrabador == null || rutGrabador.isBlank()) {
            throw new IllegalArgumentException("El RUT de quien graba es requerido.");
        }

        Evaluacion evaluacion = evaluacionRepository.findById(idEvaluacion)
                .orElseThrow(() -> new IllegalArgumentException("Evaluación no encontrada con ID: " + idEvaluacion));
        if (!esEvaluadorDe(evaluacion, rutGrabador)) {
            throw new SecurityException("Solo el evaluador de esta evaluación puede adjuntarle notas de voz.");
        }

        // Determinar nombre del grabador si no viene explícito
        String nombreFinal = (nombreGrabador != null && !nombreGrabador.isBlank()) ? nombreGrabador.trim() : null;
        if (nombreFinal == null && rutGrabador != null && !rutGrabador.isBlank()) {
            Usuario u = usuarioRepository.findByRut(rutGrabador).orElse(null);
            if (u != null) {
                nombreFinal = (u.getNombre() + " " + (u.getApellido() != null ? u.getApellido() : "")).trim();
            }
        }
        if (nombreFinal == null && evaluacion.getNombreEvaluador() != null) {
            nombreFinal = evaluacion.getNombreEvaluador();
        }

        // Almacenar el archivo de audio usando FileStorageService en subdirectorio "notas_de_voz"
        FileStorageService.StoredFileResult stored = fileStorageService.storeFile(
                file,
                "notas_de_voz",
                FORMATOS_AUDIO,
                TAMANO_MAXIMO_AUDIO
        );

        String duracionFinal = (duracion != null && !duracion.trim().isEmpty()) ? duracion.trim() : "0:00";
        String transcripcionLimpia = (transcripcion != null && !transcripcion.trim().isEmpty()) ? transcripcion.trim() : null;

        // Si no se proporcionó transcripción pero Groq Whisper está configurado, autotranscribir con IA
        if (transcripcionLimpia == null && groqClient != null && groqClient.estaConfigurado()) {
            try {
                String textoWhisper = groqClient.transcribirAudio(file.getBytes(), file.getOriginalFilename());
                if (textoWhisper != null && !textoWhisper.isBlank()) {
                    transcripcionLimpia = textoWhisper.trim();
                    logger.info("Transcripción automática con Groq Whisper generada para nota de voz.");
                }
            } catch (Exception e) {
                logger.warn("No se pudo autotranscribir con Groq Whisper: {}", e.getMessage());
            }
        }

        NotaDeVoz nota = new NotaDeVoz(
                evaluacion,
                stored.relativePath(),
                stored.originalFilename(),
                duracionFinal,
                transcripcionLimpia,
                rutGrabador,
                nombreFinal
        );
        nota = notaDeVozRepository.save(nota);
        logger.info("Nota de voz guardada con éxito (id: {}, evalId: {}, grabador: {}, archivo: {})",
                nota.getIdAudio(), evaluacion.getIdEvaluacion(), nombreFinal, stored.relativePath());

        return convertirADTO(nota);
    }

    /**
     * Endpoint directo de servicio para transcribir un archivo de audio a texto usando Groq Whisper.
     */
    public String transcribirAudio(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("El archivo de audio es requerido para transcripción.");
        }
        if (file.getSize() > TAMANO_MAXIMO_AUDIO) {
            throw new IllegalArgumentException("El audio supera el tamaño máximo de 25 MB.");
        }
        String nombre = file.getOriginalFilename() != null ? file.getOriginalFilename() : "";
        String extension = nombre.contains(".") ? nombre.substring(nombre.lastIndexOf('.') + 1).toLowerCase() : "";
        if (!FORMATOS_AUDIO.contains(extension)) {
            throw new IllegalArgumentException("Formato de audio no permitido.");
        }
        if (groqClient == null || !groqClient.estaConfigurado()) {
            throw new IllegalStateException("El servicio de transcripción de IA no está configurado (falta GROQ_API_KEY).");
        }
        try {
            String resultado = groqClient.transcribirAudio(file.getBytes(), file.getOriginalFilename());
            return resultado != null ? resultado : "";
        } catch (Exception e) {
            logger.warn("Error al procesar audio en transcribirAudio: {}", e.getMessage());
            throw new RuntimeException("No se pudo transcribir el audio.");
        }
    }

    /**
     * Es evaluador quien figura en la evaluación o, en evaluaciones antiguas sin
     * rut_evaluador, quien emitió una de sus notas.
     */
    private boolean esEvaluadorDe(Evaluacion evaluacion, String rut) {
        if (rut == null || rut.isBlank()) return false;
        if (evaluacion.getRutEvaluador() != null) {
            return evaluacion.getRutEvaluador().equalsIgnoreCase(rut.trim());
        }
        return notaRepository.findByEvaluacionIdEvaluacion(evaluacion.getIdEvaluacion()).stream()
                .anyMatch(n -> rut.trim().equalsIgnoreCase(n.getRutEvaluador()));
    }

    /** Solo quien grabó la nota (o, si no quedó registrado, el evaluador) puede modificarla. */
    private NotaDeVoz notaDelGrabador(Long idAudio, String rut) {
        NotaDeVoz nota = notaDeVozRepository.findById(idAudio)
                .orElseThrow(() -> new IllegalArgumentException("Nota de voz no encontrada con ID: " + idAudio));
        boolean autorizado = nota.getRutGrabador() != null
                ? rut != null && nota.getRutGrabador().equalsIgnoreCase(rut.trim())
                : nota.getEvaluacion() != null && esEvaluadorDe(nota.getEvaluacion(), rut);
        if (!autorizado) {
            throw new SecurityException("Solo quien grabó la nota de voz puede modificarla.");
        }
        return nota;
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
    public NotaDeVozDTO actualizarTranscripcion(Long idAudio, String nuevaTranscripcion, String rutGrabador) {
        NotaDeVoz nota = notaDelGrabador(idAudio, rutGrabador);
        nota.setTranscripcion(nuevaTranscripcion != null ? nuevaTranscripcion.trim() : null);
        nota = notaDeVozRepository.save(nota);
        return convertirADTO(nota);
    }

    @Transactional
    public void eliminar(Long idAudio, String rutGrabador) {
        if (!notaDeVozRepository.existsById(idAudio)) return;
        NotaDeVoz nota = notaDelGrabador(idAudio, rutGrabador);
        String ubicacion = nota.getUbicacionArchivo();
        notaDeVozRepository.delete(nota);
        notaDeVozRepository.flush();
        if (ubicacion != null && !ubicacion.isBlank()) {
            fileStorageService.deleteFile(ubicacion);
        }
        logger.info("Nota de voz eliminada (id: {})", idAudio);
    }

    public NotaDeVozDTO convertirADTO(NotaDeVoz nota) {
        if (nota == null) return null;
        Long evalId = nota.getEvaluacion() != null ? nota.getEvaluacion().getIdEvaluacion() : null;
        String audioUrl = "/api/notas-de-voz/" + nota.getIdAudio() + "/audio";

        String nombre = nota.getNombreGrabador();
        if ((nombre == null || nombre.isBlank()) && nota.getRutGrabador() != null && !nota.getRutGrabador().isBlank()) {
            Usuario u = usuarioRepository.findByRut(nota.getRutGrabador()).orElse(null);
            if (u != null) {
                nombre = (u.getNombre() + " " + (u.getApellido() != null ? u.getApellido() : "")).trim();
            } else if (nota.getEvaluacion() != null && nota.getEvaluacion().getNombreEvaluador() != null) {
                nombre = nota.getEvaluacion().getNombreEvaluador();
            }
        }

        return new NotaDeVozDTO(
                nota.getIdAudio(),
                evalId,
                nota.getNombreArchivo(),
                nota.getDuracion(),
                nota.getTranscripcion(),
                nota.getFechaGrabacion(),
                nota.getRutGrabador(),
                nombre,
                audioUrl
        );
    }
}
