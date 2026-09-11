package com.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.backend.model.Planificacion;
import com.backend.repository.PlanificacionRepository;

@Service
public class PlanificacionService {

    private final PlanificacionRepository planificacionRepository;

    public PlanificacionService(PlanificacionRepository planificacionRepository) {
        this.planificacionRepository = planificacionRepository;
    }

    public List<Planificacion> obtenerTodos() {
        return planificacionRepository.findAll();
    }

    public Planificacion obtenerPorId(Long id) {
        return planificacionRepository.findById(id).orElse(null);
    }

    public Planificacion crear(Planificacion planificacion) {
        return planificacionRepository.save(planificacion);
    }

    public void eliminar(Long id) {
        planificacionRepository.deleteById(id);
    }
}
