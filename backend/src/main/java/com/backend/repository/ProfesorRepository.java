package com.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.backend.model.Profesor;
import com.backend.model.Usuario;

@Repository
public interface ProfesorRepository extends JpaRepository<Profesor, Long> {
    Optional<Profesor> findByUsuario(Usuario usuario);
    Optional<Profesor> findByUsuarioRut(String rut);
    List<Profesor> findAllByUsuarioRut(String rut);

    @Query("SELECT p FROM Profesor p WHERE p.asignatura.idAsignatura = :idAsignatura")
    List<Profesor> findAllByAsignaturaId(@Param("idAsignatura") Long idAsignatura);
}
