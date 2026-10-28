package com.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.Set;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.web.server.ResponseStatusException;

import com.backend.model.Asignatura;
import com.backend.model.Estudiante;
import com.backend.model.Pauta;
import com.backend.model.PautaAplicacion;
import com.backend.model.Practica;
import com.backend.model.Profesor;
import com.backend.model.ProfesorColaborador;
import com.backend.model.Rol;
import com.backend.model.TutorPractica;
import com.backend.model.Usuario;
import com.backend.repository.ProfesorRepository;
import com.backend.repository.UsuarioRepository;
import com.backend.service.PautaAccesoService.Solicitante;

/**
 * Control de acceso del módulo de pautas: quién puede identificarse, evaluar, ver y administrar.
 * Cubre HU-22 (identificación del evaluador) y el filtro por rol (HU-23 y HU-25).
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class PautaAccesoServiceTest {

    private static final String RUT_ESTUDIANTE = "10.000.000-0";
    private static final String RUT_COLABORADOR = "20.000.000-0";
    private static final String RUT_TUTOR = "30.000.000-0";
    private static final String RUT_PROFESOR = "40.000.000-0";
    private static final String RUT_COORDINADOR = "50.000.000-0";
    private static final String RUT_AJENO = "60.000.000-0";

    @Mock private UsuarioRepository usuarioRepository;
    @Mock private ProfesorRepository profesorRepository;

    private PautaAccesoService servicio;
    private Practica practica;

    @BeforeEach
    void preparar() {
        servicio = new PautaAccesoService(usuarioRepository, profesorRepository);

        Asignatura asignatura = new Asignatura();
        asignatura.setIdAsignatura(5L);
        asignatura.setNombre("Práctica Profesional");

        Estudiante estudiante = new Estudiante();
        estudiante.setUsuario(usuario(RUT_ESTUDIANTE));

        ProfesorColaborador colaborador = new ProfesorColaborador();
        colaborador.setUsuario(usuario(RUT_COLABORADOR));

        practica = new Practica();
        practica.setIdPractica(10L);
        practica.setAsignatura(asignatura);
        practica.setEstudiante(estudiante);
        practica.setTutorPractica(new TutorPractica("Tutor Uno", usuario(RUT_TUTOR)));
        practica.setProfesoresColaboradores(Set.of(colaborador));

        Profesor profesorDeLaAsignatura = new Profesor();
        profesorDeLaAsignatura.setUsuario(usuario(RUT_PROFESOR));
        profesorDeLaAsignatura.setAsignatura(asignatura);
        when(profesorRepository.findByUsuarioRut(RUT_PROFESOR)).thenReturn(Optional.of(profesorDeLaAsignatura));

        Asignatura otraAsignatura = new Asignatura();
        otraAsignatura.setIdAsignatura(99L);
        Profesor profesorDeOtraAsignatura = new Profesor();
        profesorDeOtraAsignatura.setUsuario(usuario(RUT_AJENO));
        profesorDeOtraAsignatura.setAsignatura(otraAsignatura);
        when(profesorRepository.findByUsuarioRut(RUT_AJENO)).thenReturn(Optional.of(profesorDeOtraAsignatura));
    }

    // ------------------------------------------------------------------ identificación

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"   "})
    @DisplayName("sin RUT no hay identificación (401)")
    void rechazaSinRut(String rut) {
        assertThatThrownBy(() -> servicio.identificar(rut))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(e -> assertThat(estado(e)).isEqualTo(401));
    }

    @Test
    @DisplayName("un RUT que no existe en el sistema se rechaza (401)")
    void rechazaUsuarioDesconocido() {
        when(usuarioRepository.findByRut("1-9")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> servicio.identificar("1-9"))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(e -> assertThat(estado(e)).isEqualTo(401));
    }

    @Test
    @DisplayName("resuelve los roles del usuario sin importar mayúsculas")
    void resuelveRoles() {
        Usuario u = usuario(RUT_COLABORADOR);
        u.setNombre("Ana");
        u.setApellido("Pérez");
        u.setRoles(Set.of(new Rol("profesor_colaborador", "Colaborador")));
        when(usuarioRepository.findByRut(RUT_COLABORADOR)).thenReturn(Optional.of(u));

        Solicitante s = servicio.identificar(RUT_COLABORADOR);

        assertThat(s.esColaborador()).isTrue();
        assertThat(s.esCoordinador()).isFalse();
        assertThat(s.nombreCompleto()).isEqualTo("Ana Pérez");
    }

    @Test
    @DisplayName("si el RUT trae la K en minúscula, lo busca también en mayúscula")
    void reintentaConKMayuscula() {
        Usuario u = usuario("12.345.678-K");
        when(usuarioRepository.findByRut("12.345.678-k")).thenReturn(Optional.empty());
        when(usuarioRepository.findByRut("12.345.678-K")).thenReturn(Optional.of(u));

        assertThat(servicio.identificar("12.345.678-k").rut()).isEqualTo("12.345.678-K");
    }

    // ------------------------------------------------------------------ quién puede evaluar

    @Test
    @DisplayName("pauta de colaborador: la completa solo el colaborador de esa práctica")
    void colaboradorDeLaPracticaEvalua() {
        Pauta pauta = pauta("COLABORADOR");

        assertThat(servicio.puedeEvaluar(solicitante(RUT_COLABORADOR, "PROFESOR_COLABORADOR"), pauta, practica)).isTrue();
        assertThat(servicio.puedeEvaluar(solicitante(RUT_AJENO, "PROFESOR_COLABORADOR"), pauta, practica)).isFalse();
    }

    @Test
    @DisplayName("pauta de colaborador: ni el tutor ni el coordinador pueden completarla")
    void otrosRolesNoEvaluanPautaDeColaborador() {
        Pauta pauta = pauta("COLABORADOR");

        assertThat(servicio.puedeEvaluar(solicitante(RUT_TUTOR, "TUTOR_PRACTICA"), pauta, practica)).isFalse();
        assertThat(servicio.puedeEvaluar(solicitante(RUT_COORDINADOR, "COORDINADOR"), pauta, practica)).isFalse();
    }

    @Test
    @DisplayName("pauta de tutor: la completa solo el tutor asignado a esa práctica")
    void tutorDeLaPracticaEvalua() {
        Pauta pauta = pauta("TUTOR");

        assertThat(servicio.puedeEvaluar(solicitante(RUT_TUTOR, "TUTOR_PRACTICA"), pauta, practica)).isTrue();
        assertThat(servicio.puedeEvaluar(solicitante(RUT_AJENO, "TUTOR_PRACTICA"), pauta, practica)).isFalse();
        assertThat(servicio.puedeEvaluar(solicitante(RUT_COLABORADOR, "PROFESOR_COLABORADOR"), pauta, practica)).isFalse();
    }

    @Test
    @DisplayName("pauta académica: la completa el profesor de la asignatura de la práctica, no el de otra")
    void profesorDeLaAsignaturaEvalua() {
        Pauta pauta = pauta("ACADEMICO");

        assertThat(servicio.puedeEvaluar(solicitante(RUT_PROFESOR, "PROFESOR_ASIGNATURA"), pauta, practica)).isTrue();
        assertThat(servicio.puedeEvaluar(solicitante(RUT_AJENO, "PROFESOR_ASIGNATURA"), pauta, practica)).isFalse();
    }

    @Test
    @DisplayName("una pauta sin evaluador definido no la puede completar nadie")
    void pautaSinEvaluador() {
        assertThat(servicio.puedeEvaluar(solicitante(RUT_COLABORADOR, "PROFESOR_COLABORADOR"), pauta(null), practica)).isFalse();
    }

    // ------------------------------------------------------------------ quién puede ver

    @Test
    @DisplayName("el coordinador ve toda pauta registrada, incluso en borrador")
    void coordinadorVeTodo() {
        PautaAplicacion borrador = aplicacion(PautaAplicacion.BORRADOR);

        assertThat(servicio.puedeVerAplicacion(solicitante(RUT_COORDINADOR, "COORDINADOR"), borrador)).isTrue();
    }

    @Test
    @DisplayName("el evaluador ve su pauta también en borrador")
    void evaluadorVeSuBorrador() {
        PautaAplicacion borrador = aplicacion(PautaAplicacion.BORRADOR);

        assertThat(servicio.puedeVerAplicacion(solicitante(RUT_COLABORADOR, "PROFESOR_COLABORADOR"), borrador)).isTrue();
    }

    @Test
    @DisplayName("el estudiante ve su pauta solo cuando está finalizada")
    void estudianteSoloVeFinalizadas() {
        Solicitante estudiante = solicitante(RUT_ESTUDIANTE, "ESTUDIANTE");

        assertThat(servicio.puedeVerAplicacion(estudiante, aplicacion(PautaAplicacion.BORRADOR))).isFalse();
        assertThat(servicio.puedeVerAplicacion(estudiante, aplicacion(PautaAplicacion.FINALIZADA))).isTrue();
    }

    @Test
    @DisplayName("un estudiante no ve las pautas de la práctica de otro estudiante")
    void estudianteNoVePautasAjenas() {
        Solicitante otro = solicitante("70.000.000-0", "ESTUDIANTE");

        assertThat(servicio.puedeVerAplicacion(otro, aplicacion(PautaAplicacion.FINALIZADA))).isFalse();
    }

    @Test
    @DisplayName("el profesor de la asignatura ve las pautas finalizadas de sus estudiantes, no los borradores")
    void profesorSoloVeFinalizadas() {
        Solicitante profesor = solicitante(RUT_PROFESOR, "PROFESOR_ASIGNATURA");

        assertThat(servicio.puedeVerAplicacion(profesor, aplicacion(PautaAplicacion.BORRADOR))).isFalse();
        assertThat(servicio.puedeVerAplicacion(profesor, aplicacion(PautaAplicacion.FINALIZADA))).isTrue();
    }

    @Test
    @DisplayName("un profesor de otra asignatura no ve las pautas de esta práctica (HU-25)")
    void profesorAjenoNoVe() {
        Solicitante ajeno = solicitante(RUT_AJENO, "PROFESOR_ASIGNATURA");

        assertThat(servicio.puedeVerAplicacion(ajeno, aplicacion(PautaAplicacion.FINALIZADA))).isFalse();
    }

    @Test
    @DisplayName("un colaborador de otra práctica no ve esta pauta")
    void colaboradorAjenoNoVe() {
        Solicitante ajeno = solicitante(RUT_AJENO, "PROFESOR_COLABORADOR");

        assertThat(servicio.puedeVerAplicacion(ajeno, aplicacion(PautaAplicacion.FINALIZADA))).isFalse();
    }

    @Test
    @DisplayName("abrir una práctica en el módulo: coordinador y participantes sí; ajenos no")
    void puedeVerPractica() {
        assertThat(servicio.puedeVerPractica(solicitante(RUT_COORDINADOR, "COORDINADOR"), practica)).isTrue();
        assertThat(servicio.puedeVerPractica(solicitante(RUT_ESTUDIANTE, "ESTUDIANTE"), practica)).isTrue();
        assertThat(servicio.puedeVerPractica(solicitante(RUT_COLABORADOR, "PROFESOR_COLABORADOR"), practica)).isTrue();
        assertThat(servicio.puedeVerPractica(solicitante(RUT_TUTOR, "TUTOR_PRACTICA"), practica)).isTrue();
        assertThat(servicio.puedeVerPractica(solicitante(RUT_PROFESOR, "PROFESOR_ASIGNATURA"), practica)).isTrue();
        assertThat(servicio.puedeVerPractica(solicitante("70.000.000-0", "ESTUDIANTE"), practica)).isFalse();
        assertThat(servicio.puedeVerPractica(solicitante(RUT_AJENO, "PROFESOR_COLABORADOR"), practica)).isFalse();
    }

    // ------------------------------------------------------------------ administración

    @Test
    @DisplayName("coordinador y administrador pueden gestionar el catálogo")
    void gestionPermitida() {
        assertThatCode(() -> servicio.exigirGestion(solicitante(RUT_COORDINADOR, "COORDINADOR")))
                .doesNotThrowAnyException();
        assertThatCode(() -> servicio.exigirGestion(solicitante(RUT_COORDINADOR, "ADMIN")))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("cualquier otro rol que intente gestionar recibe 403")
    void gestionDenegada() {
        assertThatThrownBy(() -> servicio.exigirGestion(solicitante(RUT_COLABORADOR, "PROFESOR_COLABORADOR")))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(e -> assertThat(estado(e)).isEqualTo(403));
        assertThatThrownBy(() -> servicio.exigirGestion(solicitante(RUT_ESTUDIANTE, "ESTUDIANTE")))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(e -> assertThat(estado(e)).isEqualTo(403));
    }

    // ------------------------------------------------------------------ utilidades

    private static int estado(Throwable e) {
        return ((ResponseStatusException) e).getStatusCode().value();
    }

    private static Usuario usuario(String rut) {
        Usuario u = new Usuario();
        u.setRut(rut);
        return u;
    }

    private static Solicitante solicitante(String rut, String... roles) {
        return new Solicitante(usuario(rut), Set.of(roles));
    }

    private static Pauta pauta(String evaluador) {
        Pauta p = new Pauta();
        p.setEvaluador(evaluador);
        return p;
    }

    /** Pauta de colaborador ya registrada para la práctica de prueba, en el estado indicado. */
    private PautaAplicacion aplicacion(String estado) {
        PautaAplicacion a = new PautaAplicacion();
        a.setPauta(pauta("COLABORADOR"));
        a.setPractica(practica);
        a.setEstado(estado);
        return a;
    }
}
