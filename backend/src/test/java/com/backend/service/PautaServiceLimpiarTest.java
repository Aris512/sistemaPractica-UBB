package com.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowableOfType;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
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
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import com.backend.dto.PautaDTOs.GuardarAplicacionRequest;
import com.backend.dto.PautaDTOs.RespuestaDTO;
import com.backend.model.Estudiante;
import com.backend.model.Nota;
import com.backend.model.Pauta;
import com.backend.model.PautaAplicacion;
import com.backend.model.PautaCriterio;
import com.backend.model.Practica;
import com.backend.model.Usuario;
import com.backend.repository.NotaDeVozRepository;
import com.backend.repository.NotaRepository;
import com.backend.repository.PautaAplicacionRepository;
import com.backend.repository.PautaRepository;
import com.backend.repository.PracticaRepository;
import com.backend.service.PautaAccesoService.Solicitante;

/**
 * Pauta aplicada: limpiarla elimina el registro del evaluador y la nota que dejó al estudiante, y la nota se
 * registra en la tabla nota al finalizar y se retira al reabrirla.
 */
@ExtendWith(MockitoExtension.class)
class PautaServiceLimpiarTest {

    private static final long PAUTA_ID = 1L;
    private static final long PRACTICA_ID = 2L;
    private static final long APLICACION_ID = 3L;
    private static final String RUT_TUTOR = "11111111-1";

    @Mock private PautaRepository pautaRepository;
    @Mock private PautaAplicacionRepository aplicacionRepository;
    @Mock private PracticaRepository practicaRepository;
    @Mock private PautaAccesoService acceso;
    @Mock private NotaRepository notaRepository;
    @Mock private NotaDeVozRepository notaDeVozRepository;
    @Mock private FileStorageService fileStorageService;
    @InjectMocks private PautaService service;

    private final Pauta pauta = new Pauta();
    private final Practica practica = new Practica();
    private final PautaAplicacion aplicacion = new PautaAplicacion();

    @BeforeEach
    void preparar() {
        pauta.setId(PAUTA_ID);
        practica.setIdPractica(PRACTICA_ID);
        when(pautaRepository.findById(PAUTA_ID)).thenReturn(Optional.of(pauta));
        lenient().when(practicaRepository.findById(PRACTICA_ID)).thenReturn(Optional.of(practica));
        aplicacion.setPauta(pauta);
        aplicacion.setPractica(practica);
        aplicacion.setEvaluadorRut(RUT_TUTOR);
        aplicacion.setEstado(PautaAplicacion.BORRADOR);
        lenient().when(aplicacionRepository.findById(APLICACION_ID)).thenReturn(Optional.of(aplicacion));
    }

    private Solicitante solicitante(String rut, String rol) {
        Usuario u = new Usuario();
        u.setRut(rut);
        Solicitante s = new Solicitante(u, Set.of(rol));
        when(acceso.identificar(rut)).thenReturn(s);
        return s;
    }

    private void conAplicacionPropiaDelTutor() {
        when(aplicacionRepository.findByPautaIdAndPracticaIdPracticaAndEvaluadorRut(PAUTA_ID, PRACTICA_ID, RUT_TUTOR))
            .thenReturn(Optional.of(aplicacion));
    }

    @Test
    @DisplayName("el tutor que completa la pauta en borrador la elimina")
    void evaluadorLimpiaSuBorrador() {
        Solicitante tutor = solicitante(RUT_TUTOR, "TUTOR_PRACTICA");
        conAplicacionPropiaDelTutor();
        when(acceso.puedeEvaluar(tutor, pauta, practica)).thenReturn(true);

        service.limpiarAplicacion(RUT_TUTOR, PAUTA_ID, PRACTICA_ID, null);

        verify(aplicacionRepository).delete(aplicacion);
    }

    @Test
    @DisplayName("el evaluador también elimina su pauta finalizada, junto con la nota que dejó al estudiante")
    void evaluadorEliminaSuPautaFinalizadaYLaNota() {
        Solicitante tutor = solicitante(RUT_TUTOR, "TUTOR_PRACTICA");
        conAplicacionPropiaDelTutor();
        when(acceso.puedeEvaluar(tutor, pauta, practica)).thenReturn(true);
        Nota nota = new Nota(null, new Estudiante(), 6.0, RUT_TUTOR);
        aplicacion.setEstado(PautaAplicacion.FINALIZADA);
        aplicacion.setNota(nota);

        service.limpiarAplicacion(RUT_TUTOR, PAUTA_ID, PRACTICA_ID, null);

        verify(aplicacionRepository).delete(aplicacion);
        verify(notaRepository).delete(nota);
    }

