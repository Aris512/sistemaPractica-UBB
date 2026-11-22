package com.backend.config;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.backend.model.Permiso;
import com.backend.model.Rol;
import com.backend.model.RolPermiso;
import com.backend.repository.PermisoRepository;
import com.backend.repository.RolPermisoRepository;
import com.backend.repository.RolRepository;

/**
 * Catálogo fijo de permisos del sistema y a qué roles aplica cada uno.
 *
 * Cada permiso corresponde a una funcionalidad real de la plataforma y declara los roles que la tienen
 * (con su valor inicial). Un permiso solo se muestra en el panel «Permisos por rol» de los roles a los
 * que aplica, y solo se concede a esos roles: por ejemplo, «Asociar prácticas» es exclusivo del
 * coordinador, así que un profesor colaborador nunca lo obtiene aunque exista una fila antigua en la base.
 *
 * Para agregar o cambiar un permiso se edita {@link #CATALOGO}; la tabla "permiso" se sincroniza al
 * arrancar (nombre, categoría y descripción se toman del código). Las asignaciones por rol solo se
 * agregan cuando faltan: nunca se pisa lo que el administrador configuró desde el panel.
 */
@Component
public class PermisosCatalogo {

    private static final Logger logger = LoggerFactory.getLogger(PermisosCatalogo.class);

    public static final String ESTUDIANTE = "ESTUDIANTE";
    public static final String PROFESOR_ASIGNATURA = "PROFESOR_ASIGNATURA";
    public static final String PROFESOR_COLABORADOR = "PROFESOR_COLABORADOR";
    public static final String TUTOR_PRACTICA = "TUTOR_PRACTICA";
    public static final String COORDINADOR = "COORDINADOR";

    /** Semestres en que el alumno tiene acceso a la IA (desde 3.er semestre). */
    private static final String SEMESTRES_IA = "3,4,5,6,7,8,9,10";

    /** Permiso asignado a un rol: si está activo y en qué semestres ("ALL" o lista separada por comas). */
    public record AsignacionDefecto(boolean activo, String semestres) {
        static AsignacionDefecto si() { return new AsignacionDefecto(true, "ALL"); }
    }

    /**
     * Un permiso del catálogo.
     *
     * @param roles roles a los que aplica, con su valor inicial. Un rol que no figura aquí no puede tenerlo.
     */
    public record PermisoDef(String codigo, String nombre, String categoria, String descripcion,
                             Map<String, AsignacionDefecto> roles) {

        public boolean aplicaA(String rolNombre) {
            return rolNombre != null && roles.containsKey(rolNombre.trim().toUpperCase());
        }
    }

    private static Map<String, AsignacionDefecto> roles(Object... pares) {
        Map<String, AsignacionDefecto> mapa = new LinkedHashMap<>();
        for (int i = 0; i < pares.length; i += 2) {
            mapa.put((String) pares[i], (AsignacionDefecto) pares[i + 1]);
        }
        return mapa;
    }

    private static final AsignacionDefecto SI = AsignacionDefecto.si();

    public static final List<PermisoDef> CATALOGO = List.of(
        // ── Portafolio ──
        new PermisoDef("PORTAFOLIO_CONSULTAR", "Ver portafolio", "PORTAFOLIO",
                "Acceso al menú «Portafolio»: ver carpetas, documentos y evidencias.",
                roles(ESTUDIANTE, SI, PROFESOR_ASIGNATURA, SI, COORDINADOR, SI)),
        new PermisoDef("PORTAFOLIO_SUBIR", "Subir archivos al portafolio", "PORTAFOLIO",
                "Cargar, reemplazar y organizar archivos dentro del portafolio.",
                roles(ESTUDIANTE, SI, PROFESOR_ASIGNATURA, SI, COORDINADOR, SI)),

        // ── Actividades y evaluaciones ──
        new PermisoDef("ACTIVIDADES_GESTIONAR", "Crear y gestionar actividades", "EVALUACIONES",
                "Menú «Actividades»: publicar tareas para los alumnos de sus asignaturas.",
                roles(PROFESOR_ASIGNATURA, SI)),
        new PermisoDef("EVALUACIONES_REALIZAR", "Calificar entregas", "EVALUACIONES",
                "Menú «Evaluaciones»: poner nota y retroalimentación a las entregas de sus alumnos.",
                roles(PROFESOR_ASIGNATURA, SI)),
        new PermisoDef("EVALUACIONES_CONSULTAR", "Ver evaluaciones", "EVALUACIONES",
                "Menú «Evaluaciones»: revisar notas y comentarios registrados.",
                roles(ESTUDIANTE, SI, COORDINADOR, SI)),
        new PermisoDef("OBSERVACIONES_CONSULTAR", "Ver observaciones", "EVALUACIONES",
                "Menú «Observaciones»: historial de observaciones formativas del alumno.",
                roles(ESTUDIANTE, SI)),

        // ── Pautas de práctica ──
        new PermisoDef("PAUTAS_APLICAR", "Completar pautas de observación", "PAUTAS",
                "Menú «Pautas»: evaluar a los estudiantes asignados con las pautas de práctica.",
                roles(PROFESOR_COLABORADOR, SI, TUTOR_PRACTICA, SI)),
        new PermisoDef("PAUTAS_CONSULTAR", "Ver resultados de pautas", "PAUTAS",
                "Ver las pautas finalizadas y exportarlas en PDF («Mis Pautas» / «Pautas de práctica»).",
                roles(ESTUDIANTE, SI, PROFESOR_ASIGNATURA, SI)),
        new PermisoDef("PAUTAS_GESTIONAR", "Administrar pautas", "PAUTAS",
                "Menú «Pautas»: crear, editar y publicar las pautas de evaluación de práctica.",
                roles(COORDINADOR, SI)),

        // ── Prácticas y estudiantes ──
        new PermisoDef("ESTUDIANTES_CONSULTAR", "Ver estudiantes asignados", "PRACTICAS",
                "Tabla de inicio con los estudiantes en práctica a su cargo.",
                roles(PROFESOR_COLABORADOR, SI, TUTOR_PRACTICA, SI)),
        new PermisoDef("PRACTICAS_ASOCIAR", "Asociar prácticas", "PRACTICAS",
                "Menú «Asociar»: vincular estudiantes con profesor colaborador, tutor y centro en las 6 asignaturas de práctica.",
                roles(COORDINADOR, SI)),
        new PermisoDef("CENTROS_GESTIONAR", "Gestionar centros de práctica", "PRACTICAS",
                "Menú «Centros de Práctica»: registrar y editar establecimientos.",
                roles(COORDINADOR, SI)),
        new PermisoDef("DOCUMENTOS_GESTIONAR", "Documentos de práctica", "PRACTICAS",
                "Menú «Documentos»: revisar los documentos de práctica y exportarlos en ZIP.",
                roles(COORDINADOR, SI)),
        new PermisoDef("RETROALIMENTACION_REVISAR", "Revisar planificaciones", "PRACTICAS",
                "Menú «Retroalimentación»: aprobar o devolver planificaciones revisadas por la IA (8.º y 9.º semestre).",
                roles(PROFESOR_ASIGNATURA, SI)),

        // ── Inteligencia artificial ──
        new PermisoDef("IA_ACCESO", "Asistentes de IA", "INTELIGENCIA ARTIFICIAL",
                "Chat con IA y revisión de la planificación con IA («Asistentes de IA» y «Retroalimentación»).",
                roles(ESTUDIANTE, new AsignacionDefecto(true, SEMESTRES_IA)))
    );

