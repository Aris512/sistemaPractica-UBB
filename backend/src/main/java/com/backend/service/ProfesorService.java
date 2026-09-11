package com.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.backend.model.Profesor;
import com.backend.repository.ProfesorRepository;

@Service
public class ProfesorService {

    private final ProfesorRepository profesorRepository;

    public ProfesorService(ProfesorRepository profesorRepository) {
        this.profesorRepository = profesorRepository;
    }

    public List<Profesor> obtenerTodos() {
        return profesorRepository.findAll();
    }

    public Profesor obtenerPorId(Long id) {
        return profesorRepository.findById(id).orElse(null);
    }

    public Profesor crear(Profesor profesor) {
        return profesorRepository.save(profesor);
    }

    public void eliminar(Long id) {
        profesorRepository.deleteById(id);
    }
}
