package com.backend.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.backend.dto.PortafolioItemDTO;
import com.backend.model.Documento;
import com.backend.model.Estudiante;
import com.backend.model.Usuario;
import com.backend.repository.DocumentoRepository;
import com.backend.repository.EstudianteRepository;
import com.backend.repository.UsuarioRepository;
import com.backend.util.RutUtils;

@Service
public class PortafolioService {

    private static final Logger logger = LoggerFactory.getLogger(PortafolioService.class);

    private final DocumentoRepository documentoRepository;
    private final UsuarioRepository usuarioRepository;
    private final EstudianteRepository estudianteRepository;
    private final FileStorageService fileStorageService;

    public PortafolioService(DocumentoRepository documentoRepository,
                             UsuarioRepository usuarioRepository,
                             EstudianteRepository estudianteRepository,
                             FileStorageService fileStorageService) {
        this.documentoRepository = documentoRepository;
        this.usuarioRepository = usuarioRepository;
        this.estudianteRepository = estudianteRepository;
        this.fileStorageService = fileStorageService;
    }

    /**
     * Obtiene todos los documentos del portafolio asociados a un estudiante.
     */
    @Transactional(readOnly = true)
    public List<PortafolioItemDTO> obtenerDocumentosPorEstudiante(String rutEstudianteRaw) {
        Usuario usuarioEstudiante = buscarUsuarioPorRut(rutEstudianteRaw);
        String rutExacto = usuarioEstudiante != null ? usuarioEstudiante.getRut() : rutEstudianteRaw;
        String rutLimpio = RutUtils.clean(rutEstudianteRaw);

        List<Documento> docs = documentoRepository.findPortafolioByRut(rutExacto, rutLimpio);
        return docs.stream()
            .map(d -> toDTO(d, rutExacto))
            .collect(Collectors.toList());
    }

    /**
     * Sube un documento al portafolio de un estudiante.
     */
    @Transactional
    public PortafolioItemDTO subirDocumentoPortafolio(
            MultipartFile file,
            String rutEstudianteRaw,
            String tipo,
            String rutUsuarioSubioRaw,
            String descripcion) {

        Usuario usuarioEstudiante = buscarUsuarioPorRut(rutEstudianteRaw);
        if (usuarioEstudiante == null) {
            throw new IllegalArgumentException("No se encontró usuario con RUT: " + rutEstudianteRaw);
        }

        Usuario usuarioSubio = (rutUsuarioSubioRaw != null && !rutUsuarioSubioRaw.isBlank())
            ? buscarUsuarioPorRut(rutUsuarioSubioRaw)
            : usuarioEstudiante;
        if (usuarioSubio == null) {
            usuarioSubio = usuarioEstudiante;
        }

        List<String> extensionesPermitidas = List.of(
            ".pdf", ".docx", ".doc", ".pptx", ".ppt", ".xlsx", ".xls", ".zip", ".rar", ".png", ".jpg", ".jpeg"
        );

        FileStorageService.StoredFileResult stored = fileStorageService.storeFile(
            file,
            "portafolios",
            extensionesPermitidas
        );

        String tipoFinal = (tipo != null && !tipo.isBlank())
            ? (tipo.toUpperCase().startsWith("PORTAFOLIO") ? tipo.toUpperCase().trim() : "PORTAFOLIO_" + tipo.toUpperCase().trim())
            : "PORTAFOLIO_EVIDENCIA";

        Documento doc = new Documento(
            stored.originalFilename(),
            tipoFinal,
            stored.relativePath(),
            usuarioSubio
        );
        // Se asegura utilizar la clave primaria exacta registrada en la tabla usuario
        doc.setRutEstudiante(usuarioEstudiante.getRut());
        doc.setTamanioBytes(stored.sizeBytes());
        doc.setFechaCarga(LocalDateTime.now());

        Documento guardado = documentoRepository.save(doc);
        logger.info("Documento de portafolio guardado con éxito: ID {}, archivo {}", guardado.getIdDocumento(), guardado.getNombre());

        return toDTO(guardado, usuarioEstudiante.getRut());
    }