    private static final Map<String, PermisoDef> POR_CODIGO;
    static {
        Map<String, PermisoDef> mapa = new LinkedHashMap<>();
        CATALOGO.forEach(def -> mapa.put(def.codigo(), def));
        POR_CODIGO = Map.copyOf(mapa);
    }

    public static Optional<PermisoDef> buscar(String codigo) {
        return codigo == null ? Optional.empty() : Optional.ofNullable(POR_CODIGO.get(codigo.trim().toUpperCase()));
    }

    /** true si el permiso existe en el catálogo y aplica al rol. Los permisos fuera del catálogo no aplican a nadie. */
    public static boolean aplicaA(String codigo, String rolNombre) {
        return buscar(codigo).map(def -> def.aplicaA(rolNombre)).orElse(false);
    }

    /** Posición del permiso en el catálogo, para mostrarlos siempre en el mismo orden. */
    public static int orden(String codigo) {
        PermisoDef def = buscar(codigo).orElse(null);
        return def == null ? Integer.MAX_VALUE : CATALOGO.indexOf(def);
    }

    private final PermisoRepository permisoRepository;
    private final RolRepository rolRepository;
    private final RolPermisoRepository rolPermisoRepository;

    public PermisosCatalogo(PermisoRepository permisoRepository,
                            RolRepository rolRepository,
                            RolPermisoRepository rolPermisoRepository) {
        this.permisoRepository = permisoRepository;
        this.rolRepository = rolRepository;
        this.rolPermisoRepository = rolPermisoRepository;
    }

    /**
     * Crea o actualiza en la base los permisos del catálogo y asigna a cada rol su configuración
     * inicial donde todavía no exista. Los roles deben existir antes de llamarlo.
     */
    @Transactional
    public void sincronizar() {
        for (PermisoDef def : CATALOGO) {
            Optional<Permiso> existente = permisoRepository.findByCodigo(def.codigo());
            Permiso permiso;
            if (existente.isEmpty()) {
                permiso = permisoRepository.save(new Permiso(def.codigo(), def.nombre(), def.categoria(), def.descripcion()));
                logger.info("Permiso creado en catálogo: {} ({})", def.codigo(), def.nombre());
            } else {
                permiso = existente.get();
                if (!Objects.equals(permiso.getNombre(), def.nombre())
                        || !Objects.equals(permiso.getCategoria(), def.categoria())
                        || !Objects.equals(permiso.getDescripcion(), def.descripcion())) {
                    permiso.setNombre(def.nombre());
                    permiso.setCategoria(def.categoria());
                    permiso.setDescripcion(def.descripcion());
                    permiso = permisoRepository.save(permiso);
                    logger.info("Permiso actualizado desde el catálogo: {}", def.codigo());
                }
            }

            for (Map.Entry<String, AsignacionDefecto> entrada : def.roles().entrySet()) {
                String rolNombre = entrada.getKey();
                AsignacionDefecto config = entrada.getValue();
                Optional<Rol> rolOpt = rolRepository.findByNombre(rolNombre);
                if (rolOpt.isEmpty()) {
                    logger.warn("Rol '{}' no existe: no se asigna el permiso '{}'.", rolNombre, def.codigo());
                    continue;
                }
                Rol rol = rolOpt.get();
                if (rolPermisoRepository.findByRolAndPermiso(rol, permiso).isEmpty()) {
                    rolPermisoRepository.save(new RolPermiso(rol, permiso, config.activo(), config.semestres()));
                    logger.info("Permiso '{}' asignado a rol '{}' (activo: {}, semestres: {})",
                            def.codigo(), rolNombre, config.activo(), config.semestres());
                }
            }
        }
    }
}
