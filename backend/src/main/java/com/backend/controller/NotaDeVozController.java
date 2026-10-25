package com.backend.controller;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.backend.dto.NotaDeVozDTO;
import com.backend.model.NotaDeVoz;
import com.backend.service.NotaDeVozService;

@RestController
@RequestMapping("/api/notas-de-voz")
@CrossOrigin(origins = "*")
public class NotaDeVozController {

    private final NotaDeVozService notaDeVozService;

    public NotaDeVozController(NotaDeVozService notaDeVozService) {
        this.notaDeVozService = notaDeVozService;
    }

    @GetMapping
    public ResponseEntity<List<NotaDeVoz>> obtenerTodos() {
        return ResponseEntity.ok(notaDeVozService.obtenerTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<NotaDeVoz> obtenerPorId(@PathVariable Long id) {
        NotaDeVoz notaDeVoz = notaDeVozService.obtenerPorId(id);
        if (notaDeVoz == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(notaDeVoz);
    }

    @GetMapping("/evaluacion/{idEvaluacion}")
    public ResponseEntity<List<NotaDeVozDTO>> obtenerPorEvaluacion(@PathVariable Long idEvaluacion) {
        return ResponseEntity.ok(notaDeVozService.obtenerPorEvaluacion(idEvaluacion));
    }

    @GetMapping("/estudiante/{idEstudiante}")
    public ResponseEntity<List<NotaDeVozDTO>> obtenerPorEstudiante(@PathVariable Long idEstudiante) {
        return ResponseEntity.ok(notaDeVozService.obtenerPorEstudiante(idEstudiante));
    }

    @PostMapping(value = "/subir", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<NotaDeVozDTO> subirNotaDeVoz(
            @RequestParam(value = "idEvaluacion", required = false) Long idEvaluacion,
            @RequestParam(value = "idEstudiante", required = false) Long idEstudiante,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "duracion", required = false) String duracion,
            @RequestParam(value = "transcripcion", required = false) String transcripcion,
            @RequestParam(value = "rutGrabador", required = false) String rutGrabador) {
        return ResponseEntity.ok(notaDeVozService.guardarNotaDeVoz(
                idEvaluacion, idEstudiante, file, duracion, transcripcion, rutGrabador
        ));
    }

    @GetMapping("/{id}/audio")
    public ResponseEntity<Resource> reproducirAudio(@PathVariable Long id) {
        try {
            NotaDeVoz nota = notaDeVozService.obtenerPorId(id);
            if (nota == null) {
                return ResponseEntity.notFound().build();
            }

            Resource recurso = notaDeVozService.obtenerRecursoAudio(id);

            // Determinar Content-Type según extensión
            String nombre = nota.getNombreArchivo() != null ? nota.getNombreArchivo() : "audio_" + id + ".webm";
            String extension = nombre.substring(nombre.lastIndexOf('.') + 1).toLowerCase();
            MediaType mediaType;
            switch (extension) {
                case "mp3":
                    mediaType = MediaType.parseMediaType("audio/mpeg");
                    break;
                case "wav":
                    mediaType = MediaType.parseMediaType("audio/wav");
                    break;
                case "ogg":
                    mediaType = MediaType.parseMediaType("audio/ogg");
                    break;
                case "m4a":
                case "mp4":
                case "aac":
                    mediaType = MediaType.parseMediaType("audio/mp4");
                    break;
                case "webm":
                case "weba":
                default:
                    mediaType = MediaType.parseMediaType("audio/webm");
                    break;
            }

            String encodedFilename = URLEncoder.encode(nombre, StandardCharsets.UTF_8).replace("+", "%20");
            return ResponseEntity.ok()
                    .contentType(mediaType)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + nombre + "\"; filename*=UTF-8''" + encodedFilename)
                    .body(recurso);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}/transcripcion")
    public ResponseEntity<NotaDeVozDTO> actualizarTranscripcion(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String transcripcion = body.get("transcripcion");
        return ResponseEntity.ok(notaDeVozService.actualizarTranscripcion(id, transcripcion));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        notaDeVozService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
