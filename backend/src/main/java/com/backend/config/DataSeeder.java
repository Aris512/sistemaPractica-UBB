package com.backend.config;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.backend.model.Actividad;
import com.backend.model.Asignatura;
import com.backend.model.CentroPractica;
import com.backend.model.Estudiante;
import com.backend.model.Evaluacion;
import com.backend.model.Evidencia;
import com.backend.model.ObservacionPractica;
import com.backend.model.Pauta;
import com.backend.model.Practica;
import com.backend.model.Profesor;
import com.backend.model.ProfesorColaborador;
import com.backend.model.Rol;
import com.backend.model.TutorPractica;
import com.backend.model.Usuario;
import com.backend.model.Permiso;
import com.backend.model.RolPermiso;
import com.backend.repository.ActividadRepository;
import com.backend.repository.AsignaturaRepository;
import com.backend.repository.CentroPracticaRepository;
import com.backend.repository.EstudianteRepository;
import com.backend.repository.EvaluacionRepository;
import com.backend.repository.EvidenciaRepository;
import com.backend.model.DocumentoPractica;
import com.backend.repository.DocumentoPracticaRepository;
import com.backend.repository.ObservacionPracticaRepository;
import com.backend.repository.PautaRepository;
import com.backend.repository.PermisoRepository;
import com.backend.repository.PracticaRepository;
import com.backend.repository.ProfesorColaboradorRepository;
import com.backend.repository.ProfesorRepository;
import com.backend.repository.RolPermisoRepository;
import com.backend.repository.RolRepository;
import com.backend.repository.TutorPracticaRepository;
import com.backend.repository.UsuarioRepository;

