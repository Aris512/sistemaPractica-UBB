package com.backend.model;

import java.time.LocalDateTime;

import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

/**
 * Mensaje de una conversación del chatbot. El orden es correlativo dentro de cada conversación
 * y se borra junto con ella (ON DELETE CASCADE en la base de datos).
 */
@Entity
@Table(name = "chat_mensaje", uniqueConstraints = {
    @UniqueConstraint(name = "uk_chat_mensaje_orden", columnNames = {"id_conversacion", "orden"})
})
public class ChatMensaje {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_mensaje")
    private Long idMensaje;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_conversacion", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private ChatConversacion conversacion;

    @Enumerated(EnumType.STRING)
    @Column(name = "rol", length = 20, nullable = false)
    private ChatRolMensaje rol;

    @Column(name = "contenido", columnDefinition = "MEDIUMTEXT", nullable = false)
    private String contenido;

    @Column(name = "fecha", nullable = false)
    private LocalDateTime fecha;

    @Column(name = "orden", nullable = false)
    private Integer orden;

    public ChatMensaje() {
    }

    public ChatMensaje(ChatConversacion conversacion, ChatRolMensaje rol, String contenido, int orden, LocalDateTime fecha) {
        this.conversacion = conversacion;
        this.rol = rol;
        this.contenido = contenido;
        this.orden = orden;
        this.fecha = fecha;
    }

    public Long getIdMensaje() {
        return idMensaje;
    }

    public ChatConversacion getConversacion() {
        return conversacion;
    }

    public ChatRolMensaje getRol() {
        return rol;
    }

    public String getContenido() {
        return contenido;
    }

    public LocalDateTime getFecha() {
        return fecha;
    }

    public Integer getOrden() {
        return orden;
    }
}
