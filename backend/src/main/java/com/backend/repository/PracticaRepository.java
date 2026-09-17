package com.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.backend.model.Practica;

public interface PracticaRepository extends JpaRepository<Practica, Long> {
    List<Practica> findByTutorPracticaUsuarioRut(String rut);
    List<Practica> findByProfesoresColaboradoresUsuarioRut(String rut);
    List<Practica> findByAsignaturaIdAsignatura(Long idAsignatura);
}

