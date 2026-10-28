package com.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowableOfType;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;

/** Lectura del texto de la planificación (.docx y .pdf) que se le entrega a la IA. */
@ExtendWith(MockitoExtension.class)
class PlanificacionTextoExtractorTest {

    private static final int MAX_CARACTERES = 200;

    @Mock
    private FileStorageService fileStorageService;

    private PlanificacionTextoExtractor extractor;

    @BeforeEach
    void setUp() {
        extractor = new PlanificacionTextoExtractor(fileStorageService, MAX_CARACTERES);
    }

    private static MockMultipartFile archivo(String nombre, byte[] contenido) {
        return new MockMultipartFile("archivo", nombre, "application/octet-stream", contenido);
    }

    private static byte[] docx(String... parrafos) throws IOException {
        try (XWPFDocument documento = new XWPFDocument(); ByteArrayOutputStream salida = new ByteArrayOutputStream()) {
            for (String parrafo : parrafos) {
                documento.createParagraph().createRun().setText(parrafo);
            }
            documento.write(salida);
            return salida.toByteArray();
        }
    }

    private static byte[] pdf(String linea) throws IOException {
        try (PDDocument documento = new PDDocument(); ByteArrayOutputStream salida = new ByteArrayOutputStream()) {
            PDPage pagina = new PDPage();
            documento.addPage(pagina);
            if (linea != null) {
                try (PDPageContentStream contenido = new PDPageContentStream(documento, pagina)) {
                    contenido.beginText();
                    contenido.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 12);
                    contenido.newLineAtOffset(50, 700);
                    contenido.showText(linea);
                    contenido.endText();
                }
            }
            documento.save(salida);
            return salida.toByteArray();
        }
    }

    @Test
    @DisplayName("lee el texto de un .docx")
    void leeDocx() throws IOException {
        String texto = extractor.extraer(archivo("plan.docx", docx("Objetivo: resolver ecuaciones", "Inicio: activar conocimientos")));

        assertThat(texto).contains("Objetivo: resolver ecuaciones").contains("Inicio: activar conocimientos");
    }

    @Test
    @DisplayName("lee el texto de un .pdf")
    void leePdf() throws IOException {
        String texto = extractor.extraer(archivo("plan.PDF", pdf("Cierre con ticket de salida")));

        assertThat(texto).contains("Cierre con ticket de salida");
    }

    @Test
    @DisplayName("normaliza espacios repetidos y saltos de línea de más")
    void normalizaEspacios() throws IOException {
        String texto = extractor.extraer(archivo("plan.docx", docx("Objetivo:    ecuaciones", "", "", "", "Inicio")));

        assertThat(texto).doesNotContain("  ").doesNotContain("\n\n\n").contains("Objetivo: ecuaciones");
    }

    @Test
    @DisplayName("recorta una planificación muy larga y lo indica")
    void recortaTextoLargo() throws IOException {
        String texto = extractor.extraer(archivo("plan.docx", docx("x".repeat(MAX_CARACTERES * 3))));

        assertThat(texto).startsWith("x".repeat(MAX_CARACTERES)).endsWith("[… planificación recortada por extensión …]");
    }

    @ParameterizedTest
    @ValueSource(strings = {"plan.doc", "plan.odt", "plan.txt", "plan"})
    @DisplayName("otros formatos se rechazan con RETRO_FORMATO_NO_SOPORTADO")
    void formatoNoSoportado(String nombre) {
        ChatException error = catchThrowableOfType(ChatException.class,
                () -> extractor.extraer(archivo(nombre, "hola".getBytes())));

        assertThat(error.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(error.getCodigo()).isEqualTo("RETRO_FORMATO_NO_SOPORTADO");
    }

    @Test
    @DisplayName("un archivo dañado se rechaza con RETRO_ARCHIVO_ILEGIBLE")
    void archivoDanado() {
        ChatException error = catchThrowableOfType(ChatException.class,
                () -> extractor.extraer(archivo("plan.docx", "no es un docx real".getBytes())));

        assertThat(error.getCodigo()).isEqualTo("RETRO_ARCHIVO_ILEGIBLE");
        assertThat(error.getMessage()).contains("plan.docx");
    }

    @Test
    @DisplayName("un PDF sin texto (p. ej. escaneado) se rechaza con RETRO_ARCHIVO_SIN_TEXTO")
    void pdfSinTexto() throws IOException {
        byte[] vacio = pdf(null);

        ChatException error = catchThrowableOfType(ChatException.class, () -> extractor.extraer(archivo("escaneado.pdf", vacio)));

        assertThat(error.getCodigo()).isEqualTo("RETRO_ARCHIVO_SIN_TEXTO");
    }
}
