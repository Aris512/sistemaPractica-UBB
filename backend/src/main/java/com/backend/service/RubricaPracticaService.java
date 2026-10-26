package com.backend.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.backend.dto.AvancePracticaDTOs.AvancePracticaDTO;
import com.backend.dto.AvancePracticaDTOs.ColaboradorDTO;
import com.backend.model.Asignatura;
import com.backend.model.Practica;
import com.backend.model.ProfesorColaborador;
import com.backend.model.RubricaPractica;
import com.backend.repository.PracticaRepository;
import com.backend.repository.RubricaPracticaRepository;

@Service
public class RubricaPracticaService {

    private record Rubrica(String tipoEvaluador, String area, int numero) {
    }

    /** Evaluaciones de cada práctica: 4 rúbricas del profesor colaborador y 2 observaciones del tutor. */
    private static final List<Rubrica> RUBRICAS_POR_PRACTICA = List.of(
        new Rubrica(RubricaPractica.PROFESOR_COLABORADOR, "MATEMATICA", 1),
        new Rubrica(RubricaPractica.PROFESOR_COLABORADOR, "MATEMATICA", 2),
        new Rubrica(RubricaPractica.PROFESOR_COLABORADOR, "ORIENTACION", 1),
        new Rubrica(RubricaPractica.PROFESOR_COLABORADOR, "ORIENTACION", 2),
        new Rubrica(RubricaPractica.TUTOR_PRACTICA, "OBSERVACION", 1),
        new Rubrica(RubricaPractica.TUTOR_PRACTICA, "OBSERVACION", 2)
    );

    private final RubricaPracticaRepository rubricaPracticaRepository;
    private final PracticaRepository practicaRepository;

    public RubricaPracticaService(RubricaPracticaRepository rubricaPracticaRepository,
                                  PracticaRepository practicaRepository) {
        this.rubricaPracticaRepository = rubricaPracticaRepository;
        this.practicaRepository = practicaRepository;
    }

    /**
     * Avance de la práctica actual del estudiante. Si la práctica aún no tiene sus 6 evaluaciones, se
     * crean como pendientes, así también las prácticas existentes quedan con su registro. Sin práctica,
     * devuelve un avance vacío.
     */
    @Transactional
    public AvancePracticaDTO obtenerAvancePorEstudiante(String rutEstudiante) {
        Practica practica = practicaActual(rutEstudiante);
        if (practica == null) {
            return new AvancePracticaDTO(null, List.of(), List.of());
        }

        List<ColaboradorDTO> colaboradores = new ArrayList<>();
        if (practica.getProfesoresColaboradores() != null) {
            for (ProfesorColaborador pc : practica.getProfesoresColaboradores()) {
                if (pc.getUsuario() == null) continue;
                String nombre = (pc.getUsuario().getNombre() + " " + pc.getUsuario().getApellido()).trim();
                String centro = pc.getCentroPractica() != null ? pc.getCentroPractica().getNombre() : null;
                colaboradores.add(new ColaboradorDTO(nombre, pc.getUsuario().getCorreo(), centro));
            }
        }

        return new AvancePracticaDTO(practica.getIdPractica(), colaboradores, asegurarRubricas(practica));
    }

    /** Marca una evaluación como completada con su nota (1.0 a 7.0). */
    @Transactional
    public RubricaPractica completar(Long idRubrica, Double nota, String rutEvaluador) {
        if (nota == null || nota < 1.0 || nota > 7.0) {
            throw new IllegalArgumentException("La nota debe estar entre 1.0 y 7.0.");
        }
        RubricaPractica rubrica = rubricaPracticaRepository.findById(idRubrica)
            .orElseThrow(() -> new IllegalArgumentException("No existe la evaluación " + idRubrica + "."));
        rubrica.setNota(Math.round(nota * 10.0) / 10.0);
        rubrica.setRutEvaluador(rutEvaluador != null && !rutEvaluador.isBlank() ? rutEvaluador.trim() : null);
        rubrica.setEstado(RubricaPractica.COMPLETADA);
        rubrica.setFechaCompletada(LocalDateTime.now());
        return rubricaPracticaRepository.save(rubrica);
    }

    /**
     * Un estudiante puede tener la práctica de 8.° y la de 9.° semestre: se usa la de la asignatura que cursa
     * ahora y, si ninguna coincide, la más reciente.
     */
    private Practica practicaActual(String rutEstudiante) {
        List<Practica> practicas = practicaRepository.findByEstudianteUsuarioRut(rutEstudiante);
        if (practicas.isEmpty()) return null;
        Asignatura actual = practicas.get(0).getEstudiante().getAsignatura();
        return practicas.stream()
            .filter(p -> actual != null && p.getAsignatura() != null
                && Objects.equals(p.getAsignatura().getIdAsignatura(), actual.getIdAsignatura()))
            .findFirst()
            .orElseGet(() -> practicas.stream().max(Comparator.comparing((Practica p) -> p.getIdPractica(), Comparator.nullsFirst(Comparator.naturalOrder()))).orElse(null));
    }

    private List<RubricaPractica> asegurarRubricas(Practica practica) {
        List<RubricaPractica> existentes = rubricaPracticaRepository.findByPracticaIdPracticaOrderByIdRubrica(practica.getIdPractica());
        boolean faltan = false;
        for (Rubrica r : RUBRICAS_POR_PRACTICA) {
            boolean existe = existentes.stream().anyMatch(e -> e.getTipoEvaluador().equals(r.tipoEvaluador())
                && e.getArea().equals(r.area()) && e.getNumero() == r.numero());
            if (!existe) {
                rubricaPracticaRepository.save(new RubricaPractica(practica, r.tipoEvaluador(), r.area(), r.numero()));
                faltan = true;
            }
        }
        return faltan ? rubricaPracticaRepository.findByPracticaIdPracticaOrderByIdRubrica(practica.getIdPractica()) : existentes;
    }
}
