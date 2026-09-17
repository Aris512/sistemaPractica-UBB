package com.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.backend.model.CentroPractica;
import com.backend.model.Practica;
import com.backend.model.ProfesorColaborador;
import com.backend.repository.CentroPracticaRepository;
import com.backend.repository.PracticaRepository;
import com.backend.repository.ProfesorColaboradorRepository;

@Service
public class CentroPracticaService {

    private final CentroPracticaRepository centroPracticaRepository;
    private final ProfesorColaboradorRepository profesorColaboradorRepository;
    private final PracticaRepository practicaRepository;

    public CentroPracticaService(CentroPracticaRepository centroPracticaRepository,
                                 ProfesorColaboradorRepository profesorColaboradorRepository,
                                 PracticaRepository practicaRepository) {
        this.centroPracticaRepository = centroPracticaRepository;
        this.profesorColaboradorRepository = profesorColaboradorRepository;
        this.practicaRepository = practicaRepository;
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

    public CentroPractica actualizar(Long id, CentroPractica centroPractica) {
        return centroPracticaRepository.findById(id).map(existente -> {
            if (centroPractica.getNombre() != null) {
                existente.setNombre(centroPractica.getNombre().trim());
            }
            if (centroPractica.getDireccion() != null) {
                existente.setDireccion(centroPractica.getDireccion().trim());
            }
            return centroPracticaRepository.save(existente);
        }).orElse(null);
    }

    @Transactional
    public void eliminar(Long id) {
        CentroPractica centro = centroPracticaRepository.findById(id).orElse(null);
        if (centro == null) {
            return;
        }

        // 1. Desvincular de profesores colaboradores para no violar la foreign key
        List<ProfesorColaborador> colaboradores = profesorColaboradorRepository.findAll();
        for (ProfesorColaborador colab : colaboradores) {
            if (colab.getCentroPractica() != null && colab.getCentroPractica().getIdCentro().equals(id)) {
                colab.setCentroPractica(null);
                profesorColaboradorRepository.save(colab);
            }
        }

        // 2. Desvincular de prácticas asignadas
        List<Practica> practicas = practicaRepository.findAll();
        for (Practica prac : practicas) {
            if (prac.getCentroPractica() != null && prac.getCentroPractica().getIdCentro().equals(id)) {
                prac.setCentroPractica(null);
                practicaRepository.save(prac);
            }
        }

        centroPracticaRepository.delete(centro);
    }
}
