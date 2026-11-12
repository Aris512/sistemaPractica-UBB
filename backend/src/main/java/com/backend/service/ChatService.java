package com.backend.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import com.backend.dto.ChatDTOs.ConversacionDTO;
import com.backend.dto.ChatDTOs.IntercambioDTO;
import com.backend.dto.ChatDTOs.MensajeDTO;
import com.backend.model.ChatConversacion;
import com.backend.model.ChatMensaje;
import com.backend.model.ChatRolMensaje;
import com.backend.model.RetroalimentacionIA;
import com.backend.model.Usuario;
import com.backend.repository.ChatConversacionRepository;
import com.backend.repository.ChatMensajeRepository;
import com.backend.repository.UsuarioRepository;
import com.backend.util.RutUtils;

/**
 * Lógica del chatbot de IA: conversaciones por usuario, historial en MySQL y llamadas a la IA
 * (Groq, con Gemini como respaldo si Groq se satura; ver {@link ClienteIA}).
 *
 * Identificación del usuario: el proyecto no emite tokens ni sesiones en /api/**, por lo que el
 * usuario se identifica por el RUT que envía el frontend (cabecera X-Usuario-Rut). Se verifica que
 * el usuario exista, esté activo y tenga el permiso IA_ACCESO, y cada operación filtra por propietario,
 * pero el backend no puede comprobar que quien llama sea realmente ese usuario (limitación documentada).
 */
@Service
public class ChatService {

    public static final String TITULO_POR_DEFECTO = "Nueva conversación";
    public static final String PERMISO_IA = "IA_ACCESO";
    private static final int MAX_CARACTERES_TITULO = 100;
    private static final int LARGO_TITULO_AUTOMATICO = 60;

    private static final String PROMPT_SISTEMA = """
            Eres el asistente de IA de la plataforma de prácticas pedagógicas de la Universidad del Bío-Bío (Chile). \
            Apoyas a estudiantes de pedagogía en el diseño de actividades didácticas, planificaciones, instrumentos de \
            evaluación y la orientación en el aula de matemáticas. Responde siempre en español, de forma clara y ordenada. \
            No inventes información institucional (fechas, notas, normativas o datos de personas): si no la conoces, dilo \
            y sugiere consultarla con el coordinador o el profesor correspondiente. No solicites datos personales. \
            Si el estudiante comparte una planificación o una idea de clase con elementos poco claros o incompletos \
            (objetivo, habilidad, actividades, evaluación, recursos, tiempos o apoyos DUA), no los completes ni los supongas: \
            cita el elemento y formula preguntas de reflexión que lo ayuden a precisarlo por sí mismo. \
            Cada conversación admite pocas preguntas del estudiante, así que responde de forma completa y agrupa tus \
            preguntas en un solo mensaje.""";

    private final ChatConversacionRepository conversacionRepository;
    private final ChatMensajeRepository mensajeRepository;
    private final UsuarioRepository usuarioRepository;
    private final PermisoService permisoService;
    private final ClienteIA clienteIA;
    private final ChatUsoLimiter usoLimiter;
    private final RevisionIAPlanificacion revisionPlanificacion;
    private final TransactionTemplate transaccion;

    private final int maxCaracteresMensaje;
    private final int maxMensajesContexto;
    private final int maxCaracteresContexto;
    private final int maxMensajesPorConversacion;
    private final int maxConversaciones;
    private final int maxRespuestasPorDia;
    private final int maxPreguntas;

