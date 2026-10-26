package com.backend.config;

import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

<<<<<<< Updated upstream
=======
import com.backend.model.Actividad;
import com.backend.model.Asignatura;
import com.backend.model.CentroPractica;
import com.backend.model.DocumentoPractica;
import com.backend.model.Estudiante;
import com.backend.model.Evaluacion;
import com.backend.model.ObservacionPractica;
import com.backend.model.Permiso;
import com.backend.model.Practica;
import com.backend.model.Profesor;
import com.backend.model.ProfesorColaborador;
>>>>>>> Stashed changes
import com.backend.model.Rol;
import com.backend.model.Usuario;
import com.backend.repository.RolRepository;
import com.backend.repository.UsuarioRepository;

@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataSeeder.class);

    private final RolRepository rolRepository;
    private final UsuarioRepository usuarioRepository;
<<<<<<< Updated upstream
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public DataSeeder(RolRepository rolRepository, UsuarioRepository usuarioRepository) {
=======
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
    private final PautaCatalogoSeeder pautaCatalogoSeeder;
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
                      PautaCatalogoSeeder pautaCatalogoSeeder,
                      ObservacionPracticaRepository observacionPracticaRepository,
                      DocumentoPracticaRepository documentoPracticaRepository) {
>>>>>>> Stashed changes
        this.rolRepository = rolRepository;
        this.usuarioRepository = usuarioRepository;
<<<<<<< Updated upstream
=======
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
        this.pautaCatalogoSeeder = pautaCatalogoSeeder;
        this.observacionPracticaRepository = observacionPracticaRepository;
        this.documentoPracticaRepository = documentoPracticaRepository;
>>>>>>> Stashed changes
    }

    @Override
    @Transactional
    public void run(String... args) {
        logger.info("=================================================");
        logger.info("Iniciando DataSeeder de datos iniciales...");
        logger.info("=================================================");

        seedRoles();
        seedUsuarios();

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

    private void seedUsuarios() {
        String contrasenaHasheada = passwordEncoder.encode("123456");

        List<UsuarioInfo> usuariosIniciales = List.of(
            new UsuarioInfo("Estudiante", "Prueba", "estudiante@test.com", "ESTUDIANTE"),
            new UsuarioInfo("Profesor", "Asignatura", "profesor@test.com", "PROFESOR_ASIGNATURA"),
            new UsuarioInfo("Profesor", "Colaborador", "colaborador@test.com", "PROFESOR_COLABORADOR"),
            new UsuarioInfo("Tutor", "Practica", "tutor@test.com", "TUTOR_PRACTICA"),
            new UsuarioInfo("Coordinador", "General", "coordinador@test.com", "COORDINADOR")
        );

        for (UsuarioInfo info : usuariosIniciales) {
            Optional<Usuario> usuarioOpt = usuarioRepository.findByCorreo(info.correo());
            Rol rolAsociado = rolRepository.findByNombre(info.rol())
                .orElseThrow(() -> new IllegalStateException("Rol no encontrado: " + info.rol()));

            if (usuarioOpt.isEmpty()) {
                Usuario nuevoUsuario = new Usuario(
                    info.nombre(),
                    info.apellido(),
                    info.correo(),
                    contrasenaHasheada
                );
                nuevoUsuario.setRoles(new HashSet<>(Collections.singletonList(rolAsociado)));
                usuarioRepository.save(nuevoUsuario);
                logger.info("Usuario creado: {} con rol {}", info.correo(), info.rol());
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
                    logger.info("Rol {} asignado al usuario existente: {}", info.rol(), info.correo());
                } else {
                    logger.info("Usuario '{}' ya existe y ya tiene asignado el rol '{}'. Omitiendo.", info.correo(), info.rol());
                }
            }
        }
    }

<<<<<<< Updated upstream
=======
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
                    profesorRepository.save(nuevoProfesor);
                    logger.info("Profesor vinculado: RUT {} con Asignatura '{}'", info.rut(), asignatura.getNombre());
                } else {
                    Profesor prof = profesorExistente.get();
                    if (prof.getAsignatura() == null) {
                        prof.setAsignatura(asignatura);
                        profesorRepository.save(prof);
                        logger.info("Profesor RUT {} actualizado con Asignatura '{}'", info.rut(), asignatura.getNombre());
                    }
                }
            }
        }
    }

    private void eliminarActividadesDeDemostracion() {
        List<Actividad> actividadesDemo = actividadRepository.findByTituloIn(List.of(
            "Evidencia 1: Planificación de Clase y Recursos Didácticos",
            "Evidencia 2: Registro Reflexivo de Observación de Aula"
        ));
        if (actividadesDemo.isEmpty()) {
            return;
        }

        for (Actividad actividad : actividadesDemo) {
            evidenciaRepository.deleteAll(
                evidenciaRepository.findByActividadIdActividadOrderByFechaEntregaDesc(actividad.getIdActividad())
            );
        }
        actividadRepository.deleteAll(actividadesDemo);
        logger.info("Se eliminaron {} actividades de demostración para que solo el profesor cree tareas.", actividadesDemo.size());
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
        // Catálogo oficial de pautas UBB (indicadores y escalas en resources/pautas/pautas-oficiales.json)
        pautaCatalogoSeeder.sembrar();
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
            } catch (java.io.IOException | RuntimeException e) {
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
        } catch (java.io.IOException | RuntimeException e) {
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

>>>>>>> Stashed changes
    private record RolInfo(String nombre, String descripcion) {}
    private record UsuarioInfo(String nombre, String apellido, String correo, String rol) {}
}
