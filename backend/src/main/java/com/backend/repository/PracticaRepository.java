package com.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.backend.model.Practica;

public interface PracticaRepository extends JpaRepository<Practica, Long> {
}
