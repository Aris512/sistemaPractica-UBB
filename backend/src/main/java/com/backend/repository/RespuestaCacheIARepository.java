package com.backend.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.backend.model.RespuestaCacheIA;

public interface RespuestaCacheIARepository extends JpaRepository<RespuestaCacheIA, Long> {

    Optional<RespuestaCacheIA> findByClaveAndExpiraAfter(String clave, LocalDateTime ahora);

    Optional<RespuestaCacheIA> findByClave(String clave);

    /** Candidatas para la búsqueda por similitud: mismo contexto, vigentes y con embedding, las más usadas primero. */
    @Query("SELECT c FROM RespuestaCacheIA c WHERE c.contexto = :contexto AND c.expira > :ahora AND c.embedding IS NOT NULL "
            + "ORDER BY c.ultimoUso DESC")
    List<RespuestaCacheIA> candidatas(@Param("contexto") String contexto, @Param("ahora") LocalDateTime ahora, Pageable pagina);

    @Modifying
    @Query("DELETE FROM RespuestaCacheIA c WHERE c.expira < :ahora")
    int eliminarVencidas(@Param("ahora") LocalDateTime ahora);
}
