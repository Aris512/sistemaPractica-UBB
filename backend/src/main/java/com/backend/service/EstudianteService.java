package com.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.backend.model.Estudiante;
import com.backend.repository.EstudianteRepository;

@Service
public class EstudianteService {

    private final EstudianteRepository estudianteRepository;

    public EstudianteService(EstudianteRepository estudianteRepository) {
        this.estudianteRepository = estudianteRepository;
    }

    public List<Estudiante> obtenerTodos() {
        return estudianteRepository.findAll();
    }

    public Estudiante obtenerPorId(Long id) {
        return estudianteRepository.findById(id).orElse(null);
    }

    public Estudiante obtenerPorRut(String rut) {
        if (rut == null || rut.isBlank()) {
            return null;
        }
        java.util.Optional<Estudiante> opt = estudianteRepository.findByUsuarioRut(rut);
        if (opt.isPresent()) {
            return opt.get();
        }

        String clean = com.backend.util.RutUtils.clean(rut);
        opt = estudianteRepository.findByUsuarioRut(clean);
        if (opt.isPresent()) {
            return opt.get();
        }

        String standard = com.backend.util.RutUtils.formatStandard(rut);
        return estudianteRepository.findByUsuarioRut(standard).orElse(null);
    }

    public Estudiante crear(Estudiante estudiante) {
        return estudianteRepository.save(estudiante);
    }

    public void eliminar(Long id) {
        estudianteRepository.deleteById(id);
    }
}
