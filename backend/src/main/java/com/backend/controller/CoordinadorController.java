package com.backend.controller;

import java.text.Normalizer;
import java.util.ArrayList;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.backend.model.Asignatura;
import com.backend.model.CentroPractica;
import com.backend.model.Estudiante;
import com.backend.model.Practica;
import com.backend.model.ProfesorColaborador;
import com.backend.model.TutorPractica;
import com.backend.model.Usuario;
import com.backend.repository.AsignaturaRepository;
import com.backend.repository.CentroPracticaRepository;
import com.backend.repository.EstudianteRepository;
import com.backend.repository.PracticaRepository;
import com.backend.repository.ProfesorColaboradorRepository;
import com.backend.repository.TutorPracticaRepository;

@RestController
@RequestMapping("/api/coordinador")
@CrossOrigin(origins = "*")
public class CoordinadorController {

    private final EstudianteRepository estudianteRepository;
    private final AsignaturaRepository asignaturaRepository;
    private final CentroPracticaRepository centroPracticaRepository;
    private final TutorPracticaRepository tutorPracticaRepository;
    private final ProfesorColaboradorRepository profesorColaboradorRepository;
    private final PracticaRepository practicaRepository;

    public CoordinadorController(EstudianteRepository estudianteRepository,
                                 AsignaturaRepository asignaturaRepository,
                                 CentroPracticaRepository centroPracticaRepository,
                                 TutorPracticaRepository tutorPracticaRepository,
                                 ProfesorColaboradorRepository profesorColaboradorRepository,
                                 PracticaRepository practicaRepository) {
        this.estudianteRepository = estudianteRepository;
        this.asignaturaRepository = asignaturaRepository;
        this.centroPracticaRepository = centroPracticaRepository;
        this.tutorPracticaRepository = tutorPracticaRepository;
        this.profesorColaboradorRepository = profesorColaboradorRepository;
        this.practicaRepository = practicaRepository;
    }

    /**
     * Determina si una asignatura corresponde a Práctica Pedagógica o Práctica Profesional.
     */
    private boolean esAsignaturaPractica(Asignatura asig) {
        if (asig == null || asig.getNombre() == null) {
            return false;
        }
        String normalizado = Normalizer.normalize(asig.getNombre(), Normalizer.Form.NFD)
            .replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
            .toUpperCase()
            .trim();
        return normalizado.contains("PRACTICA") &&
               (normalizado.contains("PEDAGOGICA") || normalizado.contains("PROFESIONAL"));
    }

    /**
     * Retorna únicamente las asignaturas de práctica: Práctica Pedagógica y Práctica Profesional.
     */
    @GetMapping("/asignaturas-practica")
    public ResponseEntity<List<Map<String, Object>>> obtenerAsignaturasPractica() {
        List<Asignatura> todas = asignaturaRepository.findAll();
        List<Map<String, Object>> resultado = todas.stream()
            .filter(this::esAsignaturaPractica)
            .map(a -> {
                Map<String, Object> map = new HashMap<>();
                map.put("idAsignatura", a.getIdAsignatura());
                map.put("nombre", a.getNombre());
                map.put("descripcion", a.getDescripcion());
                map.put("semestre", a.getSemestre());
                return map;
            })
            .collect(Collectors.toList());

        return ResponseEntity.ok(resultado);
    }

