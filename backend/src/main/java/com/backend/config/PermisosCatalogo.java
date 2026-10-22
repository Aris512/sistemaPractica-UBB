package com.backend.config;

import java.util.List;
import java.util.Map;
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
 * Catálogo fijo de permisos del sistema y su asignación inicial por rol.
 *
 * Los permisos no se crean desde datos de ejemplo del seeder: se definen aquí, en el código. Para
 * agregar o cambiar un permiso se edita {@link #CATALOGO}; la tabla "permiso" se sincroniza al
 * arrancar. La tabla debe existir en la base porque el panel de administración la consulta y
 * "rol_permiso" la referencia.
 *
 * La sincronización solo agrega lo que falta: nunca modifica ni elimina lo que el administrador
 * ya configuró desde el panel de permisos.
 */
@Component
public class PermisosCatalogo {

    private static final Logger logger = LoggerFactory.getLogger(PermisosCatalogo.class);

    public record PermisoDef(String codigo, String nombre, String categoria, String descripcion) {}

    /** Permiso asignado a un rol: si está activo y en qué semestres ("ALL" o lista separada por comas). */
    public record AsignacionDefecto(boolean activo, String semestres) {}

    public static final List<PermisoDef> CATALOGO = List.of(
        new PermisoDef("PORTAFOLIO_CONSULTAR", "Consultar portafolio", "PORTAFOLIO", "Permite consultar y visualizar documentos y evidencias del portafolio"),
        new PermisoDef("PORTAFOLIO_SUBIR", "Subir archivos", "PORTAFOLIO", "Permite cargar y subir documentos y evidencias al portafolio"),
        new PermisoDef("EVALUACIONES_REALIZAR", "Realizar evaluaciones", "EVALUACIONES", "Permite evaluar y calificar procesos y prácticas formativas"),
        new PermisoDef("EVALUACIONES_CONSULTAR", "Consultar evaluaciones", "EVALUACIONES", "Permite consultar y visualizar las evaluaciones registradas"),
        new PermisoDef("OBSERVACIONES_REGISTRAR", "Registrar observaciones", "OBSERVACIONES", "Permite registrar observaciones formativas y pedagógicas"),
        new PermisoDef("OBSERVACIONES_CONSULTAR", "Consultar observaciones", "OBSERVACIONES", "Permite consultar el historial de observaciones formativas"),
        new PermisoDef("ESTUDIANTES_CONSULTAR", "Consultar información de otros estudiantes", "ESTUDIANTES", "Permite visualizar listas y expedientes de otros estudiantes"),
        new PermisoDef("IA_ACCESO", "Acceso a funcionalidades de IA", "INTELIGENCIA ARTIFICIAL", "Permite acceder a los asistentes inteligentes y recomendaciones pedagógicas con IA")
    );

    /** Asignación inicial: nombre de rol -> código de permiso -> configuración. */
    public static final Map<String, Map<String, AsignacionDefecto>> ASIGNACION_POR_ROL = Map.of(
        "ESTUDIANTE", Map.of(
            "PORTAFOLIO_CONSULTAR", new AsignacionDefecto(true, "ALL"),
            "PORTAFOLIO_SUBIR", new AsignacionDefecto(true, "ALL"),
            "EVALUACIONES_REALIZAR", new AsignacionDefecto(false, "ALL"),
            "EVALUACIONES_CONSULTAR", new AsignacionDefecto(true, "ALL"),
            "OBSERVACIONES_REGISTRAR", new AsignacionDefecto(false, "ALL"),
            "OBSERVACIONES_CONSULTAR", new AsignacionDefecto(true, "ALL"),
            "ESTUDIANTES_CONSULTAR", new AsignacionDefecto(false, "ALL"),
            "IA_ACCESO", new AsignacionDefecto(true, "3,4,5,6,7,8,9,10") // Habilitado desde 3er semestre
        ),
        "PROFESOR_ASIGNATURA", Map.of(
            "PORTAFOLIO_CONSULTAR", new AsignacionDefecto(true, "ALL"),
            "PORTAFOLIO_SUBIR", new AsignacionDefecto(true, "ALL"),
            "EVALUACIONES_REALIZAR", new AsignacionDefecto(true, "ALL"),
            "EVALUACIONES_CONSULTAR", new AsignacionDefecto(true, "ALL"),
            "OBSERVACIONES_REGISTRAR", new AsignacionDefecto(true, "ALL"),
            "OBSERVACIONES_CONSULTAR", new AsignacionDefecto(true, "ALL"),
            "ESTUDIANTES_CONSULTAR", new AsignacionDefecto(true, "ALL"),
            "IA_ACCESO", new AsignacionDefecto(true, "ALL")
        ),
        "PROFESOR_COLABORADOR", Map.of(
            "PORTAFOLIO_CONSULTAR", new AsignacionDefecto(true, "ALL"),
            "PORTAFOLIO_SUBIR", new AsignacionDefecto(false, "ALL"),
            "EVALUACIONES_REALIZAR", new AsignacionDefecto(true, "ALL"),
            "EVALUACIONES_CONSULTAR", new AsignacionDefecto(true, "ALL"),
            "OBSERVACIONES_REGISTRAR", new AsignacionDefecto(true, "ALL"),
            "OBSERVACIONES_CONSULTAR", new AsignacionDefecto(true, "ALL"),
            "ESTUDIANTES_CONSULTAR", new AsignacionDefecto(true, "ALL"),
            "IA_ACCESO", new AsignacionDefecto(false, "ALL")
        ),
        "TUTOR_PRACTICA", Map.of(
            "PORTAFOLIO_CONSULTAR", new AsignacionDefecto(true, "ALL"),
            "PORTAFOLIO_SUBIR", new AsignacionDefecto(false, "ALL"),
            "EVALUACIONES_REALIZAR", new AsignacionDefecto(true, "ALL"),
            "EVALUACIONES_CONSULTAR", new AsignacionDefecto(true, "ALL"),
            "OBSERVACIONES_REGISTRAR", new AsignacionDefecto(true, "ALL"),
            "OBSERVACIONES_CONSULTAR", new AsignacionDefecto(true, "ALL"),
            "ESTUDIANTES_CONSULTAR", new AsignacionDefecto(true, "ALL"),
            "IA_ACCESO", new AsignacionDefecto(false, "ALL")
        ),
        "COORDINADOR", Map.of(
            "PORTAFOLIO_CONSULTAR", new AsignacionDefecto(true, "ALL"),
            "PORTAFOLIO_SUBIR", new AsignacionDefecto(true, "ALL"),
            "EVALUACIONES_REALIZAR", new AsignacionDefecto(true, "ALL"),
            "EVALUACIONES_CONSULTAR", new AsignacionDefecto(true, "ALL"),
            "OBSERVACIONES_REGISTRAR", new AsignacionDefecto(true, "ALL"),
            "OBSERVACIONES_CONSULTAR", new AsignacionDefecto(true, "ALL"),
            "ESTUDIANTES_CONSULTAR", new AsignacionDefecto(true, "ALL"),
            "IA_ACCESO", new AsignacionDefecto(true, "ALL")
        )
    );

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
     * Crea en la base los permisos del catálogo que falten y asigna a cada rol su configuración
     * inicial donde todavía no exista. Los roles deben existir antes de llamarlo.
     */
    @Transactional
    public void sincronizar() {
        for (PermisoDef def : CATALOGO) {
            if (!permisoRepository.existsByCodigo(def.codigo())) {
                permisoRepository.save(new Permiso(def.codigo(), def.nombre(), def.categoria(), def.descripcion()));
                logger.info("Permiso creado en catálogo: {} ({})", def.codigo(), def.nombre());
            }
        }

        ASIGNACION_POR_ROL.forEach((rolNombre, asignaciones) -> {
            Optional<Rol> rolOpt = rolRepository.findByNombre(rolNombre);
            if (rolOpt.isEmpty()) {
                logger.warn("Rol '{}' no existe: no se asignan sus permisos iniciales.", rolNombre);
                return;
            }
            Rol rol = rolOpt.get();
            asignaciones.forEach((codigo, config) -> {
                Optional<Permiso> permisoOpt = permisoRepository.findByCodigo(codigo);
                if (permisoOpt.isEmpty()) {
                    logger.warn("Permiso '{}' no está en el catálogo: se omite para el rol '{}'.", codigo, rolNombre);
                    return;
                }
                Permiso permiso = permisoOpt.get();
                if (rolPermisoRepository.findByRolAndPermiso(rol, permiso).isEmpty()) {
                    rolPermisoRepository.save(new RolPermiso(rol, permiso, config.activo(), config.semestres()));
                    logger.info("Permiso '{}' asignado a rol '{}' (activo: {}, semestres: {})",
                            codigo, rolNombre, config.activo(), config.semestres());
                }
            });
        });
    }
}
