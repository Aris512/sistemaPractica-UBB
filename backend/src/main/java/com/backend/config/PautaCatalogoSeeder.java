package com.backend.config;

import java.io.InputStream;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.backend.model.Pauta;
import com.backend.model.PautaCriterio;
import com.backend.repository.PautaRepository;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

/**
 * Carga el catálogo oficial de pautas (HU-21) desde {@code pautas_seed.json}, extraído de los instrumentos
 * de las prácticas intermedias y avanzadas. Es idempotente: solo crea las pautas cuyo código no existe,
 * de modo que nunca pisa una pauta ya editada por el coordinador.
 */
@Component
public class PautaCatalogoSeeder implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(PautaCatalogoSeeder.class);

    /** Pautas de ejemplo de versiones anteriores del sistema: sin criterios, no sirven para evaluar. */
    private static final List<String> CODIGOS_LEGADOS =
        List.of("PAU-OBS-01", "RUB-DES-02", "PAU-EVA-03", "RUB-INF-04");

    private final PautaRepository pautaRepository;
    private final ObjectMapper mapper;

    public PautaCatalogoSeeder(PautaRepository pautaRepository, ObjectMapper mapper) {
        this.pautaRepository = pautaRepository;
        this.mapper = mapper;
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        List<Map<String, Object>> datos;
        try (InputStream in = getClass().getResourceAsStream("/pautas_seed.json")) {
            if (in == null) {
                logger.warn("No se encontró pautas_seed.json: no se cargó el catálogo de pautas.");
                return;
            }
            datos = mapper.readValue(in, new TypeReference<List<Map<String, Object>>>() {});
        }

        int creadas = 0;
        for (Map<String, Object> d : datos) {
            String codigo = (String) d.get("codigo");
            if (pautaRepository.existsByCodigo(codigo)) continue;

            Pauta p = new Pauta();
            p.setCodigo(codigo);
            p.setTitulo((String) d.get("titulo"));
            p.setAsignatura((String) d.get("asignatura"));
            p.setTipo((String) d.get("tipo"));
            p.setEspecialidad((String) d.get("especialidad"));
            p.setMomento((String) d.get("momento"));
            p.setEvaluador((String) d.get("evaluador"));
            p.setEscalaMin((Integer) d.get("escalaMin"));
            p.setEscalaMax((Integer) d.get("escalaMax"));
            p.setModoCalculo((String) d.get("modoCalculo"));
            p.setExigencia((Integer) d.get("exigencia"));
            p.setPonderacion((String) d.get("ponderacion"));
            p.setVersion((String) d.get("version"));
            p.setInstrucciones((String) d.get("instrucciones"));
            p.setActiva(Boolean.TRUE);

            @SuppressWarnings("unchecked")
            List<Map<String, String>> criterios = (List<Map<String, String>>) d.get("criterios");
            int orden = 1;
            for (Map<String, String> c : criterios) {
                p.getCriterios().add(new PautaCriterio(p, orden++, c.get("dimension"), c.get("numero"), c.get("texto")));
            }
            p.setCriteriosCount(p.getCriterios().size());
            pautaRepository.save(p);
            creadas++;
        }
        if (creadas > 0) logger.info("Catálogo de pautas: {} pautas oficiales cargadas.", creadas);

        // Las pautas de ejemplo antiguas se desactivan (no se borran) para que no aparezcan en el catálogo.
        for (String codigo : CODIGOS_LEGADOS) {
            pautaRepository.findByCodigo(codigo).ifPresent(p -> {
                if (p.getCriterios().isEmpty() && !Boolean.FALSE.equals(p.getActiva())) {
                    p.setActiva(Boolean.FALSE);
                    pautaRepository.save(p);
                }
            });
        }
    }
}
