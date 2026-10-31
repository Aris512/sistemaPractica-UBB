package com.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.backend.model.Actividad;


public interface ActividadRepository extends JpaRepository<Actividad, Long> {

    List<Actividad> findAllByOrderByFechaCreacionDesc();

    List<Actividad> findByProfesorUsuarioRutOrderByFechaCreacionDesc(String rut);

    List<Actividad> findByAsignaturaIdAsignaturaOrderByFechaCreacionDesc(Long idAsignatura);

    boolean existsByProfesorUsuarioRutAndAsignaturaIdAsignatura(String rutProfesor, Long idAsignatura);

    List<Actividad> findByTituloIn(List<String> titulos);
}
