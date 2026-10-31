package com.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.backend.model.Nota;


public interface NotaRepository extends JpaRepository<Nota, Long> {

    List<Nota> findByEstudianteIdEstudiante(Long idEstudiante);

    List<Nota> findByEvaluacionIdEvaluacion(Long idEvaluacion);

    Optional<Nota> findByEstudianteIdEstudianteAndEvaluacionIdEvaluacion(Long idEstudiante, Long idEvaluacion);

    Optional<Nota> findFirstByEstudianteIdEstudianteOrderByIdNotaDesc(Long idEstudiante);

    Optional<Nota> findFirstByEvaluacionIdEvaluacion(Long idEvaluacion);

    List<Nota> findByEstudianteIdEstudianteAndRutEvaluadorOrderByIdNotaDesc(Long idEstudiante, String rutEvaluador);
}
