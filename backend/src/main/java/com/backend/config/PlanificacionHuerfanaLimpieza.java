package com.backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import com.backend.service.PlanificacionService;

/**
 * Antes, al eliminar a un estudiante sus planificaciones solo se desvinculaban (id_estudiante = NULL) y quedaban en la
 * base con sus archivos y su retroalimentación con IA. Al arrancar se eliminan esas planificaciones huérfanas; si no
 * hay ninguna, no hace nada.
 */
@Component
public class PlanificacionHuerfanaLimpieza implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(PlanificacionHuerfanaLimpieza.class);

    private final PlanificacionService planificacionService;

    public PlanificacionHuerfanaLimpieza(PlanificacionService planificacionService) {
        this.planificacionService = planificacionService;
    }

    @Override
    public void run(String... args) {
        try {
            int eliminadas = planificacionService.eliminarHuerfanas();
            if (eliminadas > 0) {
                logger.info("Se eliminaron {} planificaciones sin estudiante, con sus archivos y retroalimentaciones.", eliminadas);
            }
        } catch (Exception e) {
            // No impide el arranque: se reintenta en el próximo inicio
            logger.error("No se pudieron eliminar las planificaciones sin estudiante: {}", e.getMessage(), e);
        }
    }
}
