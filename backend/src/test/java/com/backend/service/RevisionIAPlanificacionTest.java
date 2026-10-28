package com.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.catchThrowableOfType;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;

import com.backend.model.ChatMensaje;
import com.backend.model.ChatRolMensaje;
import com.backend.model.RetroalimentacionIA;
import com.backend.model.RetroalimentacionIA.Estado;
import com.backend.repository.RetroalimentacionIARepository;

/** Reglas de la revisión de planificaciones con IA: veredicto, límites de revisiones, contexto y borrado. */
@ExtendWith(MockitoExtension.class)
class RevisionIAPlanificacionTest {

    @Mock
    private RetroalimentacionIARepository repository;

    @Mock
    private JdbcTemplate jdbcTemplate;

    private RevisionIAPlanificacion revision;

    @BeforeEach
    @SuppressWarnings("unused")
    void setUp() throws IOException {
        revision = new RevisionIAPlanificacion(repository, jdbcTemplate, 6000);
    }

    private static RetroalimentacionIA retro(Estado estado, int revisionesIa) {
        RetroalimentacionIA retro = new RetroalimentacionIA();
        retro.setEstado(estado);
        retro.setRevisionesIa(revisionesIa);
        return retro;
    }

    @Nested
    @SuppressWarnings("unused")
    @DisplayName("veredicto de la IA")
    class Veredicto {

        @Test
        @DisplayName("«APTO PARA ENVIAR» habilita el envío")
        void apto() {
            assertThat(RevisionIAPlanificacion.veredicto("Muy bien.\n\nVEREDICTO: APTO PARA ENVIAR")).contains(true);
        }

        @Test
        @DisplayName("«REQUIERE CORRECCIONES» no lo habilita")
        void requiereCorrecciones() {
            assertThat(RevisionIAPlanificacion.veredicto("Faltan cosas.\nVEREDICTO: REQUIERE CORRECCIONES")).contains(false);
        }

        @Test
        @DisplayName("tolera negritas de Markdown y minúsculas")
        void formatoFlexible() {
            assertThat(RevisionIAPlanificacion.veredicto("**VEREDICTO: APTO PARA ENVIAR**")).contains(true);
            assertThat(RevisionIAPlanificacion.veredicto("veredicto: requiere correcciones")).contains(false);
        }

        @Test
        @DisplayName("si aparece más de una vez, vale la última")
        void valeElUltimo() {
            String respuesta = "Antes habría sido VEREDICTO: REQUIERE CORRECCIONES, pero ahora…\nVEREDICTO: APTO PARA ENVIAR";
            assertThat(RevisionIAPlanificacion.veredicto(respuesta)).contains(true);
        }

        @Test
        @DisplayName("sin línea de veredicto (preguntas diagnósticas) no hay resultado")
        void sinVeredicto() {
            assertThat(RevisionIAPlanificacion.veredicto("¿Qué curso es?")).isEmpty();
            assertThat(RevisionIAPlanificacion.veredicto(null)).isEmpty();
        }
    }

    @Nested
    @SuppressWarnings("unused")
    @DisplayName("registrar la respuesta de la IA")
    class RegistrarRespuesta {

        @Test
        @DisplayName("APTO cuenta una revisión y pasa a REVISADO_POR_IA")
        void aptoCambiaEstado() {
            RetroalimentacionIA retro = retro(Estado.NO_REVISADO, 0);

            revision.registrarRespuesta(retro, "Bien.\nVEREDICTO: APTO PARA ENVIAR");

            assertThat(retro.getEstado()).isEqualTo(Estado.REVISADO_POR_IA);
            assertThat(retro.getRevisionesIa()).isEqualTo(1);
            assertThat(retro.getUltimaRevisionIa()).contains("APTO PARA ENVIAR");
        }

        @Test
        @DisplayName("REQUIERE CORRECCIONES cuenta una revisión y sigue en NO_REVISADO")
        void correccionesCuentaRevision() {
            RetroalimentacionIA retro = retro(Estado.NO_REVISADO, 1);

            revision.registrarRespuesta(retro, "Falta el cierre.\nVEREDICTO: REQUIERE CORRECCIONES");

            assertThat(retro.getEstado()).isEqualTo(Estado.NO_REVISADO);
            assertThat(retro.getRevisionesIa()).isEqualTo(2);
        }

        @Test
        @DisplayName("una respuesta sin veredicto no cambia nada")
        void sinVeredictoNoCambia() {
            RetroalimentacionIA retro = retro(Estado.NO_REVISADO, 0);

            revision.registrarRespuesta(retro, "Antes de retroalimentar: ¿qué curso es?");

            assertThat(retro.getEstado()).isEqualTo(Estado.NO_REVISADO);
            assertThat(retro.getRevisionesIa()).isZero();
            assertThat(retro.getUltimaRevisionIa()).isNull();
        }

        @Test
        @DisplayName("con la revisión ya cerrada no vuelve a contar")
        void revisionCerradaNoCuenta() {
            RetroalimentacionIA retro = retro(Estado.ESPERANDO_PROFESOR, 1);

            revision.registrarRespuesta(retro, "VEREDICTO: REQUIERE CORRECCIONES");

            assertThat(retro.getEstado()).isEqualTo(Estado.ESPERANDO_PROFESOR);
            assertThat(retro.getRevisionesIa()).isEqualTo(1);
        }
    }

    @Nested
    @SuppressWarnings("unused")
    @DisplayName("seguir conversando con la IA")
    class ValidarPuedeConversar {

