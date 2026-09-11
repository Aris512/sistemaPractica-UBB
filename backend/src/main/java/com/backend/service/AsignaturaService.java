package com.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.backend.model.Asignatura;
import com.backend.repository.AsignaturaRepository;

@Service
public class AsignaturaService {

    private final AsignaturaRepository asignaturaRepository;

    public AsignaturaService(AsignaturaRepository asignaturaRepository) {
        this.asignaturaRepository = asignaturaRepository;
    }

    public List<Asignatura> obtenerTodos() {
        return asignaturaRepository.findAll();
    }

    public Asignatura obtenerPorId(Long id) {
        return asignaturaRepository.findById(id).orElse(null);
    }

    public Asignatura crear(Asignatura asignatura) {
        return asignaturaRepository.save(asignatura);
    }

    public void eliminar(Long id) {
        asignaturaRepository.deleteById(id);
    }
}
