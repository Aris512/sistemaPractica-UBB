package com.backend.service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;

import com.backend.model.Pauta;
import com.backend.model.PautaAplicacion;
import com.backend.model.PautaCriterio;
import com.backend.model.PautaRespuesta;

/**
 * Genera el PDF de una pauta (formulario) aplicada: datos de la evaluación, puntaje de cada criterio,
 * nota y observaciones del evaluador.
 */
final class PautaPdfGenerator {

    /** Datos que no viven en la pauta ni en la aplicación. */
    record Contexto(String estudianteNombre, String estudianteRut, String evaluadorRol, Double nota) {}

    private static final float MARGEN = 50f;
    private static final float ANCHO = PDRectangle.LETTER.getWidth() - 2 * MARGEN;
    private static final float COL_PUNTAJE = 60f;
    private static final DateTimeFormatter FECHA = DateTimeFormatter.ofPattern("dd-MM-yyyy");
    private static final float[] NEGRO = {0.06f, 0.09f, 0.16f};
    private static final float[] GRIS = {0.39f, 0.45f, 0.55f};
    private static final float[] AZUL = {0.01f, 0.41f, 0.63f};
    private static final float[] ROJO = {0.88f, 0.11f, 0.28f};

    private final PDDocument doc = new PDDocument();
    private final PDFont normal = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
    private final PDFont negrita = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
    private final PDFont cursiva = new PDType1Font(Standard14Fonts.FontName.HELVETICA_OBLIQUE);
    private PDPageContentStream cs;
    private float y;

    private PautaPdfGenerator() {}

    static byte[] generar(Pauta pauta, PautaAplicacion app, Contexto ctx) {
        PautaPdfGenerator g = new PautaPdfGenerator();
        try (PDDocument d = g.doc) {
            g.escribir(pauta, app, ctx);
            g.cs.close();
            g.numerarPaginas();
            ByteArrayOutputStream salida = new ByteArrayOutputStream();
            d.save(salida);
            return salida.toByteArray();
        } catch (IOException e) {
            throw new IllegalStateException("No se pudo generar el PDF de la pauta.", e);
        }
    }