    @Test
    @DisplayName("otro evaluador no puede limpiar la aplicación que completó un colega")
    void otroEvaluadorNoLimpia() {
        Solicitante otro = solicitante("22222222-2", "PROFESOR_COLABORADOR");
        when(acceso.puedeEvaluar(otro, pauta, practica)).thenReturn(true);

        ResponseStatusException error = catchThrowableOfType(ResponseStatusException.class,
            () -> service.limpiarAplicacion("22222222-2", PAUTA_ID, PRACTICA_ID, APLICACION_ID));

        assertThat(error.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        verify(aplicacionRepository, never()).delete(any());
    }

    @Test
    @DisplayName("quien no evalúa esa pauta en la práctica no puede limpiarla")
    void sinAccesoNoLimpia() {
        Solicitante ajeno = solicitante("33333333-3", "PROFESOR_COLABORADOR");
        when(acceso.puedeEvaluar(ajeno, pauta, practica)).thenReturn(false);

        ResponseStatusException error = catchThrowableOfType(ResponseStatusException.class,
            () -> service.limpiarAplicacion("33333333-3", PAUTA_ID, PRACTICA_ID, APLICACION_ID));

        assertThat(error.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        verify(aplicacionRepository, never()).delete(any());
    }

    @Test
    @DisplayName("el coordinador puede limpiar la aplicación de un evaluador, aunque esté finalizada")
    void coordinadorLimpiaFinalizada() {
        solicitante("44444444-4", "COORDINADOR");
        aplicacion.setEstado(PautaAplicacion.FINALIZADA);

        service.limpiarAplicacion("44444444-4", PAUTA_ID, PRACTICA_ID, APLICACION_ID);

        verify(aplicacionRepository).delete(aplicacion);
    }

    @Test
    @DisplayName("si el evaluador no tiene registro guardado no hace nada")
    void sinRegistroNoHaceNada() {
        solicitante(RUT_TUTOR, "TUTOR_PRACTICA");
        when(aplicacionRepository.findByPautaIdAndPracticaIdPracticaAndEvaluadorRut(PAUTA_ID, PRACTICA_ID, RUT_TUTOR))
            .thenReturn(Optional.empty());

        service.limpiarAplicacion(RUT_TUTOR, PAUTA_ID, PRACTICA_ID, null);

        verify(aplicacionRepository, never()).delete(any());
    }

    @Test
    @DisplayName("al finalizar, la nota de la pauta queda en la tabla nota, ligada al estudiante")
    void finalizarRegistraLaNota() {
        Solicitante tutor = solicitante(RUT_TUTOR, "TUTOR_PRACTICA");
        conAplicacionPropiaDelTutor();
        when(acceso.puedeEvaluar(tutor, pauta, practica)).thenReturn(true);
        Estudiante estudiante = new Estudiante();
        practica.setEstudiante(estudiante);
        pauta.setEscalaMax(7);
        pauta.setModoCalculo("PROMEDIO");
        PautaCriterio criterio = new PautaCriterio(pauta, 1, null, "1", "Planifica la clase");
        ReflectionTestUtils.setField(criterio, "id", 10L);
        pauta.getCriterios().add(criterio);
        when(notaRepository.save(any(Nota.class))).thenAnswer(inv -> inv.getArgument(0));
        when(aplicacionRepository.save(aplicacion)).thenReturn(aplicacion);

        service.guardarAplicacion(RUT_TUTOR, PAUTA_ID, PRACTICA_ID,
            new GuardarAplicacionRequest(null, null, "Buen trabajo", List.of(new RespuestaDTO(10L, 6)), true));

        ArgumentCaptor<Nota> guardada = ArgumentCaptor.forClass(Nota.class);
        verify(notaRepository).save(guardada.capture());
        assertThat(guardada.getValue().getEstudiante()).isSameAs(estudiante);
        assertThat(guardada.getValue().getRutEvaluador()).isEqualTo(RUT_TUTOR);
        assertThat(guardada.getValue().getPuntajeObtenido()).isEqualTo(6.0);
        assertThat(guardada.getValue().getEvaluacion()).isNull();
        assertThat(aplicacion.getNota()).isSameAs(guardada.getValue());
    }

    @Test
    @DisplayName("al modificar (reabrir) su pauta, el evaluador retira la nota hasta finalizarla de nuevo")
    void reabrirRetiraLaNota() {
        Solicitante tutor = solicitante(RUT_TUTOR, "TUTOR_PRACTICA");
        conAplicacionPropiaDelTutor();
        when(acceso.puedeEvaluar(tutor, pauta, practica)).thenReturn(true);
        Nota nota = new Nota(null, new Estudiante(), 6.0, RUT_TUTOR);
        aplicacion.setEstado(PautaAplicacion.FINALIZADA);
        aplicacion.setNota(nota);
        when(aplicacionRepository.save(aplicacion)).thenReturn(aplicacion);

        service.reabrir(RUT_TUTOR, PAUTA_ID, PRACTICA_ID, null);

        assertThat(aplicacion.getEstado()).isEqualTo(PautaAplicacion.BORRADOR);
        assertThat(aplicacion.getNota()).isNull();
        verify(notaRepository).delete(nota);
    }
}
