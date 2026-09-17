package com.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.backend.model.TutorPractica;

@Repository
public interface TutorPracticaRepository extends JpaRepository<TutorPractica, Long> {
    Optional<TutorPractica> findByUsuarioRut(String rut);
}
