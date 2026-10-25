package com.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.backend.model.CursoAprobado;

public interface CursoAprobadoRepository extends JpaRepository<CursoAprobado, Long> {
    Optional<CursoAprobado> findByEstudianteIdEstudianteAndAsignaturaIdAsignatura(Long idEstudiante, Long idAsignatura);
    List<CursoAprobado> findByEstudianteIdEstudiante(Long idEstudiante);
}
