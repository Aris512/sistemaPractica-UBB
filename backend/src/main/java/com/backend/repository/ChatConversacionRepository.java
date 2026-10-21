package com.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.backend.model.ChatConversacion;

public interface ChatConversacionRepository extends JpaRepository<ChatConversacion, Long> {
    List<ChatConversacion> findByUsuarioRutOrderByFechaActualizacionDesc(String rut);
    Optional<ChatConversacion> findByIdConversacionAndUsuarioRut(Long idConversacion, String rut);
    long countByUsuarioRut(String rut);
}
