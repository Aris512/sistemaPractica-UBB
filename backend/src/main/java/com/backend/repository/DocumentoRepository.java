package com.backend.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.backend.model.Documento;

public interface DocumentoRepository extends JpaRepository<Documento, Long> {
    List<Documento> findByPlanificacionesIdPlanificacion(Long idPlanificacion);

    List<Documento> findByUsuarioRut(String rut);

    List<Documento> findByRutEstudiante(String rutEstudiante);

    @Query("SELECT d FROM Documento d WHERE d.rutEstudiante = :rutExacto OR d.rutEstudiante = :rutLimpio OR ((d.usuario.rut = :rutExacto OR d.usuario.rut = :rutLimpio) AND d.tipo LIKE 'PORTAFOLIO%') ORDER BY d.fechaCarga DESC")
    List<Documento> findPortafolioByRut(@Param("rutExacto") String rutExacto, @Param("rutLimpio") String rutLimpio);
}


