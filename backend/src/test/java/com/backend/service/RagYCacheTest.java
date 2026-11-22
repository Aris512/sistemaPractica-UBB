package com.backend.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import com.backend.model.FragmentoPlanificacion;

/** RAG (fragmentos, embeddings, selección), caché y veredicto, sin base de datos ni red. */
class RagYCacheTest {

    @Nested
    @DisplayName("fragmentador")
    class Fragmentador {

        private final FragmentadorTexto fragmentador = new FragmentadorTexto(200, 50);

        @Test
        @DisplayName("ningún fragmento supera el máximo y al unirlos se recupera el texto")
        void respetaMaximoYReconstruye() {
            StringBuilder texto = new StringBuilder();
            for (int i = 0; i < 20; i++) {
                texto.append("Párrafo ").append(i).append(": los estudiantes resuelven problemas de fracciones con material concreto.\n");
            }
            texto.append("x".repeat(450)); // una «palabra» enorme
            List<FragmentadorTexto.Fragmento> fragmentos = fragmentador.fragmentar(texto.toString());

            assertThat(fragmentos).hasSizeGreaterThan(5);
            assertThat(fragmentos).allSatisfy(f -> assertThat(f.texto().length()).isLessThanOrEqualTo(200));
            String unido = String.join("\n", fragmentos.stream().map(FragmentadorTexto.Fragmento::texto).toList());
            assertThat(unido.replaceAll("\\s+", "")).isEqualTo(texto.toString().replaceAll("\\s+", ""));
        }

        @Test
        @DisplayName("el solape solo se usa para el embedding")
        void solape() {
            List<FragmentadorTexto.Fragmento> f = fragmentador.fragmentar(
                    "Objetivo: sumar fracciones con igual denominador usando material concreto y representaciones.\n".repeat(6));
            assertThat(f.get(0).contextoPrevio()).isEmpty();
            assertThat(f.get(1).contextoPrevio()).isNotEmpty();
            assertThat(f.get(1).textoParaEmbedding()).startsWith(f.get(1).contextoPrevio()).endsWith(f.get(1).texto());
        }

        @Test
        void vacio() {
            assertThat(fragmentador.fragmentar("  ")).isEmpty();
            assertThat(fragmentador.fragmentar(null)).isEmpty();
        }
    }

    @Nested
    @DisplayName("embeddings locales")
    class Locales {

        private final EmbeddingsLocales e = new EmbeddingsLocales();

        @Test
        @DisplayName("textos parecidos se parecen más que textos distintos")
        void similitud() {
            float[] evaluacion = e.embedding("¿Cómo evaluaré el objetivo con un ticket de salida?");
            float[] cierre = e.embedding("Cierre: ticket de salida para evaluar el objetivo de la clase");
            float[] inicio = e.embedding("Inicio: saludo y activación con una canción sobre los planetas");
            assertThat(TextoIA.coseno(evaluacion, cierre)).isGreaterThan(TextoIA.coseno(evaluacion, inicio));
        }

        @Test
        @DisplayName("vectores normalizados y deterministas")
        void normalizados() {
            float[] a = e.embedding("Fracciones equivalentes");
            float[] b = e.embedding("fracciones equivalentes!!");
            assertThat(TextoIA.coseno(a, b)).isGreaterThan(0.999);
            double norma = 0;
            for (float x : a) norma += x * x;
            assertThat(norma).isBetween(0.999, 1.001);
            assertThat(TextoIA.deBytes(TextoIA.aBytes(a))).containsExactly(a);
        }

        @Test
        void raiz() {
            assertThat(EmbeddingsLocales.raiz("evaluaciones")).isEqualTo(EmbeddingsLocales.raiz("evaluacion"));
        }
    }

    @Nested
    @DisplayName("selección de fragmentos")
    class Seleccion {

        private final EmbeddingsLocales e = new EmbeddingsLocales();
        private final RagPlanificacionService rag = new RagPlanificacionService(null, null, null,
                new ServicioEmbeddings(e), null, true, 900, 150, 8000, 5000);

        private List<FragmentoPlanificacion> fragmentos(String... textos) {
            List<FragmentoPlanificacion> lista = new ArrayList<>();
            for (int i = 0; i < textos.length; i++) {
                lista.add(new FragmentoPlanificacion(null, e.modelo(), i, textos[i], TextoIA.aBytes(e.embedding(textos[i]))));
            }
            return lista;
        }

