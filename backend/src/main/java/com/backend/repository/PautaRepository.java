package com.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.backend.model.Pauta;

@Repository
public interface PautaRepository extends JpaRepository<Pauta, Long> {
    Optional<Pauta> findByCodigo(String codigo);
    boolean existsByCodigo(String codigo);
}
