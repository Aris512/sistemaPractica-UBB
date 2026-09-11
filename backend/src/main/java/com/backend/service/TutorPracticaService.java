package com.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.backend.model.TutorPractica;
import com.backend.repository.TutorPracticaRepository;

@Service
public class TutorPracticaService {

    private final TutorPracticaRepository tutorPracticaRepository;

    public TutorPracticaService(TutorPracticaRepository tutorPracticaRepository) {
        this.tutorPracticaRepository = tutorPracticaRepository;
    }

    public List<TutorPractica> obtenerTodos() {
        return tutorPracticaRepository.findAll();
    }

    public TutorPractica obtenerPorId(Long id) {
        return tutorPracticaRepository.findById(id).orElse(null);
    }

    public TutorPractica crear(TutorPractica tutorPractica) {
        return tutorPracticaRepository.save(tutorPractica);
    }

    public void eliminar(Long id) {
        tutorPracticaRepository.deleteById(id);
    }
}
