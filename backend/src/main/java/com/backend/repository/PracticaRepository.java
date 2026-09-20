package com.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.backend.model.Practica;

public interface PracticaRepository extends JpaRepository<Practica, Long> {
    List<Practica> findByTutorPracticaUsuarioRut(String rut);
    List<Practica> findByTutorPracticaIdTutor(Long idTutor);
    List<Practica> findByEstudianteUsuarioRut(String rut);
    List<Practica> findByEstudianteIdEstudiante(Long idEstudiante);
    List<Practica> findByProfesoresColaboradoresUsuarioRut(String rut);
    List<Practica> findByAsignaturaIdAsignatura(Long idAsignatura);

    @Modifying
    @Query("UPDATE Practica p SET p.tutorPractica = NULL WHERE p.tutorPractica.idTutor = :idTutor")
    void desvincularTutorPorId(@Param("idTutor") Long idTutor);

    @Modifying
    @Query("UPDATE Practica p SET p.estudiante = NULL WHERE p.estudiante.idEstudiante = :idEstudiante")
    void desvincularEstudiantePorId(@Param("idEstudiante") Long idEstudiante);
}

