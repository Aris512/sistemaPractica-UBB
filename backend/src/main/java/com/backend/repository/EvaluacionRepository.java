package com.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.backend.model.Evaluacion;

public interface EvaluacionRepository extends JpaRepository<Evaluacion, Long> {
}
