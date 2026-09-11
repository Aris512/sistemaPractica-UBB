package com.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.backend.model.Documento;
import com.backend.repository.DocumentoRepository;

@Service
public class DocumentoService {

    private final DocumentoRepository documentoRepository;

    public DocumentoService(DocumentoRepository documentoRepository) {
        this.documentoRepository = documentoRepository;
    }

    public List<Documento> obtenerTodos() {
        return documentoRepository.findAll();
    }

    public Documento obtenerPorId(Long id) {
        return documentoRepository.findById(id).orElse(null);
    }

    public Documento crear(Documento documento) {
        return documentoRepository.save(documento);
    }

    public void eliminar(Long id) {
        documentoRepository.deleteById(id);
    }
}
