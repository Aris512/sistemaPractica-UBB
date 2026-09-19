package com.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.backend.model.DocumentoPractica;

@Repository
public interface DocumentoPracticaRepository extends JpaRepository<DocumentoPractica, Long> {

    List<DocumentoPractica> findByEstudianteRut(String rut);

    List<DocumentoPractica> findByEstudianteRutAndAsignaturaIdAsignatura(String rut, Long idAsignatura);

    long countByEstudianteRutAndAsignaturaIdAsignatura(String rut, Long idAsignatura);

    List<DocumentoPractica> findByAsignaturaIdAsignatura(Long idAsignatura);
}
