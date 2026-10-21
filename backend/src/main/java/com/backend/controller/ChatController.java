package com.backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.backend.dto.ChatDTOs.ConversacionDTO;
import com.backend.dto.ChatDTOs.IntercambioDTO;
import com.backend.dto.ChatDTOs.MensajeDTO;
import com.backend.dto.ChatDTOs.MensajeRequest;
import com.backend.dto.ChatDTOs.TituloRequest;
import com.backend.service.ChatService;

/**
 * API del chatbot de IA. El usuario se identifica con la cabecera X-Usuario-Rut (RUT de la sesión
 * del frontend), igual que el resto de /api/**; ver la limitación documentada en ChatService.
 */
@RestController
@RequestMapping("/api/chat/conversaciones")
public class ChatController {

    public static final String CABECERA_USUARIO = "X-Usuario-Rut";

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @GetMapping
    public List<ConversacionDTO> listar(@RequestHeader(value = CABECERA_USUARIO, required = false) String rut) {
        return chatService.listarConversaciones(chatService.resolverUsuario(rut));
    }

    @PostMapping
    public ResponseEntity<ConversacionDTO> crear(@RequestHeader(value = CABECERA_USUARIO, required = false) String rut,
                                                 @RequestBody(required = false) TituloRequest request) {
        String usuario = chatService.resolverUsuario(rut);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(chatService.crearConversacion(usuario, request != null ? request.titulo() : null));
    }

    @PatchMapping("/{id}")
    public ConversacionDTO renombrar(@RequestHeader(value = CABECERA_USUARIO, required = false) String rut,
                                     @PathVariable Long id,
                                     @RequestBody(required = false) TituloRequest request) {
        String usuario = chatService.resolverUsuario(rut);
        return chatService.renombrarConversacion(usuario, id, request != null ? request.titulo() : null);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@RequestHeader(value = CABECERA_USUARIO, required = false) String rut,
                                         @PathVariable Long id) {
        chatService.eliminarConversacion(chatService.resolverUsuario(rut), id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/mensajes")
    public List<MensajeDTO> mensajes(@RequestHeader(value = CABECERA_USUARIO, required = false) String rut,
                                     @PathVariable Long id) {
        return chatService.obtenerMensajes(chatService.resolverUsuario(rut), id);
    }

    @PostMapping("/{id}/mensajes")
    public IntercambioDTO enviar(@RequestHeader(value = CABECERA_USUARIO, required = false) String rut,
                                 @PathVariable Long id,
                                 @RequestBody(required = false) MensajeRequest request) {
        String usuario = chatService.resolverUsuario(rut);
        return chatService.enviarMensaje(usuario, id, request != null ? request.contenido() : null);
    }
}
