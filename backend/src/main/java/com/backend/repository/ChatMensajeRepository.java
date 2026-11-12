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

    /** Mensajes escritos por el alumno (no los automáticos de la plataforma) con orden mayor a desdeOrden. */
    @Query("SELECT COUNT(m) FROM ChatMensaje m WHERE m.conversacion.idConversacion = :idConversacion "
            + "AND m.rol = com.backend.model.ChatRolMensaje.USER AND m.orden > :desdeOrden "
            + "AND (m.automatico IS NULL OR m.automatico = false)")
    long contarPreguntas(@Param("idConversacion") Long idConversacion, @Param("desdeOrden") int desdeOrden);
}
