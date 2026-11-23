package com.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.backend.model.FragmentoPlanificacion;

public interface FragmentoPlanificacionRepository extends JpaRepository<FragmentoPlanificacion, Long> {

    List<FragmentoPlanificacion> findByDocumentoIdDocumentoAndModeloOrderByOrdenAsc(Long idDocumento, String modelo);

    boolean existsByDocumentoIdDocumentoAndModelo(Long idDocumento, String modelo);

    /** Fragmentos calculados con otro modelo de embeddings: ya no sirven para comparar. */
    @Modifying
    @Query("DELETE FROM FragmentoPlanificacion f WHERE f.documento.idDocumento = :idDocumento AND f.modelo <> :modelo")
    int eliminarDeOtrosModelos(@Param("idDocumento") Long idDocumento, @Param("modelo") String modelo);
}
