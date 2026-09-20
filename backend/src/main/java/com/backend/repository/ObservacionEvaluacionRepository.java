package com.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.backend.model.ObservacionEvaluacion;

import java.util.List;

public interface ObservacionEvaluacionRepository extends JpaRepository<ObservacionEvaluacion, Long> {
    List<ObservacionEvaluacion> findByEvaluacion_IdEvaluacion(Long idEvaluacion);
}