    private void escribir(Pauta pauta, PautaAplicacion app, Contexto ctx) throws IOException {
        nuevaPagina();
        boolean finalizada = "FINALIZADA".equalsIgnoreCase(app.getEstado());

        // Encabezado
        texto("Universidad del Bío-Bío · Plataforma de Práctica", normal, 9, GRIS, MARGEN, ANCHO);
        y -= 4;
        texto(Objects.requireNonNullElse(pauta.getTitulo(), "Pauta de evaluación"), negrita, 15, NEGRO, MARGEN, ANCHO);
        List<String> sub = new ArrayList<>();
        if (noVacio(pauta.getCodigo())) sub.add("Código " + pauta.getCodigo());
        if (noVacio(pauta.getAsignatura())) sub.add(pauta.getAsignatura());
        if (noVacio(pauta.getMomento())) sub.add(momento(pauta.getMomento()));
        if (noVacio(pauta.getVersion())) sub.add("Versión " + pauta.getVersion());
        if (!sub.isEmpty()) texto(String.join(" · ", sub), normal, 9, GRIS, MARGEN, ANCHO);
        y -= 6;
        linea();

        // Datos de la evaluación
        y -= 4;
        dato("Estudiante", unir(ctx.estudianteNombre(), ctx.estudianteRut()));
        dato("Evaluador/a", unir(app.getEvaluadorNombre(), rol(ctx.evaluadorRol())));
        LocalDateTime fecha = app.getFechaFinalizacion() != null ? app.getFechaFinalizacion() : app.getFechaActualizacion();
        dato("Fecha", fecha != null ? fecha.format(FECHA) : "—");
        dato("Estado", finalizada ? "Finalizada" : "En borrador (aún no es definitiva)");
        if (noVacio(pauta.getPonderacion())) dato("Ponderación", pauta.getPonderacion());
        y -= 6;

        // Nota y puntaje
        float altoCaja = 46;
        asegurar(altoCaja + 10);
        cs.setNonStrokingColor(0.94f, 0.97f, 1f);
        cs.addRect(MARGEN, y - altoCaja, ANCHO, altoCaja);
        cs.fill();
        Double nota = ctx.nota();
        float yCaja = y;
        y = yCaja - 12;
        texto("PROMEDIO".equalsIgnoreCase(pauta.getModoCalculo()) ? "PROMEDIO" : "NOTA", negrita, 8, GRIS, MARGEN + 12, 120);
        y = yCaja - 24;
        texto(nota != null ? String.format(Locale.US, "%.1f", nota) : "—", negrita, 20,
                nota != null && nota < 4.0 ? ROJO : AZUL, MARGEN + 12, 120);
        y = yCaja - 12;
        texto("PUNTAJE", negrita, 8, GRIS, MARGEN + 140, 200);
        y = yCaja - 26;
        texto(numero(app.getPuntajeObtenido()) + " de " + numero(app.getPuntajeMaximo()) + " puntos", normal, 12, NEGRO,
                MARGEN + 140, 200);
        y = yCaja - 12;
        texto("ESCALA POR CRITERIO", negrita, 8, GRIS, MARGEN + 330, 180);
        y = yCaja - 26;
        texto(Objects.requireNonNullElse(pauta.getEscalaMin(), 1) + " a " + Objects.requireNonNullElse(pauta.getEscalaMax(), 7),
                normal, 12, NEGRO, MARGEN + 330, 180);
        y = yCaja - altoCaja - 16;

        // Criterios con su puntaje
        Map<Long, Integer> puntajes = new HashMap<>();
        for (PautaRespuesta r : app.getRespuestas()) {
            puntajes.put(r.getCriterio().getId(), r.getPuntaje());
        }
        texto("Criterios evaluados", negrita, 12, NEGRO, MARGEN, ANCHO);
        y -= 4;
        String dimensionActual = null;
        for (PautaCriterio c : pauta.getCriterios()) {
            String dimension = noVacio(c.getDimension()) ? c.getDimension().strip() : null;
            if (dimension != null && !dimension.equals(dimensionActual)) {
                asegurar(40);
                y -= 6;
                texto(dimension, negrita, 10, AZUL, MARGEN, ANCHO);
                dimensionActual = dimension;
            }
            String enunciado = (noVacio(c.getNumero()) ? c.getNumero().strip() + ". " : "") + Objects.requireNonNullElse(c.getTexto(), "");
            float anchoTexto = ANCHO - COL_PUNTAJE - 10;
            List<String> lineas = partir(enunciado, normal, 10, anchoTexto);
            asegurar(lineas.size() * 13 + 10);
            float yFila = y;
            for (String l : lineas) {
                escribirLinea(l, normal, 10, NEGRO, MARGEN);
            }
            Integer p = puntajes.get(c.getId());
            float yFin = y;
            y = yFila;
            String valor = p != null ? String.valueOf(p) : "—";
            escribirLinea(valor, negrita, 11, p != null ? NEGRO : GRIS,
                    MARGEN + ANCHO - anchoDe(valor, negrita, 11));
            y = yFin - 3;
            cs.setStrokingColor(0.89f, 0.91f, 0.94f);
            cs.setLineWidth(0.5f);
            cs.moveTo(MARGEN, y + 4);
            cs.lineTo(MARGEN + ANCHO, y + 4);
            cs.stroke();
            y -= 4;
        }

        // Observaciones
        y -= 10;
        asegurar(60);
        texto("Observaciones del evaluador", negrita, 12, NEGRO, MARGEN, ANCHO);
        y -= 2;
        if (noVacio(app.getObservaciones())) {
            for (String parrafo : app.getObservaciones().strip().split("\\R")) {
                if (parrafo.isBlank()) {
                    y -= 6;
                    continue;
                }
                texto(parrafo, normal, 10, NEGRO, MARGEN, ANCHO);
            }
        } else {
            texto("Sin observaciones registradas.", cursiva, 10, GRIS, MARGEN, ANCHO);
        }
    }

    // ---- Primitivas de dibujo

    private void nuevaPagina() throws IOException {
        if (cs != null) cs.close();
        PDPage pagina = new PDPage(PDRectangle.LETTER);
        doc.addPage(pagina);
        cs = new PDPageContentStream(doc, pagina);
        y = PDRectangle.LETTER.getHeight() - MARGEN;
    }

    private void asegurar(float alto) throws IOException {
        if (y - alto < MARGEN + 20) nuevaPagina();
    }

    private void linea() throws IOException {
        cs.setStrokingColor(0.8f, 0.84f, 0.88f);
        cs.setLineWidth(0.8f);
        cs.moveTo(MARGEN, y);
        cs.lineTo(MARGEN + ANCHO, y);
        cs.stroke();
        y -= 10;
    }

    private void dato(String etiqueta, String valor) throws IOException {
        asegurar(16);
        float yFila = y;
        escribirLinea(etiqueta, negrita, 9, GRIS, MARGEN);
        y = yFila;
        texto(noVacio(valor) ? valor : "—", normal, 10, NEGRO, MARGEN + 90, ANCHO - 90);
    }

    /** Párrafo con ajuste de línea y salto de página. */
    private void texto(String contenido, PDFont fuente, float tam, float[] color, float x, float ancho) throws IOException {
        for (String l : partir(contenido, fuente, tam, ancho)) {
            asegurar(tam + 4);
            escribirLinea(l, fuente, tam, color, x);
        }
    }

