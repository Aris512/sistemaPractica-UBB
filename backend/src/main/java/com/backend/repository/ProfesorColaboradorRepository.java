package com.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.backend.model.ProfesorColaborador;

public interface ProfesorColaboradorRepository extends JpaRepository<ProfesorColaborador, Long> {
    Optional<ProfesorColaborador> findByUsuarioRut(String rut);
}