    public ChatService(ChatConversacionRepository conversacionRepository,
                       ChatMensajeRepository mensajeRepository,
                       UsuarioRepository usuarioRepository,
                       PermisoService permisoService,
                       ClienteIA clienteIA,
                       ChatUsoLimiter usoLimiter,
                       RevisionIAPlanificacion revisionPlanificacion,
                       PlatformTransactionManager transactionManager,
                       @Value("${chat.max-caracteres-mensaje:4000}") int maxCaracteresMensaje,
                       @Value("${chat.max-mensajes-contexto:20}") int maxMensajesContexto,
                       @Value("${chat.max-caracteres-contexto:24000}") int maxCaracteresContexto,
                       @Value("${chat.max-mensajes-por-conversacion:200}") int maxMensajesPorConversacion,
                       @Value("${chat.max-conversaciones:100}") int maxConversaciones,
                       @Value("${chat.limite-mensajes-por-dia:200}") int maxRespuestasPorDia,
                       @Value("${chat.max-preguntas-por-conversacion:5}") int maxPreguntas) {
        this.conversacionRepository = conversacionRepository;
        this.mensajeRepository = mensajeRepository;
        this.usuarioRepository = usuarioRepository;
        this.permisoService = permisoService;
        this.clienteIA = clienteIA;
        this.usoLimiter = usoLimiter;
        this.revisionPlanificacion = revisionPlanificacion;
        this.transaccion = new TransactionTemplate(transactionManager);
        this.maxCaracteresMensaje = maxCaracteresMensaje;
        this.maxMensajesContexto = maxMensajesContexto;
        this.maxCaracteresContexto = maxCaracteresContexto;
        this.maxMensajesPorConversacion = maxMensajesPorConversacion;
        this.maxConversaciones = maxConversaciones;
        this.maxRespuestasPorDia = maxRespuestasPorDia;
        this.maxPreguntas = Math.max(1, maxPreguntas);
    }

    // ---------------------------------------------------------------------------------------------
    // Identificación y permisos
    // ---------------------------------------------------------------------------------------------

    /** Resuelve el usuario a partir del RUT enviado por el cliente y verifica estado y permiso IA_ACCESO. */
    public String resolverUsuario(String rutCliente) {
        Usuario usuario = buscarUsuarioActivo(rutCliente);
        if (!permisoService.obtenerPermisosEfectivosUsuario(usuario.getRut()).contains(PERMISO_IA)) {
            throw new ChatException(HttpStatus.FORBIDDEN, "CHAT_SIN_PERMISO",
                    "No tienes acceso a los asistentes de IA.");
        }
        return usuario.getRut();
    }

    /** Usuario activo a partir del RUT enviado por el cliente (acepta con o sin puntos y guion). */
    public Usuario buscarUsuarioActivo(String rutCliente) {
        if (rutCliente == null || rutCliente.isBlank()) {
            throw new ChatException(HttpStatus.UNAUTHORIZED, "CHAT_SIN_USUARIO",
                    "Debes iniciar sesión para usar el asistente de IA.");
        }
        String rut = rutCliente.trim();
        Optional<Usuario> usuarioOpt = usuarioRepository.findByRut(RutUtils.formatStandard(rut));
        if (usuarioOpt.isEmpty()) usuarioOpt = usuarioRepository.findByRut(RutUtils.clean(rut));
        if (usuarioOpt.isEmpty()) usuarioOpt = usuarioRepository.findByRut(rut);

        Usuario usuario = usuarioOpt.orElseThrow(() -> new ChatException(HttpStatus.UNAUTHORIZED, "CHAT_SIN_USUARIO",
                "Tu sesión no es válida. Vuelve a iniciar sesión."));
        if (!usuario.isActivo()) {
            throw new ChatException(HttpStatus.FORBIDDEN, "CHAT_USUARIO_INACTIVO",
                    "Tu cuenta está inactiva. Contacta al administrador.");
        }
        return usuario;
    }

    // ---------------------------------------------------------------------------------------------
    // Conversaciones
    // ---------------------------------------------------------------------------------------------

    public List<ConversacionDTO> listarConversaciones(String rut) {
        return conversacionRepository.findByUsuarioRutOrderByFechaActualizacionDesc(rut).stream()
                .map(this::aDto)
                .toList();
    }

    public ConversacionDTO crearConversacion(String rut, String titulo) {
        return transaccion.execute(status -> {
            if (conversacionRepository.countByUsuarioRut(rut) >= maxConversaciones) {
                throw new ChatException(HttpStatus.CONFLICT, "CHAT_LIMITE_CONVERSACIONES",
                        "Alcanzaste el máximo de " + maxConversaciones + " conversaciones. Elimina alguna para crear otra.");
            }
            String tituloFinal = (titulo == null || titulo.isBlank()) ? TITULO_POR_DEFECTO : validarTitulo(titulo);
            Usuario usuario = usuarioRepository.getReferenceById(rut);
            return aDto(conversacionRepository.save(new ChatConversacion(usuario, tituloFinal)));
        });
    }

