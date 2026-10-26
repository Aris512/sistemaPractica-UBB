package com.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.backend.model.ObservacionPractica;
import com.backend.repository.ObservacionPracticaRepository;

@Service
public class ObservacionPracticaService {

    private final ObservacionPracticaRepository observacionPracticaRepository;

    public ObservacionPracticaService(ObservacionPracticaRepository observacionPracticaRepository) {
        this.observacionPracticaRepository = observacionPracticaRepository;
    }

    public List<ObservacionPractica> obtenerTodos() {
        return observacionPracticaRepository.findAllByOrderByIdDesc();
    }

    public ObservacionPractica obtenerPorId(Long id) {
        return observacionPracticaRepository.findById(id).orElse(null);
    }

    public List<ObservacionPractica> obtenerPorRutEstudiante(String rut) {
        return observacionPracticaRepository.findByRut(rut);
    }

    public ObservacionPractica crear(ObservacionPractica observacion) {
        return observacionPracticaRepository.save(observacion);
    }

    public void eliminar(Long id) {
        observacionPracticaRepository.deleteById(id);
    }
}
