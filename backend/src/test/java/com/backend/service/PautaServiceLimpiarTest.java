package com.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowableOfType;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.Set;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.backend.model.Pauta;
import com.backend.model.PautaAplicacion;
import com.backend.model.Practica;
import com.backend.model.Usuario;
import com.backend.repository.PautaAplicacionRepository;
import com.backend.repository.PautaRepository;
import com.backend.repository.PracticaRepository;
import com.backend.service.PautaAccesoService.Solicitante;

/** "Limpiar" una pauta aplicada: elimina su registro según quién lo pide y en qué estado está. */
@ExtendWith(MockitoExtension.class)
class PautaServiceLimpiarTest {

    private static final long PAUTA_ID = 1L;
    private static final long PRACTICA_ID = 2L;
    private static final String RUT_TUTOR = "11111111-1";

    @Mock private PautaRepository pautaRepository;
    @Mock private PautaAplicacionRepository aplicacionRepository;
    @Mock private PracticaRepository practicaRepository;
    @Mock private PautaAccesoService acceso;
    @InjectMocks private PautaService service;

    private final Pauta pauta = new Pauta();
    private final Practica practica = new Practica();
    private final PautaAplicacion aplicacion = new PautaAplicacion();

    @BeforeEach
    void preparar() {
        when(pautaRepository.findById(PAUTA_ID)).thenReturn(Optional.of(pauta));
        when(practicaRepository.findById(PRACTICA_ID)).thenReturn(Optional.of(practica));
        aplicacion.setEvaluadorRut(RUT_TUTOR);
        aplicacion.setEstado(PautaAplicacion.BORRADOR);
    }

    private Solicitante solicitante(String rut, String rol) {
        Usuario u = new Usuario();
        u.setRut(rut);
        Solicitante s = new Solicitante(u, Set.of(rol));
        when(acceso.identificar(rut)).thenReturn(s);
        return s;
    }

    private void conAplicacionGuardada() {
        when(aplicacionRepository.findByPautaIdAndPracticaIdPractica(PAUTA_ID, PRACTICA_ID))
            .thenReturn(Optional.of(aplicacion));
    }

    @Test
    @DisplayName("el tutor que completa la pauta en borrador la elimina")
    void evaluadorLimpiaSuBorrador() {
        Solicitante tutor = solicitante(RUT_TUTOR, "TUTOR_PRACTICA");
        conAplicacionGuardada();
        when(acceso.puedeEvaluar(tutor, pauta, practica)).thenReturn(true);

        service.limpiarAplicacion(RUT_TUTOR, PAUTA_ID, PRACTICA_ID);

        verify(aplicacionRepository).delete(aplicacion);
    }

    @Test
    @DisplayName("una pauta finalizada no la limpia el evaluador: debe reabrirla el coordinador")
    void finalizadaNoSeLimpiaSinReabrir() {
        Solicitante tutor = solicitante(RUT_TUTOR, "TUTOR_PRACTICA");
        conAplicacionGuardada();
        when(acceso.puedeEvaluar(tutor, pauta, practica)).thenReturn(true);
        aplicacion.setEstado(PautaAplicacion.FINALIZADA);

        ResponseStatusException error = catchThrowableOfType(ResponseStatusException.class,
            () -> service.limpiarAplicacion(RUT_TUTOR, PAUTA_ID, PRACTICA_ID));

        assertThat(error.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        verify(aplicacionRepository, never()).delete(any());
    }

    @Test
    @DisplayName("otro evaluador no puede limpiar la pauta que completó un colega")
    void otroEvaluadorNoLimpia() {
        Solicitante otro = solicitante("22222222-2", "TUTOR_PRACTICA");
        conAplicacionGuardada();
        when(acceso.puedeEvaluar(otro, pauta, practica)).thenReturn(true);

        ResponseStatusException error = catchThrowableOfType(ResponseStatusException.class,
            () -> service.limpiarAplicacion("22222222-2", PAUTA_ID, PRACTICA_ID));

        assertThat(error.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        verify(aplicacionRepository, never()).delete(any());
    }

    @Test
    @DisplayName("quien no evalúa esa pauta en la práctica no puede limpiarla")
    void sinAccesoNoLimpia() {
        Solicitante ajeno = solicitante("33333333-3", "PROFESOR_COLABORADOR");
        conAplicacionGuardada();
        when(acceso.puedeEvaluar(ajeno, pauta, practica)).thenReturn(false);

        ResponseStatusException error = catchThrowableOfType(ResponseStatusException.class,
            () -> service.limpiarAplicacion("33333333-3", PAUTA_ID, PRACTICA_ID));

        assertThat(error.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        verify(aplicacionRepository, never()).delete(any());
    }

    @Test
    @DisplayName("el coordinador puede limpiar incluso una pauta finalizada")
    void coordinadorLimpiaFinalizada() {
        solicitante("44444444-4", "COORDINADOR");
        conAplicacionGuardada();
        aplicacion.setEstado(PautaAplicacion.FINALIZADA);

        service.limpiarAplicacion("44444444-4", PAUTA_ID, PRACTICA_ID);

        verify(aplicacionRepository).delete(aplicacion);
    }

    @Test
    @DisplayName("si no hay registro guardado no hace nada")
    void sinRegistroNoHaceNada() {
        solicitante(RUT_TUTOR, "TUTOR_PRACTICA");
        when(aplicacionRepository.findByPautaIdAndPracticaIdPractica(PAUTA_ID, PRACTICA_ID))
            .thenReturn(Optional.empty());

        service.limpiarAplicacion(RUT_TUTOR, PAUTA_ID, PRACTICA_ID);

        verify(aplicacionRepository, never()).delete(any());
    }
}
