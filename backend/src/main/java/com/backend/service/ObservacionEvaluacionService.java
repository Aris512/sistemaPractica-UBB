package com.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.backend.model.ObservacionEvaluacion;
import com.backend.repository.ObservacionEvaluacionRepository;

@Service
public class ObservacionEvaluacionService {

    private final ObservacionEvaluacionRepository observacionEvaluacionRepository;

    public ObservacionEvaluacionService(ObservacionEvaluacionRepository observacionEvaluacionRepository) {
        this.observacionEvaluacionRepository = observacionEvaluacionRepository;
    }

    public List<ObservacionEvaluacion> obtenerTodos() {
        return observacionEvaluacionRepository.findAll();
    }

    public ObservacionEvaluacion obtenerPorId(Long id) {
        return observacionEvaluacionRepository.findById(id).orElse(null);
    }

    public ObservacionEvaluacion crear(ObservacionEvaluacion observacionEvaluacion) {
        return observacionEvaluacionRepository.save(observacionEvaluacion);
    }

    public void eliminar(Long id) {
        observacionEvaluacionRepository.deleteById(id);
    }
}
