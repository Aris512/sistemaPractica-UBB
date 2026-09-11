package com.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.backend.model.CentroPractica;
import com.backend.repository.CentroPracticaRepository;

@Service
public class CentroPracticaService {

    private final CentroPracticaRepository centroPracticaRepository;

    public CentroPracticaService(CentroPracticaRepository centroPracticaRepository) {
        this.centroPracticaRepository = centroPracticaRepository;
    }

    public List<CentroPractica> obtenerTodos() {
        return centroPracticaRepository.findAll();
    }

    public CentroPractica obtenerPorId(Long id) {
        return centroPracticaRepository.findById(id).orElse(null);
    }

    public CentroPractica crear(CentroPractica centroPractica) {
        return centroPracticaRepository.save(centroPractica);
    }

    public void eliminar(Long id) {
        centroPracticaRepository.deleteById(id);
    }
}