    public ConversacionDTO renombrarConversacion(String rut, Long idConversacion, String titulo) {
        String tituloFinal = validarTitulo(titulo);
        return transaccion.execute(status -> {
            ChatConversacion conversacion = obtenerPropia(rut, idConversacion);
            conversacion.setTitulo(tituloFinal);
            return aDto(conversacion);
        });
    }

    public void eliminarConversacion(String rut, Long idConversacion) {
        transaccion.executeWithoutResult(status -> {
            ChatConversacion conversacion = obtenerPropia(rut, idConversacion);
            revisionPlanificacion.eliminarDeConversacion(idConversacion);
            // Los mensajes se eliminan por la FK ON DELETE CASCADE de chat_mensaje
            conversacionRepository.delete(conversacion);
        });
    }

    public List<MensajeDTO> obtenerMensajes(String rut, Long idConversacion) {
        obtenerPropia(rut, idConversacion);
        return mensajeRepository.findByConversacionIdConversacionOrderByOrdenAsc(idConversacion).stream()
                .map(MensajeDTO::de)
                .toList();
    }

    // ---------------------------------------------------------------------------------------------
    // Mensajes
    // ---------------------------------------------------------------------------------------------

    /**
     * Envía un mensaje a la IA con el historial reciente y guarda la pregunta y la respuesta juntas.
     * La llamada a la IA se hace fuera de cualquier transacción; si falla, no se guarda nada y el
     * historial queda exactamente como estaba. Cada conversación admite como máximo
     * chat.max-preguntas-por-conversacion mensajes del alumno; después queda cerrada.
     */
    public IntercambioDTO enviarMensaje(String rut, Long idConversacion, String contenido) {
        return enviarMensaje(rut, idConversacion, contenido, false);
    }

    /**
     * Mensaje que la plataforma escribe en nombre del alumno (al abrir una revisión o subir una versión corregida):
     * no cuenta como pregunta ni se bloquea por el máximo, para que la IA siempre pueda revisar el archivo nuevo.
     */
    public IntercambioDTO enviarMensajeAutomatico(String rut, Long idConversacion, String contenido) {
        return enviarMensaje(rut, idConversacion, contenido, true);
    }

