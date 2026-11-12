package com.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.backend.model.ObservacionPractica;

public interface ObservacionPracticaRepository extends JpaRepository<ObservacionPractica, Long> {
    List<ObservacionPractica> findAllByOrderByIdDesc();
    List<ObservacionPractica> findByRut(String rut);
    List<ObservacionPractica> findByAutorRut(String autorRut);
}
