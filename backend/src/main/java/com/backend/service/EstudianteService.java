package com.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.backend.model.Estudiante;
import com.backend.repository.EstudianteRepository;

@Service
public class EstudianteService {

    private final EstudianteRepository estudianteRepository;

    public EstudianteService(EstudianteRepository estudianteRepository) {
        this.estudianteRepository = estudianteRepository;
    }

    public List<Estudiante> obtenerTodos() {
        return estudianteRepository.findAll().stream()
            .filter(e -> e.getUsuario() == null || (e.getUsuario().isActivo() && !"inactivo".equalsIgnoreCase(e.getUsuario().getEstado())))
            .filter(e -> e.getEstado() == null || !"INACTIVO".equalsIgnoreCase(e.getEstado()))
            .collect(java.util.stream.Collectors.toList());
    }

    public Estudiante obtenerPorId(Long id) {
        Estudiante est = estudianteRepository.findById(id).orElse(null);
        if (est != null && est.getUsuario() != null && (!est.getUsuario().isActivo() || "inactivo".equalsIgnoreCase(est.getUsuario().getEstado()))) {
            return null;
        }
        if (est != null && "INACTIVO".equalsIgnoreCase(est.getEstado())) {
            return null;
        }
        return est;
    }

    public Estudiante obtenerPorRut(String rut) {
        if (rut == null || rut.isBlank()) {
            return null;
        }
        Estudiante est = null;
        java.util.Optional<Estudiante> opt = estudianteRepository.findByUsuarioRut(rut);
        if (opt.isPresent()) {
            est = opt.get();
        } else {
            String clean = com.backend.util.RutUtils.clean(rut);
            opt = estudianteRepository.findByUsuarioRut(clean);
            if (opt.isPresent()) {
                est = opt.get();
            } else {
                String standard = com.backend.util.RutUtils.formatStandard(rut);
                est = estudianteRepository.findByUsuarioRut(standard).orElse(null);
            }
        }
        if (est != null && est.getUsuario() != null && (!est.getUsuario().isActivo() || "inactivo".equalsIgnoreCase(est.getUsuario().getEstado()))) {
            return null;
        }
        if (est != null && "INACTIVO".equalsIgnoreCase(est.getEstado())) {
            return null;
        }
        return est;
    }

    public Estudiante crear(Estudiante estudiante) {
        return estudianteRepository.save(estudiante);
    }

    public void eliminar(Long id) {
        estudianteRepository.deleteById(id);
    }
}
