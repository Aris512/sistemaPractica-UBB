package com.backend.config;

import java.util.List;

import javax.sql.DataSource;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.boot.jpa.autoconfigure.EntityManagerFactoryDependsOnPostProcessor;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * pauta_aplicacion pasa de una aplicación por (pauta, práctica) a una por evaluador, para que una pauta con
 * varios evaluadores (tutor y colaborador, por ejemplo) la complete cada uno por su cuenta. Hibernate
 * (ddl-auto=update) crea la restricción única nueva, pero no elimina la antigua: la retira esta migración,
 * antes de que arranque JPA. Como la antigua también servía de índice a la clave foránea de pauta_id, primero
 * se crea un índice propio para esa columna. En una base nueva no hace nada.
 */
@Component("pautaAplicacionEsquemaMigration")
public class PautaAplicacionEsquemaMigration implements InitializingBean {

    private static final Logger logger = LoggerFactory.getLogger(PautaAplicacionEsquemaMigration.class);
    private static final String TABLA = "pauta_aplicacion";

    private final JdbcTemplate jdbcTemplate;

    public PautaAplicacionEsquemaMigration(DataSource dataSource) {
        this.jdbcTemplate = new JdbcTemplate(dataSource);
    }

    /** Hace que el EntityManagerFactory (y con él Hibernate) se cree después de esta migración. */
    @Bean
    static EntityManagerFactoryDependsOnPostProcessor pautaAplicacionEsquemaMigrationAntesDeJpa() {
        return new EntityManagerFactoryDependsOnPostProcessor("pautaAplicacionEsquemaMigration");
    }

    @Override
    public void afterPropertiesSet() {
        // Índices únicos cuyas columnas son exactamente pauta_id e id_practica, en ese orden.
        List<String> antiguos = jdbcTemplate.queryForList(
            "SELECT index_name FROM information_schema.statistics "
                + "WHERE table_schema = DATABASE() AND table_name = ? AND non_unique = 0 "
                + "GROUP BY index_name "
                + "HAVING GROUP_CONCAT(column_name ORDER BY seq_in_index) = 'pauta_id,id_practica'",
            String.class, TABLA);
        if (antiguos.isEmpty()) return;

        if (!existeIndice("idx_pauta_aplicacion_pauta")) {
            jdbcTemplate.execute("CREATE INDEX idx_pauta_aplicacion_pauta ON " + TABLA + " (pauta_id)");
        }
        for (String indice : antiguos) {
            jdbcTemplate.execute("ALTER TABLE " + TABLA + " DROP INDEX `" + indice + "`");
            logger.info("Se eliminó la restricción única {} de {}: ahora hay una aplicación por evaluador.", indice, TABLA);
        }
    }

    private boolean existeIndice(String indice) {
        Integer total = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?",
            Integer.class, TABLA, indice);
        return total != null && total > 0;
    }
}
