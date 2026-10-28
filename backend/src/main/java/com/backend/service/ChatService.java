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
 * Lógica del chatbot de IA: conversaciones por usuario, historial en MySQL y llamadas a Groq.
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
            y sugiere consultarla con el coordinador o el profesor correspondiente. No solicites datos personales.""";

    private final ChatConversacionRepository conversacionRepository;
    private final ChatMensajeRepository mensajeRepository;
    private final UsuarioRepository usuarioRepository;
    private final PermisoService permisoService;
    private final GroqClient groqClient;
    private final ChatUsoLimiter usoLimiter;
    private final RevisionIAPlanificacion revisionPlanificacion;
    private final TransactionTemplate transaccion;

    private final int maxCaracteresMensaje;
    private final int maxMensajesContexto;
    private final int maxCaracteresContexto;
    private final int maxMensajesPorConversacion;
    private final int maxConversaciones;
    private final int maxRespuestasPorDia;

    public ChatService(ChatConversacionRepository conversacionRepository,
                       ChatMensajeRepository mensajeRepository,
                       UsuarioRepository usuarioRepository,
                       PermisoService permisoService,
                       GroqClient groqClient,
                       ChatUsoLimiter usoLimiter,
                       RevisionIAPlanificacion revisionPlanificacion,
                       PlatformTransactionManager transactionManager,
                       @Value("${chat.max-caracteres-mensaje:4000}") int maxCaracteresMensaje,
                       @Value("${chat.max-mensajes-contexto:20}") int maxMensajesContexto,
                       @Value("${chat.max-caracteres-contexto:24000}") int maxCaracteresContexto,
                       @Value("${chat.max-mensajes-por-conversacion:200}") int maxMensajesPorConversacion,
                       @Value("${chat.max-conversaciones:100}") int maxConversaciones,
                       @Value("${chat.limite-mensajes-por-dia:200}") int maxRespuestasPorDia) {
        this.conversacionRepository = conversacionRepository;
        this.mensajeRepository = mensajeRepository;
        this.usuarioRepository = usuarioRepository;
        this.permisoService = permisoService;
        this.groqClient = groqClient;
        this.usoLimiter = usoLimiter;
        this.revisionPlanificacion = revisionPlanificacion;
        this.transaccion = new TransactionTemplate(transactionManager);
        this.maxCaracteresMensaje = maxCaracteresMensaje;
        this.maxMensajesContexto = maxMensajesContexto;
        this.maxCaracteresContexto = maxCaracteresContexto;
        this.maxMensajesPorConversacion = maxMensajesPorConversacion;
        this.maxConversaciones = maxConversaciones;
        this.maxRespuestasPorDia = maxRespuestasPorDia;
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
                .map(ConversacionDTO::de)
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
            return ConversacionDTO.de(conversacionRepository.save(new ChatConversacion(usuario, tituloFinal)));
        });
    }

    public ConversacionDTO renombrarConversacion(String rut, Long idConversacion, String titulo) {
        String tituloFinal = validarTitulo(titulo);
        return transaccion.execute(status -> {
            ChatConversacion conversacion = obtenerPropia(rut, idConversacion);
            conversacion.setTitulo(tituloFinal);
            return ConversacionDTO.de(conversacion);
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
     * Envía un mensaje a Groq con el historial reciente y guarda la pregunta y la respuesta juntas.
     * La llamada a Groq se hace fuera de cualquier transacción; si falla, no se guarda nada y el
     * historial queda exactamente como estaba.
     */
    public IntercambioDTO enviarMensaje(String rut, Long idConversacion, String contenido) {
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
        long respuestasHoy = mensajeRepository.countByConversacionUsuarioRutAndRolAndFechaAfter(
                rut, ChatRolMensaje.ASSISTANT, LocalDate.now().atStartOfDay());
        if (respuestasHoy >= maxRespuestasPorDia) {
            throw new ChatException(HttpStatus.TOO_MANY_REQUESTS, "CHAT_LIMITE_DIARIO",
                    "Alcanzaste el límite diario de " + maxRespuestasPorDia + " mensajes. Vuelve a intentarlo mañana.");
        }

        // Las conversaciones de revisión de planificación usan el prompt RetroPlani, el archivo vigente junto al
        // mensaje y un historial más corto, para no pasar del límite de tokens por minuto de Groq
        List<GroqClient.Mensaje> contexto;
        Optional<RetroalimentacionIA> revision = revisionPlanificacion.deConversacion(idConversacion);
        if (revision.isPresent()) {
            RetroalimentacionIA retro = revision.get();
            revisionPlanificacion.validarPuedeConversar(retro);
            String conArchivo = revisionPlanificacion.conArchivoAdjunto(retro, texto);
            // El archivo no descuenta del presupuesto del historial: ya tiene su propio máximo de caracteres
            int presupuesto = revisionPlanificacion.maxCaracteresHistorial() + conArchivo.length() - texto.length();
            contexto = construirContexto(revisionPlanificacion.promptSistema(), presupuesto,
                    revisionPlanificacion.historialVigente(retro, historial), conArchivo);
        } else {
            contexto = construirContexto(PROMPT_SISTEMA, maxCaracteresContexto, historial, texto);
        }

        String respuesta;
        usoLimiter.adquirir(rut);
        try {
            respuesta = groqClient.completar(contexto);
        } finally {
            usoLimiter.liberar(rut);
        }

        return transaccion.execute(status -> {
            ChatConversacion conversacion = conversacionRepository.findByIdConversacionAndUsuarioRut(idConversacion, rut)
                    .orElseThrow(() -> new ChatException(HttpStatus.NOT_FOUND, "CHAT_CONVERSACION_NO_ENCONTRADA",
                            "La conversación fue eliminada mientras se generaba la respuesta."));
            int orden = mensajeRepository.findMaxOrden(idConversacion);
            LocalDateTime ahora = LocalDateTime.now();

            ChatMensaje mensajeUsuario = mensajeRepository.save(
                    new ChatMensaje(conversacion, ChatRolMensaje.USER, texto, orden + 1, ahora));
            ChatMensaje mensajeAsistente = mensajeRepository.save(
                    new ChatMensaje(conversacion, ChatRolMensaje.ASSISTANT, respuesta, orden + 2, LocalDateTime.now()));

            if (orden == 0 && TITULO_POR_DEFECTO.equals(conversacion.getTitulo())) {
                conversacion.setTitulo(tituloDesdeMensaje(texto));
            }
            conversacion.setFechaActualizacion(mensajeAsistente.getFecha());
            revisionPlanificacion.deConversacion(idConversacion)
                    .ifPresent(retro -> revisionPlanificacion.registrarRespuesta(retro, respuesta));

            return new IntercambioDTO(ConversacionDTO.de(conversacion),
                    MensajeDTO.de(mensajeUsuario), MensajeDTO.de(mensajeAsistente));
        });
    }

    /** Prompt de sistema + los mensajes más recientes que quepan en el presupuesto de caracteres + el nuevo mensaje. */
    private List<GroqClient.Mensaje> construirContexto(String promptSistema, int maxCaracteres,
                                                       List<ChatMensaje> historial, String nuevoMensaje) {
        List<GroqClient.Mensaje> recientes = new ArrayList<>();
        int caracteres = nuevoMensaje.length();
        for (int i = historial.size() - 1; i >= 0 && recientes.size() < maxMensajesContexto; i--) {
            ChatMensaje m = historial.get(i);
            caracteres += m.getContenido().length();
            if (caracteres > maxCaracteres) break;
            recientes.add(new GroqClient.Mensaje(m.getRol() == ChatRolMensaje.USER ? "user" : "assistant", m.getContenido()));
        }
        Collections.reverse(recientes);

        List<GroqClient.Mensaje> mensajes = new ArrayList<>();
        mensajes.add(new GroqClient.Mensaje("system", promptSistema));
        mensajes.addAll(recientes);
        mensajes.add(new GroqClient.Mensaje("user", nuevoMensaje));
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
