package com.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.backend.model.ObservacionEvaluacion;

public interface ObservacionEvaluacionRepository extends JpaRepository<ObservacionEvaluacion, Long> {

    List<ObservacionEvaluacion> findByEvaluacion_IdEvaluacion(Long idEvaluacion);
}
