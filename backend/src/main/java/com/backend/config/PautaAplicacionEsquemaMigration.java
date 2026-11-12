package com.backend.config;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.List;
import java.util.Map;

import javax.sql.DataSource;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.boot.jpa.autoconfigure.EntityManagerFactoryDependsOnPostProcessor;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Component;

/**
 * Cambios de esquema de pauta_aplicacion que Hibernate (ddl-auto=update) no hace por sí solo. Corre antes de
 * que arranque JPA; en una base nueva no hace nada.
 *
 * 1. Una aplicación por evaluador: para que una pauta con varios evaluadores (tutor y colaborador, por ejemplo)
 *    la complete cada uno por su cuenta, se retira la restricción única antigua (pauta, práctica). Como también
 *    servía de índice a la clave foránea de pauta_id, primero se crea un índice propio para esa columna.
 * 2. La nota de la pauta pasa a la tabla nota: la columna nota (un número) se reemplaza por id_nota. Las pautas
 *    ya finalizadas registran su nota en la tabla nota, ligada al estudiante, y se elimina la columna antigua.
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
        unaAplicacionPorEvaluador();
        notaEnTablaNota();
    }

    private void unaAplicacionPorEvaluador() {
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

    private void notaEnTablaNota() {
        if (!existeColumna(TABLA, "nota")) return;
        if (!existeColumna(TABLA, "id_nota")) {
            jdbcTemplate.execute("ALTER TABLE " + TABLA + " ADD COLUMN id_nota BIGINT NULL");
        }

        List<Map<String, Object>> finalizadas = jdbcTemplate.queryForList(
            "SELECT a.id, a.nota, a.evaluador_rut, p.id_estudiante FROM " + TABLA + " a "
                + "JOIN practica p ON p.id_practica = a.id_practica "
                + "WHERE a.estado = 'FINALIZADA' AND a.nota IS NOT NULL AND a.id_nota IS NULL");
        for (Map<String, Object> fila : finalizadas) {
            KeyHolder clave = new GeneratedKeyHolder();
            jdbcTemplate.update(con -> {
                PreparedStatement ps = con.prepareStatement(
                    "INSERT INTO nota (id_estudiante, puntaje_obtenido, rut_evaluador) VALUES (?, ?, ?)",
                    Statement.RETURN_GENERATED_KEYS);
                ps.setObject(1, fila.get("id_estudiante"));
                ps.setObject(2, fila.get("nota"));
                ps.setObject(3, fila.get("evaluador_rut"));
                return ps;
            }, clave);
            jdbcTemplate.update("UPDATE " + TABLA + " SET id_nota = ? WHERE id = ?",
                clave.getKey().longValue(), fila.get("id"));
        }

        jdbcTemplate.execute("ALTER TABLE " + TABLA + " DROP COLUMN nota");
        logger.info("{}.nota se reemplazó por id_nota: {} notas de pautas finalizadas pasaron a la tabla nota.",
            TABLA, finalizadas.size());
    }

    private boolean existeIndice(String indice) {
        Integer total = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?",
            Integer.class, TABLA, indice);
        return total != null && total > 0;
    }

    private boolean existeColumna(String tabla, String columna) {
        Integer total = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?",
            Integer.class, tabla, columna);
        return total != null && total > 0;
    }
}