        @Test
        @DisplayName("se puede mientras la revisión está abierta y quedan revisiones")
        void permitido() {
            assertThatCode(() -> revision.validarPuedeConversar(retro(Estado.NO_REVISADO, 1))).doesNotThrowAnyException();
        }

        @Test
        @DisplayName("con las 2 revisiones agotadas responde RETRO_REVISIONES_AGOTADAS")
        void revisionesAgotadas() {
            ChatException error = catchThrowableOfType(ChatException.class,
                    () -> revision.validarPuedeConversar(retro(Estado.NO_REVISADO, RetroalimentacionIA.MAX_REVISIONES_IA)));

            assertThat(error.getStatus()).isEqualTo(HttpStatus.CONFLICT);
            assertThat(error.getCodigo()).isEqualTo("RETRO_REVISIONES_AGOTADAS");
        }

        @ParameterizedTest
        @EnumSource(value = Estado.class, names = "NO_REVISADO", mode = EnumSource.Mode.EXCLUDE)
        @DisplayName("fuera de NO_REVISADO la revisión está cerrada")
        void revisionCerrada(Estado estado) {
            ChatException error = catchThrowableOfType(ChatException.class,
                    () -> revision.validarPuedeConversar(retro(estado, 0)));

            assertThat(error.getCodigo()).isEqualTo("RETRO_REVISION_CERRADA");
        }
    }

    @Nested
    @SuppressWarnings("unused")
    @DisplayName("contexto que recibe la IA")
    class Contexto {

        @Test
        @DisplayName("el prompt de sistema es RetroPlani y exige la línea de veredicto")
        void promptSistema() {
            assertThat(revision.promptSistema()).contains("RetroPlani").contains("VEREDICTO: APTO PARA ENVIAR");
        }

        @Test
        @DisplayName("el archivo vigente va junto al mensaje del alumno")
        void archivoJuntoAlMensaje() {
            RetroalimentacionIA retro = retro(Estado.NO_REVISADO, 0);
            retro.setNombreArchivoRevisado("plan.docx");
            retro.setTextoPlanificacion("  Objetivo: resolver ecuaciones.  ");

            String mensaje = revision.conArchivoAdjunto(retro, "Revísala por favor");

            assertThat(mensaje)
                    .startsWith("Revísala por favor")
                    .contains("ARCHIVO ADJUNTO «plan.docx»")
                    .contains("<<<\nObjetivo: resolver ecuaciones.\n>>>")
                    .contains("30 caracteres"); // el texto recortado, sin los espacios de los extremos
        }

        @Test
        @DisplayName("tras cambiar el archivo, la IA no recibe lo conversado sobre la versión anterior")
        void historialVigente() {
            RetroalimentacionIA retro = retro(Estado.NO_REVISADO, 0);
            retro.setMensajesPreviosArchivo(2);
            List<ChatMensaje> historial = List.of(
                    mensaje(1, "Adjunto mi planificación"),
                    mensaje(2, "Tu archivo solo dice hola"),
                    mensaje(3, "Adjunto una versión actualizada"),
                    mensaje(4, "Ahora sí la reviso"));

            assertThat(revision.historialVigente(retro, historial))
                    .extracting(m -> m.getContenido())
                    .containsExactly("Adjunto una versión actualizada", "Ahora sí la reviso");
        }

        private ChatMensaje mensaje(int orden, String contenido) {
            ChatRolMensaje rol = orden % 2 == 1 ? ChatRolMensaje.USER : ChatRolMensaje.ASSISTANT;
            return new ChatMensaje(null, rol, contenido, orden, LocalDateTime.now());
        }
    }

    @Nested
    @SuppressWarnings("unused")
    @DisplayName("eliminar la conversación de una revisión")
    class EliminarDeConversacion {

        @Test
        @DisplayName("en revisión con la IA: elimina la retroalimentación y sus preguntas diagnósticas")
        void eliminaRetroalimentacion() {
            RetroalimentacionIA retro = retro(Estado.NO_REVISADO, 1);
            when(repository.findFirstByConversacionIdConversacion(7L)).thenReturn(Optional.of(retro));

            revision.eliminarDeConversacion(7L);

            verify(jdbcTemplate).update(contains("DELETE rp FROM respuesta_pregunta"), any(Object[].class));
            verify(jdbcTemplate).update(contains("DELETE FROM pregunta_diagnostica"), any(Object[].class));
            verify(repository).delete(retro);
        }

        @ParameterizedTest
        @EnumSource(value = Estado.class, names = {"ESPERANDO_PROFESOR", "APROBADO"})
        @DisplayName("con el profesor o aprobada: se bloquea y no borra nada")
        void protegida(Estado estado) {
            RetroalimentacionIA retro = retro(estado, 1);
            when(repository.findFirstByConversacionIdConversacion(7L)).thenReturn(Optional.of(retro));

            ChatException error = catchThrowableOfType(ChatException.class, () -> revision.eliminarDeConversacion(7L));

            assertThat(error.getCodigo()).isEqualTo("RETRO_CONVERSACION_PROTEGIDA");
            verify(repository, never()).delete(any());
            verify(jdbcTemplate, never()).update(anyString(), any(Object[].class));
        }

        @Test
        @DisplayName("un chat que no es de revisión no toca ninguna retroalimentación")
        void chatNormal() {
            when(repository.findFirstByConversacionIdConversacion(9L)).thenReturn(Optional.empty());

            revision.eliminarDeConversacion(9L);

            verify(repository, never()).delete(any());
        }
    }
}
