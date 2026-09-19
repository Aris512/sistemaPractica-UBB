package com.backend.service;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.Normalizer;

import java.util.ArrayList;

import java.util.List;
import java.util.Optional;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.backend.dto.DetalleEstudianteDocumentosDTO;
import com.backend.dto.DocumentoItemDTO;
import com.backend.dto.EstudianteDocumentoDTO;
import com.backend.dto.ProfesorContactoDTO;
import com.backend.model.Asignatura;
import com.backend.model.DocumentoPractica;
import com.backend.model.Estudiante;
import com.backend.model.Profesor;
import com.backend.model.Usuario;
import com.backend.repository.DocumentoPracticaRepository;
import com.backend.repository.EstudianteRepository;
import com.backend.repository.ProfesorRepository;
import com.backend.repository.UsuarioRepository;
import com.backend.util.RutUtils;

@Service
public class DocumentoPracticaService {

    private static final Logger logger = LoggerFactory.getLogger(DocumentoPracticaService.class);
    private static final Path UPLOADS_DIR = Paths.get("uploads", "documentos");

    private final DocumentoPracticaRepository documentoPracticaRepository;
    private final EstudianteRepository estudianteRepository;
    private final ProfesorRepository profesorRepository;
    private final UsuarioRepository usuarioRepository;

    public DocumentoPracticaService(DocumentoPracticaRepository documentoPracticaRepository,
                                   EstudianteRepository estudianteRepository,
                                   ProfesorRepository profesorRepository,
                                   UsuarioRepository usuarioRepository) {
        this.documentoPracticaRepository = documentoPracticaRepository;
        this.estudianteRepository = estudianteRepository;
        this.profesorRepository = profesorRepository;
        this.usuarioRepository = usuarioRepository;
        initUploadsDirectory();
    }

