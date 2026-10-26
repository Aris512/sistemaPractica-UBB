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
 * retroalimentacion_ia pierde fecha, resultado_general y observacion_general (nadie los usaba): ahora
 * guarda el flujo de revisión IA → profesor. Corre antes de que Hibernate (ddl-auto=update) cree las
 * columnas nuevas, que no elimina las antiguas por sí solo. En una base nueva no hace nada.
 */
@Component("retroalimentacionEsquemaMigration")
public class RetroalimentacionEsquemaMigration implements InitializingBean {

    private static final Logger logger = LoggerFactory.getLogger(RetroalimentacionEsquemaMigration.class);

    private final JdbcTemplate jdbcTemplate;

    public RetroalimentacionEsquemaMigration(DataSource dataSource) {
        this.jdbcTemplate = new JdbcTemplate(dataSource);
    }

    /** Hace que el EntityManagerFactory (y con él Hibernate) se cree después de esta migración. */
    @Bean
    static EntityManagerFactoryDependsOnPostProcessor retroalimentacionEsquemaMigrationAntesDeJpa() {
        return new EntityManagerFactoryDependsOnPostProcessor("retroalimentacionEsquemaMigration");
    }

    @Override
    public void afterPropertiesSet() {
        for (String columna : new String[] {"fecha", "resultado_general", "observacion_general"}) {
            if (existeColumna("retroalimentacion_ia", columna)) {
                jdbcTemplate.execute("ALTER TABLE retroalimentacion_ia DROP COLUMN " + columna);
                logger.info("Se eliminó la columna retroalimentacion_ia.{}.", columna);
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
