package com.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.backend.model.Profesor;

public interface ProfesorRepository extends JpaRepository<Profesor, Long> {
}
