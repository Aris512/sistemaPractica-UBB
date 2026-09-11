package com.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.backend.model.Estudiante;

public interface EstudianteRepository extends JpaRepository<Estudiante, Long> {
}
