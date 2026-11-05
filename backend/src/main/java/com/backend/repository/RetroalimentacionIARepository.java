package com.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.backend.model.RetroalimentacionIA;

public interface RetroalimentacionIARepository extends JpaRepository<RetroalimentacionIA, Long> {

    Optional<RetroalimentacionIA> findFirstByConversacionIdConversacion(Long idConversacion);

    Optional<RetroalimentacionIA> findFirstByPlanificacionIdPlanificacionOrderByIdRetroalimentacionDesc(Long idPlanificacion);

    List<RetroalimentacionIA> findByPlanificacionAsignaturaIdAsignaturaAndFechaEnvioProfesorIsNotNull(Long idAsignatura);

    /** Habilita al estudiante para que el coordinador lo asocie (estado APROBADO). */
    boolean existsByPlanificacionEstudianteIdEstudianteAndEstado(Long idEstudiante, RetroalimentacionIA.Estado estado);
}
