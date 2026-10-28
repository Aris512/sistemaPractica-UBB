package com.backend.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.backend.dto.PautaDTOs.AplicacionDTO;
import com.backend.dto.PautaDTOs.CriterioDTO;
import com.backend.dto.PautaDTOs.CriterioRequest;
import com.backend.dto.PautaDTOs.GuardarAplicacionRequest;
import com.backend.dto.PautaDTOs.PautaDetalleDTO;
import com.backend.dto.PautaDTOs.PautaRequest;
import com.backend.dto.PautaDTOs.PautaResumenDTO;
import com.backend.dto.PautaDTOs.RespuestaDTO;
import com.backend.dto.PautaDTOs.ResultadoDTO;
import com.backend.model.Pauta;
import com.backend.model.PautaAplicacion;
import com.backend.model.PautaCriterio;
import com.backend.model.PautaRespuesta;
import com.backend.model.Practica;
import com.backend.repository.PautaAplicacionRepository;
import com.backend.repository.PautaRepository;
import com.backend.repository.PracticaRepository;
import com.backend.service.PautaAccesoService.Solicitante;

@Service
public class PautaService {

    static final double NOTA_MIN = 2.0;
    static final double NOTA_APROBACION = 4.0;
    static final double NOTA_MAX = 7.0;

    private static final Set<String> EVALUADORES = Set.of("COLABORADOR", "TUTOR", "ACADEMICO");
    private static final Set<String> MOMENTOS = Set.of("PRIMERA", "SEGUNDA", "UNICA");
    private static final Set<String> ESPECIALIDADES = Set.of("ESPECIALIDAD", "ORIENTACION");
    private static final Set<String> MODOS_CALCULO = Set.of("ESCALA_EXIGENCIA", "PROMEDIO");

    private final PautaRepository pautaRepository;
    private final PautaAplicacionRepository aplicacionRepository;
    private final PracticaRepository practicaRepository;
    private final PautaAccesoService acceso;

    public PautaService(PautaRepository pautaRepository,
                        PautaAplicacionRepository aplicacionRepository,
                        PracticaRepository practicaRepository,
                        PautaAccesoService acceso) {
        this.pautaRepository = pautaRepository;
        this.aplicacionRepository = aplicacionRepository;
        this.practicaRepository = practicaRepository;
        this.acceso = acceso;
    }

    // ---------------------------------------------------------- Catálogo de pautas (HU-21)

