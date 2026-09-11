package com.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.backend.model.ProfesorColaborador;
import com.backend.repository.ProfesorColaboradorRepository;

@Service
public class ProfesorColaboradorService {

    private final ProfesorColaboradorRepository profesorColaboradorRepository;

    public ProfesorColaboradorService(ProfesorColaboradorRepository profesorColaboradorRepository) {
        this.profesorColaboradorRepository = profesorColaboradorRepository;
    }

    public List<ProfesorColaborador> obtenerTodos() {
        return profesorColaboradorRepository.findAll();
    }

    public ProfesorColaborador obtenerPorId(Long id) {
        return profesorColaboradorRepository.findById(id).orElse(null);
    }

    public ProfesorColaborador crear(ProfesorColaborador profesorColaborador) {
        return profesorColaboradorRepository.save(profesorColaborador);
    }

    public void eliminar(Long id) {
        profesorColaboradorRepository.deleteById(id);
    }
}
