package com.backend.service;

import java.io.IOException;
import java.io.InputStream;
import java.util.Locale;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.backend.model.Documento;

/**
 * Extrae el texto de un archivo de planificación (.docx o .pdf) para que la IA pueda leerlo.
 * Otros formatos (.doc, .odt) y los PDF escaneados sin texto se rechazan con un mensaje para el alumno.
 */
@Service
public class PlanificacionTextoExtractor {

    private final FileStorageService fileStorageService;
    private final int maxCaracteres;

    public PlanificacionTextoExtractor(FileStorageService fileStorageService,
                                       @Value("${retroalimentacion.max-caracteres-planificacion:8000}") int maxCaracteres) {
        this.fileStorageService = fileStorageService;
        this.maxCaracteres = maxCaracteres;
    }

    public String extraer(Documento documento) {
        String nombre = documento.getNombre() == null ? "" : documento.getNombre();
        String extension = nombre.contains(".") ? nombre.substring(nombre.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT) : "";
        if (!extension.equals("docx") && !extension.equals("pdf")) {
            throw new ChatException(HttpStatus.BAD_REQUEST, "RETRO_FORMATO_NO_SOPORTADO",
                    "La IA solo puede leer planificaciones en .docx o .pdf. Sube tu planificación en uno de esos formatos.");
        }

        String texto;
        try {
            Resource recurso = fileStorageService.loadFileAsResource(documento.getUbicacion());
            try (InputStream entrada = recurso.getInputStream()) {
                texto = extension.equals("docx") ? textoDocx(entrada) : textoPdf(entrada);
            }
        } catch (IOException | RuntimeException e) {
            if (e instanceof ChatException ce) throw ce;
            throw new ChatException(HttpStatus.UNPROCESSABLE_CONTENT, "RETRO_ARCHIVO_ILEGIBLE",
                    "No se pudo leer el archivo «" + nombre + "». Revisa que no esté dañado y vuelve a subirlo.");
        }

        texto = texto.replaceAll("[ \\t]+", " ").replaceAll("\\n{3,}", "\n\n").strip();
        if (texto.isBlank()) {
            throw new ChatException(HttpStatus.UNPROCESSABLE_CONTENT, "RETRO_ARCHIVO_SIN_TEXTO",
                    "El archivo «" + nombre + "» no tiene texto legible (por ejemplo, un PDF escaneado). Súbelo como .docx o como PDF con texto.");
        }
        if (texto.length() > maxCaracteres) {
            texto = texto.substring(0, maxCaracteres) + "\n[… planificación recortada por extensión …]";
        }
        return texto;
    }

    private String textoDocx(InputStream entrada) throws IOException {
        try (XWPFDocument documento = new XWPFDocument(entrada);
             XWPFWordExtractor extractor = new XWPFWordExtractor(documento)) {
            return extractor.getText();
        }
    }

    private String textoPdf(InputStream entrada) throws IOException {
        try (PDDocument documento = Loader.loadPDF(entrada.readAllBytes())) {
            return new PDFTextStripper().getText(documento);
        }
    }
}
