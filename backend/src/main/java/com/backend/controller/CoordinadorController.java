package com.backend.controller;

import java.text.Normalizer;
import java.util.ArrayList;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
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
import com.backend.repository.PautaAplicacionRepository;
import com.backend.repository.PracticaRepository;
import com.backend.repository.ProfesorColaboradorRepository;
import com.backend.repository.TutorPracticaRepository;
import com.backend.service.PermisoService;
import com.backend.service.PracticaService;

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
    private final PracticaService practicaService;
    private final PermisoService permisoService;
    private final PautaAplicacionRepository pautaAplicacionRepository;

    public CoordinadorController(EstudianteRepository estudianteRepository,
                                 AsignaturaRepository asignaturaRepository,
                                 CentroPracticaRepository centroPracticaRepository,
                                 TutorPracticaRepository tutorPracticaRepository,
                                 ProfesorColaboradorRepository profesorColaboradorRepository,
                                 PracticaRepository practicaRepository,
                                 PracticaService practicaService,
                                 PermisoService permisoService,
                                 PautaAplicacionRepository pautaAplicacionRepository) {
        this.estudianteRepository = estudianteRepository;
        this.asignaturaRepository = asignaturaRepository;
        this.centroPracticaRepository = centroPracticaRepository;
        this.tutorPracticaRepository = tutorPracticaRepository;
        this.profesorColaboradorRepository = profesorColaboradorRepository;
        this.practicaRepository = practicaRepository;
        this.practicaService = practicaService;
        this.permisoService = permisoService;
        this.pautaAplicacionRepository = pautaAplicacionRepository;
    }

    /** Permiso que habilita asociar / desvincular prácticas (se administra en el panel de permisos). */
    private static final String PERMISO_ASOCIAR = "PRACTICAS_ASOCIAR";

    private static String normalizar(String s) {
        if (s == null) {
            return "";
        }
        return Normalizer.normalize(s, Normalizer.Form.NFD)
            .replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
            .toUpperCase()
            .trim();
    }

    /**
     * Ciclo de la línea de práctica al que pertenece la asignatura: INICIAL, INTERMEDIA, PEDAGOGICA o
     * PROFESIONAL. Devuelve null si no es una de las 6 asignaturas de práctica.
     */
    private String nivelPractica(Asignatura asig) {
        if (asig == null || asig.getNombre() == null) {
            return null;
        }
        String n = normalizar(asig.getNombre());
        if (n.contains("APROXIMACION") && n.contains("SISTEMA ESCOLAR")) return "INICIAL";
        if (n.contains("AMBIENTES") && n.contains("APRENDIZAJE")) return "INICIAL";
        if (n.contains("TRABAJO COLABORATIVO")) return "INTERMEDIA";
        if (n.contains("INVESTIGACION") && n.contains("AULA")) return "INTERMEDIA";
        if (n.contains("PRACTICA") && n.contains("PEDAGOGICA")) return "PEDAGOGICA";
        if (n.contains("PRACTICA") && n.contains("PROFESIONAL")) return "PROFESIONAL";
        return null;
    }

    /**
     * Determina si una asignatura es una de las 6 de la línea de práctica: Aproximación al Sistema Escolar,
     * Ambientes de Aprendizaje, Trabajo Colaborativo en el Aula, Investigación en el Aula,
     * Práctica Pedagógica y Práctica Profesional.
     */
    private boolean esAsignaturaPractica(Asignatura asig) {
        return nivelPractica(asig) != null;
    }

    /** Las prácticas iniciales son simulaciones en la universidad: no hay colegio ni profesor colaborador. */
    private boolean requiereColaborador(String nivel) {
        return nivel != null && !"INICIAL".equals(nivel);
    }

    /** Solo en la Práctica Profesional interviene un tutor/supervisor contratado por la universidad. */
    private boolean requiereTutor(String nivel) {
        return "PROFESIONAL".equals(nivel);
    }

    private static int semestreNum(Asignatura a) {
        try {
            return Integer.parseInt(a.getSemestre() == null ? "" : a.getSemestre().trim());
        } catch (NumberFormatException e) {
            return Integer.MAX_VALUE;
        }
    }

    private static Long aLong(Object o) {
        if (o == null || o.toString().isBlank()) {
            return null;
        }
        return Long.valueOf(o.toString().trim());
    }

    /** Solo quienes tienen el permiso PRACTICAS_ASOCIAR pueden asociar o desvincular prácticas. */
    private ResponseEntity<?> exigirPermisoAsociar(String rut) {
        if (rut == null || rut.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Debe iniciar sesión para asociar prácticas."));
        }
        Set<String> permisos = permisoService.obtenerPermisosEfectivosUsuario(rut.trim());
        boolean ok = permisos != null && permisos.stream().anyMatch(p -> PERMISO_ASOCIAR.equalsIgnoreCase(p));
        if (!ok) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("error", "No tiene permiso para asociar prácticas."));
        }
        return null;
    }

    /**
     * Retorna las 6 asignaturas de la línea de práctica (ordenadas por semestre), indicando qué participantes
     * requiere cada una: profesor colaborador / centro (todas salvo las iniciales) y tutor (solo Práctica Profesional).
     */
    @GetMapping("/asignaturas-practica")
    public ResponseEntity<List<Map<String, Object>>> obtenerAsignaturasPractica() {
        List<Asignatura> todas = asignaturaRepository.findAll();
        List<Map<String, Object>> resultado = todas.stream()
            .filter(this::esAsignaturaPractica)
            .sorted((x, y) -> Integer.compare(semestreNum(x), semestreNum(y)))
            .map(a -> {
                Map<String, Object> map = new HashMap<>();
                map.put("idAsignatura", a.getIdAsignatura());
                map.put("nombre", a.getNombre());
                map.put("descripcion", a.getDescripcion());
                map.put("semestre", a.getSemestre());
                String nivel = nivelPractica(a);
                map.put("nivel", nivel);
                map.put("requiereColaborador", requiereColaborador(nivel));
                map.put("requiereTutor", requiereTutor(nivel));
                return map;
            })
            .collect(Collectors.toList());

        return ResponseEntity.ok(resultado);
    }

    /**
     * Retorna el listado simple de estudiantes de Práctica Pedagógica (8.°) y Práctica Profesional (9.°).
     * Sin columnas innecesarias (RUT, teléfono, etc. sólo expuestos internamente si es necesario).
     */
    @GetMapping("/estudiantes-practica")
    public ResponseEntity<List<Map<String, Object>>> obtenerEstudiantesPractica() {
        List<Estudiante> todos = estudianteRepository.findAll();
        List<Map<String, Object>> resultado = new ArrayList<>();

        for (Estudiante est : todos) {
            // El inicio del coordinador solo lista a los alumnos de 8.° y 9.° semestre
            String nivel = nivelPractica(est.getAsignatura());
            if (!"PEDAGOGICA".equals(nivel) && !"PROFESIONAL".equals(nivel)) {
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
                "error", "La asignatura seleccionada no es una de las 6 asignaturas de la línea de práctica."
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

    /** Respuesta 409 con un código que el formulario usa para decidir qué mostrar. */
    private ResponseEntity<?> conflicto(String codigo, String mensaje) {
        Map<String, Object> cuerpo = new HashMap<>();
        cuerpo.put("error", mensaje);
        cuerpo.put("codigo", codigo);
        return ResponseEntity.status(HttpStatus.CONFLICT).body(cuerpo);
    }

    private static String nombreCompleto(Usuario u) {
        return u == null ? "" : ((u.getNombre() == null ? "" : u.getNombre()) + " " + (u.getApellido() == null ? "" : u.getApellido())).trim();
    }

    /**
     * Asocia Estudiante + Asignatura de práctica (+ Profesor Colaborador, Tutor y Centro según el ciclo):
     * - Iniciales (Aproximación al Sistema Escolar, Ambientes de Aprendizaje): solo estudiante y asignatura.
     * - Intermedias y Práctica Pedagógica: además profesor colaborador y centro (obligatorio, sin valor por defecto).
     * - Práctica Profesional: además tutor universitario.
     *
     * Protecciones:
     * - Exige el permiso PRACTICAS_ASOCIAR.
     * - Si el estudiante ya tiene colaborador/tutor y se pretende cambiarlos, responde 409 ASOCIACION_EXISTENTE
     *   salvo que el cliente envíe {@code reemplazar: true}.
     * - Si la práctica ya tiene pautas aplicadas, no se permite cambiar evaluadores: 409 PAUTAS_APLICADAS.
     * - Conserva el estado de aprobación de la práctica existente.
     * - Mantiene sincronizada la relación práctica-colaborador (el colaborador es el lado propietario).
     */
    @PostMapping("/asociar")
    @Transactional
    public ResponseEntity<?> asociarPractica(@RequestBody Map<String, Object> payload,
                                             @RequestHeader(value = "X-User-Rut", required = false) String rutSolicitante) {
        ResponseEntity<?> denegado = exigirPermisoAsociar(rutSolicitante);
        if (denegado != null) {
            return denegado;
        }

        Long[] ids;
        try {
            ids = new Long[] {
                aLong(payload.get("idAsignatura")),
                aLong(payload.get("idEstudiante")),
                aLong(payload.get("idProfesorColaborador")),
                aLong(payload.get("idTutor")),
                aLong(payload.get("idCentroPractica"))
            };
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Los identificadores enviados no son válidos."));
        }
        final Long idAsignatura = ids[0];
        final Long idEstudiante = ids[1];
        final Long idColaborador = ids[2];
        final Long idTutor = ids[3];
        final Long idCentro = ids[4];
        final boolean reemplazar = Boolean.parseBoolean(String.valueOf(payload.get("reemplazar")));

        if (idAsignatura == null || idEstudiante == null) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "La asignatura y el estudiante son obligatorios."
            ));
        }

        // 1. Asignatura: debe ser una de las 6 de la línea de práctica
        Optional<Asignatura> asigOpt = asignaturaRepository.findById(idAsignatura);
        if (asigOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "La asignatura especificada no existe."));
        }
        Asignatura asignatura = asigOpt.get();
        String nivel = nivelPractica(asignatura);
        if (nivel == null) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "La asignatura '" + asignatura.getNombre() + "' no es una de las 6 asignaturas de la línea de práctica."
            ));
        }
        if (requiereColaborador(nivel) && idColaborador == null) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "La asignatura '" + asignatura.getNombre() + "' requiere un profesor colaborador."
            ));
        }
        if (requiereColaborador(nivel) && idCentro == null) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "La asignatura '" + asignatura.getNombre() + "' requiere seleccionar el centro de práctica."
            ));
        }
        if (requiereTutor(nivel) && idTutor == null) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "La asignatura '" + asignatura.getNombre() + "' requiere un tutor de práctica."
            ));
        }

        // 2. Estudiante (bloqueado durante la transacción) y pertenencia a la asignatura
        Optional<Estudiante> estOpt = estudianteRepository.findByIdForUpdate(idEstudiante);
        if (estOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "El estudiante especificado no existe."));
        }
        Estudiante estudiante = estOpt.get();

        if (estudiante.getAsignatura() == null || !idAsignatura.equals(estudiante.getAsignatura().getIdAsignatura())) {
            String asigEstudiante = estudiante.getAsignatura() != null ? estudiante.getAsignatura().getNombre() : "Sin asignatura";
            return ResponseEntity.badRequest().body(Map.of(
                "error", "No se puede realizar la asociación. El estudiante debe pertenecer a la asignatura seleccionada. " +
                         "El estudiante está matriculado en '" + asigEstudiante + "' y la asignatura seleccionada es '" + asignatura.getNombre() + "'."
            ));
        }

        // 3. Tutor (solo Práctica Profesional)
        TutorPractica tutor = null;
        if (requiereTutor(nivel)) {
            tutor = tutorPracticaRepository.findById(idTutor).orElse(null);
            if (tutor == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "El tutor de práctica especificado no existe."));
            }
        }

        // 4. Profesor colaborador (todas salvo las iniciales)
        ProfesorColaborador colaborador = null;
        if (requiereColaborador(nivel)) {
            colaborador = profesorColaboradorRepository.findById(idColaborador).orElse(null);
            if (colaborador == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "El profesor colaborador especificado no existe."));
            }
        }

        // 5. Centro de práctica: obligatorio donde hay trabajo en establecimiento, sin valor por defecto
        CentroPractica centro = null;
        if (requiereColaborador(nivel)) {
            centro = centroPracticaRepository.findById(idCentro).orElse(null);
            if (centro == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "El centro de práctica especificado no existe."));
            }
        }

        // 6. Práctica existente del estudiante y qué cambiaría con esta asociación
        List<Practica> practicasEst = practicaRepository.findByEstudianteIdEstudiante(estudiante.getIdEstudiante());
        Practica existente = null;
        if (practicasEst != null && !practicasEst.isEmpty()) {
            existente = practicasEst.stream()
                .filter(p -> p.getAsignatura() != null && idAsignatura.equals(p.getAsignatura().getIdAsignatura()))
                .findFirst()
                .orElse(practicasEst.get(0));
        }

        List<ProfesorColaborador> colaboradoresPrevios = new ArrayList<>();
        Long tutorActualId = null;
        boolean tienePautas = false;
        if (existente != null) {
            if (existente.getProfesoresColaboradores() != null) {
                colaboradoresPrevios.addAll(existente.getProfesoresColaboradores());
            }
            tutorActualId = existente.getTutorPractica() != null ? existente.getTutorPractica().getIdTutor() : null;
            tienePautas = pautaAplicacionRepository.existsByPracticaIdPractica(existente.getIdPractica());
        }

        Set<Long> colaboradoresActualesIds = new HashSet<>();
        for (ProfesorColaborador previo : colaboradoresPrevios) {
            colaboradoresActualesIds.add(previo.getIdColaborador());
        }
        Set<Long> colaboradoresNuevosIds = new HashSet<>();
        if (colaborador != null) {
            colaboradoresNuevosIds.add(colaborador.getIdColaborador());
        }
        Long tutorNuevoId = tutor != null ? tutor.getIdTutor() : null;

        boolean teniaAsociacion = !colaboradoresActualesIds.isEmpty() || tutorActualId != null;
        boolean cambiaEvaluadores = !colaboradoresActualesIds.equals(colaboradoresNuevosIds)
            || !Objects.equals(tutorActualId, tutorNuevoId);
        boolean cambiaAsignatura = existente != null && existente.getAsignatura() != null
            && !idAsignatura.equals(existente.getAsignatura().getIdAsignatura());

        if (existente != null && tienePautas && ((teniaAsociacion && cambiaEvaluadores) || cambiaAsignatura)) {
            return conflicto("PAUTAS_APLICADAS",
                "No se puede reemplazar la asociación: la práctica de este estudiante ya tiene pautas de evaluación aplicadas. " +
                "Cambiar a sus evaluadores dejaría esas evaluaciones sin respaldo.");
        }
        if (teniaAsociacion && cambiaEvaluadores && !reemplazar) {
            String actual = colaboradoresPrevios.isEmpty() ? "sin colaborador"
                : "colaborador " + colaboradoresPrevios.stream()
                    .map(c -> nombreCompleto(c.getUsuario()))
                    .collect(Collectors.joining(", "));
            return conflicto("ASOCIACION_EXISTENTE",
                "El estudiante ya tiene una asociación (" + actual + "). Confirma el reemplazo para continuar.");
        }

        // 7. Sin cambios reales: no se toca nada
        boolean mismoCentro = existente != null && Objects.equals(
            existente.getCentroPractica() != null ? existente.getCentroPractica().getIdCentro() : null,
            centro != null ? centro.getIdCentro() : null);
        if (existente != null && !cambiaEvaluadores && !cambiaAsignatura && mismoCentro) {
            return ResponseEntity.ok(respuestaAsociacion(
                "La asociación ya estaba registrada con esos datos.", true,
                existente, estudiante, asignatura, colaborador, tutor, centro));
        }

        // 8. Guardar. El estado de aprobación se conserva si la práctica ya existía.
        Practica practica = existente != null ? existente : new Practica();
        practica.setEstudiante(estudiante);
        practica.setAsignatura(asignatura);
        practica.setTutorPractica(tutor);
        practica.setCentroPractica(centro);
        if (practica.getEstadoAprobacion() == null || practica.getEstadoAprobacion().isBlank()) {
            practica.setEstadoAprobacion("EN_CURSO");
        }
        final Practica guardada = practicaRepository.save(practica);
        final Long idPracticaGuardada = guardada.getIdPractica();

        // 9. La relación práctica-colaborador la guarda el colaborador (lado propietario): se retira la práctica
        //    de los colaboradores anteriores y se agrega al nuevo, para que no queden dos colaboradores vinculados.
        for (ProfesorColaborador previo : colaboradoresPrevios) {
            boolean sigue = colaborador != null && previo.getIdColaborador().equals(colaborador.getIdColaborador());
            if (!sigue && previo.getPracticas() != null) {
                previo.getPracticas().removeIf(p -> idPracticaGuardada.equals(p.getIdPractica()));
                profesorColaboradorRepository.save(previo);
            }
        }
        if (colaborador != null) {
            if (colaborador.getPracticas() == null) {
                colaborador.setPracticas(new HashSet<>());
            }
            colaborador.getPracticas().removeIf(p -> idPracticaGuardada.equals(p.getIdPractica()));
            colaborador.getPracticas().add(guardada);
            if (centro != null && colaborador.getCentroPractica() == null) {
                colaborador.setCentroPractica(centro);
            }
            profesorColaboradorRepository.save(colaborador);
        }
        Set<ProfesorColaborador> colaboradoresFinales = new HashSet<>();
        if (colaborador != null) {
            colaboradoresFinales.add(colaborador);
        }
        guardada.setProfesoresColaboradores(colaboradoresFinales);

        return ResponseEntity.ok(respuestaAsociacion(
            "Asociación confirmada y registrada exitosamente.", false,
            guardada, estudiante, asignatura, colaborador, tutor, centro));
    }

    private Map<String, Object> respuestaAsociacion(String mensaje, boolean sinCambios, Practica practica,
                                                    Estudiante estudiante, Asignatura asignatura,
                                                    ProfesorColaborador colaborador, TutorPractica tutor,
                                                    CentroPractica centro) {
        Map<String, Object> respuesta = new HashMap<>();
        respuesta.put("message", mensaje);
        respuesta.put("sinCambios", sinCambios);
        respuesta.put("idPractica", practica.getIdPractica());
        respuesta.put("estudiante", nombreCompleto(estudiante.getUsuario()));
        respuesta.put("asignatura", asignatura.getNombre());
        respuesta.put("profesorColaborador", colaborador != null ? nombreCompleto(colaborador.getUsuario()) : "");
        respuesta.put("tutor", tutor != null && tutor.getNombre() != null ? tutor.getNombre() : "");
        respuesta.put("centroPractica", centro != null ? centro.getNombre() : "Sin centro");
        respuesta.put("estadoAprobacion", practica.getEstadoAprobacion());
        return respuesta;
    }

    /**
     * Retorna el listado de asociaciones vigentes registradas en el sistema.
     */
    @GetMapping("/asociaciones")
    public ResponseEntity<List<Map<String, Object>>> obtenerAsociaciones() {
        List<Practica> practicas = practicaRepository.findAll();
        Set<Long> practicasConPautas = new HashSet<>(pautaAplicacionRepository.practicaIdsConAplicaciones());
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
                List<String> nombres = new ArrayList<>();
                for (ProfesorColaborador colab : p.getProfesoresColaboradores()) {
                    if (idColab == null) {
                        idColab = colab.getIdColaborador();
                    }
                    String nombre = nombreCompleto(colab.getUsuario());
                    if (!nombre.isBlank()) {
                        nombres.add(nombre);
                    }
                }
                if (!nombres.isEmpty()) {
                    nomColab = String.join(", ", nombres);
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
            dto.put("tienePautas", practicasConPautas.contains(p.getIdPractica()));

            resultado.add(dto);
        }

        return ResponseEntity.ok(resultado);
    }

    /**
     * Elimina / desvincula una práctica asociada.
     */
    @DeleteMapping("/asociaciones/{idPractica}")
    public ResponseEntity<?> eliminarAsociacion(@PathVariable Long idPractica,
                                                @RequestHeader(value = "X-User-Rut", required = false) String rutSolicitante) {
        ResponseEntity<?> denegado = exigirPermisoAsociar(rutSolicitante);
        if (denegado != null) {
            return denegado;
        }
        if (!practicaRepository.existsById(idPractica)) {
            return ResponseEntity.notFound().build();
        }
        if (pautaAplicacionRepository.existsByPracticaIdPractica(idPractica)) {
            return conflicto("PAUTAS_APLICADAS",
                "No se puede desvincular: la práctica ya tiene pautas de evaluación aplicadas.");
        }
        practicaService.eliminar(idPractica);
        return ResponseEntity.ok(Map.of("message", "Asociación eliminada exitosamente."));
    }
}
