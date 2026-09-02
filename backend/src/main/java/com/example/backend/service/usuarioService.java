package com.example.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.example.backend.model.usuario;
import com.example.backend.repository.usuarioRepository;

@Service
public class usuarioService {

    private final usuarioRepository usuarioRepository;

    public usuarioService(usuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    public List<usuario> obtenerUsuarios() {
        return usuarioRepository.findAll();
    }

    public usuario obtenerUsuarioPorId(Long id) {
        return usuarioRepository.findById(id)
                .orElse(null);
    }

    public usuario crearUsuario(usuario usuario) {
        return usuarioRepository.save(usuario);
    }

    public void eliminarUsuario(Long id) {
        usuarioRepository.deleteById(id);
    }
}