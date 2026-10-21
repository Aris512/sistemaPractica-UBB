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

    List<Evidencia> findByEstudianteIdEstudiante(Long idEstudiante);

    List<Evidencia> findByEstudianteIdEstudianteAndActividadAsignaturaIdAsignatura(Long idEstudiante, Long idAsignatura);

    List<Evidencia> findByEstudianteIdEstudianteAndActividadAsignaturaIdAsignaturaAndCalificacionIsNotNull(
        Long idEstudiante, Long idAsignatura
    );

    boolean existsByEstudianteIdEstudianteAndActividadProfesorUsuarioRutAndActividadAsignaturaIdAsignatura(
        Long idEstudiante, String rutProfesor, Long idAsignatura
    );

    Optional<Evidencia> findFirstByEstudianteIdEstudianteAndActividadProfesorUsuarioRutOrderByFechaEntregaDesc(
        Long idEstudiante, String rutProfesor
    );

    long countByArchivoUrlIn(java.util.Collection<String> ubicaciones);

    long countByArchivoRevisionUrlIn(java.util.Collection<String> ubicaciones);

    List<Evidencia> findByArchivoProfesorIdDocumento(Long idDocumento);
}