    private IntercambioDTO enviarMensaje(String rut, Long idConversacion, String contenido, boolean automatico) {
        String texto = contenido == null ? "" : contenido.strip();
        if (texto.isEmpty()) {
            throw new ChatException(HttpStatus.BAD_REQUEST, "CHAT_MENSAJE_VACIO", "El mensaje no puede estar vacío.");
        }
        if (texto.length() > maxCaracteresMensaje) {
            throw new ChatException(HttpStatus.BAD_REQUEST, "CHAT_MENSAJE_LARGO",
                    "El mensaje supera el máximo de " + maxCaracteresMensaje + " caracteres.");
        }

        obtenerPropia(rut, idConversacion);
        List<ChatMensaje> historial = mensajeRepository.findByConversacionIdConversacionOrderByOrdenAsc(idConversacion);
        if (historial.size() + 2 > maxMensajesPorConversacion) {
            throw new ChatException(HttpStatus.CONFLICT, "CHAT_CONVERSACION_LLENA",
                    "Esta conversación alcanzó el máximo de mensajes. Inicia una nueva conversación.");
        }
        int preguntasUsadas = preguntasUsadas(idConversacion);
        if (!automatico) {
            validarQuedanPreguntas(idConversacion, preguntasUsadas);
        }
        long respuestasHoy = mensajeRepository.countByConversacionUsuarioRutAndRolAndFechaAfter(
                rut, ChatRolMensaje.ASSISTANT, LocalDate.now().atStartOfDay());
        if (respuestasHoy >= maxRespuestasPorDia) {
            throw new ChatException(HttpStatus.TOO_MANY_REQUESTS, "CHAT_LIMITE_DIARIO",
                    "Alcanzaste el límite diario de " + maxRespuestasPorDia + " mensajes. Vuelve a intentarlo mañana.");
        }

        // Las conversaciones de revisión de planificación usan el prompt RetroPlani, el archivo vigente junto al
        // mensaje y un historial más corto, para no pasar del límite de tokens por minuto de Groq
        List<MensajeIA> contexto;
        Optional<RetroalimentacionIA> revision = revisionPlanificacion.deConversacion(idConversacion);
        if (revision.isPresent()) {
            RetroalimentacionIA retro = revision.get();
            revisionPlanificacion.validarPuedeConversar(retro);
            String conArchivo = revisionPlanificacion.conArchivoAdjunto(retro, texto);
            // El archivo no descuenta del presupuesto del historial: ya tiene su propio máximo de caracteres
            int presupuesto = revisionPlanificacion.maxCaracteresHistorial() + conArchivo.length() - texto.length();
            contexto = construirContexto(revisionPlanificacion.promptSistema() + avisoPreguntas(preguntasUsadas, automatico),
                    presupuesto, revisionPlanificacion.historialVigente(retro, historial), conArchivo);
        } else {
            contexto = construirContexto(PROMPT_SISTEMA + avisoPreguntas(preguntasUsadas, automatico),
                    maxCaracteresContexto, historial, texto);
        }

        // Groq responde; si se satura, ClienteIA repite la misma solicitud (mismas reglas) con Gemini
        ClienteIA.Respuesta generada;
        usoLimiter.adquirir(rut);
        try {
            generada = clienteIA.completar(contexto);
        } finally {
            usoLimiter.liberar(rut);
        }

        return transaccion.execute(status -> {
            ChatConversacion conversacion = conversacionRepository.findByIdConversacionAndUsuarioRut(idConversacion, rut)
                    .orElseThrow(() -> new ChatException(HttpStatus.NOT_FOUND, "CHAT_CONVERSACION_NO_ENCONTRADA",
                            "La conversación fue eliminada mientras se generaba la respuesta."));
            // Otro envío pudo completar el máximo mientras se generaba esta respuesta
            if (!automatico) {
                validarQuedanPreguntas(idConversacion, preguntasUsadas(idConversacion));
            }
            int orden = mensajeRepository.findMaxOrden(idConversacion);
            LocalDateTime ahora = LocalDateTime.now();

            ChatMensaje mensajeUsuario = mensajeRepository.save(
                    new ChatMensaje(conversacion, ChatRolMensaje.USER, texto, orden + 1, ahora, automatico));
            ChatMensaje asistente = new ChatMensaje(conversacion, ChatRolMensaje.ASSISTANT, generada.texto(), orden + 2,
                    LocalDateTime.now());
            asistente.setProveedor(generada.proveedor());
            ChatMensaje mensajeAsistente = mensajeRepository.save(asistente);

            if (orden == 0 && TITULO_POR_DEFECTO.equals(conversacion.getTitulo())) {
                conversacion.setTitulo(tituloDesdeMensaje(texto));
            }
            conversacion.setFechaActualizacion(mensajeAsistente.getFecha());
            revisionPlanificacion.deConversacion(idConversacion)
                    .ifPresent(retro -> revisionPlanificacion.registrarRespuesta(retro, generada.texto()));

            return new IntercambioDTO(aDto(conversacion),
                    MensajeDTO.de(mensajeUsuario), MensajeDTO.de(mensajeAsistente));
        });
    }

    // ---------------------------------------------------------------------------------------------
    // Máximo de preguntas por conversación
    // ---------------------------------------------------------------------------------------------

    /** Preguntas que el alumno ya hizo; en las conversaciones de revisión, solo las del archivo vigente. */
    private int preguntasUsadas(Long idConversacion) {
        int desde = revisionPlanificacion.ordenInicioPreguntas(idConversacion);
        return (int) mensajeRepository.contarPreguntas(idConversacion, desde);
    }

    private void validarQuedanPreguntas(Long idConversacion, int preguntasUsadas) {
        if (preguntasUsadas < maxPreguntas) return;
        boolean esRevision = revisionPlanificacion.deConversacion(idConversacion).isPresent();
        throw new ChatException(HttpStatus.CONFLICT, "CHAT_LIMITE_PREGUNTAS", esRevision
                ? "Ya hiciste las " + maxPreguntas + " preguntas de esta revisión y el chat quedó cerrado. "
                        + "Corrige tu planificación y súbela con el botón + para seguir conversando."
                : "Ya hiciste las " + maxPreguntas + " preguntas de esta conversación y el chat quedó cerrado. "
                        + "Inicia una conversación nueva para seguir.");
    }

