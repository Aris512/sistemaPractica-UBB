package com.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.backend.model.Encuesta;

public interface EncuestaRepository extends JpaRepository<Encuesta, Long> {
}
