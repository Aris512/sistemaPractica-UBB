package com.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.backend.model.RetroalimentacionIA;
import com.backend.repository.RetroalimentacionIARepository;

@Service
public class RetroalimentacionIAService {

    private final RetroalimentacionIARepository retroalimentacionIARepository;

    public RetroalimentacionIAService(RetroalimentacionIARepository retroalimentacionIARepository) {
        this.retroalimentacionIARepository = retroalimentacionIARepository;
    }

    public List<RetroalimentacionIA> obtenerTodos() {
        return retroalimentacionIARepository.findAll();
    }

    public RetroalimentacionIA obtenerPorId(Long id) {
        return retroalimentacionIARepository.findById(id).orElse(null);
    }

    public RetroalimentacionIA crear(RetroalimentacionIA retroalimentacionIA) {
        return retroalimentacionIARepository.save(retroalimentacionIA);
    }

    public void eliminar(Long id) {
        retroalimentacionIARepository.deleteById(id);
    }
}