    /** Le dice a la IA cuántas preguntas le quedan al alumno, para que en la última entregue una respuesta de cierre. */
    private String avisoPreguntas(int preguntasUsadas, boolean automatico) {
        int restantes = automatico ? maxPreguntas - preguntasUsadas : maxPreguntas - preguntasUsadas - 1;
        if (restantes > 0) {
            return "\n\n[Plataforma] Después de este mensaje, el estudiante puede escribir " + restantes + " mensaje"
                    + (restantes == 1 ? "" : "s") + " más en esta conversación (máximo " + maxPreguntas + ").";
        }
        return "\n\n[Plataforma] Este es el último mensaje que el estudiante puede escribir en esta conversación: "
                + "no podrá responderte. Entrega una respuesta completa y de cierre, sin dejar preguntas pendientes "
                + "que necesiten su respuesta; si corresponde, termina con preguntas de reflexión para que las piense "
                + "por su cuenta al corregir.";
    }

    private ConversacionDTO aDto(ChatConversacion conversacion) {
        return ConversacionDTO.de(conversacion, preguntasUsadas(conversacion.getIdConversacion()), maxPreguntas);
    }

    /** Prompt de sistema + los mensajes más recientes que quepan en el presupuesto de caracteres + el nuevo mensaje. */
    private List<MensajeIA> construirContexto(String promptSistema, int maxCaracteres,
                                                       List<ChatMensaje> historial, String nuevoMensaje) {
        List<MensajeIA> recientes = new ArrayList<>();
        int caracteres = nuevoMensaje.length();
        for (int i = historial.size() - 1; i >= 0 && recientes.size() < maxMensajesContexto; i--) {
            ChatMensaje m = historial.get(i);
            caracteres += m.getContenido().length();
            if (caracteres > maxCaracteres) break;
            recientes.add(new MensajeIA(m.getRol() == ChatRolMensaje.USER ? "user" : "assistant", m.getContenido()));
        }
        Collections.reverse(recientes);

        List<MensajeIA> mensajes = new ArrayList<>();
        mensajes.add(new MensajeIA("system", promptSistema));
        mensajes.addAll(recientes);
        mensajes.add(new MensajeIA("user", nuevoMensaje));
        return mensajes;
    }

    // ---------------------------------------------------------------------------------------------
    // Utilidades
    // ---------------------------------------------------------------------------------------------

    /** Devuelve la conversación solo si pertenece al usuario; si no, responde 404 sin revelar si existe. */
    private ChatConversacion obtenerPropia(String rut, Long idConversacion) {
        if (idConversacion == null) {
            throw new ChatException(HttpStatus.BAD_REQUEST, "CHAT_ID_INVALIDO", "Conversación no válida.");
        }
        return conversacionRepository.findByIdConversacionAndUsuarioRut(idConversacion, rut)
                .orElseThrow(() -> new ChatException(HttpStatus.NOT_FOUND, "CHAT_CONVERSACION_NO_ENCONTRADA",
                        "La conversación no existe o no te pertenece."));
    }

    private String validarTitulo(String titulo) {
        String limpio = titulo == null ? "" : titulo.strip().replaceAll("\\s+", " ");
        if (limpio.isEmpty()) {
            throw new ChatException(HttpStatus.BAD_REQUEST, "CHAT_TITULO_VACIO", "El título no puede estar vacío.");
        }
        if (limpio.length() > MAX_CARACTERES_TITULO) {
            throw new ChatException(HttpStatus.BAD_REQUEST, "CHAT_TITULO_LARGO",
                    "El título no puede superar los " + MAX_CARACTERES_TITULO + " caracteres.");
        }
        return limpio;
    }

    private String tituloDesdeMensaje(String texto) {
        String linea = texto.strip().replaceAll("\\s+", " ");
        if (linea.length() <= LARGO_TITULO_AUTOMATICO) return linea;
        return linea.substring(0, LARGO_TITULO_AUTOMATICO - 1).strip() + "…";
    }
}
