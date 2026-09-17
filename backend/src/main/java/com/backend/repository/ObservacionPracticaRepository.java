package com.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.backend.model.ObservacionPractica;

@Repository
public interface ObservacionPracticaRepository extends JpaRepository<ObservacionPractica, Long> {
    List<ObservacionPractica> findAllByOrderByIdDesc();
    List<ObservacionPractica> findByRut(String rut);
    List<ObservacionPractica> findByAutorRut(String autorRut);
}
