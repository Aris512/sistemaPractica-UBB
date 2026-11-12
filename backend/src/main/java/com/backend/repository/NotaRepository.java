package com.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.backend.model.Nota;


public interface NotaRepository extends JpaRepository<Nota, Long> {

    List<Nota> findByEstudianteIdEstudiante(Long idEstudiante);

    List<Nota> findByEvaluacionIdEvaluacion(Long idEvaluacion);

    Optional<Nota> findByEstudianteIdEstudianteAndEvaluacionIdEvaluacion(Long idEstudiante, Long idEvaluacion);

    /**
     * Notas del estudiante que no son de una pauta. Las de pautas (pauta_aplicacion.id_nota) se gestionan
     * desde el módulo de pautas y no deben mezclarse con las del modal de evaluación.
     */
    @Query("select n from Nota n where n.estudiante.idEstudiante = ?1 "
        + "and not exists (select a from PautaAplicacion a where a.nota = n) order by n.idNota desc")
    List<Nota> findSinPautaByEstudiante(Long idEstudiante);

    /** Última nota del modal de evaluación (sin contar las de pautas). */
    default Optional<Nota> findFirstByEstudianteIdEstudianteOrderByIdNotaDesc(Long idEstudiante) {
        return findSinPautaByEstudiante(idEstudiante).stream().findFirst();
    }

    Optional<Nota> findFirstByEvaluacionIdEvaluacion(Long idEvaluacion);

    /** Notas que el evaluador puso al estudiante desde el modal de evaluación (sin las de pautas). */
    @Query("select n from Nota n where n.estudiante.idEstudiante = ?1 and n.rutEvaluador = ?2 "
        + "and not exists (select a from PautaAplicacion a where a.nota = n) order by n.idNota desc")
    List<Nota> findByEstudianteIdEstudianteAndRutEvaluadorOrderByIdNotaDesc(Long idEstudiante, String rutEvaluador);
}
