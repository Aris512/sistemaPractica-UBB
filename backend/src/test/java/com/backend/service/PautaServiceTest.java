package com.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import com.backend.dto.PautaDTOs.AplicacionDTO;
import com.backend.dto.PautaDTOs.CriterioRequest;
import com.backend.dto.PautaDTOs.GuardarAplicacionRequest;
import com.backend.dto.PautaDTOs.PautaDetalleDTO;
import com.backend.dto.PautaDTOs.PautaRequest;
import com.backend.dto.PautaDTOs.RespuestaDTO;
import com.backend.model.Pauta;
import com.backend.model.PautaAplicacion;
import com.backend.model.PautaCriterio;
import com.backend.model.Practica;
import com.backend.model.Usuario;
import com.backend.repository.PautaAplicacionRepository;
import com.backend.repository.PautaRepository;
import com.backend.repository.PracticaRepository;
import com.backend.service.PautaAccesoService.Solicitante;

/**
 * HU-21 (gestión de pautas) y HU-05 (evaluación digital): cálculo de nota, validación de puntajes,
 * finalización, identificación del evaluador y protección de pautas con evaluaciones registradas.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class PautaServiceTest {

    private static final String RUT_EVALUADOR = "11.111.111-1";
    private static final String RUT_COORDINADOR = "22.222.222-2";

    @Mock private PautaRepository pautaRepository;
    @Mock private PautaAplicacionRepository aplicacionRepository;
    @Mock private PracticaRepository practicaRepository;
    @Mock private PautaAccesoService acceso;

    private PautaService servicio;

    @BeforeEach
    void preparar() {
        servicio = new PautaService(pautaRepository, aplicacionRepository, practicaRepository, acceso);
    }

    // ------------------------------------------------------------------ cálculo de nota

    @ParameterizedTest(name = "{0} de 133 puntos → nota {1}")
    @CsvSource({
            "0, 2.0", "10, 2.3", "20, 2.5", "30, 2.8", "40, 3.0", "45, 3.1", "50, 3.3", "60, 3.5",
            "63, 3.6", "70, 3.8", "77, 3.9", "78, 4.0", "80, 4.0", "81, 4.1", "90, 4.6", "95, 4.9",
            "100, 5.1", "110, 5.7", "119, 6.2", "120, 6.3", "129, 6.8", "132, 6.9", "133, 7.0",
    })
    @DisplayName("escala con exigencia 60 %: reproduce la tabla de la pauta en papel (133 puntos)")
    void notaCoincideConLaTablaDelWord(int puntaje, double esperada) {
        Pauta pauta = new Pauta();
        pauta.setModoCalculo("ESCALA_EXIGENCIA");
        pauta.setExigencia(60);

        assertThat(PautaService.calcularNota(pauta, puntaje, 19, 133)).isEqualTo(esperada);
    }

    @Test
    @DisplayName("sin exigencia indicada se usa 60 %")
    void exigenciaPorDefecto() {
        Pauta pauta = new Pauta();
        pauta.setModoCalculo("ESCALA_EXIGENCIA");

        assertThat(PautaService.calcularNota(pauta, 80, 19, 133)).isEqualTo(4.0);
    }

    @ParameterizedTest(name = "{0} puntos en {1} criterios → nota {2}")
    @CsvSource({"100, 20, 5.0", "140, 20, 7.0", "94, 20, 4.7", "20, 20, 1.0"})
    @DisplayName("modo PROMEDIO: la nota es el promedio de los puntajes")
    void notaPorPromedio(int puntaje, int criterios, double esperada) {
        Pauta pauta = new Pauta();
        pauta.setModoCalculo("PROMEDIO");

        assertThat(PautaService.calcularNota(pauta, puntaje, criterios, criterios * 7.0)).isEqualTo(esperada);
    }

    // ------------------------------------------------------------------ evaluación digital (HU-05)

    @Test
    @DisplayName("un puntaje fuera de la escala de la pauta se rechaza (400)")
    void rechazaPuntajeFueraDeEscala() {
        prepararEvaluacion(pautaConDosCriterios(), Optional.empty());

        GuardarAplicacionRequest req = guardar(List.of(new RespuestaDTO(1L, 8)), false);

        assertThatThrownBy(() -> servicio.guardarAplicacion(RUT_EVALUADOR, 1L, 10L, req))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(e -> assertThat(estado(e)).isEqualTo(400));
    }

    @Test
    @DisplayName("el puntaje debe ser mayor o igual al mínimo de la escala (2..7 en pautas de aula)")
    void rechazaPuntajeBajoElMinimo() {
        prepararEvaluacion(pautaConDosCriterios(), Optional.empty());

        GuardarAplicacionRequest req = guardar(List.of(new RespuestaDTO(1L, 1)), false);

        assertThatThrownBy(() -> servicio.guardarAplicacion(RUT_EVALUADOR, 1L, 10L, req))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(e -> assertThat(estado(e)).isEqualTo(400));
    }

    @Test
    @DisplayName("un criterio que no pertenece a la pauta se rechaza (400)")
    void rechazaCriterioAjeno() {
        prepararEvaluacion(pautaConDosCriterios(), Optional.empty());

        GuardarAplicacionRequest req = guardar(List.of(new RespuestaDTO(999L, 5)), false);

        assertThatThrownBy(() -> servicio.guardarAplicacion(RUT_EVALUADOR, 1L, 10L, req))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(e -> assertThat(estado(e)).isEqualTo(400));
    }

    @Test
    @DisplayName("guardar un borrador parcial no calcula nota y deja la pauta en BORRADOR")
    void borradorParcialNoTieneNota() {
        prepararEvaluacion(pautaConDosCriterios(), Optional.empty());

        AplicacionDTO dto = servicio.guardarAplicacion(RUT_EVALUADOR, 1L, 10L,
                guardar(List.of(new RespuestaDTO(1L, 6)), false));

        assertThat(dto.estado()).isEqualTo(PautaAplicacion.BORRADOR);
        assertThat(dto.respondidos()).isEqualTo(1);
        assertThat(dto.totalCriterios()).isEqualTo(2);
        assertThat(dto.nota()).isNull();
    }

    @Test
    @DisplayName("no se puede finalizar con criterios sin responder (400)")
    void noFinalizaIncompleta() {
        prepararEvaluacion(pautaConDosCriterios(), Optional.empty());

        GuardarAplicacionRequest req = guardar(List.of(new RespuestaDTO(1L, 6)), true);

        assertThatThrownBy(() -> servicio.guardarAplicacion(RUT_EVALUADOR, 1L, 10L, req))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(e -> assertThat(estado(e)).isEqualTo(400));
    }

    @Test
    @DisplayName("al finalizar una pauta completa se calcula la nota y queda FINALIZADA")
    void finalizaCompletaYCalculaNota() {
        prepararEvaluacion(pautaConDosCriterios(), Optional.empty());

        AplicacionDTO dto = servicio.guardarAplicacion(RUT_EVALUADOR, 1L, 10L,
                guardar(List.of(new RespuestaDTO(1L, 7), new RespuestaDTO(2L, 7)), true));

        assertThat(dto.estado()).isEqualTo(PautaAplicacion.FINALIZADA);
        assertThat(dto.puntajeObtenido()).isEqualTo(14.0);
        assertThat(dto.puntajeMaximo()).isEqualTo(14.0);
        assertThat(dto.nota()).isEqualTo(7.0);
        assertThat(dto.fechaFinalizacion()).isNotNull();
    }

    @Test
    @DisplayName("el evaluador se toma de quien hace la petición, no de lo que envíe el cliente")
    void evaluadorSeTomaDelSolicitante() {
        prepararEvaluacion(pautaConDosCriterios(), Optional.empty());
        GuardarAplicacionRequest conEvaluadorFalso = new GuardarAplicacionRequest(
                "99.999.999-9", "Otra Persona", "obs", List.of(new RespuestaDTO(1L, 5)), false);

        AplicacionDTO dto = servicio.guardarAplicacion(RUT_EVALUADOR, 1L, 10L, conEvaluadorFalso);

        assertThat(dto.evaluadorRut()).isEqualTo(RUT_EVALUADOR);
        assertThat(dto.evaluadorNombre()).isEqualTo("Ana Pérez");
    }

    @Test
    @DisplayName("quien no es el evaluador que corresponde no puede completar la pauta (403)")
    void rechazaAQuienNoLeCorresponde() {
        Pauta pauta = pautaConDosCriterios();
        prepararEvaluacion(pauta, Optional.empty());
        when(acceso.puedeEvaluar(any(), any(), any())).thenReturn(false);

        GuardarAplicacionRequest req = guardar(List.of(new RespuestaDTO(1L, 5)), false);

        assertThatThrownBy(() -> servicio.guardarAplicacion(RUT_EVALUADOR, 1L, 10L, req))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(e -> assertThat(estado(e)).isEqualTo(403));
        verify(aplicacionRepository, never()).save(any());
    }

    @Test
    @DisplayName("una pauta iniciada por otro evaluador no puede ser tomada por alguien más (409)")
    void rechazaOtroEvaluador() {
        Pauta pauta = pautaConDosCriterios();
        PautaAplicacion existente = aplicacionExistente(pauta, "55.555.555-5", PautaAplicacion.BORRADOR);
        prepararEvaluacion(pauta, Optional.of(existente));

        GuardarAplicacionRequest req = guardar(List.of(new RespuestaDTO(1L, 5)), false);

        assertThatThrownBy(() -> servicio.guardarAplicacion(RUT_EVALUADOR, 1L, 10L, req))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(e -> assertThat(estado(e)).isEqualTo(409));
    }

    @Test
    @DisplayName("una pauta ya finalizada no se puede seguir modificando (409)")
    void rechazaEditarFinalizada() {
        Pauta pauta = pautaConDosCriterios();
        PautaAplicacion existente = aplicacionExistente(pauta, RUT_EVALUADOR, PautaAplicacion.FINALIZADA);
        prepararEvaluacion(pauta, Optional.of(existente));

        GuardarAplicacionRequest req = guardar(List.of(new RespuestaDTO(1L, 5)), false);

        assertThatThrownBy(() -> servicio.guardarAplicacion(RUT_EVALUADOR, 1L, 10L, req))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(e -> assertThat(estado(e)).isEqualTo(409));
    }

    @Test
    @DisplayName("sin identificarse (sin RUT) no se puede guardar una evaluación (401)")
    void exigeIdentificacion() {
        when(acceso.identificar(null))
                .thenThrow(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Debe identificarse"));

        assertThatThrownBy(() -> servicio.guardarAplicacion(null, 1L, 10L, guardar(List.of(), false)))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(e -> assertThat(estado(e)).isEqualTo(401));
    }

    // ------------------------------------------------------------------ gestión de pautas (HU-21)

    @Test
    @DisplayName("solo el coordinador puede crear pautas: otro rol recibe 403 y no se guarda nada")
    void soloCoordinadorCrea() {
        doThrow(new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo el coordinador"))
                .when(acceso).exigirGestion(any());

        assertThatThrownBy(() -> servicio.crear(RUT_EVALUADOR, solicitudValida()))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(e -> assertThat(estado(e)).isEqualTo(403));
        verify(pautaRepository, never()).save(any());
    }

    @Test
    @DisplayName("crear una pauta válida guarda sus criterios en orden y numerados")
    void creaPautaValida() {
        coordinadorIdentificado();
        when(pautaRepository.existsByCodigo("PED-ESP-1-COL")).thenReturn(false);
        when(pautaRepository.save(any(Pauta.class))).thenAnswer(inv -> inv.getArgument(0));

        PautaDetalleDTO dto = servicio.crear(RUT_COORDINADOR, solicitudValida());

        assertThat(dto.codigo()).isEqualTo("PED-ESP-1-COL");
        assertThat(dto.criterios()).hasSize(2);
        assertThat(dto.criterios().get(0).orden()).isEqualTo(1);
        assertThat(dto.criterios().get(1).numero()).isEqualTo("2");
        assertThat(dto.puntajeMaximo()).isEqualTo(14);
        assertThat(dto.tieneEvaluaciones()).isFalse();
    }

    @Test
    @DisplayName("crear exige código y título (400)")
    void creaExigeCodigoYTitulo() {
        coordinadorIdentificado();
        PautaRequest sinTitulo = solicitud("X-1", " ", "Práctica Pedagógica", "COLABORADOR", "PRIMERA",
                "ESPECIALIDAD", 2, 7, criteriosDeEjemplo());

        assertThatThrownBy(() -> servicio.crear(RUT_COORDINADOR, sinTitulo))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(e -> assertThat(estado(e)).isEqualTo(400));
    }

    @Test
    @DisplayName("un evaluador que no existe en el sistema se rechaza (400)")
    void rechazaEvaluadorInvalido() {
        coordinadorIdentificado();
        PautaRequest req = solicitud("X-2", "Pauta", "Práctica Pedagógica", "DIRECTOR", "PRIMERA",
                "ESPECIALIDAD", 2, 7, criteriosDeEjemplo());

        assertThatThrownBy(() -> servicio.crear(RUT_COORDINADOR, req))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(e -> assertThat(estado(e)).isEqualTo(400));
    }

    @Test
    @DisplayName("una pauta sin ningún indicador se rechaza (400)")
    void rechazaPautaSinCriterios() {
        coordinadorIdentificado();
        PautaRequest req = solicitud("X-3", "Pauta", "Práctica Pedagógica", "COLABORADOR", "PRIMERA",
                "ESPECIALIDAD", 2, 7, List.of());

        assertThatThrownBy(() -> servicio.crear(RUT_COORDINADOR, req))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(e -> assertThat(estado(e)).isEqualTo(400));
    }

    @Test
    @DisplayName("una escala con mínimo mayor o igual al máximo se rechaza (400)")
    void rechazaEscalaInvertida() {
        coordinadorIdentificado();
        PautaRequest req = solicitud("X-4", "Pauta", "Práctica Pedagógica", "COLABORADOR", "PRIMERA",
                "ESPECIALIDAD", 7, 2, criteriosDeEjemplo());

        assertThatThrownBy(() -> servicio.crear(RUT_COORDINADOR, req))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(e -> assertThat(estado(e)).isEqualTo(400));
    }

    @Test
    @DisplayName("no se pueden crear dos pautas con el mismo código (409)")
    void rechazaCodigoDuplicado() {
        coordinadorIdentificado();
        when(pautaRepository.existsByCodigo("PED-ESP-1-COL")).thenReturn(true);

        assertThatThrownBy(() -> servicio.crear(RUT_COORDINADOR, solicitudValida()))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(e -> assertThat(estado(e)).isEqualTo(409));
        verify(pautaRepository, never()).save(any());
    }

    @Test
    @DisplayName("con evaluaciones registradas no se pueden cambiar los criterios (409)")
    void bloqueaCriteriosConEvaluaciones() {
        coordinadorIdentificado();
        Pauta pauta = pautaConDosCriterios();
        when(pautaRepository.findById(1L)).thenReturn(Optional.of(pauta));
        when(aplicacionRepository.existsByPautaId(1L)).thenReturn(true);

        assertThatThrownBy(() -> servicio.actualizar(RUT_COORDINADOR, 1L, solicitudValida()))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(e -> assertThat(estado(e)).isEqualTo(409));
        verify(pautaRepository, never()).save(any());
    }

    @Test
    @DisplayName("con evaluaciones registradas tampoco se puede cambiar el evaluador ni la escala (409)")
    void bloqueaCambiosEstructurales() {
        coordinadorIdentificado();
        Pauta pauta = pautaConDosCriterios();
        when(pautaRepository.findById(1L)).thenReturn(Optional.of(pauta));
        when(aplicacionRepository.existsByPautaId(1L)).thenReturn(true);
        PautaRequest cambiaEvaluador = new PautaRequest(null, null, null, null, null, null, "TUTOR",
                null, null, null, null, null, null, null, null, null);

        assertThatThrownBy(() -> servicio.actualizar(RUT_COORDINADOR, 1L, cambiaEvaluador))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(e -> assertThat(estado(e)).isEqualTo(409));
    }

    @Test
    @DisplayName("con evaluaciones registradas sí se puede editar el título")
    void permiteEditarTituloConEvaluaciones() {
        coordinadorIdentificado();
        Pauta pauta = pautaConDosCriterios();
        when(pautaRepository.findById(1L)).thenReturn(Optional.of(pauta));
        when(aplicacionRepository.existsByPautaId(1L)).thenReturn(true);
        when(pautaRepository.save(any(Pauta.class))).thenAnswer(inv -> inv.getArgument(0));
        PautaRequest soloTitulo = new PautaRequest(null, "Título nuevo", null, null, null, null, null,
                null, null, null, null, null, null, null, null, null);

        PautaDetalleDTO dto = servicio.actualizar(RUT_COORDINADOR, 1L, soloTitulo);

        assertThat(dto.titulo()).isEqualTo("Título nuevo");
        assertThat(dto.criterios()).hasSize(2);
    }

    @Test
    @DisplayName("una pauta con evaluaciones no se elimina: se desactiva (409)")
    void noEliminaConEvaluaciones() {
        coordinadorIdentificado();
        when(pautaRepository.findById(1L)).thenReturn(Optional.of(pautaConDosCriterios()));
        when(aplicacionRepository.existsByPautaId(1L)).thenReturn(true);

        assertThatThrownBy(() -> servicio.eliminar(RUT_COORDINADOR, 1L))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(e -> assertThat(estado(e)).isEqualTo(409));
        verify(pautaRepository, never()).deleteById(any());
    }

    @Test
    @DisplayName("una pauta sin evaluaciones sí se puede eliminar")
    void eliminaSinEvaluaciones() {
        coordinadorIdentificado();
        when(pautaRepository.findById(1L)).thenReturn(Optional.of(pautaConDosCriterios()));
        when(aplicacionRepository.existsByPautaId(1L)).thenReturn(false);

        servicio.eliminar(RUT_COORDINADOR, 1L);

        verify(pautaRepository).deleteById(1L);
    }

    // ------------------------------------------------------------------ utilidades

    private static int estado(Throwable e) {
        return ((ResponseStatusException) e).getStatusCode().value();
    }

    private static Usuario usuario(String rut, String nombre, String apellido) {
        Usuario u = new Usuario();
        u.setRut(rut);
        u.setNombre(nombre);
        u.setApellido(apellido);
        return u;
    }

    private void coordinadorIdentificado() {
        when(acceso.identificar(RUT_COORDINADOR))
                .thenReturn(new Solicitante(usuario(RUT_COORDINADOR, "Carla", "Soto"), Set.of("COORDINADOR")));
    }

    /** Pauta de aula: 2 criterios, escala 2..7, puntaje máximo 14, nota con exigencia 60 %. */
    private static Pauta pautaConDosCriterios() {
        Pauta p = new Pauta();
        ReflectionTestUtils.setField(p, "id", 1L);
        p.setCodigo("PED-ESP-1-COL");
        p.setTitulo("Primera observación – Especialidad");
        p.setAsignatura("Práctica Pedagógica");
        p.setEvaluador("COLABORADOR");
        p.setMomento("PRIMERA");
        p.setEspecialidad("ESPECIALIDAD");
        p.setEscalaMin(2);
        p.setEscalaMax(7);
        p.setModoCalculo("ESCALA_EXIGENCIA");
        p.setExigencia(60);
        for (int i = 1; i <= 2; i++) {
            PautaCriterio c = new PautaCriterio(p, i, "DIMENSIÓN A", String.valueOf(i), "Indicador " + i);
            ReflectionTestUtils.setField(c, "id", (long) i);
            p.getCriterios().add(c);
        }
        p.setCriteriosCount(2);
        return p;
    }

    private void prepararEvaluacion(Pauta pauta, Optional<PautaAplicacion> existente) {
        Practica practica = new Practica();
        practica.setIdPractica(10L);
        when(acceso.identificar(RUT_EVALUADOR)).thenReturn(new Solicitante(
                usuario(RUT_EVALUADOR, "Ana", "Pérez"), Set.of("PROFESOR_COLABORADOR")));
        when(pautaRepository.findById(1L)).thenReturn(Optional.of(pauta));
        when(practicaRepository.findById(10L)).thenReturn(Optional.of(practica));
        when(acceso.puedeEvaluar(any(), any(), any())).thenReturn(true);
        when(aplicacionRepository.findByPautaIdAndPracticaIdPractica(1L, 10L)).thenReturn(existente);
        when(aplicacionRepository.save(any(PautaAplicacion.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    private static PautaAplicacion aplicacionExistente(Pauta pauta, String rutEvaluador, String estado) {
        Practica practica = new Practica();
        practica.setIdPractica(10L);
        PautaAplicacion app = new PautaAplicacion();
        app.setPauta(pauta);
        app.setPractica(practica);
        app.setEvaluadorRut(rutEvaluador);
        app.setEstado(estado);
        return app;
    }

    private static GuardarAplicacionRequest guardar(List<RespuestaDTO> respuestas, boolean finalizar) {
        return new GuardarAplicacionRequest(null, null, null, respuestas, finalizar);
    }

    private static List<CriterioRequest> criteriosDeEjemplo() {
        return List.of(new CriterioRequest("DIMENSIÓN A", null, "Indicador uno"),
                       new CriterioRequest("DIMENSIÓN A", null, "Indicador dos"));
    }

    private static PautaRequest solicitud(String codigo, String titulo, String asignatura, String evaluador,
                                          String momento, String especialidad, Integer min, Integer max,
                                          List<CriterioRequest> criterios) {
        return new PautaRequest(codigo, titulo, asignatura, "Observación de aula", especialidad, momento,
                evaluador, min, max, "ESCALA_EXIGENCIA", 60, null, null, "2025-2", true, criterios);
    }

    private static PautaRequest solicitudValida() {
        return solicitud("PED-ESP-1-COL", "Primera observación – Especialidad", "Práctica Pedagógica",
                "COLABORADOR", "PRIMERA", "ESPECIALIDAD", 2, 7, criteriosDeEjemplo());
    }
}