    private Usuario buscarUsuarioPorRut(String rutRaw) {
        if (rutRaw == null || rutRaw.isBlank()) {
            return null;
        }
        String trim = rutRaw.trim();
        java.util.Optional<Usuario> directo = usuarioRepository.findByRut(trim);
        if (directo.isPresent()) {
            return directo.get();
        }

        String limpio = RutUtils.clean(trim);
        return usuarioRepository.findAll().stream()
            .filter(u -> RutUtils.clean(u.getRut()).equalsIgnoreCase(limpio))
            .findFirst()
            .orElse(null);
    }

    /**
     * Elimina físicamente un archivo y su registro en la BD.
     */
    @Transactional
    public void eliminarDocumento(Long idDocumento) {
        Documento doc = documentoRepository.findById(idDocumento)
            .orElseThrow(() -> new IllegalArgumentException("Documento no encontrado con ID: " + idDocumento));

        fileStorageService.deleteFile(doc.getUbicacion());
        documentoRepository.delete(doc);
        logger.info("Documento de portafolio eliminado con éxito: ID {}", idDocumento);
    }

    /**
     * Carga el archivo físico como recurso descargable.
     */
    public Resource obtenerRecursoArchivo(Long idDocumento) {
        Documento doc = documentoRepository.findById(idDocumento)
            .orElseThrow(() -> new IllegalArgumentException("Documento no encontrado con ID: " + idDocumento));

        return fileStorageService.loadFileAsResource(doc.getUbicacion());
    }

    public Documento obtenerDocumentoPorId(Long idDocumento) {
        return documentoRepository.findById(idDocumento).orElse(null);
    }

    /**
     * Lista estudiantes que tienen portafolios para supervisión de profesores o coordinador.
     */
    @Transactional(readOnly = true)
    public List<java.util.Map<String, Object>> obtenerEstudiantesConPortafolio() {
        List<Estudiante> estudiantes = estudianteRepository.findAll();
        List<java.util.Map<String, Object>> resultado = new ArrayList<>();

        for (Estudiante est : estudiantes) {
            Usuario u = est.getUsuario();
            if (u == null) continue;

            String rutExacto = u.getRut();
            String rutLimpio = RutUtils.clean(rutExacto);
            List<Documento> docs = documentoRepository.findPortafolioByRut(rutExacto, rutLimpio);

            java.util.Map<String, Object> map = new java.util.HashMap<>();
            map.put("rut", u.getRut());
            map.put("nombre", (u.getNombre() != null ? u.getNombre() : "") + " " + (u.getApellido() != null ? u.getApellido() : ""));
            map.put("correo", u.getCorreo());
            map.put("carrera", est.getAsignatura() != null ? est.getAsignatura().getNombre() : "Pedagogía");
            map.put("totalArchivos", docs.size());
            map.put("ultimaActualizacion", docs.isEmpty() ? null : docs.get(0).getFechaCarga());
            resultado.add(map);
        }

        return resultado;
    }

    private PortafolioItemDTO toDTO(Documento doc, String rutEstudianteFallback) {
        String subidoPorNombre = "Desconocido";
        String subidoPorRut = "";
        if (doc.getUsuario() != null) {
            subidoPorRut = doc.getUsuario().getRut();
            subidoPorNombre = ((doc.getUsuario().getNombre() != null ? doc.getUsuario().getNombre() : "") + " " +
                               (doc.getUsuario().getApellido() != null ? doc.getUsuario().getApellido() : "")).trim();
        }

        String rutEst = doc.getRutEstudiante() != null && !doc.getRutEstudiante().isBlank()
            ? doc.getRutEstudiante()
            : (doc.getUsuario() != null ? doc.getUsuario().getRut() : rutEstudianteFallback);

        return new PortafolioItemDTO(
            doc.getIdDocumento(),
            doc.getNombre(),
            doc.getTipo(),
            doc.getUbicacion(),
            doc.getFechaCarga(),
            formatSize(doc.getTamanioBytes()),
            doc.getTamanioBytes(),
            rutEst,
            subidoPorRut,
            subidoPorNombre,
            "/api/portafolio/archivos/" + doc.getIdDocumento() + "/descargar"
        );
    }

    private String formatSize(Long bytes) {
        if (bytes == null || bytes <= 0) return "—";
        if (bytes < 1024) return bytes + " B";
        int exp = (int) (Math.log(bytes) / Math.log(1024));
        char pre = "KMGTPE".charAt(exp - 1);
        return String.format("%.1f %cB", bytes / Math.pow(1024, exp), pre);
    }
}
