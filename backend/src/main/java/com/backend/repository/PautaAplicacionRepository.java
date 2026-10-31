package com.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.backend.model.PautaAplicacion;


public interface PautaAplicacionRepository extends JpaRepository<PautaAplicacion, Long> {
    List<PautaAplicacion> findByPracticaIdPractica(Long idPractica);
    Optional<PautaAplicacion> findByPautaIdAndPracticaIdPractica(Long pautaId, Long idPractica);
    boolean existsByPautaId(Long pautaId);
    boolean existsByPracticaIdPractica(Long idPractica);

    /** Ids de las prácticas que ya tienen al menos una pauta aplicada (para marcarlas sin una consulta por práctica). */
    @Query("select distinct a.practica.idPractica from PautaAplicacion a")
    List<Long> practicaIdsConAplicaciones();
}
