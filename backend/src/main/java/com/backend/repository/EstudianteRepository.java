package com.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.backend.model.Estudiante;
import com.backend.model.Usuario;

@Repository
public interface EstudianteRepository extends JpaRepository<Estudiante, Long> {
    Optional<Estudiante> findByUsuario(Usuario usuario);
    Optional<Estudiante> findByUsuarioRut(String rut);
}
