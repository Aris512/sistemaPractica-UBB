package com.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.backend.model.RespuestaEncuesta;
import com.backend.repository.RespuestaEncuestaRepository;

@Service
public class RespuestaEncuestaService {

    private final RespuestaEncuestaRepository respuestaEncuestaRepository;

    public RespuestaEncuestaService(RespuestaEncuestaRepository respuestaEncuestaRepository) {
        this.respuestaEncuestaRepository = respuestaEncuestaRepository;
    }

    public List<RespuestaEncuesta> obtenerTodos() {
        return respuestaEncuestaRepository.findAll();
    }

    public RespuestaEncuesta obtenerPorId(Long id) {
        return respuestaEncuestaRepository.findById(id).orElse(null);
    }

    public RespuestaEncuesta crear(RespuestaEncuesta respuestaEncuesta) {
        return respuestaEncuestaRepository.save(respuestaEncuesta);
    }

    public void eliminar(Long id) {
        respuestaEncuestaRepository.deleteById(id);
    }
}
