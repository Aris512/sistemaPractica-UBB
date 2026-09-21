package com.backend.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.backend.model.Documento;

public interface DocumentoRepository extends JpaRepository<Documento, Long> {
    List<Documento> findByPlanificacionesIdPlanificacion(Long idPlanificacion);
}

