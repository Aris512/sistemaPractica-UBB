package com.backend.service;

import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.backend.model.Pauta;
import com.backend.model.PautaAplicacion;
import com.backend.model.Practica;
import com.backend.model.ProfesorColaborador;
import com.backend.model.Rol;
import com.backend.model.Usuario;
import com.backend.repository.ProfesorRepository;
import com.backend.repository.UsuarioRepository;

/**
 * Reglas de acceso del módulo de pautas: quién puede llenar, quién puede ver y quién puede administrar.
 *
 * Nota: el sistema todavía no tiene sesión ni token. El solicitante se identifica con el encabezado
 * X-User-Rut y sus roles/relaciones se leen de la base de datos. Esto evita errores y usos indebidos
 * desde la interfaz, pero no impide que alguien falsifique el encabezado; para eso hace falta autenticación real.
 */
@Service
public class PautaAccesoService {

    private final UsuarioRepository usuarioRepository;
    private final ProfesorRepository profesorRepository;

    public PautaAccesoService(UsuarioRepository usuarioRepository, ProfesorRepository profesorRepository) {
        this.usuarioRepository = usuarioRepository;
        this.profesorRepository = profesorRepository;
    }

    /** Usuario que hace la petición, con sus roles ya resueltos. */
    public static final class Solicitante {
        private final Usuario usuario;
        private final Set<String> roles;

        Solicitante(Usuario usuario, Set<String> roles) {
            this.usuario = usuario;
            this.roles = roles;
        }

        public Usuario usuario() { return usuario; }
        public String rut() { return usuario.getRut(); }

        public String nombreCompleto() {
            String n = usuario.getNombre() != null ? usuario.getNombre() : "";
            String a = usuario.getApellido() != null ? usuario.getApellido() : "";
            return (n + " " + a).trim();
        }

        private boolean tiene(String fragmento) {
            for (String r : roles) {
                if (r.contains(fragmento)) return true;
            }
            return false;
        }

        public boolean esCoordinador() { return tiene("COORDINADOR"); }
        public boolean esAdmin() { return tiene("ADMIN"); }
        public boolean esColaborador() { return tiene("COLABORADOR"); }
        public boolean esTutor() { return tiene("TUTOR"); }
        public boolean esProfesorAsignatura() { return tiene("PROFESOR_ASIGNATURA"); }
        public boolean esEstudiante() { return tiene("ESTUDIANTE"); }

        /** Coordinador y administrador pueden gestionar el catálogo y reabrir pautas. */
        public boolean puedeGestionar() { return esCoordinador() || esAdmin(); }
    }

    @Transactional(readOnly = true)
    public Solicitante identificar(String rut) {
        if (rut == null || rut.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Debe identificarse para usar las pautas.");
        }
        String limpio = rut.trim();
        Usuario u = usuarioRepository.findByRut(limpio)
            .or(() -> usuarioRepository.findByRut(limpio.toUpperCase(Locale.ROOT)))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario no reconocido."));
        Set<String> roles = new HashSet<>();
        if (u.getRoles() != null) {
            for (Rol r : u.getRoles()) {
                if (r.getNombre() != null) roles.add(r.getNombre().toUpperCase(Locale.ROOT));
            }
        }
        return new Solicitante(u, roles);
    }

    public void exigirGestion(Solicitante s) {
        if (!s.puedeGestionar()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo el coordinador puede realizar esta acción.");
        }
    }

    // ------------------------------------------------------------------ relaciones con la práctica

    public boolean esTutorDe(Solicitante s, Practica p) {
        return p.getTutorPractica() != null
            && p.getTutorPractica().getUsuario() != null
            && s.rut().equalsIgnoreCase(p.getTutorPractica().getUsuario().getRut());
    }

    public boolean esColaboradorDe(Solicitante s, Practica p) {
        if (p.getProfesoresColaboradores() == null) return false;
        for (ProfesorColaborador c : p.getProfesoresColaboradores()) {
            if (c.getUsuario() != null && s.rut().equalsIgnoreCase(c.getUsuario().getRut())) return true;
        }
        return false;
    }

    public boolean esProfesorDeAsignatura(Solicitante s, Practica p) {
        if (p.getAsignatura() == null || !s.esProfesorAsignatura()) return false;
        return profesorRepository.findByUsuarioRut(s.rut())
            .map(pr -> pr.getAsignatura() != null
                && pr.getAsignatura().getIdAsignatura().equals(p.getAsignatura().getIdAsignatura()))
            .orElse(false);
    }

    public boolean esEstudianteDe(Solicitante s, Practica p) {
        return p.getEstudiante() != null
            && p.getEstudiante().getUsuario() != null
            && s.rut().equalsIgnoreCase(p.getEstudiante().getUsuario().getRut());
    }

    // ------------------------------------------------------------------ permisos

    /** Quién puede llenar la pauta: el evaluador que le corresponde, vinculado a esa práctica. */
    public boolean puedeEvaluar(Solicitante s, Pauta pauta, Practica practica) {
        String ev = pauta.getEvaluador();
        if ("COLABORADOR".equals(ev)) return s.esColaborador() && esColaboradorDe(s, practica);
        if ("TUTOR".equals(ev)) return s.esTutor() && esTutorDe(s, practica);
        if ("ACADEMICO".equals(ev)) return s.esProfesorAsignatura() && esProfesorDeAsignatura(s, practica);
        return false;
    }

    /** Quién puede abrir la práctica en el módulo de pautas. */
    public boolean puedeVerPractica(Solicitante s, Practica p) {
        return s.puedeGestionar()
            || esTutorDe(s, p) || esColaboradorDe(s, p)
            || esProfesorDeAsignatura(s, p) || esEstudianteDe(s, p);
    }

    /**
     * Quién puede ver una pauta ya registrada:
     * el coordinador (todas), su propio evaluador (también en borrador), y el profesor de la asignatura
     * y el estudiante, solo cuando está finalizada.
     */
    public boolean puedeVerAplicacion(Solicitante s, PautaAplicacion app) {
        if (s.puedeGestionar()) return true;
        Practica p = app.getPractica();
        if (puedeEvaluar(s, app.getPauta(), p)) return true;
        boolean finalizada = PautaAplicacion.FINALIZADA.equals(app.getEstado());
        return finalizada && (esProfesorDeAsignatura(s, p) || esEstudianteDe(s, p));
    }
}