    /**
     * Retorna el listado simple de estudiantes que pertenecen EXCLUSIVAMENTE a:
     * - Práctica Pedagógica
     * - Práctica Profesional
     * Sin columnas innecesarias (RUT, teléfono, etc. sólo expuestos internamente si es necesario).
     */
    @GetMapping("/estudiantes-practica")
    public ResponseEntity<List<Map<String, Object>>> obtenerEstudiantesPractica() {
        List<Estudiante> todos = estudianteRepository.findAll();
        List<Map<String, Object>> resultado = new ArrayList<>();

        for (Estudiante est : todos) {
            if (est.getAsignatura() == null || !esAsignaturaPractica(est.getAsignatura())) {
                continue;
            }

            Usuario u = est.getUsuario();
            if (u != null && (!u.isActivo() || "inactivo".equalsIgnoreCase(u.getEstado()))) {
                continue;
            }
            if ("INACTIVO".equalsIgnoreCase(est.getEstado())) {
                continue;
            }

            String nombreCompleto = u != null ? (u.getNombre() + " " + u.getApellido()).trim() : "Estudiante";

            // Buscar si ya tiene una práctica asociada
            List<Practica> practicasEst = practicaRepository.findByEstudianteIdEstudiante(est.getIdEstudiante());
            Practica practicaActiva = (practicasEst != null && !practicasEst.isEmpty()) ? practicasEst.get(0) : null;

            Map<String, Object> dto = new HashMap<>();
            dto.put("idEstudiante", est.getIdEstudiante());
            dto.put("nombre", nombreCompleto);
            dto.put("rut", u != null ? u.getRut() : "");
            dto.put("idAsignatura", est.getAsignatura().getIdAsignatura());
            dto.put("asignaturaNombre", est.getAsignatura().getNombre());
            dto.put("tieneAsociacion", practicaActiva != null);
            dto.put("idPractica", practicaActiva != null ? practicaActiva.getIdPractica() : null);

            if (practicaActiva != null) {
                dto.put("tutorNombre", practicaActiva.getTutorPractica() != null ? practicaActiva.getTutorPractica().getNombre() : "Sin asignar");
                dto.put("centroNombre", practicaActiva.getCentroPractica() != null ? practicaActiva.getCentroPractica().getNombre() : "Sin asignar");
                if (practicaActiva.getProfesoresColaboradores() != null && !practicaActiva.getProfesoresColaboradores().isEmpty()) {
                    ProfesorColaborador colab = practicaActiva.getProfesoresColaboradores().iterator().next();
                    String colabNom = (colab.getUsuario() != null) ? colab.getUsuario().getNombre() + " " + colab.getUsuario().getApellido() : "Sin asignar";
                    dto.put("colaboradorNombre", colabNom);
                } else {
                    dto.put("colaboradorNombre", "Sin asignar");
                }
            }

            resultado.add(dto);
        }

        return ResponseEntity.ok(resultado);
    }

