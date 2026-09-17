package com.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.backend.model.ProfesorColaborador;

@Repository
public interface ProfesorColaboradorRepository extends JpaRepository<ProfesorColaborador, Long> {
    Optional<ProfesorColaborador> findByUsuarioRut(String rut);
}
