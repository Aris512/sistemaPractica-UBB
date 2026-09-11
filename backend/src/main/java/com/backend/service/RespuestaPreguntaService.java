package com.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.backend.model.RespuestaPregunta;
import com.backend.repository.RespuestaPreguntaRepository;

@Service
public class RespuestaPreguntaService {

    private final RespuestaPreguntaRepository respuestaPreguntaRepository;

    public RespuestaPreguntaService(RespuestaPreguntaRepository respuestaPreguntaRepository) {
        this.respuestaPreguntaRepository = respuestaPreguntaRepository;
    }

    public List<RespuestaPregunta> obtenerTodos() {
        return respuestaPreguntaRepository.findAll();
    }

    public RespuestaPregunta obtenerPorId(Long id) {
        return respuestaPreguntaRepository.findById(id).orElse(null);
    }

    public RespuestaPregunta crear(RespuestaPregunta respuestaPregunta) {
        return respuestaPreguntaRepository.save(respuestaPregunta);
    }

    public void eliminar(Long id) {
        respuestaPreguntaRepository.deleteById(id);
    }
}