    private void escribirLinea(String linea, PDFont fuente, float tam, float[] color, float x) throws IOException {
        y -= tam;
        cs.beginText();
        cs.setFont(fuente, tam);
        cs.setNonStrokingColor(color[0], color[1], color[2]);
        cs.newLineAtOffset(x, y);
        cs.showText(limpiar(linea));
        cs.endText();
        y -= tam * 0.3f;
    }

    private List<String> partir(String contenido, PDFont fuente, float tam, float ancho) throws IOException {
        List<String> lineas = new ArrayList<>();
        StringBuilder actual = new StringBuilder();
        for (String palabra : limpiar(contenido).split(" ")) {
            if (palabra.isEmpty()) continue;
            // Una palabra más larga que la línea se corta para que no se salga de la hoja
            while (anchoDe(palabra, fuente, tam) > ancho && palabra.length() > 1) {
                int corte = palabra.length() - 1;
                while (corte > 1 && anchoDe(palabra.substring(0, corte), fuente, tam) > ancho) corte--;
                if (actual.length() > 0) {
                    lineas.add(actual.toString());
                    actual.setLength(0);
                }
                lineas.add(palabra.substring(0, corte));
                palabra = palabra.substring(corte);
            }
            String candidata = actual.length() == 0 ? palabra : actual + " " + palabra;
            if (anchoDe(candidata, fuente, tam) > ancho && actual.length() > 0) {
                lineas.add(actual.toString());
                actual = new StringBuilder(palabra);
            } else {
                actual = new StringBuilder(candidata);
            }
        }
        if (actual.length() > 0) lineas.add(actual.toString());
        if (lineas.isEmpty()) lineas.add("");
        return lineas;
    }

    private float anchoDe(String texto, PDFont fuente, float tam) throws IOException {
        return fuente.getStringWidth(limpiar(texto)) / 1000f * tam;
    }

    /** Helvetica solo dibuja caracteres WinAnsi: se normalizan los habituales y el resto se reemplaza por «?». */
    private String limpiar(String texto) {
        if (texto == null) return "";
        String t = texto.replace('\t', ' ').replace(' ', ' ')
                .replace("→", "->").replace("≤", "<=").replace("≥", ">=").replace("−", "-");
        StringBuilder sb = new StringBuilder(t.length());
        for (int i = 0; i < t.length(); i++) {
            char c = t.charAt(i);
            if (c == '\n' || c == '\r') {
                sb.append(' ');
                continue;
            }
            // Emojis y otros símbolos fuera del plano básico no existen en la fuente: se omiten
            if (c < 32 || Character.isSurrogate(c)) continue;
            try {
                normal.encode(String.valueOf(c));
                sb.append(c);
            } catch (IOException | IllegalArgumentException e) {
                sb.append('?');
            }
        }
        return sb.toString();
    }

    private void numerarPaginas() throws IOException {
        int total = doc.getNumberOfPages();
        for (int i = 0; i < total; i++) {
            try (PDPageContentStream pie = new PDPageContentStream(doc, doc.getPage(i),
                    PDPageContentStream.AppendMode.APPEND, true)) {
                String t = "Página " + (i + 1) + " de " + total;
                pie.beginText();
                pie.setFont(normal, 8);
                pie.setNonStrokingColor(GRIS[0], GRIS[1], GRIS[2]);
                pie.newLineAtOffset(MARGEN + ANCHO - normal.getStringWidth(t) / 1000f * 8, 30);
                pie.showText(t);
                pie.endText();
            }
        }
    }

    private static boolean noVacio(String s) {
        return s != null && !s.isBlank();
    }

    private static String unir(String a, String b) {
        if (!noVacio(a)) return noVacio(b) ? b : "—";
        return noVacio(b) ? a + " · " + b : a;
    }

    private static String rol(String rol) {
        if (rol == null) return null;
        return switch (rol.toUpperCase(Locale.ROOT)) {
            case "COLABORADOR" -> "Profesor/a colaborador/a";
            case "TUTOR" -> "Tutor/a";
            case "ACADEMICO" -> "Académico/a";
            default -> null;
        };
    }

    private static String momento(String momento) {
        return switch (momento.toUpperCase(Locale.ROOT)) {
            case "PRIMERA" -> "Primera observación";
            case "SEGUNDA" -> "Segunda observación";
            case "UNICA" -> "Observación única";
            default -> momento;
        };
    }

    private static String numero(Double valor) {
        if (valor == null) return "—";
        return valor == Math.rint(valor) ? String.valueOf(valor.longValue()) : String.format(Locale.US, "%.1f", valor);
    }
}
