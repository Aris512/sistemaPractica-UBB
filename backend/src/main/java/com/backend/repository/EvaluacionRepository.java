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

    List<Evaluacion> findByPracticaEstudianteIdEstudianteOrderByFechaDesc(Long idEstudiante);

    Optional<Evaluacion> findFirstByPracticaEstudianteIdEstudianteOrderByFechaDesc(Long idEstudiante);

    List<Evaluacion> findByPracticaEstudianteUsuarioRut(String rut);

    /** Evaluaciones registradas por un evaluador (profesor, tutor o colaborador) según su RUT. */
    List<Evaluacion> findByRutEvaluador(String rutEvaluador);

    List<Evaluacion> findByIdEvaluador(Long idEvaluador);

    long countByArchivoUrlIn(java.util.Collection<String> ubicaciones);
}
