package com.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.backend.model.Rol;

public interface RolRepository extends JpaRepository<Rol, Long> {
}
