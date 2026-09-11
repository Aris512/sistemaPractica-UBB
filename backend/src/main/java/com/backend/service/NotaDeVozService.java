package com.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.backend.model.NotaDeVoz;
import com.backend.repository.NotaDeVozRepository;

@Service
public class NotaDeVozService {

    private final NotaDeVozRepository notaDeVozRepository;

    public NotaDeVozService(NotaDeVozRepository notaDeVozRepository) {
        this.notaDeVozRepository = notaDeVozRepository;
    }

    public List<NotaDeVoz> obtenerTodos() {
        return notaDeVozRepository.findAll();
    }

    public NotaDeVoz obtenerPorId(Long id) {
        return notaDeVozRepository.findById(id).orElse(null);
    }

    public NotaDeVoz crear(NotaDeVoz notaDeVoz) {
        return notaDeVozRepository.save(notaDeVoz);
    }

    public void eliminar(Long id) {
        notaDeVozRepository.deleteById(id);
    }
}
