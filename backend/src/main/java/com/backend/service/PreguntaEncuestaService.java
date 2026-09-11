package com.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.backend.model.PreguntaEncuesta;
import com.backend.repository.PreguntaEncuestaRepository;

@Service
public class PreguntaEncuestaService {

    private final PreguntaEncuestaRepository preguntaEncuestaRepository;

    public PreguntaEncuestaService(PreguntaEncuestaRepository preguntaEncuestaRepository) {
        this.preguntaEncuestaRepository = preguntaEncuestaRepository;
    }

    public List<PreguntaEncuesta> obtenerTodos() {
        return preguntaEncuestaRepository.findAll();
    }

    public PreguntaEncuesta obtenerPorId(Long id) {
        return preguntaEncuestaRepository.findById(id).orElse(null);
    }

    public PreguntaEncuesta crear(PreguntaEncuesta preguntaEncuesta) {
        return preguntaEncuestaRepository.save(preguntaEncuesta);
    }

    public void eliminar(Long id) {
        preguntaEncuestaRepository.deleteById(id);
    }
}
