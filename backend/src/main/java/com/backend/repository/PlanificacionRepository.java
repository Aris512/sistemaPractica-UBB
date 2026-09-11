package com.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.backend.model.Planificacion;

public interface PlanificacionRepository extends JpaRepository<Planificacion, Long> {
}
