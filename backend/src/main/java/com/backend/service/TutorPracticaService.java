package com.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.backend.model.TutorPractica;
import com.backend.repository.PracticaRepository;
import com.backend.repository.TutorPracticaRepository;

@Service
public class TutorPracticaService {

    private final TutorPracticaRepository tutorPracticaRepository;
    private final PracticaRepository practicaRepository;

    public TutorPracticaService(TutorPracticaRepository tutorPracticaRepository, PracticaRepository practicaRepository) {
        this.tutorPracticaRepository = tutorPracticaRepository;
        this.practicaRepository = practicaRepository;
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

    @Transactional
    public void eliminar(Long id) {
        if (id != null) {
            practicaRepository.desvincularTutorPorId(id);
        }
        tutorPracticaRepository.deleteById(id);
    }
}
