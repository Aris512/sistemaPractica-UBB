package com.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.backend.model.CentroPractica;

@Repository
public interface CentroPracticaRepository extends JpaRepository<CentroPractica, Long> {
    Optional<CentroPractica> findByNombre(String nombre);
    boolean existsByNombre(String nombre);
}