    /**
     * Retorna candidatos elegibles para una asignatura específica:
     * - Estudiantes de esa asignatura
     * - Profesores colaboradores disponibles
     * - Tutores de práctica disponibles
     * - Centros de práctica
     */
    @GetMapping("/candidatos")
    public ResponseEntity<?> obtenerCandidatos(@RequestParam(required = false) Long asignaturaId) {
        if (asignaturaId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "El parámetro 'asignaturaId' es obligatorio."));
        }

        Optional<Asignatura> asigOpt = asignaturaRepository.findById(asignaturaId);
        if (asigOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Asignatura asignatura = asigOpt.get();
        if (!esAsignaturaPractica(asignatura)) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "La asignatura seleccionada no corresponde a una práctica válida (Práctica Pedagógica o Práctica Profesional)."
            ));
        }

        // 1. Estudiantes de esa asignatura
        List<Estudiante> estudiantesAsig = estudianteRepository.findByAsignaturaIdAsignatura(asignaturaId);
        List<Map<String, Object>> estudiantesList = estudiantesAsig.stream()
            .filter(e -> e.getUsuario() == null || (e.getUsuario().isActivo() && !"inactivo".equalsIgnoreCase(e.getUsuario().getEstado())))
            .filter(e -> !"INACTIVO".equalsIgnoreCase(e.getEstado()))
            .map(e -> {
                Map<String, Object> map = new HashMap<>();
                map.put("idEstudiante", e.getIdEstudiante());
                map.put("nombre", e.getUsuario() != null ? (e.getUsuario().getNombre() + " " + e.getUsuario().getApellido()).trim() : "Estudiante");
                map.put("rut", e.getUsuario() != null ? e.getUsuario().getRut() : "");
                map.put("idAsignatura", asignatura.getIdAsignatura());
                map.put("asignaturaNombre", asignatura.getNombre());
                return map;
            })
            .collect(Collectors.toList());

        // 2. Tutores de Práctica
        List<TutorPractica> tutores = tutorPracticaRepository.findAll();
        List<Map<String, Object>> tutoresList = tutores.stream()
            .filter(t -> {
                if (t.getUsuario() != null) {
                    if (!t.getUsuario().isActivo() || "inactivo".equalsIgnoreCase(t.getUsuario().getEstado())) {
                        return false;
                    }
                    if (t.getUsuario().getRoles() != null && !t.getUsuario().getRoles().isEmpty()) {
                        return t.getUsuario().getRoles().stream()
                            .anyMatch(r -> r.getNombre() != null && r.getNombre().toUpperCase().contains("TUTOR"));
                    }
                }
                return true;
            })
            .map(t -> {
                Map<String, Object> map = new HashMap<>();
                map.put("idTutor", t.getIdTutor());
                String nom = t.getNombre();
                if ((nom == null || nom.isBlank()) && t.getUsuario() != null) {
                    nom = (t.getUsuario().getNombre() + " " + t.getUsuario().getApellido()).trim();
                }
                map.put("nombre", nom != null ? nom : "Tutor de Práctica");
                map.put("rut", t.getUsuario() != null ? t.getUsuario().getRut() : "");
                return map;
            })
            .collect(Collectors.toList());

        // 3. Profesores Colaboradores (filtro estricto por rol PROFESOR_COLABORADOR)
        List<ProfesorColaborador> colaboradores = profesorColaboradorRepository.findAll();
        List<Map<String, Object>> colabList = colaboradores.stream()
            .filter(c -> {
                if (c.getUsuario() == null) {
                    return false;
                }
                if (!c.getUsuario().isActivo() || "inactivo".equalsIgnoreCase(c.getUsuario().getEstado())) {
                    return false;
                }
                if (c.getUsuario().getRoles() == null || c.getUsuario().getRoles().isEmpty()) {
                    return false;
                }
                return c.getUsuario().getRoles().stream()
                    .anyMatch(r -> r.getNombre() != null && r.getNombre().toUpperCase().contains("COLABORADOR"));
            })
            .map(c -> {
                Map<String, Object> map = new HashMap<>();
                map.put("idColaborador", c.getIdColaborador());
                String nom = (c.getUsuario() != null) ? (c.getUsuario().getNombre() + " " + c.getUsuario().getApellido()).trim() : "Profesor Colaborador";
                map.put("nombre", nom);
                map.put("especialidad", c.getEspecialidad());
                map.put("idCentro", c.getCentroPractica() != null ? c.getCentroPractica().getIdCentro() : null);
                map.put("centroNombre", c.getCentroPractica() != null ? c.getCentroPractica().getNombre() : "Sin centro asignado");
                return map;
            })
            .collect(Collectors.toList());

        // 4. Centros de Práctica
        List<CentroPractica> centros = centroPracticaRepository.findAll();
        List<Map<String, Object>> centrosList = centros.stream()
            .map(c -> {
                Map<String, Object> map = new HashMap<>();
                map.put("idCentro", c.getIdCentro());
                map.put("nombre", c.getNombre());
                map.put("direccion", c.getDireccion());
                return map;
            })
            .collect(Collectors.toList());

        Map<String, Object> respuesta = new HashMap<>();
        respuesta.put("asignatura", Map.of(
            "idAsignatura", asignatura.getIdAsignatura(),
            "nombre", asignatura.getNombre(),
            "semestre", asignatura.getSemestre() != null ? asignatura.getSemestre() : ""
        ));
        respuesta.put("estudiantes", estudiantesList);
        respuesta.put("tutores", tutoresList);
        respuesta.put("profesoresColaboradores", colabList);
        respuesta.put("centrosPractica", centrosList);

        return ResponseEntity.ok(respuesta);
    }

    /**
     * Asocia Estudiante + Asignatura + Profesor Colaborador + Tutor (+ Centro de Práctica).
     * Aplica validación estricta en servidor de que el estudiante pertenezca a la misma asignatura
     * y que sea una asignatura de práctica válida.
     */
    @PostMapping("/asociar")
    @Transactional
    public ResponseEntity<?> asociarPractica(@RequestBody Map<String, Object> payload) {
        Object idAsigObj = payload.get("idAsignatura");
        Object idEstObj = payload.get("idEstudiante");
        Object idColabObj = payload.get("idProfesorColaborador");
        Object idTutorObj = payload.get("idTutor");
        Object idCentroObj = payload.get("idCentroPractica");

        if (idAsigObj == null || idEstObj == null || idColabObj == null || idTutorObj == null) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Todos los campos de asociación son obligatorios: Asignatura, Estudiante, Profesor Colaborador y Tutor."
            ));
        }

        Long idAsignatura = Long.valueOf(idAsigObj.toString());
        Long idEstudiante = Long.valueOf(idEstObj.toString());
        Long idColaborador = Long.valueOf(idColabObj.toString());
        Long idTutor = Long.valueOf(idTutorObj.toString());

        // 1. Validar Asignatura
        Optional<Asignatura> asigOpt = asignaturaRepository.findById(idAsignatura);
        if (asigOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "La asignatura especificada no existe."));
        }
        Asignatura asignatura = asigOpt.get();
        if (!esAsignaturaPractica(asignatura)) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "La asignatura '" + asignatura.getNombre() + "' no corresponde a Práctica Pedagógica ni Práctica Profesional."
            ));
        }

        // 2. Validar Estudiante y pertenencia a la misma asignatura
        Optional<Estudiante> estOpt = estudianteRepository.findById(idEstudiante);
        if (estOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "El estudiante especificado no existe."));
        }
        Estudiante estudiante = estOpt.get();

        if (estudiante.getAsignatura() == null || !idAsignatura.equals(estudiante.getAsignatura().getIdAsignatura())) {
            String asigEstudiante = estudiante.getAsignatura() != null ? estudiante.getAsignatura().getNombre() : "Sin asignatura";
            return ResponseEntity.badRequest().body(Map.of(
                "error", "No se puede realizar la asociación. El estudiante, profesor colaborador y tutor deben pertenecer a la misma asignatura. " +
                         "El estudiante está matriculado en '" + asigEstudiante + "' y la asignatura seleccionada es '" + asignatura.getNombre() + "'."
            ));
        }

        // 3. Validar Tutor
        Optional<TutorPractica> tutorOpt = tutorPracticaRepository.findById(idTutor);
        if (tutorOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "El tutor de práctica especificado no existe."));
        }
        TutorPractica tutor = tutorOpt.get();

        // 4. Validar Profesor Colaborador
        Optional<ProfesorColaborador> colabOpt = profesorColaboradorRepository.findById(idColaborador);
        if (colabOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "El profesor colaborador especificado no existe."));
        }
        ProfesorColaborador colaborador = colabOpt.get();

        // 5. Determinar Centro de Práctica
        CentroPractica centro = null;
        if (idCentroObj != null && !idCentroObj.toString().isBlank()) {
            Long idC = Long.valueOf(idCentroObj.toString());
            centro = centroPracticaRepository.findById(idC).orElse(null);
        }
        if (centro == null && colaborador.getCentroPractica() != null) {
            centro = colaborador.getCentroPractica();
        }
        if (centro == null) {
            centro = centroPracticaRepository.findAll().stream().findFirst().orElse(null);
        }

        // 6. Guardar o actualizar la asociación en la tabla practica existente
        List<Practica> practicasEst = practicaRepository.findByEstudianteIdEstudiante(estudiante.getIdEstudiante());
        Practica practica;
        if (practicasEst != null && !practicasEst.isEmpty()) {
            practica = practicasEst.get(0);
        } else {
            practica = new Practica();
            practica.setEstadoAprobacion("EN_CURSO");
        }

        practica.setEstudiante(estudiante);
        practica.setAsignatura(asignatura);
        practica.setTutorPractica(tutor);
        practica.setCentroPractica(centro);
        practica.setEstadoAprobacion("EN_CURSO");

        Set<ProfesorColaborador> colabs = new HashSet<>();
        colabs.add(colaborador);
        practica.setProfesoresColaboradores(colabs);

        Practica guardada = practicaRepository.save(practica);

        if (colaborador.getPracticas() == null) {
            colaborador.setPracticas(new HashSet<>());
        }
        colaborador.getPracticas().add(guardada);
        if (centro != null && colaborador.getCentroPractica() == null) {
            colaborador.setCentroPractica(centro);
        }
        profesorColaboradorRepository.save(colaborador);

        return ResponseEntity.ok(Map.of(
            "message", "Asociación confirmada y registrada exitosamente.",
            "idPractica", guardada.getIdPractica(),
            "estudiante", estudiante.getUsuario() != null ? estudiante.getUsuario().getNombre() + " " + estudiante.getUsuario().getApellido() : "",
            "asignatura", asignatura.getNombre(),
            "profesorColaborador", colaborador.getUsuario() != null ? colaborador.getUsuario().getNombre() + " " + colaborador.getUsuario().getApellido() : "",
            "tutor", tutor.getNombre(),
            "centroPractica", centro != null ? centro.getNombre() : "Sin centro"
        ));
    }

    /**
     * Retorna el listado de asociaciones vigentes registradas en el sistema.
     */
    @GetMapping("/asociaciones")
    public ResponseEntity<List<Map<String, Object>>> obtenerAsociaciones() {
        List<Practica> practicas = practicaRepository.findAll();
        List<Map<String, Object>> resultado = new ArrayList<>();

        for (Practica p : practicas) {
            if (p.getAsignatura() == null || !esAsignaturaPractica(p.getAsignatura())) {
                continue;
            }
            if (p.getEstudiante() == null || p.getEstudiante().getUsuario() == null) {
                continue;
            }

            Usuario estUser = p.getEstudiante().getUsuario();
            String nomEst = estUser.getNombre() + " " + estUser.getApellido();

            String nomTutor = p.getTutorPractica() != null ? p.getTutorPractica().getNombre() : "Sin tutor";
            String nomCentro = p.getCentroPractica() != null ? p.getCentroPractica().getNombre() : "Sin centro";

            String nomColab = "Sin colaborador";
            Long idColab = null;
            if (p.getProfesoresColaboradores() != null && !p.getProfesoresColaboradores().isEmpty()) {
                ProfesorColaborador colab = p.getProfesoresColaboradores().iterator().next();
                idColab = colab.getIdColaborador();
                if (colab.getUsuario() != null) {
                    nomColab = colab.getUsuario().getNombre() + " " + colab.getUsuario().getApellido();
                }
            }

            Map<String, Object> dto = new HashMap<>();
            dto.put("idPractica", p.getIdPractica());
            dto.put("idEstudiante", p.getEstudiante().getIdEstudiante());
            dto.put("estudianteNombre", nomEst);
            dto.put("idAsignatura", p.getAsignatura().getIdAsignatura());
            dto.put("asignaturaNombre", p.getAsignatura().getNombre());
            dto.put("idTutor", p.getTutorPractica() != null ? p.getTutorPractica().getIdTutor() : null);
            dto.put("tutorNombre", nomTutor);
            dto.put("idColaborador", idColab);
            dto.put("colaboradorNombre", nomColab);
            dto.put("idCentro", p.getCentroPractica() != null ? p.getCentroPractica().getIdCentro() : null);
            dto.put("centroNombre", nomCentro);
            dto.put("estadoAprobacion", p.getEstadoAprobacion() != null ? p.getEstadoAprobacion() : "EN_CURSO");

            resultado.add(dto);
        }

        return ResponseEntity.ok(resultado);
    }

    /**
     * Elimina / desvincula una práctica asociada.
     */
    @DeleteMapping("/asociaciones/{idPractica}")
    @Transactional
    public ResponseEntity<?> eliminarAsociacion(@PathVariable Long idPractica) {
        Optional<Practica> opt = practicaRepository.findById(idPractica);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Practica p = opt.get();
        if (p.getProfesoresColaboradores() != null) {
            for (ProfesorColaborador c : p.getProfesoresColaboradores()) {
                if (c.getPracticas() != null) {
                    c.getPracticas().remove(p);
                    profesorColaboradorRepository.save(c);
                }
            }
        }
        practicaRepository.delete(p);
        return ResponseEntity.ok(Map.of("message", "Asociación eliminada exitosamente."));
    }
}
