package com.backend.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.backend.model.Planificacion;

public interface PlanificacionRepository extends JpaRepository<Planificacion, Long> {
    List<Planificacion> findByEstudianteUsuarioRut(String rut);
    List<Planificacion> findByEstudianteIdEstudiante(Long idEstudiante);
}