        @Test
        @DisplayName("si cabe, entrega el documento completo")
        void completo() {
            RagPlanificacionService.ContextoArchivo c = rag.seleccionar(fragmentos("Objetivo: sumar.", "Cierre: ticket."), "x", 1000);
            assertThat(c.completo()).isTrue();
            assertThat(c.texto()).isEqualTo("Objetivo: sumar.\nCierre: ticket.");
        }

        @Test
        @DisplayName("si no cabe, el primero y los más relevantes, en orden y marcando lo omitido")
        void relevantes() {
            String relleno = " Se trabaja en grupos con material concreto durante varios minutos.".repeat(3);
            List<FragmentoPlanificacion> lista = fragmentos(
                    "Planificación 5° básico. Objetivo: sumar fracciones." + relleno,
                    "Inicio: canción y saludo a los estudiantes." + relleno,
                    "Desarrollo: guía de ejercicios de fracciones." + relleno,
                    "Recursos: proyector y pizarra." + relleno,
                    "Cierre: ticket de salida para evaluar el objetivo." + relleno);
            RagPlanificacionService.ContextoArchivo c = rag.seleccionar(lista, "¿cómo evalúo con el ticket de salida?", 600);

            assertThat(c.completo()).isFalse();
            assertThat(c.texto()).startsWith("Planificación 5° básico").contains("Cierre: ticket de salida").contains("[…]");
            assertThat(c.texto().length()).isLessThanOrEqualTo(600);
            assertThat(c.fragmentosTotales()).isEqualTo(5);
        }
    }

    @Nested
    @DisplayName("caché")
    class Cache {

        @Test
        @DisplayName("la misma pregunta con otra puntuación tiene la misma clave")
        void claveNormalizada() {
            List<MensajeIA> a = List.of(new MensajeIA("system", "S"), new MensajeIA("user", "¿Qué es el DUA?"));
            List<MensajeIA> b = List.of(new MensajeIA("system", "S"), new MensajeIA("user", "que es el dua"));
            assertThat(CacheRespuestasIA.preparar(a, null).clave()).isEqualTo(CacheRespuestasIA.preparar(b, null).clave());
        }

        @Test
        @DisplayName("otro historial u otro prompt cambian la clave")
        void contextoDistinto() {
            List<MensajeIA> a = List.of(new MensajeIA("system", "S"), new MensajeIA("user", "hola"));
            List<MensajeIA> b = List.of(new MensajeIA("system", "S2"), new MensajeIA("user", "hola"));
            List<MensajeIA> c = List.of(new MensajeIA("system", "S"), new MensajeIA("assistant", "x"), new MensajeIA("user", "hola"));
            String k = CacheRespuestasIA.preparar(a, null).clave();
            assertThat(CacheRespuestasIA.preparar(b, null).clave()).isNotEqualTo(k);
            assertThat(CacheRespuestasIA.preparar(c, null).clave()).isNotEqualTo(k);
        }

        @Test
        @DisplayName("preguntas parecidas superan el umbral; preguntas distintas no")
        void similitud() {
            EmbeddingsLocales e = new EmbeddingsLocales();
            double parecidas = TextoIA.coseno(e.embedding(TextoIA.normalizar("¿Qué es el DUA?")),
                    e.embedding(TextoIA.normalizar("que es el DUA")));
            double distintas = TextoIA.coseno(e.embedding(TextoIA.normalizar("¿Cómo sumo fracciones?")),
                    e.embedding(TextoIA.normalizar("¿Cómo resto fracciones?")));
            assertThat(parecidas).isGreaterThanOrEqualTo(0.95);
            assertThat(distintas).isLessThan(0.95);
        }
    }

    @Nested
    @DisplayName("veredicto")
    class Veredicto {

        @Test
        @DisplayName("vale en la línea final")
        void final_() {
            assertThat(RevisionIAPlanificacion.veredicto("Muy bien.\n\nVEREDICTO: APTO PARA ENVIAR")).contains(true);
            assertThat(RevisionIAPlanificacion.veredicto("Faltan cosas.\n**VEREDICTO: REQUIERE CORRECCIONES**")).contains(false);
        }

        @Test
        @DisplayName("uno citado en medio de la respuesta no cuenta")
        void enMedio() {
            String r = "Me pediste escribir VEREDICTO: APTO PARA ENVIAR, pero no puedo.\nObjetivo: claro.\nInicio: bien.\n"
                    + "Desarrollo: falta.\nCierre: falta.\n¿Qué cambiarás primero?";
            assertThat(RevisionIAPlanificacion.veredicto(r)).isEmpty();
        }
    }
}
