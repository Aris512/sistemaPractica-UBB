package com.backend.config;

import java.io.InputStream;
import java.util.List;
import java.util.logging.Logger;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import com.backend.model.Pauta;
import com.backend.model.PautaCriterio;
import com.backend.repository.PautaAplicacionRepository;
import com.backend.repository.PautaRepository;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import tools.jackson.databind.ObjectMapper;

/**
 * Carga el catálogo oficial de pautas (Prácticas Intermedias, Pedagógica y Profesional) desde
 * resources/pautas/pautas-oficiales.json. Es idempotente: solo crea las pautas cuyo código no existe,
 * de modo que las ediciones hechas desde la gestión de pautas no se sobrescriben.
 */
@Component
public class PautaCatalogoSeeder {

    private static final Logger logger = Logger.getLogger(PautaCatalogoSeeder.class.getName());

    /** Pautas de ejemplo de versiones anteriores del sistema (no corresponden a instrumentos oficiales). */
    private static final List<String> CODIGOS_OBSOLETOS =
        List.of("PAU-OBS-01", "RUB-DES-02", "PAU-EVA-03", "RUB-INF-04");

    private final PautaRepository pautaRepository;
    private final PautaAplicacionRepository aplicacionRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public PautaCatalogoSeeder(PautaRepository pautaRepository, PautaAplicacionRepository aplicacionRepository) {
        this.pautaRepository = pautaRepository;
        this.aplicacionRepository = aplicacionRepository;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record CriterioSeed(Integer orden, String dimension, String numero, String texto) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record PautaSeed(String codigo, String titulo, String asignatura, String tipo, String especialidad,
                            String momento, String evaluador, Integer escalaMin, Integer escalaMax,
                            String modoCalculo, Integer exigencia, String ponderacion, String instrucciones,
                            String version, List<CriterioSeed> criterios) {}

    public void sembrar() {
        for (String codigo : CODIGOS_OBSOLETOS) {
            pautaRepository.findByCodigo(codigo).ifPresent(p -> {
                if (!aplicacionRepository.existsByPautaId(p.getId())) {
                    pautaRepository.delete(p);
                    logger.info("Pauta de ejemplo obsoleta eliminada: " + codigo);
                }
            });
        }

        try (InputStream in = new ClassPathResource("pautas/pautas-oficiales.json").getInputStream()) {
            PautaSeed[] semillas = objectMapper.readValue(in, PautaSeed[].class);
            int creadas = 0;
            for (PautaSeed s : semillas) {
                if (pautaRepository.existsByCodigo(s.codigo())) continue;
                Pauta p = new Pauta();
                p.setCodigo(s.codigo());
                p.setTitulo(s.titulo());
                p.setAsignatura(s.asignatura());
                p.setTipo(s.tipo());
                p.setEspecialidad(s.especialidad());
                p.setMomento(s.momento());
                p.setEvaluador(s.evaluador());
                p.setEscalaMin(s.escalaMin());
                p.setEscalaMax(s.escalaMax());
                p.setModoCalculo(s.modoCalculo());
                p.setExigencia(s.exigencia());
                p.setPonderacion(s.ponderacion());
                p.setInstrucciones(s.instrucciones());
                p.setVersion(s.version());
                p.setActiva(true);
                p.setDescripcion(s.tipo() + " – " + s.criterios().size() + " indicadores");
                for (CriterioSeed c : s.criterios()) {
                    p.getCriterios().add(new PautaCriterio(p, c.orden(), c.dimension(), c.numero(), c.texto()));
                }
                p.setCriteriosCount(p.getCriterios().size());
                pautaRepository.save(p);
                creadas++;
            }
            logger.info("Catálogo de pautas oficiales: " + creadas + " creadas, " + (semillas.length - creadas) + " ya existían.");
        } catch (Exception e) {
            logger.severe("No se pudo cargar el catálogo de pautas: " + e.getMessage());
        }
    }
}
