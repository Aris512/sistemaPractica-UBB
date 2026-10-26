package com.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.backend.model.PautaAplicacion;

@Repository
public interface PautaAplicacionRepository extends JpaRepository<PautaAplicacion, Long> {
    List<PautaAplicacion> findByPracticaIdPractica(Long idPractica);
    Optional<PautaAplicacion> findByPautaIdAndPracticaIdPractica(Long pautaId, Long idPractica);
    boolean existsByPautaId(Long pautaId);
}
