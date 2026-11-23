package com.backend.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;

/**
 * Respuesta de la IA guardada para reutilizarla cuando llega la misma solicitud (caché de preguntas repetidas).
 * «clave» identifica la solicitud exacta; «contexto» agrupa las que comparten prompt e historial, para buscar
 * preguntas parecidas (con su embedding) solo entre las que tienen el mismo contexto.
 */
@Entity
@Table(name = "ia_cache_respuesta", indexes = {
        @Index(name = "uk_ia_cache_clave", columnList = "clave", unique = true),
        @Index(name = "idx_ia_cache_contexto", columnList = "contexto, expira"),
        @Index(name = "idx_ia_cache_expira", columnList = "expira")})
public class RespuestaCacheIA {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_cache")
    private Long idCache;

    @Column(name = "clave", nullable = false, length = 64)
    private String clave;

    @Column(name = "contexto", nullable = false, length = 64)
    private String contexto;

    @Column(name = "pregunta_normalizada", length = 1000)
    private String preguntaNormalizada;

    @Lob
    @Column(name = "embedding", columnDefinition = "MEDIUMBLOB")
    private byte[] embedding;

    @Lob
    @Column(name = "respuesta", nullable = false, columnDefinition = "MEDIUMTEXT")
    private String respuesta;

    @Column(name = "proveedor", length = 20)
    private String proveedor;

    @Column(name = "aciertos", nullable = false)
    private int aciertos;

    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "ultimo_uso", nullable = false)
    private LocalDateTime ultimoUso;

    @Column(name = "expira", nullable = false)
    private LocalDateTime expira;

    protected RespuestaCacheIA() {
    }

    public RespuestaCacheIA(String clave, String contexto, String preguntaNormalizada, byte[] embedding,
                            String respuesta, String proveedor, LocalDateTime expira) {
        this.clave = clave;
        this.contexto = contexto;
        this.preguntaNormalizada = preguntaNormalizada;
        this.embedding = embedding;
        this.respuesta = respuesta;
        this.proveedor = proveedor;
        this.fechaCreacion = LocalDateTime.now();
        this.ultimoUso = this.fechaCreacion;
        this.expira = expira;
    }

    public void registrarAcierto() {
        this.aciertos++;
        this.ultimoUso = LocalDateTime.now();
    }

    public Long getIdCache() {
        return idCache;
    }

    public String getClave() {
        return clave;
    }

    public String getContexto() {
        return contexto;
    }

    public String getPreguntaNormalizada() {
        return preguntaNormalizada;
    }

    public byte[] getEmbedding() {
        return embedding;
    }

    public String getRespuesta() {
        return respuesta;
    }

    public String getProveedor() {
        return proveedor;
    }

    public int getAciertos() {
        return aciertos;
    }

    public LocalDateTime getExpira() {
        return expira;
    }
}
