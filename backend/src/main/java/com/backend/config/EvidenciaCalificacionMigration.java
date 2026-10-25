package com.backend.config;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Component;

import com.backend.repository.AsignaturaRepository;
import com.backend.repository.EstudianteRepository;
import com.backend.service.AvanceAcademicoService;

/**
 * Migración única: la tabla evidencia ya no guarda su propia columna "calificacion"; la nota vive
 * solo en la tabla nota (evidencia.id_nota). Esa copia quedaba desactualizada cuando el profesor
 * eliminaba la nota, y la asignatura seguía contando como aprobada.
 *
 * Si la columna aún existe: traspasa a nota las calificaciones que no tenían Nota, elimina la
 * columna, recalcula cursos_aprobados con las notas reales y reubica en la asignatura del profesor
 * las pautas de evaluación que se archivaron en la asignatura equivocada.
 */
@Component
public class EvidenciaCalificacionMigration implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(EvidenciaCalificacionMigration.class);

    private final JdbcTemplate jdbcTemplate;
    private final AvanceAcademicoService avanceAcademicoService;
    private final EstudianteRepository estudianteRepository;
    private final AsignaturaRepository asignaturaRepository;

    public EvidenciaCalificacionMigration(JdbcTemplate jdbcTemplate,
                                          AvanceAcademicoService avanceAcademicoService,
                                          EstudianteRepository estudianteRepository,
                                          AsignaturaRepository asignaturaRepository) {
        this.jdbcTemplate = jdbcTemplate;
        this.avanceAcademicoService = avanceAcademicoService;
        this.estudianteRepository = estudianteRepository;
        this.asignaturaRepository = asignaturaRepository;
    }

    @Override
    public void run(String... args) {
        if (!columnaCalificacionExiste()) {
            return;
        }
        try {
            traspasarCalificacionesSinNota();
            jdbcTemplate.execute("ALTER TABLE evidencia DROP COLUMN calificacion");
            logger.info("Columna evidencia.calificacion eliminada; la calificación se lee desde la tabla nota.");
            corregirAsignaturaDePautasDeEvaluacion();
            recalcularCursos();
        } catch (Exception e) {
            logger.error("No se pudo completar la migración de evidencia.calificacion: {}", e.getMessage(), e);
        }
    }

    private boolean columnaCalificacionExiste() {
        Integer total = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM information_schema.columns "
                + "WHERE table_schema = DATABASE() AND table_name = 'evidencia' AND column_name = 'calificacion'",
            Integer.class);
        return total != null && total > 0;
    }

    /** Entregas calificadas antes de existir la tabla nota: se les crea su Nota para no perder la calificación. */
    private void traspasarCalificacionesSinNota() {
        List<Map<String, Object>> filas = jdbcTemplate.queryForList(
            "SELECT ev.id_evidencia, ev.id_estudiante, ev.calificacion, u.rut_usuario AS rut_revisor "
                + "FROM evidencia ev LEFT JOIN profesor u ON u.id_profesor = ev.id_profesor_revisor "
                + "WHERE ev.calificacion IS NOT NULL AND ev.id_nota IS NULL");
        for (Map<String, Object> fila : filas) {
            KeyHolder keyHolder = new GeneratedKeyHolder();
            jdbcTemplate.update(con -> {
                PreparedStatement ps = con.prepareStatement(
                    "INSERT INTO nota (puntaje_obtenido, id_estudiante, rut_evaluador) VALUES (?, ?, ?)",
                    Statement.RETURN_GENERATED_KEYS);
                ps.setObject(1, fila.get("calificacion"));
                ps.setObject(2, fila.get("id_estudiante"));
                ps.setObject(3, fila.get("rut_revisor"));
                return ps;
            }, keyHolder);
            Number idNota = keyHolder.getKey();
            if (idNota != null) {
                jdbcTemplate.update("UPDATE evidencia SET id_nota = ? WHERE id_evidencia = ?",
                    idNota.longValue(), fila.get("id_evidencia"));
            }
        }
        if (!filas.isEmpty()) {
            logger.info("Se traspasaron {} calificaciones de evidencia a la tabla nota.", filas.size());
        }
    }

    /**
     * La copia en documento_practica de la pauta subida por el profesor se guardaba con la asignatura
     * que el estudiante cursaba en ese momento; corresponde a la asignatura del profesor.
     */
    private void corregirAsignaturaDePautasDeEvaluacion() {
        int corregidos = jdbcTemplate.update(
            "UPDATE documento_practica dp "
                + "JOIN evaluacion e ON e.archivo_url = dp.ubicacion "
                + "JOIN profesor p ON p.rut_usuario = dp.rut_usuario "
                + "SET dp.id_asignatura = p.id_asignatura "
                + "WHERE dp.tipo_documento = 'PROFESOR' AND p.id_asignatura IS NOT NULL "
                + "AND (dp.id_asignatura IS NULL OR dp.id_asignatura <> p.id_asignatura)");
        if (corregidos > 0) {
            logger.info("Se reubicaron {} pautas de evaluación en la asignatura del profesor.", corregidos);
        }
    }

    /** Recalcula cursos_aprobados de cada estudiante y asignatura con entregas, usando solo las notas reales. */
    private void recalcularCursos() {
        List<Map<String, Object>> pares = jdbcTemplate.queryForList(
            "SELECT DISTINCT ev.id_estudiante, a.id_asignatura FROM evidencia ev "
                + "JOIN actividad a ON a.id_actividad = ev.id_actividad WHERE a.id_asignatura IS NOT NULL "
                + "UNION SELECT DISTINCT id_estudiante, id_asignatura FROM cursos_aprobados");
        for (Map<String, Object> par : pares) {
            Long idEstudiante = ((Number) par.get("id_estudiante")).longValue();
            Long idAsignatura = ((Number) par.get("id_asignatura")).longValue();
            estudianteRepository.findById(idEstudiante).ifPresent(est ->
                asignaturaRepository.findById(idAsignatura).ifPresent(asig ->
                    avanceAcademicoService.recalcularYGuardar(est, asig)));
        }
    }
}
