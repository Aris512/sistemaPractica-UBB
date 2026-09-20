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

    public List<ObservacionEvaluacion> obtenerPorEvaluacion(Long idEvaluacion) {
        return observacionEvaluacionRepository.findByEvaluacion_IdEvaluacion(idEvaluacion);
    }

    public ObservacionEvaluacion actualizar(Long id, ObservacionEvaluacion detalles) {
        ObservacionEvaluacion observacionExistente = observacionEvaluacionRepository.findById(id).orElse(null);
        if (observacionExistente == null) {
            return null;
        }

        if (observacionExistente.getEvaluacion() != null && observacionExistente.getEvaluacion().getFechaLimite() != null) {
            if (java.time.LocalDateTime.now().isAfter(observacionExistente.getEvaluacion().getFechaLimite())) {
                throw new IllegalStateException("La evaluación está cerrada y no se pueden editar sus observaciones.");
            }
        }

        observacionExistente.setTexto(detalles.getTexto());
        return observacionEvaluacionRepository.save(observacionExistente);
    }
}
