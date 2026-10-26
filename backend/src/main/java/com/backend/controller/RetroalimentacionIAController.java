package com.backend.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.backend.dto.RetroalimentacionDTOs.InicioRevisionDTO;
import com.backend.dto.RetroalimentacionDTOs.PlanificacionRetroDTO;
import com.backend.dto.RetroalimentacionDTOs.RespuestaProfesorRequest;
import com.backend.dto.RetroalimentacionDTOs.RetroDTO;
import com.backend.dto.RetroalimentacionDTOs.RetroProfesorDTO;
import com.backend.dto.RetroalimentacionDTOs.RetroProfesorDetalleDTO;
import com.backend.service.RetroalimentacionIAService;

/**
 * Retroalimentación de planificaciones: el alumno en práctica la revisa con la IA y la envía a su
 * profesor de asignatura, que la aprueba o la rechaza. El usuario se identifica con la cabecera
 * X-Usuario-Rut, igual que el chat; los errores salen como { error, codigo } (ChatExceptionHandler).
 */
@RestController
@RequestMapping("/api/retroalimentaciones-ia")
public class RetroalimentacionIAController {

    private final RetroalimentacionIAService service;

    public RetroalimentacionIAController(RetroalimentacionIAService service) {
        this.service = service;
    }

    @GetMapping("/estudiante")
    public List<PlanificacionRetroDTO> listarEstudiante(
            @RequestHeader(value = ChatController.CABECERA_USUARIO, required = false) String rut) {
        return service.listarDelEstudiante(rut);
    }

    @PostMapping("/planificacion/{idPlanificacion}/revision-ia")
    public InicioRevisionDTO iniciarRevisionIa(
            @RequestHeader(value = ChatController.CABECERA_USUARIO, required = false) String rut,
            @PathVariable Long idPlanificacion) {
        return service.iniciarRevisionIa(rut, idPlanificacion);
    }

    @PostMapping("/{id}/enviar")
    public RetroDTO enviar(@RequestHeader(value = ChatController.CABECERA_USUARIO, required = false) String rut,
                           @PathVariable Long id) {
        return service.enviarAlProfesor(rut, id);
    }

    @PostMapping("/{id}/reiniciar")
    public RetroDTO reiniciar(@RequestHeader(value = ChatController.CABECERA_USUARIO, required = false) String rut,
                              @PathVariable Long id) {
        return service.reiniciar(rut, id);
    }

    @GetMapping("/profesor")
    public List<RetroProfesorDTO> listarProfesor(
            @RequestHeader(value = ChatController.CABECERA_USUARIO, required = false) String rut) {
        return service.listarDelProfesor(rut);
    }

    @GetMapping("/profesor/{id}")
    public RetroProfesorDetalleDTO detalleProfesor(
            @RequestHeader(value = ChatController.CABECERA_USUARIO, required = false) String rut,
            @PathVariable Long id) {
        return service.detalleProfesor(rut, id);
    }

    @PostMapping("/profesor/{id}/responder")
    public RetroProfesorDTO responder(@RequestHeader(value = ChatController.CABECERA_USUARIO, required = false) String rut,
                                      @PathVariable Long id, @RequestBody RespuestaProfesorRequest request) {
        return service.responder(rut, id, request.aprobado(), request.comentario());
    }
}
