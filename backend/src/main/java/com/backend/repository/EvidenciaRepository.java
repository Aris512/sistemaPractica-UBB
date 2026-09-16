package com.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.backend.model.Evidencia;

@Repository
public interface EvidenciaRepository extends JpaRepository<Evidencia, Long> {

    List<Evidencia> findAllByOrderByFechaEntregaDesc();

    List<Evidencia> findByEstudianteUsuarioRutOrderByFechaEntregaDesc(String rut);

    List<Evidencia> findByActividadIdActividadOrderByFechaEntregaDesc(Long idActividad);

    List<Evidencia> findByActividadProfesorUsuarioRutOrderByFechaEntregaDesc(String rut);

    Optional<Evidencia> findByActividadIdActividadAndEstudianteUsuarioRut(Long idActividad, String rut);

    long countByActividadIdActividad(Long idActividad);

    long countByActividadIdActividadAndEstado(Long idActividad, String estado);
}
