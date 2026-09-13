package com.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.backend.model.Usuario;

public interface UsuarioRepository extends JpaRepository<Usuario, String> {
    Optional<Usuario> findByRut(String rut);
    Optional<Usuario> findByCorreo(String correo);
    boolean existsByRut(String rut);
    boolean existsByCorreo(String correo);
}
