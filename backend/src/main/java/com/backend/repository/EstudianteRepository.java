package com.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.backend.model.Estudiante;
import com.backend.model.Usuario;

import jakarta.persistence.LockModeType;


public interface EstudianteRepository extends JpaRepository<Estudiante, Long> {
    Optional<Estudiante> findByUsuario(Usuario usuario);

    /**
     * Lee al estudiante bloqueándolo hasta el fin de la transacción: evita que dos asociaciones simultáneas
     * del mismo estudiante creen prácticas duplicadas o se pisen entre sí.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select e from Estudiante e where e.idEstudiante = :id")
    Optional<Estudiante> findByIdForUpdate(@Param("id") Long id);
    Optional<Estudiante> findByUsuarioRut(String rut);
    java.util.List<Estudiante> findAllByUsuarioRut(String rut);
    java.util.List<Estudiante> findByAsignaturaIdAsignatura(Long idAsignatura);
}
