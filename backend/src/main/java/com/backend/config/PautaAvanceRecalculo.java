package com.backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import com.backend.model.Practica;
import com.backend.repository.PautaAplicacionRepository;
import com.backend.repository.PracticaRepository;
import com.backend.service.AvanceAcademicoService;

/**
 * Al iniciar, recalcula el avance académico de los estudiantes con pautas aplicadas en su práctica, para que las
 * pautas finalizadas antes de que contaran en el avance (asignaturas hasta 8.° semestre) queden reflejadas. Es
 * idempotente: solo vuelve a calcular el estado con las notas vigentes.
 */
@Component
@Order(100)
public class PautaAvanceRecalculo implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(PautaAvanceRecalculo.class);

    private final PautaAplicacionRepository aplicacionRepository;
    private final PracticaRepository practicaRepository;
    private final AvanceAcademicoService avanceAcademicoService;
    private final TransactionTemplate transaccion;

    public PautaAvanceRecalculo(PautaAplicacionRepository aplicacionRepository,
                                PracticaRepository practicaRepository,
                                AvanceAcademicoService avanceAcademicoService,
                                PlatformTransactionManager transactionManager) {
        this.aplicacionRepository = aplicacionRepository;
        this.practicaRepository = practicaRepository;
        this.avanceAcademicoService = avanceAcademicoService;
        this.transaccion = new TransactionTemplate(transactionManager);
    }

    @Override
    public void run(String... args) {
        int recalculados = 0;
        for (Long idPractica : aplicacionRepository.practicaIdsConAplicaciones()) {
            try {
                // Una transacción por práctica: si una falla, las demás se recalculan igual
                Boolean hecho = transaccion.execute(status -> {
                    Practica practica = practicaRepository.findById(idPractica).orElse(null);
                    if (practica == null || practica.getEstudiante() == null || practica.getAsignatura() == null
                            || AvanceAcademicoService.semestreNumerico(practica.getAsignatura().getSemestre())
                                > AvanceAcademicoService.ULTIMO_SEMESTRE_CON_PAUTAS) {
                        return false;
                    }
                    avanceAcademicoService.recalcularYGuardar(practica.getEstudiante(), practica.getAsignatura());
                    return true;
                });
                if (Boolean.TRUE.equals(hecho)) recalculados++;
            } catch (Exception e) {
                logger.warn("No se pudo recalcular el avance de la práctica {}: {}", idPractica, e.getMessage());
            }
        }
        if (recalculados > 0) {
            logger.info("Avance académico recalculado con las pautas de {} prácticas.", recalculados);
        }
    }
}
