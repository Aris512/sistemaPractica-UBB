package com.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.backend.model.Pauta;
import com.backend.repository.PautaRepository;

@Service
public class PautaService {

    private final PautaRepository pautaRepository;

    public PautaService(PautaRepository pautaRepository) {
        this.pautaRepository = pautaRepository;
    }

    public List<Pauta> obtenerTodos() {
        return pautaRepository.findAll();
    }

    public Pauta obtenerPorId(Long id) {
        return pautaRepository.findById(id).orElse(null);
    }

    public Pauta crear(Pauta pauta) {
        return pautaRepository.save(pauta);
    }

    public void eliminar(Long id) {
        pautaRepository.deleteById(id);
    }
}
