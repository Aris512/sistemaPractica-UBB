package com.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.backend.model.Permiso;

@Repository
public interface PermisoRepository extends JpaRepository<Permiso, Long> {
    Optional<Permiso> findByCodigo(String codigo);
    boolean existsByCodigo(String codigo);
}
