package com.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.backend.model.ProyectoIntervencion;
import com.backend.repository.ProyectoIntervencionRepository;

@Service
public class ProyectoIntervencionService {

    private final ProyectoIntervencionRepository proyectoIntervencionRepository;

    public ProyectoIntervencionService(ProyectoIntervencionRepository proyectoIntervencionRepository) {
        this.proyectoIntervencionRepository = proyectoIntervencionRepository;
    }

    public List<ProyectoIntervencion> obtenerTodos() {
        return proyectoIntervencionRepository.findAll();
    }

    public ProyectoIntervencion obtenerPorId(Long id) {
        return proyectoIntervencionRepository.findById(id).orElse(null);
    }

    public ProyectoIntervencion crear(ProyectoIntervencion proyectoIntervencion) {
        return proyectoIntervencionRepository.save(proyectoIntervencion);
    }

    public void eliminar(Long id) {
        proyectoIntervencionRepository.deleteById(id);
    }
}
