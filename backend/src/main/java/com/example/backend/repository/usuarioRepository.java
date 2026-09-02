package com.example.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.backend.model.usuario;

public interface usuarioRepository extends JpaRepository<usuario, Long> {
}