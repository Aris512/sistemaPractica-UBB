package com.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.backend.model.Profesor;
import com.backend.model.Usuario;

@Repository
public interface ProfesorRepository extends JpaRepository<Profesor, Long> {
    Optional<Profesor> findByUsuario(Usuario usuario);
    Optional<Profesor> findByUsuarioRut(String rut);
}
