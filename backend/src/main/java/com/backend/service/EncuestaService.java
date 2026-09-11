package com.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.backend.model.Encuesta;
import com.backend.repository.EncuestaRepository;

@Service
public class EncuestaService {

    private final EncuestaRepository encuestaRepository;

    public EncuestaService(EncuestaRepository encuestaRepository) {
        this.encuestaRepository = encuestaRepository;
    }

    public List<Encuesta> obtenerTodos() {
        return encuestaRepository.findAll();
    }

    public Encuesta obtenerPorId(Long id) {
        return encuestaRepository.findById(id).orElse(null);
    }

    public Encuesta crear(Encuesta encuesta) {
        return encuestaRepository.save(encuesta);
    }

    public void eliminar(Long id) {
        encuestaRepository.deleteById(id);
    }
}
