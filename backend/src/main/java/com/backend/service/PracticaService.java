package com.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.backend.model.Practica;
import com.backend.repository.PracticaRepository;

@Service
public class PracticaService {

    private final PracticaRepository practicaRepository;

    public PracticaService(PracticaRepository practicaRepository) {
        this.practicaRepository = practicaRepository;
    }

    public List<Practica> obtenerTodos() {
        return practicaRepository.findAll();
    }

    public Practica obtenerPorId(Long id) {
        return practicaRepository.findById(id).orElse(null);
    }

    public Practica crear(Practica practica) {
        return practicaRepository.save(practica);
    }

    public void eliminar(Long id) {
        practicaRepository.deleteById(id);
    }
}
