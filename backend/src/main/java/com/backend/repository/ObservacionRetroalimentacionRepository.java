package com.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.backend.model.ObservacionRetroalimentacion;

public interface ObservacionRetroalimentacionRepository extends JpaRepository<ObservacionRetroalimentacion, Long> {

    List<ObservacionRetroalimentacion> findByRetroalimentacionIdRetroalimentacionOrderByFechaAscIdObservacionAsc(Long idRetroalimentacion);
}
