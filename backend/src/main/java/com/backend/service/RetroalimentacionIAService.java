package com.backend.service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.multipart.MultipartFile;

import com.backend.dto.RetroalimentacionDTOs.InicioRevisionDTO;
import com.backend.dto.RetroalimentacionDTOs.MensajeChatDTO;
import com.backend.dto.RetroalimentacionDTOs.ObservacionDTO;
import com.backend.dto.RetroalimentacionDTOs.PlanificacionRetroDTO;
import com.backend.dto.RetroalimentacionDTOs.RetroDTO;
import com.backend.dto.RetroalimentacionDTOs.RetroProfesorDTO;
import com.backend.dto.RetroalimentacionDTOs.RetroProfesorDetalleDTO;
import com.backend.model.Documento;
import com.backend.model.Estudiante;
import com.backend.model.ObservacionRetroalimentacion;
import com.backend.model.Planificacion;
import com.backend.model.Profesor;
import com.backend.model.RetroalimentacionIA;
import com.backend.model.RetroalimentacionIA.Estado;
import com.backend.model.Usuario;
import com.backend.repository.ChatConversacionRepository;
import com.backend.repository.ChatMensajeRepository;
import com.backend.repository.EstudianteRepository;
import com.backend.repository.ObservacionRetroalimentacionRepository;
import com.backend.repository.PlanificacionRepository;
import com.backend.repository.ProfesorRepository;
import com.backend.repository.RetroalimentacionIARepository;
import com.backend.repository.UsuarioRepository;

/**
 * Flujo de retroalimentación de una planificación: la revisa la IA en una conversación del asistente
 * (máximo {@link RetroalimentacionIA#MAX_REVISIONES_IA} revisiones por ciclo); con su visto bueno el alumno
 * la envía al profesor de asignatura, que la aprueba o la rechaza. Tras un rechazo, o si se agotan las
 * revisiones de la IA, el alumno sube una versión corregida y empieza un ciclo nuevo.
 *
 * El alumno también puede enviarla directamente al profesor, sin la IA. Mientras el profesor la revisa, el alumno
 * puede seguir cambiando sus archivos y recibe sus observaciones; una vez aprobada queda cerrada y el estudiante
 * queda habilitado para que el coordinador lo asocie.
 */
@Service
public class RetroalimentacionIAService {

    private static final Logger logger = LoggerFactory.getLogger(RetroalimentacionIAService.class);
    private static final String CATEGORIA_PLANIFICACION = "PLANIFICACION";
    private static final int MAX_COMENTARIO = 2000;
    /** Deja espacio en el mensaje del chat (4.000 caracteres) para la frase automática que anuncia el archivo. */
    private static final int MAX_COMENTARIO_ADJUNTO = 3500;

    private final RetroalimentacionIARepository repository;
    private final ObservacionRetroalimentacionRepository observacionRepository;
    private final PlanificacionRepository planificacionRepository;
    private final EstudianteRepository estudianteRepository;
    private final ProfesorRepository profesorRepository;
    private final UsuarioRepository usuarioRepository;
    private final ChatConversacionRepository conversacionRepository;
    private final ChatMensajeRepository mensajeRepository;
    private final ChatService chatService;
    private final PlanificacionTextoExtractor extractor;
    private final PlanificacionService planificacionService;
    private final TransactionTemplate transaccion;

    public RetroalimentacionIAService(RetroalimentacionIARepository repository,
                                      ObservacionRetroalimentacionRepository observacionRepository,
                                      PlanificacionRepository planificacionRepository,
                                      EstudianteRepository estudianteRepository,
                                      ProfesorRepository profesorRepository,
                                      UsuarioRepository usuarioRepository,
                                      ChatConversacionRepository conversacionRepository,
                                      ChatMensajeRepository mensajeRepository,
                                      ChatService chatService,
                                      PlanificacionTextoExtractor extractor,
                                      PlanificacionService planificacionService,
                                      PlatformTransactionManager transactionManager) {
        this.repository = repository;
        this.observacionRepository = observacionRepository;
        this.planificacionRepository = planificacionRepository;
        this.estudianteRepository = estudianteRepository;
        this.profesorRepository = profesorRepository;
        this.usuarioRepository = usuarioRepository;
        this.conversacionRepository = conversacionRepository;
        this.mensajeRepository = mensajeRepository;
        this.chatService = chatService;
        this.extractor = extractor;
        this.planificacionService = planificacionService;
        this.transaccion = new TransactionTemplate(transactionManager);
    }

