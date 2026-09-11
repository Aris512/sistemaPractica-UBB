package com.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.backend.model.Documento;

public interface DocumentoRepository extends JpaRepository<Documento, Long> {
}