@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataSeeder.class);

    private final RolRepository rolRepository;
    private final PermisoRepository permisoRepository;
    private final RolPermisoRepository rolPermisoRepository;
    private final UsuarioRepository usuarioRepository;
    private final AsignaturaRepository asignaturaRepository;
    private final EstudianteRepository estudianteRepository;
    private final ProfesorRepository profesorRepository;
    private final ActividadRepository actividadRepository;
    private final EvaluacionRepository evaluacionRepository;
    private final EvidenciaRepository evidenciaRepository;
    private final CentroPracticaRepository centroPracticaRepository;
    private final TutorPracticaRepository tutorPracticaRepository;
    private final ProfesorColaboradorRepository profesorColaboradorRepository;
    private final PracticaRepository practicaRepository;
    private final PautaRepository pautaRepository;
    private final ObservacionPracticaRepository observacionPracticaRepository;
    private final DocumentoPracticaRepository documentoPracticaRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public DataSeeder(RolRepository rolRepository,
                      PermisoRepository permisoRepository,
                      RolPermisoRepository rolPermisoRepository,
                      UsuarioRepository usuarioRepository,
                      AsignaturaRepository asignaturaRepository,
                      EstudianteRepository estudianteRepository,
                      ProfesorRepository profesorRepository,
                      ActividadRepository actividadRepository,
                      EvaluacionRepository evaluacionRepository,
                      EvidenciaRepository evidenciaRepository,
                      CentroPracticaRepository centroPracticaRepository,
                      TutorPracticaRepository tutorPracticaRepository,
                      ProfesorColaboradorRepository profesorColaboradorRepository,
                      PracticaRepository practicaRepository,
                      PautaRepository pautaRepository,
                      ObservacionPracticaRepository observacionPracticaRepository,
                      DocumentoPracticaRepository documentoPracticaRepository) {
        this.rolRepository = rolRepository;
        this.permisoRepository = permisoRepository;
        this.rolPermisoRepository = rolPermisoRepository;
        this.usuarioRepository = usuarioRepository;
        this.asignaturaRepository = asignaturaRepository;
        this.estudianteRepository = estudianteRepository;
        this.profesorRepository = profesorRepository;
        this.actividadRepository = actividadRepository;
        this.evaluacionRepository = evaluacionRepository;
        this.evidenciaRepository = evidenciaRepository;
        this.centroPracticaRepository = centroPracticaRepository;
        this.tutorPracticaRepository = tutorPracticaRepository;
        this.profesorColaboradorRepository = profesorColaboradorRepository;
        this.practicaRepository = practicaRepository;
        this.pautaRepository = pautaRepository;
        this.observacionPracticaRepository = observacionPracticaRepository;
        this.documentoPracticaRepository = documentoPracticaRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        logger.info("=================================================");
        logger.info("Iniciando DataSeeder de datos iniciales...");
        logger.info("=================================================");

        seedRoles();
        seedPermisos();
        seedAsignaturas();
        seedUsuarios();
        seedEstudiantesYProfesores();
        seedActividadesYEvidencias();
        seedCentrosYTutoresYPracticas();
        seedPautas();
        seedObservaciones();
        seedDocumentosPractica();
        seedEvaluaciones();

        logger.info("=================================================");
        logger.info("DataSeeder finalizado con éxito.");
        logger.info("=================================================");
    }

    private void seedRoles() {
        List<RolInfo> rolesIniciales = List.of(
            new RolInfo("ESTUDIANTE", "Rol para estudiantes que realizan prácticas"),
            new RolInfo("PROFESOR_ASIGNATURA", "Rol para profesores a cargo de asignaturas"),
            new RolInfo("PROFESOR_COLABORADOR", "Rol para profesores colaboradores en centros de práctica"),
            new RolInfo("TUTOR_PRACTICA", "Rol para tutores de práctica profesional"),
            new RolInfo("COORDINADOR", "Rol para coordinadores de práctica")
        );

        for (RolInfo info : rolesIniciales) {
            if (!rolRepository.existsByNombre(info.nombre())) {
                Rol nuevoRol = new Rol(info.nombre(), info.descripcion());
                rolRepository.save(nuevoRol);
                logger.info("Rol creado: {}", info.nombre());
            } else {
                logger.info("Rol '{}' ya existe. Omitiendo creación.", info.nombre());
            }
        }
    }

    private void seedPermisos() {
        List<PermisoSeedInfo> permisosIniciales = List.of(
            new PermisoSeedInfo("PORTAFOLIO_CONSULTAR", "Consultar portafolio", "PORTAFOLIO", "Permite consultar y visualizar documentos y evidencias del portafolio"),
            new PermisoSeedInfo("PORTAFOLIO_SUBIR", "Subir archivos", "PORTAFOLIO", "Permite cargar y subir documentos y evidencias al portafolio"),
            new PermisoSeedInfo("EVALUACIONES_REALIZAR", "Realizar evaluaciones", "EVALUACIONES", "Permite evaluar y calificar procesos y prácticas formativas"),
            new PermisoSeedInfo("EVALUACIONES_CONSULTAR", "Consultar evaluaciones", "EVALUACIONES", "Permite consultar y visualizar las evaluaciones registradas"),
            new PermisoSeedInfo("OBSERVACIONES_REGISTRAR", "Registrar observaciones", "OBSERVACIONES", "Permite registrar observaciones formativas y pedagógicas"),
            new PermisoSeedInfo("OBSERVACIONES_CONSULTAR", "Consultar observaciones", "OBSERVACIONES", "Permite consultar el historial de observaciones formativas"),
            new PermisoSeedInfo("ESTUDIANTES_CONSULTAR", "Consultar información de otros estudiantes", "ESTUDIANTES", "Permite visualizar listas y expedientes de otros estudiantes"),
            new PermisoSeedInfo("IA_ACCESO", "Acceso a funcionalidades de IA", "INTELIGENCIA ARTIFICIAL", "Permite acceder a los asistentes inteligentes y recomendaciones pedagógicas con IA")
        );

        for (PermisoSeedInfo info : permisosIniciales) {
            if (!permisoRepository.existsByCodigo(info.codigo())) {
                Permiso nuevoPermiso = new Permiso(info.codigo(), info.nombre(), info.categoria(), info.descripcion());
                permisoRepository.save(nuevoPermiso);
                logger.info("Permiso creado en catálogo: {} ({})", info.codigo(), info.nombre());
            }
        }

        // Asignación de permisos por defecto para cada rol
        seedRolPermisosPorDefecto();
    }

    private void seedRolPermisosPorDefecto() {
        // Matriz por defecto para roles
        Map<String, Map<String, RolPermisoDefecto>> matrizRoles = Map.of(
            "ESTUDIANTE", Map.of(
                "PORTAFOLIO_CONSULTAR", new RolPermisoDefecto(true, "ALL"),
                "PORTAFOLIO_SUBIR", new RolPermisoDefecto(true, "ALL"),
                "EVALUACIONES_REALIZAR", new RolPermisoDefecto(false, "ALL"),
                "EVALUACIONES_CONSULTAR", new RolPermisoDefecto(true, "ALL"),
                "OBSERVACIONES_REGISTRAR", new RolPermisoDefecto(false, "ALL"),
                "OBSERVACIONES_CONSULTAR", new RolPermisoDefecto(true, "ALL"),
                "ESTUDIANTES_CONSULTAR", new RolPermisoDefecto(false, "ALL"),
                "IA_ACCESO", new RolPermisoDefecto(true, "3,4,5,6,7,8,9,10") // Habilitado desde 3er semestre
            ),
            "PROFESOR_ASIGNATURA", Map.of(
                "PORTAFOLIO_CONSULTAR", new RolPermisoDefecto(true, "ALL"),
                "PORTAFOLIO_SUBIR", new RolPermisoDefecto(true, "ALL"),
                "EVALUACIONES_REALIZAR", new RolPermisoDefecto(true, "ALL"),
                "EVALUACIONES_CONSULTAR", new RolPermisoDefecto(true, "ALL"),
                "OBSERVACIONES_REGISTRAR", new RolPermisoDefecto(true, "ALL"),
                "OBSERVACIONES_CONSULTAR", new RolPermisoDefecto(true, "ALL"),
                "ESTUDIANTES_CONSULTAR", new RolPermisoDefecto(true, "ALL"),
                "IA_ACCESO", new RolPermisoDefecto(true, "ALL")
            ),
            "PROFESOR_COLABORADOR", Map.of(
                "PORTAFOLIO_CONSULTAR", new RolPermisoDefecto(true, "ALL"),
                "PORTAFOLIO_SUBIR", new RolPermisoDefecto(false, "ALL"),
                "EVALUACIONES_REALIZAR", new RolPermisoDefecto(true, "ALL"),
                "EVALUACIONES_CONSULTAR", new RolPermisoDefecto(true, "ALL"),
                "OBSERVACIONES_REGISTRAR", new RolPermisoDefecto(true, "ALL"),
                "OBSERVACIONES_CONSULTAR", new RolPermisoDefecto(true, "ALL"),
                "ESTUDIANTES_CONSULTAR", new RolPermisoDefecto(true, "ALL"),
                "IA_ACCESO", new RolPermisoDefecto(false, "ALL")
            ),
            "TUTOR_PRACTICA", Map.of(
                "PORTAFOLIO_CONSULTAR", new RolPermisoDefecto(true, "ALL"),
                "PORTAFOLIO_SUBIR", new RolPermisoDefecto(false, "ALL"),
                "EVALUACIONES_REALIZAR", new RolPermisoDefecto(true, "ALL"),
                "EVALUACIONES_CONSULTAR", new RolPermisoDefecto(true, "ALL"),
                "OBSERVACIONES_REGISTRAR", new RolPermisoDefecto(true, "ALL"),
                "OBSERVACIONES_CONSULTAR", new RolPermisoDefecto(true, "ALL"),
                "ESTUDIANTES_CONSULTAR", new RolPermisoDefecto(true, "ALL"),
                "IA_ACCESO", new RolPermisoDefecto(false, "ALL")
            ),
            "COORDINADOR", Map.of(
                "PORTAFOLIO_CONSULTAR", new RolPermisoDefecto(true, "ALL"),
                "PORTAFOLIO_SUBIR", new RolPermisoDefecto(true, "ALL"),
                "EVALUACIONES_REALIZAR", new RolPermisoDefecto(true, "ALL"),
                "EVALUACIONES_CONSULTAR", new RolPermisoDefecto(true, "ALL"),
                "OBSERVACIONES_REGISTRAR", new RolPermisoDefecto(true, "ALL"),
                "OBSERVACIONES_CONSULTAR", new RolPermisoDefecto(true, "ALL"),
                "ESTUDIANTES_CONSULTAR", new RolPermisoDefecto(true, "ALL"),
                "IA_ACCESO", new RolPermisoDefecto(true, "ALL")
            )
        );

        matrizRoles.forEach((rolNombre, permisosMap) -> {
            Optional<Rol> rolOpt = rolRepository.findByNombre(rolNombre);
            if (rolOpt.isPresent()) {
                Rol rol = rolOpt.get();
                permisosMap.forEach((permCodigo, configDefecto) -> {
                    Optional<Permiso> permisoOpt = permisoRepository.findByCodigo(permCodigo);
                    if (permisoOpt.isPresent()) {
                        Permiso permiso = permisoOpt.get();
                        Optional<RolPermiso> rpExistente = rolPermisoRepository.findByRolAndPermiso(rol, permiso);
                        if (rpExistente.isEmpty()) {
                            RolPermiso nuevoRP = new RolPermiso(rol, permiso, configDefecto.activo(), configDefecto.semestres());
                            rolPermisoRepository.save(nuevoRP);
                            logger.info("Permiso '{}' asignado a rol '{}' (activo: {}, semestres: {})",
                                    permCodigo, rolNombre, configDefecto.activo(), configDefecto.semestres());
                        }
                    }
                });
            }
        });
    }

    private void seedAsignaturas() {
        List<AsignaturaInfo> asignaturasIniciales = List.of(
            new AsignaturaInfo("Curriculum Educacional", "Asignatura del área curricular pedagógica", "4"),
            new AsignaturaInfo("Ambientes de Aprendizaje", "Gestión y diseño de ambientes de aprendizaje", "5"),
            new AsignaturaInfo("Trabajo Colaborativo en Aula", "Estrategias de trabajo colaborativo en aula", "6"),
            new AsignaturaInfo("Investigación en Aula", "Metodologías de investigación aplicadas al aula", "7"),
            new AsignaturaInfo("Práctica Pedagógica", "Práctica pedagógica en centros educativos", "8"),
            new AsignaturaInfo("Práctica Profesional", "Práctica profesional terminal de la carrera", "9")
        );

        for (AsignaturaInfo info : asignaturasIniciales) {
            if (!asignaturaRepository.existsByNombreIgnoreCase(info.nombre())) {
                Asignatura nuevaAsignatura = new Asignatura(info.nombre(), info.descripcion(), info.semestre());
                asignaturaRepository.save(nuevaAsignatura);
                logger.info("Asignatura creada: {} (Semestre {})", info.nombre(), info.semestre());
            } else {
                logger.info("Asignatura '{}' ya existe. Omitiendo creación.", info.nombre());
            }
        }
    }

    private void seedUsuarios() {
        String contrasenaHasheada = passwordEncoder.encode("123456");

        // Diferentes RUTs chilenos válidos calculados mediante algoritmo Módulo 11
        List<UsuarioInfo> usuariosIniciales = List.of(
            new UsuarioInfo("12345678-5", "Estudiante", "Prueba", "estudiante@test.com", "ESTUDIANTE"),
            new UsuarioInfo("15432109-8", "Camila", "Valenzuela", "camila.valenzuela@test.com", "ESTUDIANTE"),
            new UsuarioInfo("16543210-K", "Matías", "Morales", "matias.morales@test.com", "ESTUDIANTE"),
            new UsuarioInfo("17654321-3", "Valentina", "Rojas", "valentina.rojas@test.com", "ESTUDIANTE"),
            new UsuarioInfo("19876543-0", "Diego", "Castro", "diego.castro@test.com", "ESTUDIANTE"),
            new UsuarioInfo("14234567-6", "Sofía", "Herrera", "sofia.herrera@test.com", "ESTUDIANTE"),
            new UsuarioInfo("11111111-1", "Profesor", "Asignatura", "profesor@test.com", "PROFESOR_ASIGNATURA"),
            new UsuarioInfo("13876543-1", "Andrés", "Muñoz", "andres.munoz@test.com", "PROFESOR_ASIGNATURA"),
            new UsuarioInfo("10987654-2", "Patricia", "Navarro", "patricia.navarro@test.com", "PROFESOR_ASIGNATURA"),
            new UsuarioInfo("10000013-K", "Profesor", "Colaborador", "colaborador@test.com", "PROFESOR_COLABORADOR"),
            new UsuarioInfo("18765432-7", "Tutor", "Practica", "tutor@test.com", "TUTOR_PRACTICA"),
            new UsuarioInfo("20123456-5", "Coordinador", "General", "coordinador@test.com", "COORDINADOR")
        );

        for (UsuarioInfo info : usuariosIniciales) {
            Optional<Usuario> usuarioOpt = usuarioRepository.findByRut(info.rut());
            Rol rolAsociado = rolRepository.findByNombre(info.rol())
                .orElseThrow(() -> new IllegalStateException("Rol no encontrado: " + info.rol()));

            if (usuarioOpt.isEmpty()) {
                Usuario nuevoUsuario = new Usuario(
                    info.rut(),
                    info.nombre(),
                    info.apellido(),
                    info.correo(),
                    contrasenaHasheada
                );
                nuevoUsuario.setRoles(new HashSet<>(Collections.singletonList(rolAsociado)));
                usuarioRepository.save(nuevoUsuario);
                logger.info("Usuario creado: RUT {} ({}) con rol {}", info.rut(), info.correo(), info.rol());
            } else {
                Usuario usuarioExistente = usuarioOpt.get();
                if (usuarioExistente.getRoles() == null) {
                    usuarioExistente.setRoles(new HashSet<>());
                }

                boolean yaTieneRol = usuarioExistente.getRoles().stream()
                    .anyMatch(r -> r.getNombre().equalsIgnoreCase(info.rol()));

                if (!yaTieneRol) {
                    usuarioExistente.getRoles().add(rolAsociado);
                    usuarioRepository.save(usuarioExistente);
                    logger.info("Rol {} asignado al usuario existente con RUT: {}", info.rol(), info.rut());
                } else {
                    logger.info("Usuario con RUT '{}' ya existe y ya tiene asignado el rol '{}'. Omitiendo.", info.rut(), info.rol());
                }
            }
        }
    }

    private void seedEstudiantesYProfesores() {
        // Relación de estudiantes con asignaturas
        List<EstudianteSeedInfo> estudiantesInfo = List.of(
            new EstudianteSeedInfo("12345678-5", "Práctica Pedagógica", "ACTIVO"),
            new EstudianteSeedInfo("15432109-8", "Curriculum Educacional", "ACTIVO"),
            new EstudianteSeedInfo("16543210-K", "Ambientes de Aprendizaje", "ACTIVO"),
            new EstudianteSeedInfo("17654321-3", "Trabajo Colaborativo en Aula", "ACTIVO"),
            new EstudianteSeedInfo("19876543-0", "Investigación en Aula", "ACTIVO"),
            new EstudianteSeedInfo("14234567-6", "Práctica Profesional", "ACTIVO")
        );

        for (EstudianteSeedInfo info : estudiantesInfo) {
            Optional<Usuario> usuarioOpt = usuarioRepository.findByRut(info.rut());
            Optional<Asignatura> asignaturaOpt = asignaturaRepository.findByNombreIgnoreCase(info.asignaturaNombre());

            if (usuarioOpt.isPresent() && asignaturaOpt.isPresent()) {
                Usuario usuario = usuarioOpt.get();
                Asignatura asignatura = asignaturaOpt.get();

                Optional<Estudiante> estudianteExistente = estudianteRepository.findByUsuario(usuario);
                if (estudianteExistente.isEmpty()) {
                    Estudiante nuevoEstudiante = new Estudiante(usuario, asignatura, info.estado());
                    estudianteRepository.save(nuevoEstudiante);
                    logger.info("Estudiante vinculado: RUT {} con Asignatura '{}'", info.rut(), asignatura.getNombre());
                } else {
                    Estudiante est = estudianteExistente.get();
                    if (est.getAsignatura() == null) {
                        est.setAsignatura(asignatura);
                        estudianteRepository.save(est);
                        logger.info("Estudiante RUT {} actualizado con Asignatura '{}'", info.rut(), asignatura.getNombre());
                    }
                }
            }
        }

        // Relación de profesores con asignaturas
        List<ProfesorSeedInfo> profesoresInfo = List.of(
            new ProfesorSeedInfo("11111111-1", "Práctica Pedagógica"),
            new ProfesorSeedInfo("13876543-1", "Curriculum Educacional"),
            new ProfesorSeedInfo("10987654-2", "Trabajo Colaborativo en Aula")
        );

        for (ProfesorSeedInfo info : profesoresInfo) {
            Optional<Usuario> usuarioOpt = usuarioRepository.findByRut(info.rut());
            Optional<Asignatura> asignaturaOpt = asignaturaRepository.findByNombreIgnoreCase(info.asignaturaNombre());

            if (usuarioOpt.isPresent() && asignaturaOpt.isPresent()) {
                Usuario usuario = usuarioOpt.get();
                Asignatura asignatura = asignaturaOpt.get();

                Optional<Profesor> profesorExistente = profesorRepository.findByUsuario(usuario);
                if (profesorExistente.isEmpty()) {
                    Profesor nuevoProfesor = new Profesor(usuario, asignatura);
                    if (nuevoProfesor.getAsignaturas() == null) {
                        nuevoProfesor.setAsignaturas(new HashSet<>());
                    }
                    nuevoProfesor.getAsignaturas().add(asignatura);
                    profesorRepository.save(nuevoProfesor);
                    logger.info("Profesor vinculado: RUT {} con Asignatura '{}'", info.rut(), asignatura.getNombre());
                } else {
                    Profesor prof = profesorExistente.get();
                    boolean modificado = false;
                    if (prof.getAsignatura() == null) {
                        prof.setAsignatura(asignatura);
                        modificado = true;
                    }
                    if (prof.getAsignaturas() == null) {
                        prof.setAsignaturas(new HashSet<>());
                    }
                    if (!prof.getAsignaturas().contains(asignatura)) {
                        prof.getAsignaturas().add(asignatura);
                        modificado = true;
                    }
                    if (modificado) {
                        profesorRepository.save(prof);
                        logger.info("Profesor RUT {} actualizado con Asignatura '{}'", info.rut(), asignatura.getNombre());
                    }
                }
            }
        }
    }

    private void seedActividadesYEvidencias() {
        if (actividadRepository.count() == 0) {
            Optional<Profesor> profesorOpt = profesorRepository.findByUsuarioRut("11111111-1");
            Optional<Asignatura> asignaturaOpt = asignaturaRepository.findByNombreIgnoreCase("Práctica Pedagógica");
            Optional<Estudiante> estudianteOpt = estudianteRepository.findByUsuarioRut("12345678-5");

            if (profesorOpt.isPresent() && asignaturaOpt.isPresent()) {
                Profesor profesor = profesorOpt.get();
                Asignatura asignatura = asignaturaOpt.get();

                // Actividad 1: Con entrega revisada
                Actividad act1 = new Actividad(
                    profesor,
                    asignatura,
                    "Evidencia 1: Planificación de Clase y Recursos Didácticos",
                    "El estudiante debe adjuntar la planificación de aula para su primera intervención en el centro de práctica, incluyendo objetivos de aprendizaje, secuencia didáctica y materiales de apoyo.",
                    LocalDateTime.now().plusDays(7)
                );
                actividadRepository.save(act1);
                logger.info("Actividad inicial creada: {}", act1.getTitulo());

                if (estudianteOpt.isPresent()) {
                    Estudiante estudiante = estudianteOpt.get();
                    Evidencia ev1 = new Evidencia(
                        act1,
                        estudiante,
                        "Planificacion_Unidad_Funciones_JavierToro.pdf",
                        "https://ejemplo.edu/evidencias/planificacion_unidad1.pdf",
                        "Adjunto la propuesta de planificación con énfasis en resolución colaborativa de problemas matemáticos."
                    );
                    ev1.setFechaEntrega(LocalDateTime.now().minusDays(2));
                    ev1.setEstado("REVISADO");
                    ev1.setCalificacion(6.5);
                    ev1.setRetroalimentacion("Excelente articulación metodológica y selección de recursos. Sugiero profundizar un poco más en la pauta de cotejo para el cierre de la clase.");
                    ev1.setFechaRevision(LocalDateTime.now().minusHours(8));
                    ev1.setRevisadoPor(profesor);
                    evidenciaRepository.save(ev1);
                    logger.info("Evidencia inicial de prueba creada y revisada para estudiante: {}", estudiante.getUsuario().getRut());
                }

                // Actividad 2: Pendiente para el estudiante
                Actividad act2 = new Actividad(
                    profesor,
                    asignatura,
                    "Evidencia 2: Registro Reflexivo de Observación de Aula",
                    "Documento de análisis pedagógico crítico respecto a la dinámica del aula observada durante las primeras 15 horas de práctica pedagógica en terreno.",
                    LocalDateTime.now().plusDays(12)
                );
                actividadRepository.save(act2);
                logger.info("Actividad pendiente creada: {}", act2.getTitulo());
            }
        }
    }

    private void seedCentrosYTutoresYPracticas() {
        // Centros de práctica
        List<CentroPracticaInfo> centros = List.of(
            new CentroPracticaInfo("Colegio Concepción San Pedro", "Av. Los Manantiales 123, San Pedro de la Paz"),
            new CentroPracticaInfo("Liceo Bicentenario San Nicolás", "Av. Bernardo O'Higgins 450, San Nicolás"),
            new CentroPracticaInfo("Colegio San Agustín Concepción", "Collao 1200, Concepción"),
            new CentroPracticaInfo("Colegio Wessex School Chillán", "Paul Harris 980, Chillán")
        );

        for (CentroPracticaInfo c : centros) {
            if (!centroPracticaRepository.existsByNombre(c.nombre())) {
                centroPracticaRepository.save(new CentroPractica(c.nombre(), c.direccion()));
                logger.info("Centro de práctica registrado: {}", c.nombre());
            }
        }

        // Tutor de Práctica
        Optional<Usuario> usuarioTutor = usuarioRepository.findByRut("18765432-7");
        TutorPractica tutor = null;
        if (usuarioTutor.isPresent()) {
            Optional<TutorPractica> tutorOpt = tutorPracticaRepository.findByUsuarioRut("18765432-7");
            if (tutorOpt.isEmpty()) {
                tutor = new TutorPractica("Tutor de Práctica UBB", usuarioTutor.get());
                tutorPracticaRepository.save(tutor);
                logger.info("Tutor de práctica creado para RUT: 18765432-7");
            } else {
                tutor = tutorOpt.get();
            }
        }

        // Profesor Colaborador
        Optional<Usuario> usuarioColaborador = usuarioRepository.findByRut("10000013-K");
        CentroPractica primerCentro = centroPracticaRepository.findByNombre("Colegio Concepción San Pedro").orElse(null);
        ProfesorColaborador colaborador = null;
        if (usuarioColaborador.isPresent() && primerCentro != null) {
            Optional<ProfesorColaborador> colabOpt = profesorColaboradorRepository.findByUsuarioRut("10000013-K");
            if (colabOpt.isEmpty()) {
                colaborador = new ProfesorColaborador(usuarioColaborador.get(), primerCentro, "Pedagogía y Gestión de Aula");
                profesorColaboradorRepository.save(colaborador);
                logger.info("Profesor colaborador creado para RUT: 10000013-K");
            } else {
                colaborador = colabOpt.get();
            }
        }

        // Sembrar Prácticas si no existen
        if (practicaRepository.count() == 0 && tutor != null) {
            List<Estudiante> estudiantes = estudianteRepository.findAll();
            List<CentroPractica> centrosList = centroPracticaRepository.findAll();

            int idx = 0;
            for (Estudiante est : estudiantes) {
                CentroPractica centro = centrosList.get(idx % centrosList.size());
                Practica practica = new Practica(
                    est,
                    tutor,
                    centro,
                    est.getAsignatura(),
                    "EN_CURSO"
                );

                if (colaborador != null) {
                    practica.setProfesoresColaboradores(new HashSet<>(Collections.singletonList(colaborador)));
                }

                practicaRepository.save(practica);
                logger.info("Práctica creada para estudiante {} en {}", est.getUsuario().getRut(), centro.getNombre());
                idx++;
            }
        }
    }

    private void seedPautas() {
        if (pautaRepository.count() == 0) {
            List<Pauta> pautas = List.of(
                new Pauta(
                    "PAU-OBS-01",
                    "Pauta de Observación de Desempeño Docente en Aula",
                    "Práctica Pedagógica / Profesional",
                    "Observación de Aula",
                    12,
                    "Evalúa clima de aula, diseño de actividades de aprendizaje, dominio de contenido y fomento de la participación activa de los alumnos.",
                    "30%",
                    "2026.1"
                ),
                new Pauta(
                    "RUB-DES-02",
                    "Rúbrica Analítica de Planificación y Gestión Curricular",
                    "Todas las Prácticas",
                    "Rúbrica de Desempeño",
                    8,
                    "Rúbrica graduada con 4 niveles (Insuficiente, Básico, Competente, Destacado) para evaluar carpetas y planificaciones didácticas.",
                    "35%",
                    "2026.1"
                ),
                new Pauta(
                    "PAU-EVA-03",
                    "Pauta de Evaluación Final del Profesor Colaborador",
                    "Práctica Profesional (Semestre 9)",
                    "Evaluación Final",
                    15,
                    "Informe evaluativo consolidado del desempeño integral del practicante durante su estadía completa en la institución educativa.",
                    "35%",
                    "2026.1"
                ),
                new Pauta(
                    "RUB-INF-04",
                    "Rúbrica de Informe de Práctica y Reflexión Pedagógica",
                    "Práctica Pedagógica (Semestre 8)",
                    "Rúbrica de Desempeño",
                    10,
                    "Criterios para calificar la profundidad reflexiva, marco teórico y análisis pedagógico de la experiencia docente en aula.",
                    "25%",
                    "2026.2"
                )
            );

            pautaRepository.saveAll(pautas);
            logger.info("Pautas y rúbricas oficiales UBB sembradas en la base de datos ({} registros).", pautas.size());
        }
    }

    private void seedObservaciones() {
        if (observacionPracticaRepository.count() == 0) {
            List<ObservacionPractica> observaciones = List.of(
                new ObservacionPractica(
                    "Camila Ignacia Rojas",
                    "12345678-5",
                    "Colegio Concepción San Pedro",
                    "15 de Septiembre, 2026",
                    "Inicio de Clase y Activación de Conocimientos Previos",
                    "La estudiante practicante demuestra excelente dominio del grupo, motiva la participación y utiliza recursos didácticos atractivos. Se sugiere profundizar en la síntesis al cierre.",
                    "CONCLUIDA",
                    "18765432-7"
                ),
                new ObservacionPractica(
                    "Felipe Andrés Soto",
                    "15432109-8",
                    "Liceo Bicentenario San Nicolás",
                    "12 de Septiembre, 2026",
                    "Gestión del Clima de Aula y Trabajo Colaborativo",
                    "Buen manejo de la dinámica grupal en mesas de trabajo. Se acordó ajustar el tiempo asignado para la entrega de guías formativas en la siguiente clase supervisada.",
                    "SEGUIMIENTO",
                    "18765432-7"
                ),
                new ObservacionPractica(
                    "Matías Ignacio Morales",
                    "16543210-K",
                    "Colegio San Agustín Concepción",
                    "08 de Septiembre, 2026",
                    "Evaluación Formativa y Retroalimentación Inmediata",
                    "Aplicación destacada de rúbrica formativa compartida con los alumnos. Comunicación clara, lenguaje pedagógico pertinente y constante refuerzo positivo.",
                    "CONCLUIDA",
                    "10000013-K"
                ),
                new ObservacionPractica(
                    "Valentina Rojas",
                    "17654321-3",
                    "Colegio Wessex School Chillán",
                    "04 de Septiembre, 2026",
                    "Uso de Recursos Didácticos y Tecnológicos",
                    "Se integraron herramientas interactivas con buena recepción del estudiantado. Continuar fortaleciendo el control de tiempos durante la fase de cierre.",
                    "SEGUIMIENTO",
                    "10000013-K"
                )
            );

            observacionPracticaRepository.saveAll(observaciones);
            logger.info("Observaciones de práctica sembradas en la base de datos ({} registros).", observaciones.size());
        }
    }

    private void seedDocumentosPractica() {
        if (documentoPracticaRepository.count() == 0) {
            java.nio.file.Path uploadsDir = java.nio.file.Paths.get("uploads", "documentos");
            try {
                if (!java.nio.file.Files.exists(uploadsDir)) {
                    java.nio.file.Files.createDirectories(uploadsDir);
                }
            } catch (Exception e) {
                logger.error("Error creando directorio uploads/documentos: {}", e.getMessage());
            }

            Optional<Usuario> usuarioEstudiante1 = usuarioRepository.findByRut("12345678-5");
            Optional<Usuario> usuarioProfesor = usuarioRepository.findByRut("11111111-1");
            Optional<Asignatura> asig1 = asignaturaRepository.findByNombreIgnoreCase("Práctica Pedagógica");

            if (usuarioEstudiante1.isPresent() && usuarioProfesor.isPresent() && asig1.isPresent()) {
                Usuario est1 = usuarioEstudiante1.get();
                Usuario prof = usuarioProfesor.get();
                Asignatura asig = asig1.get();

                // 1. Doc estudiante 1 (12345678-5)
                String fnEst1 = "Informe_Final_Practica_Pedagogica_JavierToro.pdf";
                crearArchivoFisico(uploadsDir.resolve(fnEst1), "Informe de Práctica Pedagógica", est1.getNombre() + " " + est1.getApellido(), asig.getNombre());
                DocumentoPractica docEst1 = new DocumentoPractica(
                    est1, est1, asig,
                    fnEst1,
                    "Informe Final de Práctica Pedagógica y Autoevaluación",
                    "ESTUDIANTE",
                    "uploads/documentos/" + fnEst1,
                    LocalDateTime.now().minusDays(5),
                    "ENTREGADO",
                    145820L
                );
                documentoPracticaRepository.save(docEst1);

                // 2. Doc profesor para estudiante 1 (12345678-5)
                String fnProf1 = "Pauta_Evaluacion_Final_Profesor_12345678-5.pdf";
                crearArchivoFisico(uploadsDir.resolve(fnProf1), "Evaluación Final de Desempeño", est1.getNombre() + " " + est1.getApellido(), asig.getNombre());
                DocumentoPractica docProf1 = new DocumentoPractica(
                    prof, est1, asig,
                    fnProf1,
                    "Pauta de Evaluación Final del Profesor de Asignatura",
                    "PROFESOR",
                    "uploads/documentos/" + fnProf1,
                    LocalDateTime.now().minusDays(2),
                    "ENTREGADO",
                    120400L
                );
                documentoPracticaRepository.save(docProf1);
                logger.info("Documentos sembrados para estudiante 12345678-5 (100% Completo).");
            }

            // Estudiante 2 (15432109-8) - Camila Valenzuela (Curriculum Educacional) -> 50% En progreso
            Optional<Usuario> usuarioEstudiante2 = usuarioRepository.findByRut("15432109-8");
            Optional<Asignatura> asig2 = asignaturaRepository.findByNombreIgnoreCase("Curriculum Educacional");
            if (usuarioEstudiante2.isPresent() && asig2.isPresent()) {
                Usuario est2 = usuarioEstudiante2.get();
                Asignatura asig = asig2.get();

                String fnEst2 = "Informe_Avance_Curriculum_CamilaValenzuela.pdf";
                crearArchivoFisico(uploadsDir.resolve(fnEst2), "Informe de Avance Curricular", est2.getNombre() + " " + est2.getApellido(), asig.getNombre());
                DocumentoPractica docEst2 = new DocumentoPractica(
                    est2, est2, asig,
                    fnEst2,
                    "Informe Diagnóstico y Planificación Didáctica",
                    "ESTUDIANTE",
                    "uploads/documentos/" + fnEst2,
                    LocalDateTime.now().minusDays(3),
                    "ENTREGADO",
                    98400L
                );
                documentoPracticaRepository.save(docEst2);
                logger.info("Documento sembrado para estudiante 15432109-8 (50% En progreso).");
            }
        }
    }

    private void crearArchivoFisico(java.nio.file.Path destino, String titulo, String estudiante, String asignatura) {
        try {
            if (!java.nio.file.Files.exists(destino)) {
                byte[] content = com.backend.service.DocumentoPracticaService.generarPdfMock(titulo, estudiante, asignatura);
                java.nio.file.Files.write(destino, content);
            }
        } catch (Exception e) {
            logger.warn("No se pudo escribir archivo físico de prueba {}: {}", destino, e.getMessage());
        }
    }

    /**
     * Nuevo (módulo Pedro) — crea evaluaciones de prueba asociadas a las prácticas existentes.
     * Usa el nuevo constructor con idEvaluador, tipoEvaluador y fechaLimite.
     */
    private void seedEvaluaciones() {
        if (evaluacionRepository.count() > 0) {
            logger.info("Evaluaciones ya existen. Omitiendo seedEvaluaciones.");
            return;
        }

        List<Practica> practicas = practicaRepository.findAll();
        if (practicas.isEmpty()) {
            logger.warn("No hay prácticas para asociar evaluaciones. Omitiendo seedEvaluaciones.");
            return;
        }

        // Usamos el índice del usuario como referencia para idEvaluador (el modelo Evaluacion
        // almacena idEvaluador como Long; aquí guardamos el hashCode del RUT como referencia)
        Optional<Usuario> profesorOpt = usuarioRepository.findByRut("11111111-1");
        Optional<Usuario> colaboradorOpt = usuarioRepository.findByRut("10000013-K");

        for (int i = 0; i < practicas.size(); i++) {
            Practica practica = practicas.get(i);

            // Evaluación del profesor de asignatura
            if (profesorOpt.isPresent()) {
                Usuario prof = profesorOpt.get();
                Long idRef = (long) Math.abs(prof.getRut().hashCode());
                Evaluacion evalProfesor = new Evaluacion(
                    practica,
                    idRef,
                    "PROFESOR_ASIGNATURA",
                    "Evaluación de Desempeño Docente",
                    1.0,
                    7.0,
                    LocalDateTime.now().plusDays(30)
                );
                evaluacionRepository.save(evalProfesor);
                logger.info("Evaluación de profesor creada para práctica id: {}", practica.getIdPractica());
            }

            // Evaluación del colaborador (solo para las primeras 2 prácticas)
            if (colaboradorOpt.isPresent() && i < 2) {
                Usuario colab = colaboradorOpt.get();
                Long idRef = (long) Math.abs(colab.getRut().hashCode());
                Evaluacion evalColaborador = new Evaluacion(
                    practica,
                    idRef,
                    "PROFESOR_COLABORADOR",
                    "Evaluación de Práctica en Terreno",
                    1.0,
                    7.0,
                    LocalDateTime.now().plusDays(15)
                );
                evaluacionRepository.save(evalColaborador);
                logger.info("Evaluación de colaborador creada para práctica id: {}", practica.getIdPractica());
            }
        }

        logger.info("seedEvaluaciones completado.");
    }

    private record RolInfo(String nombre, String descripcion) {}
    private record AsignaturaInfo(String nombre, String descripcion, String semestre) {}
    private record UsuarioInfo(String rut, String nombre, String apellido, String correo, String rol) {}
    private record EstudianteSeedInfo(String rut, String asignaturaNombre, String estado) {}
    private record ProfesorSeedInfo(String rut, String asignaturaNombre) {}
    private record CentroPracticaInfo(String nombre, String direccion) {}
    private record PermisoSeedInfo(String codigo, String nombre, String categoria, String descripcion) {}
    private record RolPermisoDefecto(boolean activo, String semestres) {}
}