    // ---------------------------------------------------------------------------------------------
    // Alumno
    // ---------------------------------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<PlanificacionRetroDTO> listarDelEstudiante(String rutCliente) {
        Estudiante estudiante = estudianteEnPractica(rutCliente);
        return planificacionRepository.findByEstudianteIdEstudiante(estudiante.getIdEstudiante()).stream()
                .sorted(Comparator.comparing((Planificacion p) -> p.getIdPlanificacion()).reversed())
                .map(p -> {
                    Documento archivo = archivoPlanificacion(p);
                    RetroalimentacionIA retro = retroDe(p);
                    boolean completa = planificacionService.categoriasPendientes(p).isEmpty();
                    return new PlanificacionRetroDTO(p.getIdPlanificacion(), p.getFechaCreacion(),
                            p.getAsignatura() != null ? p.getAsignatura().getNombre() : null,
                            archivo != null ? archivo.getIdDocumento() : null,
                            archivo != null ? archivo.getNombre() : null,
                            completa, archivo != null && (retro == null || admiteEnvioDirecto(retro)),
                            retro != null ? aDTO(retro, archivo) : null);
                })
                .toList();
    }

    /**
     * Abre (o retoma) la conversación de revisión con la IA. Si es nueva, envía el primer mensaje para que
     * la IA empiece a revisar; si Groq falla, la conversación queda creada y el alumno puede escribir igual.
     * La llamada a Groq va fuera de la transacción, igual que en el chat.
     */
    public InicioRevisionDTO iniciarRevisionIa(String rutCliente, Long idPlanificacion) {
        return iniciarRevisionIa(rutCliente, idPlanificacion, null);
    }

    /** comentario: lo que el alumno escribió junto al archivo (botón +); se agrega al mensaje automático. */
    private InicioRevisionDTO iniciarRevisionIa(String rutCliente, Long idPlanificacion, String comentario) {
        String rut = chatService.resolverUsuario(rutCliente);
        InicioPreparado inicio = transaccion.execute(status -> prepararRevision(rut, idPlanificacion, comentario));

        String aviso = inicio.aviso();
        if (inicio.mensajeAutomatico() != null) {
            try {
                chatService.enviarMensajeAutomatico(rut, inicio.idConversacion(), inicio.mensajeAutomatico());
            } catch (ChatException e) {
                logger.warn("No se pudo enviar el primer mensaje de revisión (conversación {}): {}", inicio.idConversacion(), e.getCodigo());
                aviso = "La IA no pudo responder todavía (" + e.getMessage() + "). Escríbele en la conversación para reintentar.";
            }
        }
        return new InicioRevisionDTO(inicio.idConversacion(), inicio.nueva(), aviso);
    }

    /** mensajeAutomatico: lo que se le escribe a la IA al abrir la revisión o tras cambiar el archivo (null si no hace falta). */
    private record InicioPreparado(Long idConversacion, boolean nueva, String mensajeAutomatico, String aviso) {
    }

    private InicioPreparado prepararRevision(String rut, Long idPlanificacion, String comentario) {
        Planificacion planificacion = planificacionPropia(rut, idPlanificacion);
        Documento archivo = archivoPlanificacion(planificacion);
        if (archivo == null) {
            throw new ChatException(HttpStatus.CONFLICT, "RETRO_SIN_ARCHIVO",
                    "Primero sube el archivo «Planificación» en la sección Planificación.");
        }
        RetroalimentacionIA retro = retroDe(planificacion);
        if (retro == null) {
            retro = new RetroalimentacionIA(planificacion);
        }
        if (!puedeRevisarIa(retro, archivo)) {
            throw new ChatException(HttpStatus.CONFLICT, "RETRO_REVISION_CERRADA", retro.getEstado() == Estado.NO_REVISADO
                    ? "Ya recibiste las " + RetroalimentacionIA.MAX_REVISIONES_IA + " revisiones de la IA. Sube una versión corregida y reinicia la revisión."
                    : "La revisión de la IA ya terminó para esta planificación.");
        }

        String aviso = null;
        boolean archivoNuevo = !archivo.getIdDocumento().equals(retro.getIdDocumentoRevisado());
        if (archivoNuevo) {
            // La IA lee el texto guardado aquí en cada mensaje; con un archivo nuevo se actualiza
            retro.setTextoPlanificacion(extractor.extraer(archivo));
            retro.setIdDocumentoRevisado(archivo.getIdDocumento());
            retro.setNombreArchivoRevisado(archivo.getNombre());
            if (retro.getConversacion() != null) {
                aviso = "La IA ahora revisa tu archivo actualizado «" + archivo.getNombre() + "».";
                // Lo conversado hasta aquí era sobre la versión anterior: la IA ya no lo recibe
                retro.setMensajesPreviosArchivo(mensajeRepository.findMaxOrden(retro.getConversacion().getIdConversacion()));
            }
        }

        boolean nueva = retro.getConversacion() == null;
        if (nueva) {
            String titulo = "Revisión: " + archivo.getNombre();
            Long id = chatService.crearConversacion(rut, titulo.length() > 100 ? titulo.substring(0, 100) : titulo).id();
            retro.setConversacion(conversacionRepository.getReferenceById(id));
            retro.setMensajesPreviosArchivo(0);
        }
        retro.tocar();
        repository.save(retro);

        String mensaje = null;
        if (nueva) {
            mensaje = "Hola, adjunto mi planificación «" + archivo.getNombre() + "» para que la revises y me hagas "
                    + "preguntas de reflexión sobre lo que esté poco claro o incompleto.";
        } else if (archivoNuevo) {
            mensaje = "Adjunto una versión actualizada de mi planificación «" + archivo.getNombre() + "». Por favor, revísala "
                    + "y hazme preguntas de reflexión sobre lo que siga poco claro o incompleto.";
        }
        if (mensaje != null && comentario != null && !comentario.isBlank()) {
            mensaje += "\n\n" + comentario.strip();
        }
        return new InicioPreparado(retro.getConversacion().getIdConversacion(), nueva, mensaje, aviso);
    }

    /**
     * Reemplaza el archivo «Planificación» desde la conversación de revisión (botón +). Con la revisión abierta, la IA
     * lee el archivo nuevo en la misma conversación; si ya estaba cerrada (aprobada por la IA, rechazada por el profesor
     * o revisiones agotadas) se reinicia el ciclo y se abre una conversación nueva. Si el profesor la está revisando,
     * solo se reemplaza el archivo: el profesor ve la versión nueva y la IA no interviene.
     */
    public InicioRevisionDTO reemplazarArchivo(String rutCliente, Long idPlanificacion, MultipartFile archivo, String comentario) {
        String rut = chatService.resolverUsuario(rutCliente);
        if (comentario != null && comentario.strip().length() > MAX_COMENTARIO_ADJUNTO) {
            throw new ChatException(HttpStatus.BAD_REQUEST, "CHAT_MENSAJE_LARGO",
                    "El mensaje que acompaña al archivo supera el máximo de " + MAX_COMENTARIO_ADJUNTO + " caracteres.");
        }
        // Se valida todo antes de tocar el archivo actual, para no perderlo si lo nuevo no sirve
        transaccion.executeWithoutResult(status -> {
            RetroalimentacionIA retro = retroDe(planificacionPropia(rut, idPlanificacion));
            // Mientras el profesor la revisa se puede seguir cambiando; al aprobarla queda cerrada
            if (retro != null && retro.getEstado() == Estado.APROBADO) {
                throw new ChatException(HttpStatus.CONFLICT, "RETRO_NO_EDITABLE", "Tu profesor ya aprobó esta planificación.");
            }
        });
        if (archivo == null || archivo.isEmpty()) {
            throw new ChatException(HttpStatus.BAD_REQUEST, "RETRO_SIN_ARCHIVO", "Adjunta el archivo de tu planificación.");
        }
        // Formato, archivo dañado o sin texto: se rechaza aquí, sin perder la planificación que ya estaba subida
        extractor.extraer(archivo);

        planificacionService.subirArchivos(idPlanificacion, List.of(archivo), List.of(CATEGORIA_PLANIFICACION), rut);

        InicioRevisionDTO enRevisionProfesor = transaccion.execute(status -> {
            Planificacion planificacion = planificacionPropia(rut, idPlanificacion);
            RetroalimentacionIA retro = retroDe(planificacion);
            if (retro != null && retro.getEstado() == Estado.ESPERANDO_PROFESOR) {
                return new InicioRevisionDTO(retro.getConversacion() != null ? retro.getConversacion().getIdConversacion() : null,
                        false, "Actualizaste tu planificación: tu profesor revisará la versión nueva.");
            }
            if (retro != null && puedeReiniciar(retro, archivoPlanificacion(planificacion))) {
                reiniciar(rut, retro.getIdRetroalimentacion());
            }
            return null;
        });
        if (enRevisionProfesor != null) {
            return enRevisionProfesor;
        }
        return iniciarRevisionIa(rut, idPlanificacion, comentario);
    }

    @Transactional
    public RetroDTO enviarAlProfesor(String rutCliente, Long idRetroalimentacion) {
        String rut = chatService.resolverUsuario(rutCliente);
        RetroalimentacionIA retro = retroPropia(rut, idRetroalimentacion);
        Documento archivo = archivoPlanificacion(retro.getPlanificacion());
        if (!puedeEnviar(retro, archivo)) {
            throw new ChatException(HttpStatus.CONFLICT, "RETRO_NO_ENVIABLE", archivoCambiado(retro, archivo)
                    ? "Cambiaste el archivo después de la revisión de la IA. Reinicia la revisión con la nueva versión."
                    : "Solo puedes enviarla al profesor cuando la IA la marque como apta.");
        }
        exigirProfesorAsignado(retro.getPlanificacion());
        retro.setEstado(Estado.ESPERANDO_PROFESOR);
        retro.setFechaEnvioProfesor(LocalDateTime.now());
        retro.setFechaRespuestaProfesor(null);
        return aDTO(retro, archivo);
    }

    /**
     * Botón «Enviar al profesor» de la planificación: la envía sin pasar por la IA. Basta el archivo «Planificación»;
     * el profesor ve como pendientes los que falten. Tras un rechazo empieza un ciclo nuevo; la conversación con la IA,
     * si la hubo, se conserva para que el profesor la lea.
     */
    @Transactional
    public RetroDTO enviarDirecto(String rutCliente, Long idPlanificacion) {
        String rut = chatService.resolverUsuario(rutCliente);
        Planificacion planificacion = planificacionPropia(rut, idPlanificacion);
        Documento archivo = archivoPlanificacion(planificacion);
        if (archivo == null) {
            throw new ChatException(HttpStatus.CONFLICT, "RETRO_SIN_ARCHIVO",
                    "Sube al menos el archivo «Planificación» antes de enviarla a tu profesor.");
        }
        RetroalimentacionIA retro = retroDe(planificacion);
        if (retro == null) {
            retro = new RetroalimentacionIA(planificacion);
        }
        if (!admiteEnvioDirecto(retro)) {
            throw new ChatException(HttpStatus.CONFLICT, "RETRO_NO_ENVIABLE", retro.getEstado() == Estado.APROBADO
                    ? "Tu profesor ya aprobó esta planificación."
                    : "Tu profesor ya está revisando esta planificación.");
        }
        exigirProfesorAsignado(planificacion);
        if (retro.getEstado() == Estado.RECHAZADO) {
            retro.setCiclo(retro.getCiclo() + 1);
        }
        retro.setIdDocumentoRevisado(archivo.getIdDocumento());
        retro.setNombreArchivoRevisado(archivo.getNombre());
        retro.setEstado(Estado.ESPERANDO_PROFESOR);
        retro.setFechaEnvioProfesor(LocalDateTime.now());
        retro.setFechaRespuestaProfesor(null);
        repository.save(retro);
        return aDTO(retro, archivo);
    }

    private void exigirProfesorAsignado(Planificacion planificacion) {
        Long idAsignatura = planificacion.getAsignatura() != null ? planificacion.getAsignatura().getIdAsignatura() : null;
        if (idAsignatura == null || profesorRepository.findAllByAsignaturaId(idAsignatura).isEmpty()) {
            throw new ChatException(HttpStatus.CONFLICT, "RETRO_SIN_PROFESOR",
                    "Tu asignatura aún no tiene un profesor asignado. Contacta a la coordinación.");
        }
    }

    /** Ciclo nuevo con la versión corregida: tras un rechazo, revisiones agotadas o un archivo cambiado tras el visto bueno. */
    @Transactional
    public RetroDTO reiniciar(String rutCliente, Long idRetroalimentacion) {
        String rut = chatService.resolverUsuario(rutCliente);
        RetroalimentacionIA retro = retroPropia(rut, idRetroalimentacion);
        Documento archivo = archivoPlanificacion(retro.getPlanificacion());
        if (!puedeReiniciar(retro, archivo)) {
            throw new ChatException(HttpStatus.CONFLICT, "RETRO_NO_REINICIABLE", archivo != null && !archivoCambiado(retro, archivo)
                    ? "Sube primero la versión corregida de tu planificación en la sección Planificación."
                    : "Esta retroalimentación no se puede reiniciar en su estado actual.");
        }
        retro.setEstado(Estado.NO_REVISADO);
        retro.setCiclo(retro.getCiclo() + 1);
        retro.setRevisionesIa(0);
        retro.setConversacion(null);
        retro.setMensajesPreviosArchivo(0);
        retro.setTextoPlanificacion(null);
        retro.setIdDocumentoRevisado(null);
        retro.setNombreArchivoRevisado(null);
        retro.setUltimaRevisionIa(null);
        retro.setFechaEnvioProfesor(null);
        retro.setFechaRespuestaProfesor(null);
        // El comentario del profesor se conserva para que el alumno lo tenga a mano al corregir
        return aDTO(retro, archivo);
    }

    // ---------------------------------------------------------------------------------------------
    // Profesor
    // ---------------------------------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<RetroProfesorDTO> listarDelProfesor(String rutCliente) {
        Profesor profesor = profesorDe(rutCliente);
        return repository.findByPlanificacionAsignaturaIdAsignaturaAndFechaEnvioProfesorIsNotNull(
                        profesor.getAsignatura().getIdAsignatura()).stream()
                .sorted(Comparator.comparing((RetroalimentacionIA r) -> r.getEstado() != Estado.ESPERANDO_PROFESOR)
                        .thenComparing((RetroalimentacionIA r) -> r.getFechaEnvioProfesor(), Comparator.reverseOrder()))
                .map(this::aDTOProfesor)
                .toList();
    }

    @Transactional(readOnly = true)
    public RetroProfesorDetalleDTO detalleProfesor(String rutCliente, Long idRetroalimentacion) {
        return detalle(retroDelProfesor(profesorDe(rutCliente), idRetroalimentacion));
    }

    @Transactional
    public RetroProfesorDTO responder(String rutCliente, Long idRetroalimentacion, Boolean aprobado, String comentario) {
        Profesor profesor = profesorDe(rutCliente);
        RetroalimentacionIA retro = retroDelProfesor(profesor, idRetroalimentacion);
        if (retro.getEstado() != Estado.ESPERANDO_PROFESOR) {
            throw new ChatException(HttpStatus.CONFLICT, "RETRO_YA_RESPONDIDA", "Esta retroalimentación ya fue respondida.");
        }
        if (aprobado == null) {
            throw new ChatException(HttpStatus.BAD_REQUEST, "RETRO_DECISION_FALTANTE", "Indica si apruebas o rechazas la planificación.");
        }
        String texto = comentario == null ? "" : comentario.strip();
        if (!aprobado && texto.isEmpty()) {
            throw new ChatException(HttpStatus.BAD_REQUEST, "RETRO_COMENTARIO_REQUERIDO",
                    "Para rechazarla, escribe qué debe corregir el estudiante.");
        }
        if (texto.length() > MAX_COMENTARIO) {
            throw new ChatException(HttpStatus.BAD_REQUEST, "RETRO_COMENTARIO_LARGO",
                    "El comentario supera el máximo de " + MAX_COMENTARIO + " caracteres.");
        }
        retro.setEstado(aprobado ? Estado.APROBADO : Estado.RECHAZADO);
        retro.setComentarioProfesor(texto.isEmpty() ? null : texto);
        retro.setRutProfesorRevisor(profesor.getUsuario().getRut());
        retro.setFechaRespuestaProfesor(LocalDateTime.now());
        observacionRepository.save(new ObservacionRetroalimentacion(retro,
                aprobado ? ObservacionRetroalimentacion.Tipo.APROBACION : ObservacionRetroalimentacion.Tipo.RECHAZO,
                retro.getComentarioProfesor(), retro.getRutProfesorRevisor()));
        return aDTOProfesor(retro);
    }

    /**
     * El profesor elimina por completo la retroalimentación de un alumno de su asignatura: la planificación (y su
     * registro en la tabla planificacion), los archivos que subió, sus observaciones y el chat que usó con la IA.
     */
    @Transactional
    public void eliminarDelProfesor(String rutCliente, Long idRetroalimentacion) {
        Profesor profesor = profesorDe(rutCliente);
        Planificacion planificacion = retroDelProfesor(profesor, idRetroalimentacion).getPlanificacion();
        logger.info("El profesor {} eliminó la retroalimentación {} (planificación {}).",
                profesor.getUsuario().getRut(), idRetroalimentacion, planificacion.getIdPlanificacion());
        planificacionService.eliminarPorProfesor(planificacion);
    }

    /** Observación del profesor mientras la revisa (o tras rechazarla); no cambia el estado de la retroalimentación. */
    @Transactional
    public RetroProfesorDetalleDTO observar(String rutCliente, Long idRetroalimentacion, String texto) {
        Profesor profesor = profesorDe(rutCliente);
        RetroalimentacionIA retro = retroDelProfesor(profesor, idRetroalimentacion);
        if (!puedeObservar(retro)) {
            throw new ChatException(HttpStatus.CONFLICT, "RETRO_YA_APROBADA",
                    "La planificación ya fue aprobada: no admite más observaciones.");
        }
        String limpio = texto == null ? "" : texto.strip();
        if (limpio.isEmpty()) {
            throw new ChatException(HttpStatus.BAD_REQUEST, "RETRO_OBSERVACION_VACIA", "Escribe la observación para el estudiante.");
        }
        if (limpio.length() > MAX_COMENTARIO) {
            throw new ChatException(HttpStatus.BAD_REQUEST, "RETRO_COMENTARIO_LARGO",
                    "La observación supera el máximo de " + MAX_COMENTARIO + " caracteres.");
        }
        observacionRepository.save(new ObservacionRetroalimentacion(retro, ObservacionRetroalimentacion.Tipo.OBSERVACION,
                limpio, profesor.getUsuario().getRut()));
        retro.tocar();
        return detalle(retro);
    }

    // ---------------------------------------------------------------------------------------------
    // Reglas de estado
    // ---------------------------------------------------------------------------------------------

    private static boolean archivoCambiado(RetroalimentacionIA retro, Documento archivo) {
        return retro.getIdDocumentoRevisado() != null
                && (archivo == null || !archivo.getIdDocumento().equals(retro.getIdDocumentoRevisado()));
    }

    private static boolean puedeRevisarIa(RetroalimentacionIA retro, Documento archivo) {
        return archivo != null && retro.getEstado() == Estado.NO_REVISADO
                && retro.getRevisionesIa() < RetroalimentacionIA.MAX_REVISIONES_IA;
    }

    private static boolean puedeEnviar(RetroalimentacionIA retro, Documento archivo) {
        return retro.getEstado() == Estado.REVISADO_POR_IA && !archivoCambiado(retro, archivo);
    }

    /** Envío sin la IA: desde cualquier estado salvo cuando el profesor ya la tiene o ya la aprobó. */
    private static boolean admiteEnvioDirecto(RetroalimentacionIA retro) {
        return retro.getEstado() != Estado.ESPERANDO_PROFESOR && retro.getEstado() != Estado.APROBADO;
    }

    private static boolean puedeObservar(RetroalimentacionIA retro) {
        return retro.getEstado() == Estado.ESPERANDO_PROFESOR || retro.getEstado() == Estado.RECHAZADO;
    }

    private static boolean puedeReiniciar(RetroalimentacionIA retro, Documento archivo) {
        boolean motivo = retro.getEstado() == Estado.RECHAZADO
                || retro.getEstado() == Estado.REVISADO_POR_IA
                || (retro.getEstado() == Estado.NO_REVISADO && retro.getRevisionesIa() >= RetroalimentacionIA.MAX_REVISIONES_IA);
        return motivo && archivo != null && archivoCambiado(retro, archivo);
    }

    // ---------------------------------------------------------------------------------------------
    // Búsquedas y conversión
    // ---------------------------------------------------------------------------------------------

    private Estudiante estudianteEnPractica(String rutCliente) {
        String rut = chatService.resolverUsuario(rutCliente);
        Estudiante estudiante = estudianteRepository.findByUsuarioRut(rut)
                .orElseThrow(() -> new ChatException(HttpStatus.FORBIDDEN, "RETRO_SOLO_ESTUDIANTES",
                        "La retroalimentación está disponible solo para estudiantes."));
        String semestre = estudiante.getAsignatura() != null ? estudiante.getAsignatura().getSemestre() : null;
        int numero = AvanceAcademicoService.semestreNumerico(semestre);
        if (numero < 8 || numero == Integer.MAX_VALUE) {
            throw new ChatException(HttpStatus.FORBIDDEN, "RETRO_SOLO_PRACTICA",
                    "La retroalimentación está disponible desde 8.° semestre.");
        }
        return estudiante;
    }

    private Planificacion planificacionPropia(String rut, Long idPlanificacion) {
        Estudiante estudiante = estudianteEnPractica(rut);
        return planificacionRepository.findById(idPlanificacion)
                .filter(p -> p.getEstudiante() != null
                        && Objects.equals(p.getEstudiante().getIdEstudiante(), estudiante.getIdEstudiante()))
                .orElseThrow(() -> new ChatException(HttpStatus.NOT_FOUND, "RETRO_NO_ENCONTRADA",
                        "La planificación no existe o no te pertenece."));
    }

    private RetroalimentacionIA retroPropia(String rut, Long idRetroalimentacion) {
        Estudiante estudiante = estudianteEnPractica(rut);
        return repository.findById(idRetroalimentacion)
                .filter(r -> r.getPlanificacion() != null && r.getPlanificacion().getEstudiante() != null
                        && Objects.equals(r.getPlanificacion().getEstudiante().getIdEstudiante(), estudiante.getIdEstudiante()))
                .orElseThrow(() -> new ChatException(HttpStatus.NOT_FOUND, "RETRO_NO_ENCONTRADA",
                        "La retroalimentación no existe o no te pertenece."));
    }

    private Profesor profesorDe(String rutCliente) {
        Usuario usuario = chatService.buscarUsuarioActivo(rutCliente);
        Profesor profesor = profesorRepository.findByUsuarioRut(usuario.getRut())
                .orElseThrow(() -> new ChatException(HttpStatus.FORBIDDEN, "RETRO_SOLO_PROFESORES",
                        "Esta sección es solo para profesores de asignatura."));
        if (profesor.getAsignatura() == null) {
            throw new ChatException(HttpStatus.FORBIDDEN, "RETRO_SIN_ASIGNATURA", "No tienes una asignatura asignada.");
        }
        int semestre = AvanceAcademicoService.semestreNumerico(profesor.getAsignatura().getSemestre());
        if (semestre < 8 || semestre == Integer.MAX_VALUE) {
            throw new ChatException(HttpStatus.FORBIDDEN, "RETRO_SOLO_PRACTICA",
                    "La revisión de planificaciones es para profesores de 8.° y 9.° semestre.");
        }
        return profesor;
    }

    /** Solo retroalimentaciones enviadas y de la asignatura del profesor; las demás responden 404 sin revelar si existen. */
    private RetroalimentacionIA retroDelProfesor(Profesor profesor, Long idRetroalimentacion) {
        Long idAsignatura = profesor.getAsignatura().getIdAsignatura();
        return repository.findById(idRetroalimentacion)
                .filter(r -> r.getFechaEnvioProfesor() != null && r.getPlanificacion() != null
                        && r.getPlanificacion().getAsignatura() != null
                        && Objects.equals(r.getPlanificacion().getAsignatura().getIdAsignatura(), idAsignatura))
                .orElseThrow(() -> new ChatException(HttpStatus.NOT_FOUND, "RETRO_NO_ENCONTRADA",
                        "La retroalimentación no existe o no corresponde a tu asignatura."));
    }

    private RetroalimentacionIA retroDe(Planificacion planificacion) {
        return repository.findFirstByPlanificacionIdPlanificacionOrderByIdRetroalimentacionDesc(planificacion.getIdPlanificacion())
                .orElse(null);
    }

    private static Documento archivoPlanificacion(Planificacion planificacion) {
        return planificacion.getDocumentoPlanificacion() != null
                ? planificacion.getDocumentoPlanificacion().getArchivo(CATEGORIA_PLANIFICACION) : null;
    }

    private String nombreUsuario(String rut) {
        if (rut == null) return null;
        return usuarioRepository.findByRut(rut).map(u -> u.getNombre() + " " + u.getApellido()).orElse(rut);
    }

    private RetroDTO aDTO(RetroalimentacionIA r, Documento archivo) {
        return new RetroDTO(r.getIdRetroalimentacion(), r.getEstado().name(), r.getRevisionesIa(),
                RetroalimentacionIA.MAX_REVISIONES_IA, r.getCiclo(),
                r.getConversacion() != null ? r.getConversacion().getIdConversacion() : null,
                r.getNombreArchivoRevisado(), archivoCambiado(r, archivo), r.getComentarioProfesor(),
                nombreUsuario(r.getRutProfesorRevisor()), r.getFechaEnvioProfesor(), r.getFechaRespuestaProfesor(),
                r.getFechaActualizacion(), puedeRevisarIa(r, archivo), puedeEnviar(r, archivo), puedeReiniciar(r, archivo),
                observacionesDe(r));
    }

    private List<ObservacionDTO> observacionesDe(RetroalimentacionIA r) {
        if (r.getIdRetroalimentacion() == null) {
            return List.of();
        }
        return observacionRepository.findByRetroalimentacionIdRetroalimentacionOrderByFechaAscIdObservacionAsc(r.getIdRetroalimentacion())
                .stream()
                .map(o -> new ObservacionDTO(o.getIdObservacion(), o.getTipo().name(), o.getTexto(),
                        nombreUsuario(o.getRutProfesor()), o.getCiclo(), o.getFecha()))
                .toList();
    }

    /** Lo que revisa el profesor: los 5 archivos, la conversación del alumno con la IA y sus observaciones. */
    private RetroProfesorDetalleDTO detalle(RetroalimentacionIA retro) {
        List<MensajeChatDTO> conversacion = retro.getConversacion() == null ? List.of()
                : mensajeRepository.findByConversacionIdConversacionOrderByOrdenAsc(retro.getConversacion().getIdConversacion())
                        .stream()
                        .map(m -> new MensajeChatDTO(m.getRol().name(), m.getContenido(), m.getFecha()))
                        .toList();
        return new RetroProfesorDetalleDTO(aDTOProfesor(retro), retro.getUltimaRevisionIa(),
                planificacionService.archivosDe(retro.getPlanificacion()), conversacion, observacionesDe(retro),
                puedeObservar(retro));
    }

    private RetroProfesorDTO aDTOProfesor(RetroalimentacionIA r) {
        Planificacion p = r.getPlanificacion();
        Documento archivo = archivoPlanificacion(p);
        Usuario alumno = p.getEstudiante() != null ? p.getEstudiante().getUsuario() : null;
        return new RetroProfesorDTO(r.getIdRetroalimentacion(), r.getEstado().name(),
                alumno != null ? alumno.getRut() : null,
                alumno != null ? alumno.getNombre() + " " + alumno.getApellido() : null,
                p.getAsignatura() != null ? p.getAsignatura().getNombre() : null,
                r.getCiclo(), r.getRevisionesIa(),
                archivo != null ? archivo.getIdDocumento() : null,
                archivo != null ? archivo.getNombre() : r.getNombreArchivoRevisado(),
                archivoCambiado(r, archivo), r.getComentarioProfesor(),
                r.getFechaEnvioProfesor(), r.getFechaRespuestaProfesor());
    }
}
