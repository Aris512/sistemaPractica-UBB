package com.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.backend.model.Evaluacion;

@Repository
public interface EvaluacionRepository extends JpaRepository<Evaluacion, Long> {

    List<Evaluacion> findByPracticaIdPractica(Long idPractica);

    Optional<Evaluacion> findFirstByPracticaIdPracticaOrderByFechaDesc(Long idPractica);

    List<Evaluacion> findByPracticaEstudianteIdEstudiante(Long idEstudiante);

    Optional<Evaluacion> findFirstByPracticaEstudianteIdEstudianteOrderByFechaDesc(Long idEstudiante);
}
