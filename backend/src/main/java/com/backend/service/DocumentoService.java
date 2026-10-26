package com.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.backend.model.Documento;
import com.backend.repository.DocumentoRepository;

@Service
public class DocumentoService {

    private final DocumentoRepository documentoRepository;
    private final FileStorageService fileStorageService;

    public DocumentoService(DocumentoRepository documentoRepository, FileStorageService fileStorageService) {
        this.documentoRepository = documentoRepository;
        this.fileStorageService = fileStorageService;
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

    @Transactional
    public void eliminar(Long id) {
        Documento documento = documentoRepository.findById(id).orElse(null);
        if (documento == null) return;
        documentoRepository.delete(documento);
        fileStorageService.deleteFile(documento.getUbicacion());
    }
}
