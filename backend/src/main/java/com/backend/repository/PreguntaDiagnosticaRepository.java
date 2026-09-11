package com.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.backend.model.PreguntaDiagnostica;

public interface PreguntaDiagnosticaRepository extends JpaRepository<PreguntaDiagnostica, Long> {
}
