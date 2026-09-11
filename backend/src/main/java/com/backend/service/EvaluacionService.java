package com.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.backend.model.Evaluacion;
import com.backend.repository.EvaluacionRepository;

@Service
public class EvaluacionService {

    private final EvaluacionRepository evaluacionRepository;

    public EvaluacionService(EvaluacionRepository evaluacionRepository) {
        this.evaluacionRepository = evaluacionRepository;
    }

    public List<Evaluacion> obtenerTodos() {
        return evaluacionRepository.findAll();
    }

    public Evaluacion obtenerPorId(Long id) {
        return evaluacionRepository.findById(id).orElse(null);
    }

    public Evaluacion crear(Evaluacion evaluacion) {
        return evaluacionRepository.save(evaluacion);
    }

    public void eliminar(Long id) {
        evaluacionRepository.deleteById(id);
    }
}