    /** Cualquier usuario identificado puede consultar el catálogo: son instrumentos institucionales. */
    @Transactional(readOnly = true)
    public List<PautaResumenDTO> listar(String rut, String asignatura, String especialidad, String momento,
                                        String evaluador, boolean soloActivas) {
        acceso.identificar(rut);
        return pautaRepository.findAll().stream()
            .filter(p -> coincide(p.getAsignatura(), asignatura))
            .filter(p -> coincide(p.getEspecialidad(), especialidad))
            .filter(p -> coincide(p.getMomento(), momento))
            .filter(p -> coincide(p.getEvaluador(), evaluador))
            .filter(p -> !soloActivas || !Boolean.FALSE.equals(p.getActiva()))
            .map(p -> resumen(p, null))
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PautaDetalleDTO obtenerDetalle(String rut, Long id) {
        acceso.identificar(rut);
        return detalle(obtenerPauta(id));
    }

    @Transactional
    public PautaDetalleDTO crear(String rut, PautaRequest req) {
        acceso.exigirGestion(acceso.identificar(rut));
        if (req.codigo() == null || req.codigo().isBlank() || req.titulo() == null || req.titulo().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Código y título son obligatorios.");
        }
        validarCampos(req, null);
        if (pautaRepository.existsByCodigo(req.codigo())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe una pauta con ese código.");
        }
        Pauta p = new Pauta();
        aplicarDatos(p, req);
        reemplazarCriterios(p, req.criterios());
        return detalle(pautaRepository.save(p));
    }

    @Transactional
    public PautaDetalleDTO actualizar(String rut, Long id, PautaRequest req) {
        acceso.exigirGestion(acceso.identificar(rut));
        Pauta p = obtenerPauta(id);
        boolean conEvaluaciones = aplicacionRepository.existsByPautaId(id);
        if (req.criterios() != null && conEvaluaciones) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "La pauta ya tiene evaluaciones registradas: no se pueden modificar sus criterios. Cree una nueva versión.");
        }
        if (conEvaluaciones) exigirSinCambiosEstructurales(p, req);
        validarCampos(req, p);
        if (req.codigo() != null && !req.codigo().equals(p.getCodigo()) && pautaRepository.existsByCodigo(req.codigo())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe una pauta con ese código.");
        }
        aplicarDatos(p, req);
        if (req.criterios() != null) reemplazarCriterios(p, req.criterios());
        return detalle(pautaRepository.save(p));
    }

    @Transactional
    public PautaDetalleDTO cambiarActiva(String rut, Long id, boolean activa) {
        acceso.exigirGestion(acceso.identificar(rut));
        Pauta p = obtenerPauta(id);
        p.setActiva(activa);
        return detalle(pautaRepository.save(p));
    }

    @Transactional
    public void eliminar(String rut, Long id) {
        acceso.exigirGestion(acceso.identificar(rut));
        obtenerPauta(id);
        if (aplicacionRepository.existsByPautaId(id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "La pauta tiene evaluaciones registradas. Desactívela en lugar de eliminarla.");
        }
        pautaRepository.deleteById(id);
    }

    // ---------------------------------------------------------- Evaluación digital (HU-05)

    /**
     * Pautas de la práctica de un estudiante, según quién consulta: el evaluador ve las que le corresponden,
     * el coordinador ve todas, y el profesor de asignatura y el estudiante ven solo las finalizadas.
     */
    @Transactional(readOnly = true)
    public List<PautaResumenDTO> listarParaPractica(String rut, Long practicaId) {
        Solicitante s = acceso.identificar(rut);
        Practica practica = obtenerPractica(practicaId);
        if (!acceso.puedeVerPractica(s, practica)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tiene acceso a esta práctica.");
        }
        String asignatura = practica.getAsignatura() != null ? practica.getAsignatura().getNombre() : null;
        Map<Long, PautaAplicacion> aplicadas = new HashMap<>();
        for (PautaAplicacion a : aplicacionRepository.findByPracticaIdPractica(practicaId)) {
            aplicadas.put(a.getPauta().getId(), a);
        }
        return pautaRepository.findAll().stream()
            .filter(p -> !Boolean.FALSE.equals(p.getActiva()))
            .filter(p -> asignatura != null && asignatura.equalsIgnoreCase(p.getAsignatura()))
            .filter(p -> {
                if (s.puedeGestionar() || acceso.puedeEvaluar(s, p, practica)) return true;
                PautaAplicacion a = aplicadas.get(p.getId());
                return a != null && acceso.puedeVerAplicacion(s, a);
            })
            .map(p -> resumen(p, aplicadas.get(p.getId())))
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AplicacionDTO obtenerAplicacion(String rut, Long pautaId, Long practicaId) {
        Solicitante s = acceso.identificar(rut);
        Pauta pauta = obtenerPauta(pautaId);
        Practica practica = obtenerPractica(practicaId);
        if (!acceso.puedeVerPractica(s, practica)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tiene acceso a esta práctica.");
        }
        PautaAplicacion app = aplicacionRepository.findByPautaIdAndPracticaIdPractica(pautaId, practicaId).orElse(null);
        if (app == null) {
            if (!s.puedeGestionar() && !acceso.puedeEvaluar(s, pauta, practica)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tiene acceso a esta pauta.");
            }
            return null;
        }
        if (!acceso.puedeVerAplicacion(s, app)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tiene acceso a esta pauta.");
        }
        return aplicacionDTO(app, pauta);
    }

    @Transactional
    public AplicacionDTO guardarAplicacion(String rut, Long pautaId, Long practicaId, GuardarAplicacionRequest req) {
        Solicitante s = acceso.identificar(rut);
        Pauta pauta = obtenerPauta(pautaId);
        Practica practica = obtenerPractica(practicaId);

        if (!acceso.puedeEvaluar(s, pauta, practica)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "Esta pauta no le corresponde: debe ser el evaluador asignado a esta práctica.");
        }

        PautaAplicacion app = aplicacionRepository.findByPautaIdAndPracticaIdPractica(pautaId, practicaId)
            .orElseGet(() -> {
                PautaAplicacion nueva = new PautaAplicacion();
                nueva.setPauta(pauta);
                nueva.setPractica(practica);
                return nueva;
            });

        if (app.getEvaluadorRut() != null && !app.getEvaluadorRut().equalsIgnoreCase(s.rut())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Esta pauta ya está siendo completada por otro evaluador.");
        }
        if (PautaAplicacion.FINALIZADA.equals(app.getEstado())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "La pauta ya fue finalizada. Solo el coordinador puede reabrirla.");
        }

        Map<Long, PautaCriterio> criteriosPorId = pauta.getCriterios().stream()
            .collect(Collectors.toMap(c -> c.getId(), c -> c));
        int min = Objects.requireNonNullElse(pauta.getEscalaMin(), 1);
        int max = Objects.requireNonNullElse(pauta.getEscalaMax(), 7);

        if (req.respuestas() != null) {
            Map<Long, PautaRespuesta> existentes = app.getRespuestas().stream()
                .collect(Collectors.toMap(r -> r.getCriterio().getId(), r -> r));
            for (RespuestaDTO r : req.respuestas()) {
                PautaCriterio criterio = criteriosPorId.get(r.criterioId());
                if (criterio == null) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "El criterio " + r.criterioId() + " no pertenece a la pauta.");
                }
                if (r.puntaje() == null) {
                    PautaRespuesta quitar = existentes.get(r.criterioId());
                    if (quitar != null) app.getRespuestas().remove(quitar);
                    continue;
                }
                if (r.puntaje() < min || r.puntaje() > max) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "El puntaje debe estar entre " + min + " y " + max + " (sin decimales).");
                }
                PautaRespuesta actual = existentes.get(r.criterioId());
                if (actual != null) actual.setPuntaje(r.puntaje());
                else app.getRespuestas().add(new PautaRespuesta(app, criterio, r.puntaje()));
            }
        }

        // El evaluador se toma de quien hace la petición, no de lo que envíe el cliente.
        app.setEvaluadorRut(s.rut());
        app.setEvaluadorNombre(s.nombreCompleto());
        if (req.observaciones() != null) app.setObservaciones(req.observaciones());
        app.setFechaActualizacion(LocalDateTime.now());

        boolean completa = app.getRespuestas().size() == pauta.getCriterios().size();
        if (Boolean.TRUE.equals(req.finalizar())) {
            if (!completa) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Faltan criterios por responder (" + app.getRespuestas().size() + " de "
                        + pauta.getCriterios().size() + ").");
            }
            app.setEstado(PautaAplicacion.FINALIZADA);
            app.setFechaFinalizacion(LocalDateTime.now());
        }

        recalcular(app, pauta);
        return aplicacionDTO(aplicacionRepository.save(app), pauta);
    }

    /** Solo el coordinador: devuelve una pauta finalizada a borrador para que el evaluador la corrija. */
    @Transactional
    public AplicacionDTO reabrir(String rut, Long pautaId, Long practicaId) {
        acceso.exigirGestion(acceso.identificar(rut));
        Pauta pauta = obtenerPauta(pautaId);
        PautaAplicacion app = aplicacionRepository.findByPautaIdAndPracticaIdPractica(pautaId, practicaId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No hay evaluación registrada."));
        app.setEstado(PautaAplicacion.BORRADOR);
        app.setFechaFinalizacion(null);
        app.setFechaActualizacion(LocalDateTime.now());
        recalcular(app, pauta);
        app.setNota(null);
        return aplicacionDTO(aplicacionRepository.save(app), pauta);
    }

    /** Resultados visibles para quien consulta (estudiante, profesor de asignatura, coordinador o evaluador). */
    @Transactional(readOnly = true)
    public List<ResultadoDTO> listarResultados(String rut) {
        Solicitante s = acceso.identificar(rut);
        return aplicacionRepository.findAll().stream()
            .filter(a -> acceso.puedeVerAplicacion(s, a))
            .sorted((x, y) -> {
                LocalDateTime fx = x.getFechaActualizacion();
                LocalDateTime fy = y.getFechaActualizacion();
                if (fx == null && fy == null) return 0;
                if (fx == null) return 1;
                if (fy == null) return -1;
                return fy.compareTo(fx);
            })
            .map(this::resultadoDTO)
            .collect(Collectors.toList());
    }

    // ---------------------------------------------------------- Cálculo de puntaje y nota

    private void recalcular(PautaAplicacion app, Pauta pauta) {
        int escalaMax = Objects.requireNonNullElse(pauta.getEscalaMax(), 7);
        double puntaje = app.getRespuestas().stream().mapToInt(resp -> resp.getPuntaje()).sum();
        double maximo = (double) pauta.getCriterios().size() * escalaMax;
        app.setPuntajeObtenido(puntaje);
        app.setPuntajeMaximo(maximo);
        boolean completa = app.getRespuestas().size() == pauta.getCriterios().size() && !pauta.getCriterios().isEmpty();
        app.setNota(completa ? calcularNota(pauta, puntaje, app.getRespuestas().size(), maximo) : null);
    }

    /**
     * ESCALA_EXIGENCIA: escala lineal por tramos (2.0 -> 4.0 hasta la exigencia, 4.0 -> 7.0 sobre ella).
     * PROMEDIO: promedio simple de los puntajes (pautas de observación 1-7).
     */
    static double calcularNota(Pauta pauta, double puntaje, int respondidos, double maximo) {
        double nota;
        if ("PROMEDIO".equalsIgnoreCase(pauta.getModoCalculo())) {
            nota = puntaje / respondidos;
        } else {
            double exig = Objects.requireNonNullElse(pauta.getExigencia(), 60) / 100.0;
            double pExig = maximo * exig;
            if (puntaje < pExig) {
                nota = NOTA_MIN + (NOTA_APROBACION - NOTA_MIN) * puntaje / pExig;
            } else {
                nota = NOTA_APROBACION + (NOTA_MAX - NOTA_APROBACION) * (puntaje - pExig) / (maximo - pExig);
            }
        }
        return BigDecimal.valueOf(nota).setScale(1, RoundingMode.HALF_UP).doubleValue();
    }

    // ---------------------------------------------------------- Mapeos y utilidades

    private Pauta obtenerPauta(Long id) {
        return pautaRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pauta no encontrada."));
    }

    private Practica obtenerPractica(Long id) {
        return practicaRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Práctica no encontrada."));
    }

    private static boolean coincide(String valor, String filtro) {
        if (filtro == null || filtro.isBlank()) return true;
        return valor != null && valor.toUpperCase(Locale.ROOT).equals(filtro.trim().toUpperCase(Locale.ROOT));
    }

    /**
     * Valida los datos de una pauta. Al crear (existente == null) son obligatorios asignatura, evaluador, momento,
     * especialidad y al menos un indicador; al editar solo se validan los campos que vienen en la solicitud.
     */
    private void validarCampos(PautaRequest r, Pauta existente) {
        boolean crear = existente == null;
        if (crear && (r.asignatura() == null || r.asignatura().isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La asignatura es obligatoria.");
        }
        if (crear && (r.criterios() == null || r.criterios().isEmpty())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La pauta necesita al menos un indicador.");
        }
        validarOpcion(r.evaluador(), EVALUADORES, "evaluador", crear);
        validarOpcion(r.momento(), MOMENTOS, "momento de evaluación", crear);
        validarOpcion(r.especialidad(), ESPECIALIDADES, "especialidad", crear);
        validarOpcion(r.modoCalculo(), MODOS_CALCULO, "modo de cálculo", false);

        int min = Objects.requireNonNullElse(r.escalaMin(), existente != null ? Objects.requireNonNullElse(existente.getEscalaMin(), 1) : 1);
        int max = Objects.requireNonNullElse(r.escalaMax(), existente != null ? Objects.requireNonNullElse(existente.getEscalaMax(), 7) : 7);
        if (min < 0 || max > 10 || min >= max) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "La escala de puntaje debe tener un mínimo menor que el máximo, entre 0 y 10.");
        }
        if (r.exigencia() != null && (r.exigencia() < 1 || r.exigencia() > 99)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La exigencia debe estar entre 1 y 99 %.");
        }
    }

    private static void validarOpcion(String valor, Set<String> permitidos, String nombre, boolean obligatorio) {
        if (valor == null || valor.isBlank()) {
            if (obligatorio) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Falta indicar: " + nombre + ".");
            }
            return;
        }
        if (!permitidos.contains(valor.toUpperCase(Locale.ROOT))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Valor no válido para " + nombre + ": " + valor);
        }
    }

    /**
     * Con evaluaciones registradas solo se pueden editar título, tipo, ponderación, versión, instrucciones y estado.
     * Cambiar la asignatura, el evaluador, el momento o la escala dejaría inconsistentes las notas ya calculadas.
     */
    private void exigirSinCambiosEstructurales(Pauta p, PautaRequest r) {
        boolean cambia = distinto(p.getAsignatura(), r.asignatura(), false)
            || distinto(p.getEspecialidad(), r.especialidad(), true)
            || distinto(p.getMomento(), r.momento(), true)
            || distinto(p.getEvaluador(), r.evaluador(), true)
            || distinto(p.getModoCalculo(), r.modoCalculo(), true)
            || (r.escalaMin() != null && !r.escalaMin().equals(p.getEscalaMin()))
            || (r.escalaMax() != null && !r.escalaMax().equals(p.getEscalaMax()))
            || (r.exigencia() != null && !r.exigencia().equals(p.getExigencia()));
        if (cambia) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "La pauta ya tiene evaluaciones registradas: solo se pueden editar título, tipo, ponderación, "
                    + "versión e instrucciones. Cree una nueva versión para cambiar lo demás.");
        }
    }

    private static boolean distinto(String actual, String nuevo, boolean mayusculas) {
        if (nuevo == null) return false;
        String n = mayusculas ? nuevo.toUpperCase(Locale.ROOT) : nuevo;
        return !n.equals(actual);
    }

    private void aplicarDatos(Pauta p, PautaRequest r) {
        if (r.codigo() != null) p.setCodigo(r.codigo());
        if (r.titulo() != null) p.setTitulo(r.titulo());
        if (r.asignatura() != null) p.setAsignatura(r.asignatura());
        if (r.tipo() != null) p.setTipo(r.tipo());
        if (r.especialidad() != null) p.setEspecialidad(r.especialidad().toUpperCase(Locale.ROOT));
        if (r.momento() != null) p.setMomento(r.momento().toUpperCase(Locale.ROOT));
        if (r.evaluador() != null) p.setEvaluador(r.evaluador().toUpperCase(Locale.ROOT));
        p.setEscalaMin(Objects.requireNonNullElse(r.escalaMin(), Objects.requireNonNullElse(p.getEscalaMin(), 1)));
        p.setEscalaMax(Objects.requireNonNullElse(r.escalaMax(), Objects.requireNonNullElse(p.getEscalaMax(), 7)));
        p.setModoCalculo(r.modoCalculo() != null ? r.modoCalculo().toUpperCase(Locale.ROOT)
            : (p.getModoCalculo() != null ? p.getModoCalculo() : "PROMEDIO"));
        if (r.exigencia() != null) p.setExigencia(r.exigencia());
        if (r.ponderacion() != null) p.setPonderacion(r.ponderacion());
        if (r.instrucciones() != null) p.setInstrucciones(r.instrucciones());
        if (r.version() != null) p.setVersion(r.version());
        if (r.activa() != null) p.setActiva(r.activa());
    }

    private void reemplazarCriterios(Pauta p, List<CriterioRequest> criterios) {
        p.getCriterios().clear();
        if (criterios == null) {
            p.setCriteriosCount(0);
            return;
        }
        int orden = 1;
        for (CriterioRequest c : criterios) {
            if (c.texto() == null || c.texto().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Todos los criterios requieren texto.");
            }
            p.getCriterios().add(new PautaCriterio(p, orden, c.dimension(),
                c.numero() != null ? c.numero() : String.valueOf(orden), c.texto()));
            orden++;
        }
        p.setCriteriosCount(p.getCriterios().size());
    }

    private PautaResumenDTO resumen(Pauta p, PautaAplicacion app) {
        int n = p.getCriterios().size();
        int escalaMax = Objects.requireNonNullElse(p.getEscalaMax(), 7);
        return new PautaResumenDTO(p.getId(), p.getCodigo(), p.getTitulo(), p.getAsignatura(), p.getTipo(),
            p.getEspecialidad(), p.getMomento(), p.getEvaluador(), n, n * escalaMax, p.getPonderacion(),
            p.getVersion(), p.getActiva(),
            app != null ? app.getId() : null, app != null ? app.getEstado() : null, app != null ? app.getNota() : null);
    }

    private PautaDetalleDTO detalle(Pauta p) {
        int n = p.getCriterios().size();
        int escalaMax = Objects.requireNonNullElse(p.getEscalaMax(), 7);
        List<CriterioDTO> criterios = p.getCriterios().stream()
            .map(c -> new CriterioDTO(c.getId(), c.getOrden(), c.getDimension(), c.getNumero(), c.getTexto()))
            .collect(Collectors.toList());
        return new PautaDetalleDTO(p.getId(), p.getCodigo(), p.getTitulo(), p.getAsignatura(), p.getTipo(),
            p.getEspecialidad(), p.getMomento(), p.getEvaluador(), p.getEscalaMin(), p.getEscalaMax(),
            p.getModoCalculo(), p.getExigencia(), n * escalaMax, p.getPonderacion(), p.getInstrucciones(),
            p.getVersion(), p.getActiva(), criterios, aplicacionRepository.existsByPautaId(p.getId()));
    }

    private AplicacionDTO aplicacionDTO(PautaAplicacion a, Pauta pauta) {
        List<RespuestaDTO> respuestas = new ArrayList<>();
        for (PautaRespuesta r : a.getRespuestas()) {
            respuestas.add(new RespuestaDTO(r.getCriterio().getId(), r.getPuntaje()));
        }
        return new AplicacionDTO(a.getId(), pauta.getId(), a.getPractica().getIdPractica(), a.getEstado(),
            a.getEvaluadorRut(), a.getEvaluadorNombre(), a.getObservaciones(), respuestas,
            respuestas.size(), pauta.getCriterios().size(), a.getPuntajeObtenido(), a.getPuntajeMaximo(),
            a.getNota(), a.getFechaActualizacion(), a.getFechaFinalizacion());
    }

    private ResultadoDTO resultadoDTO(PautaAplicacion a) {
        Pauta p = a.getPauta();
        Practica pr = a.getPractica();
        String estNombre = null;
        String estRut = null;
        if (pr.getEstudiante() != null && pr.getEstudiante().getUsuario() != null) {
            String n = pr.getEstudiante().getUsuario().getNombre();
            String ap = pr.getEstudiante().getUsuario().getApellido();
            estNombre = ((n != null ? n : "") + " " + (ap != null ? ap : "")).trim();
            estRut = pr.getEstudiante().getUsuario().getRut();
        }
        return new ResultadoDTO(a.getId(), p.getId(), p.getCodigo(), p.getTitulo(), p.getAsignatura(),
            p.getEvaluador(), a.getEvaluadorNombre(), pr.getIdPractica(), estNombre, estRut,
            a.getEstado(), a.getPuntajeObtenido(), a.getPuntajeMaximo(), a.getNota(),
            p.getModoCalculo(), p.getPonderacion(), a.getFechaActualizacion(), a.getFechaFinalizacion());
    }
}
