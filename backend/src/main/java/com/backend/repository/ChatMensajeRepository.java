package com.backend.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.backend.model.ChatMensaje;
import com.backend.model.ChatRolMensaje;

public interface ChatMensajeRepository extends JpaRepository<ChatMensaje, Long> {
    List<ChatMensaje> findByConversacionIdConversacionOrderByOrdenAsc(Long idConversacion);

    long countByConversacionIdConversacion(Long idConversacion);

    @Query("SELECT COALESCE(MAX(m.orden), 0) FROM ChatMensaje m WHERE m.conversacion.idConversacion = :idConversacion")
    int findMaxOrden(@Param("idConversacion") Long idConversacion);

    long countByConversacionUsuarioRutAndRolAndFechaAfter(String rut, ChatRolMensaje rol, LocalDateTime desde);
}
