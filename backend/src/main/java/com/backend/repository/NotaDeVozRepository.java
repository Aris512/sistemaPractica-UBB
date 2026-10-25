package com.backend.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import com.backend.model.NotaDeVoz;

@Repository
public interface NotaDeVozRepository extends JpaRepository<NotaDeVoz, Long> {
    List<NotaDeVoz> findByEvaluacionIdEvaluacionOrderByFechaGrabacionDesc(Long idEvaluacion);

    @Query("SELECT n FROM NotaDeVoz n WHERE " +
           "(n.evaluacion.practica.estudiante.idEstudiante = :idEstudiante) OR " +
           "(n.evaluacion.idEvaluacion IN (SELECT nt.evaluacion.idEvaluacion FROM Nota nt WHERE nt.estudiante.idEstudiante = :idEstudiante AND nt.evaluacion IS NOT NULL)) " +
           "ORDER BY n.fechaGrabacion DESC")
    List<NotaDeVoz> findByEstudianteId(@Param("idEstudiante") Long idEstudiante);

    void deleteByEvaluacionIdEvaluacion(Long idEvaluacion);
}
