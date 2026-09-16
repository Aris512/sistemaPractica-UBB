package com.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.backend.model.Actividad;

@Repository
public interface ActividadRepository extends JpaRepository<Actividad, Long> {

    List<Actividad> findAllByOrderByFechaCreacionDesc();

    List<Actividad> findByProfesorUsuarioRutOrderByFechaCreacionDesc(String rut);

    List<Actividad> findByAsignaturaIdAsignaturaOrderByFechaCreacionDesc(Long idAsignatura);
}
