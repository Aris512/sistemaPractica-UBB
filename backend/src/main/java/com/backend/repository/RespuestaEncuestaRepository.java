package com.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.backend.model.RespuestaEncuesta;

public interface RespuestaEncuestaRepository extends JpaRepository<RespuestaEncuesta, Long> {
}
