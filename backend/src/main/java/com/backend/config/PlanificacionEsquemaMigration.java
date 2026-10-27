package com.backend.config;

import javax.sql.DataSource;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.boot.jpa.autoconfigure.EntityManagerFactoryDependsOnPostProcessor;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Adapta el esquema antiguo de planificación antes de que Hibernate (ddl-auto=update) lo revise:
 * - documento_planificacion era una tabla de unión (id_documento, id_planificacion); ahora guarda una columna
 *   por archivo. Si estaba vacía se elimina; si tenía datos se conserva renombrada como documento_planificacion_respaldo.
 * - planificacion pierde titulo, objetivo, estado y version_autoincremental.
 * Hibernate crea después la estructura nueva. En una base nueva no hace nada.
 */
@Component("planificacionEsquemaMigration")
public class PlanificacionEsquemaMigration implements InitializingBean {

    private static final Logger logger = LoggerFactory.getLogger(PlanificacionEsquemaMigration.class);

    private final JdbcTemplate jdbcTemplate;

    public PlanificacionEsquemaMigration(DataSource dataSource) {
        this.jdbcTemplate = new JdbcTemplate(dataSource);
    }

    /** Hace que el EntityManagerFactory (y con él Hibernate) se cree después de esta migración. */
    @Bean
    static EntityManagerFactoryDependsOnPostProcessor planificacionEsquemaMigrationAntesDeJpa() {
        return new EntityManagerFactoryDependsOnPostProcessor("planificacionEsquemaMigration");
    }

    @Override
    public void afterPropertiesSet() {
        if (existeColumna("documento_planificacion", "id_documento")) {
            Integer filas = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM documento_planificacion", Integer.class);
            if (filas != null && filas > 0) {
                jdbcTemplate.execute("RENAME TABLE documento_planificacion TO documento_planificacion_respaldo");
                logger.warn("documento_planificacion antigua tenía {} filas: se conserva como documento_planificacion_respaldo.", filas);
            } else {
                jdbcTemplate.execute("DROP TABLE documento_planificacion");
                logger.info("Se eliminó la tabla de unión documento_planificacion antigua (vacía).");
            }
        }
        for (String columna : new String[] {"titulo", "objetivo", "estado", "version_autoincremental"}) {
            if (existeColumna("planificacion", columna)) {
                jdbcTemplate.execute("ALTER TABLE planificacion DROP COLUMN " + columna);
                logger.info("Se eliminó la columna planificacion.{}.", columna);
            }
        }
    }

    private boolean existeColumna(String tabla, String columna) {
        Integer total = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?",
            Integer.class, tabla, columna);
        return total != null && total > 0;
    }
}
