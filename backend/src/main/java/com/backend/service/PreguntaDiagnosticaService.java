package com.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.backend.model.PreguntaDiagnostica;
import com.backend.repository.PreguntaDiagnosticaRepository;

@Service
public class PreguntaDiagnosticaService {

    private final PreguntaDiagnosticaRepository preguntaDiagnosticaRepository;

    public PreguntaDiagnosticaService(PreguntaDiagnosticaRepository preguntaDiagnosticaRepository) {
        this.preguntaDiagnosticaRepository = preguntaDiagnosticaRepository;
    }

    public List<PreguntaDiagnostica> obtenerTodos() {
        return preguntaDiagnosticaRepository.findAll();
    }

    public PreguntaDiagnostica obtenerPorId(Long id) {
        return preguntaDiagnosticaRepository.findById(id).orElse(null);
    }

    public PreguntaDiagnostica crear(PreguntaDiagnostica preguntaDiagnostica) {
        return preguntaDiagnosticaRepository.save(preguntaDiagnostica);
    }

    public void eliminar(Long id) {
        preguntaDiagnosticaRepository.deleteById(id);
    }
}