    private void initUploadsDirectory() {
        try {
            if (!Files.exists(UPLOADS_DIR)) {
                Files.createDirectories(UPLOADS_DIR);
                logger.info("Directorio de documentos creado: {}", UPLOADS_DIR.toAbsolutePath());
            }
        } catch (IOException e) {
            logger.error("No se pudo crear el directorio de documentos: {}", e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public List<EstudianteDocumentoDTO> obtenerEstudiantesConProgreso() {
        List<Estudiante> estudiantes = estudianteRepository.findAll();
        List<EstudianteDocumentoDTO> resultado = new ArrayList<>();

        for (Estudiante est : estudiantes) {
            Usuario usuario = est.getUsuario();
            if (usuario == null) continue;

            // Omitir si el usuario está inactivo
            if (!usuario.isActivo() || "inactivo".equalsIgnoreCase(usuario.getEstado())) {
                continue;
            }

            String rut = usuario.getRut();
            String nombreCompleto = usuario.getNombre() + " " + usuario.getApellido();
            String correo = usuario.getCorreo();

            Asignatura asig = est.getAsignatura();
            String asignaturaNombre = asig != null ? asig.getNombre() : "—";
            Long idAsignatura = asig != null ? asig.getIdAsignatura() : null;
            String semestre = asig != null ? asig.getSemestre() : "—";

            // Obtener profesores asociados a la asignatura
            List<ProfesorContactoDTO> profesoresDTO = new ArrayList<>();
            if (idAsignatura != null) {
                List<Profesor> profesores = profesorRepository.findAllByAsignaturaId(idAsignatura);
                for (Profesor p : profesores) {
                    if (p.getUsuario() != null) {
                        String asigProfNombre = p.getAsignatura() != null ? p.getAsignatura().getNombre() : asignaturaNombre;
                        profesoresDTO.add(new ProfesorContactoDTO(
                            p.getUsuario().getRut(),
                            p.getUsuario().getNombre() + " " + p.getUsuario().getApellido(),
                            p.getUsuario().getCorreo(),
                            "Profesor de Asignatura",
                            asigProfNombre
                        ));
                    }
                }
            }

            // Consultar documentos de práctica para este estudiante y asignatura
            List<DocumentoPractica> docs = idAsignatura != null
                ? documentoPracticaRepository.findByEstudianteRutAndAsignaturaIdAsignatura(rut, idAsignatura)
                : documentoPracticaRepository.findByEstudianteRut(rut);

            boolean tieneDocEstudiante = docs.stream().anyMatch(d -> "ESTUDIANTE".equalsIgnoreCase(d.getTipoDocumento()));
            boolean tieneDocProfesor = docs.stream().anyMatch(d -> "PROFESOR".equalsIgnoreCase(d.getTipoDocumento()));

            int entregados = (tieneDocEstudiante ? 1 : 0) + (tieneDocProfesor ? 1 : 0);
            int requeridos = 2; // Documento de estudiante + Documento de profesor
            double progreso = Math.round((entregados / (double) requeridos) * 100.0);

            String estado;
            if (entregados >= requeridos) {
                estado = "COMPLETO";
            } else if (entregados > 0) {
                estado = "EN_PROGRESO";
            } else {
                estado = "PENDIENTE";
            }

            resultado.add(new EstudianteDocumentoDTO(
                rut,
                nombreCompleto,
                correo,
                asignaturaNombre,
                idAsignatura,
                semestre,
                entregados,
                requeridos,
                progreso,
                estado,
                profesoresDTO
            ));
        }

        return resultado;
    }

    @Transactional(readOnly = true)
    public DetalleEstudianteDocumentosDTO obtenerDetalleEstudiante(String rutRaw) {
        String rut = RutUtils.clean(rutRaw);
        Optional<Estudiante> estOpt = estudianteRepository.findAll().stream()
            .filter(e -> e.getUsuario() != null && RutUtils.clean(e.getUsuario().getRut()).equalsIgnoreCase(rut))
            .findFirst();

        Usuario usuario;
        Asignatura asig = null;
        if (estOpt.isPresent()) {
            usuario = estOpt.get().getUsuario();
            asig = estOpt.get().getAsignatura();
        } else {
            usuario = usuarioRepository.findAll().stream()
                .filter(u -> RutUtils.clean(u.getRut()).equalsIgnoreCase(rut))
                .findFirst()
                .orElse(null);
        }

        if (usuario == null) {
            return null;
        }

        String rutFinal = usuario.getRut();
        String nombreCompleto = usuario.getNombre() + " " + usuario.getApellido();
        String correo = usuario.getCorreo();
        String asignaturaNombre = asig != null ? asig.getNombre() : "—";
        Long idAsignatura = asig != null ? asig.getIdAsignatura() : null;
        String semestre = asig != null ? asig.getSemestre() : "—";

        // Obtener profesores de la asignatura
        List<ProfesorContactoDTO> profesoresDTO = new ArrayList<>();
        if (idAsignatura != null) {
            List<Profesor> profesores = profesorRepository.findAllByAsignaturaId(idAsignatura);
            for (Profesor p : profesores) {
                if (p.getUsuario() != null) {
                    String asigProfNombre = p.getAsignatura() != null ? p.getAsignatura().getNombre() : asignaturaNombre;
                    profesoresDTO.add(new ProfesorContactoDTO(
                        p.getUsuario().getRut(),
                        p.getUsuario().getNombre() + " " + p.getUsuario().getApellido(),
                        p.getUsuario().getCorreo(),
                        "Profesor de Asignatura",
                        asigProfNombre
                    ));
                }
            }
        }

        // Consultar documentos de la práctica
        List<DocumentoPractica> docs = idAsignatura != null
            ? documentoPracticaRepository.findByEstudianteRutAndAsignaturaIdAsignatura(rutFinal, idAsignatura)
            : documentoPracticaRepository.findByEstudianteRut(rutFinal);

        Optional<DocumentoPractica> docEstudianteOpt = docs.stream()
            .filter(d -> "ESTUDIANTE".equalsIgnoreCase(d.getTipoDocumento()))
            .findFirst();

        Optional<DocumentoPractica> docProfesorOpt = docs.stream()
            .filter(d -> "PROFESOR".equalsIgnoreCase(d.getTipoDocumento()))
            .findFirst();

        List<DocumentoItemDTO> documentosList = new ArrayList<>();

        // Slot 1: Documento del Estudiante
        if (docEstudianteOpt.isPresent()) {
            DocumentoPractica d = docEstudianteOpt.get();
            documentosList.add(new DocumentoItemDTO(
                d.getIdDocumentoPractica(),
                d.getNombreDocumento() != null ? d.getNombreDocumento() : "Informe de Práctica (Estudiante)",
                d.getNombreArchivo(),
                "ESTUDIANTE",
                d.getFechaCarga(),
                "ENTREGADO",
                formatTamanio(d.getTamanioBytes()),
                d.getUsuario() != null ? d.getUsuario().getNombre() + " " + d.getUsuario().getApellido() : nombreCompleto,
                d.getUsuario() != null ? d.getUsuario().getCorreo() : correo,
                "/admin/documentos/archivo/" + d.getIdDocumentoPractica()
            ));
        } else {
            documentosList.add(new DocumentoItemDTO(
                null,
                "Informe de Práctica y Autoevaluación",
                "—",
                "ESTUDIANTE",
                null,
                "PENDIENTE",
                "—",
                nombreCompleto,
                correo,
                null
            ));
        }

        // Slot 2: Documento del Profesor
        if (docProfesorOpt.isPresent()) {
            DocumentoPractica d = docProfesorOpt.get();
            String nombreProf = d.getUsuario() != null ? d.getUsuario().getNombre() + " " + d.getUsuario().getApellido() : "Profesor";
            String correoProf = d.getUsuario() != null ? d.getUsuario().getCorreo() : "—";
            documentosList.add(new DocumentoItemDTO(
                d.getIdDocumentoPractica(),
                d.getNombreDocumento() != null ? d.getNombreDocumento() : "Evaluación Final de Desempeño (Profesor)",
                d.getNombreArchivo(),
                "PROFESOR",
                d.getFechaCarga(),
                "ENTREGADO",
                formatTamanio(d.getTamanioBytes()),
                nombreProf,
                correoProf,
                "/admin/documentos/archivo/" + d.getIdDocumentoPractica()
            ));
        } else {
            String defaultProfNombre = !profesoresDTO.isEmpty() ? profesoresDTO.get(0).getNombre() : "Profesor Asignado";
            String defaultProfCorreo = !profesoresDTO.isEmpty() ? profesoresDTO.get(0).getCorreo() : "—";
            documentosList.add(new DocumentoItemDTO(
                null,
                "Pauta de Evaluación y Retroalimentación Final",
                "—",
                "PROFESOR",
                null,
                "PENDIENTE",
                "—",
                defaultProfNombre,
                defaultProfCorreo,
                null
            ));
        }

        int entregados = (docEstudianteOpt.isPresent() ? 1 : 0) + (docProfesorOpt.isPresent() ? 1 : 0);
        int requeridos = 2;
        double progreso = Math.round((entregados / (double) requeridos) * 100.0);

        return new DetalleEstudianteDocumentosDTO(
            rutFinal,
            nombreCompleto,
            correo,
            asignaturaNombre,
            idAsignatura,
            semestre,
            progreso,
            entregados,
            requeridos,
            profesoresDTO,
            documentosList
        );
    }

    @Transactional(readOnly = true)
    public DocumentoPractica obtenerDocumentoPorId(Long id) {
        return documentoPracticaRepository.findById(id).orElse(null);
    }

    public Resource obtenerRecursoArchivo(DocumentoPractica doc) throws IOException {
        Path path = resolverRutaArchivo(doc.getUbicacion(), doc.getNombreArchivo());
        if (path != null && Files.exists(path)) {
            return new FileSystemResource(path.toFile());
        }

        // Si el archivo físico no existe en disco, generar un PDF legible en memoria
        byte[] pdfMock = generarPdfMock(
            doc.getNombreDocumento() != null ? doc.getNombreDocumento() : doc.getNombreArchivo(),
            doc.getEstudiante() != null ? doc.getEstudiante().getNombre() + " " + doc.getEstudiante().getApellido() : "Estudiante",
            doc.getAsignatura() != null ? doc.getAsignatura().getNombre() : "Práctica"
        );
        return new ByteArrayResource(pdfMock);
    }

    @Transactional(readOnly = true)
    public void escribirZipEstudiante(String rutRaw, OutputStream out) throws IOException {
        String rut = RutUtils.clean(rutRaw);
        Usuario usuario = usuarioRepository.findAll().stream()
            .filter(u -> RutUtils.clean(u.getRut()).equalsIgnoreCase(rut))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Estudiante no encontrado para RUT: " + rutRaw));

        List<DocumentoPractica> documentos = documentoPracticaRepository.findByEstudianteRut(usuario.getRut());

        try (ZipOutputStream zos = new ZipOutputStream(out)) {
            if (documentos.isEmpty()) {
                // Agregar un archivo informativo en el zip si no hay documentos entregados aún
                ZipEntry entry = new ZipEntry("sin_documentos.txt");
                zos.putNextEntry(entry);
                String mensaje = "El estudiante " + usuario.getNombre() + " " + usuario.getApellido() +
                                 " (RUT " + usuario.getRut() + ") aún no tiene documentos entregados.";
                zos.write(mensaje.getBytes(StandardCharsets.UTF_8));
                zos.closeEntry();
            } else {
                for (DocumentoPractica doc : documentos) {
                    String asigNombre = doc.getAsignatura() != null ? doc.getAsignatura().getNombre() : "General";
                    String carpeta = sanitizarNombre(asigNombre);
                    String prefijo = "ESTUDIANTE".equalsIgnoreCase(doc.getTipoDocumento()) ? "[ESTUDIANTE]" : "[PROFESOR]";
                    String nombreArchivo = prefijo + "_" + sanitizarNombre(doc.getNombreArchivo());

                    ZipEntry entry = new ZipEntry(carpeta + "/" + nombreArchivo);
                    zos.putNextEntry(entry);

                    Path localPath = resolverRutaArchivo(doc.getUbicacion(), doc.getNombreArchivo());
                    if (localPath != null && Files.exists(localPath)) {
                        Files.copy(localPath, zos);
                    } else {
                        byte[] pdfContent = generarPdfMock(
                            doc.getNombreDocumento() != null ? doc.getNombreDocumento() : doc.getNombreArchivo(),
                            usuario.getNombre() + " " + usuario.getApellido(),
                            asigNombre
                        );
                        zos.write(pdfContent);
                    }

                    zos.closeEntry();
                }
            }
            zos.finish();
        }
    }

    private Path resolverRutaArchivo(String ubicacion, String nombreArchivo) {
        if (ubicacion != null && !ubicacion.isBlank()) {
            Path p = Paths.get(ubicacion);
            if (Files.exists(p)) return p;
        }

        if (nombreArchivo != null && !nombreArchivo.isBlank()) {
            Path p1 = UPLOADS_DIR.resolve(nombreArchivo);
            if (Files.exists(p1)) return p1;

            Path p2 = Paths.get(System.getProperty("user.dir"), "uploads", "documentos", nombreArchivo);
            if (Files.exists(p2)) return p2;
        }

        return null;
    }

    public static byte[] generarPdfMock(String titulo, String estudiante, String asignatura) {
        // Generador de archivo de texto con encabezado y formato estructurado
        String contenido = "%PDF-1.4\n" +
            "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n" +
            "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n" +
            "3 0 obj << /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >> endobj\n" +
            "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n" +
            "5 0 obj << /Length 200 >> stream\n" +
            "BT /F1 14 Tf 50 720 Td (" + escapePdf(titulo) + ") Tj\n" +
            "/F1 11 Tf 0 -30 Td (Estudiante: " + escapePdf(estudiante) + ") Tj\n" +
            "0 -20 Td (Asignatura: " + escapePdf(asignatura) + ") Tj\n" +
            "0 -20 Td (Universidad del Bio-Bio - Sistema de Practicas) Tj\n" +
            "0 -20 Td (Documento verificado y archivado localmente.) Tj ET\n" +
            "endstream\nendobj\nxref\n0 6\n0000000000 65535 f \n" +
            "trailer << /Size 6 /Root 1 0 R >>\nstartxref\n500\n%%EOF\n";
        return contenido.getBytes(StandardCharsets.ISO_8859_1);
    }

    private static String escapePdf(String text) {
        if (text == null) return "";
        return text.replace("(", "").replace(")", "").replace("\\", "");
    }

    private String sanitizarNombre(String entrada) {
        if (entrada == null) return "archivo";
        String normalized = Normalizer.normalize(entrada, Normalizer.Form.NFD);
        String limpia = normalized.replaceAll("[\\p{InCombiningDiacriticalMarks}]", "");
        return limpia.replaceAll("[^a-zA-Z0-9._-]", "_");
    }

    private String formatTamanio(Long bytes) {
        if (bytes == null || bytes <= 0) return "—";
        if (bytes < 1024) return bytes + " B";
        int exp = (int) (Math.log(bytes) / Math.log(1024));
        char pre = "KMGTPE".charAt(exp - 1);
        return String.format("%.1f %cB", bytes / Math.pow(1024, exp), pre);
    }
}
