package com.backend.service;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.text.Normalizer;
import java.util.List;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

@Service
public class FileStorageService {

    private static final Logger logger = LoggerFactory.getLogger(FileStorageService.class);
    public static final long DEFAULT_MAX_SIZE_BYTES = 20L * 1024 * 1024; // 20 MB

    private final Path rootLocation;

    public FileStorageService(@Value("${app.storage.location:uploads}") String storageLocation) {
        this.rootLocation = Paths.get(storageLocation).toAbsolutePath().normalize();
        initStorage();
    }

    private void initStorage() {
        try {
            if (!Files.exists(this.rootLocation)) {
                Files.createDirectories(this.rootLocation);
                logger.info("Directorio principal de almacenamiento creado en: {}", this.rootLocation);
            }
        } catch (IOException e) {
            logger.error("No se pudo inicializar el directorio raíz de almacenamiento: {}", e.getMessage());
            throw new RuntimeException("No se pudo inicializar el almacenamiento de archivos", e);
        }
    }

    /**
     * Almacena físicamente un archivo en el subdirectorio indicado con validación estricta de 20MB y formato.
     */
    public StoredFileResult storeFile(MultipartFile file, String subfolder, List<String> allowedExtensions) {
        return storeFile(file, subfolder, allowedExtensions, DEFAULT_MAX_SIZE_BYTES);
    }

    public StoredFileResult storeFile(MultipartFile file, String subfolder, List<String> allowedExtensions, long maxSizeBytes) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("No se ha seleccionado ningún archivo o el archivo está vacío.");
        }

        // Validación de tamaño (Límite 20MB)
        if (file.getSize() > maxSizeBytes) {
            long maxMb = maxSizeBytes / (1024 * 1024);
            throw new IllegalArgumentException("El archivo excede el tamaño máximo permitido de " + maxMb + " MB.");
        }

        // Obtención y sanitización del nombre original
        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "archivo");
        if (originalFilename.contains("..")) {
            throw new IllegalArgumentException("El nombre del archivo contiene caracteres no válidos de ruta: " + originalFilename);
        }

        String extension = getFileExtension(originalFilename).toLowerCase();

        // Validación de restricciones de formato
        if (allowedExtensions != null && !allowedExtensions.isEmpty()) {
            boolean extensionValida = allowedExtensions.stream()
                .anyMatch(ext -> {
                    String cleanExt = ext.startsWith(".") ? ext.substring(1) : ext;
                    return cleanExt.equalsIgnoreCase(extension);
                });

            if (!extensionValida) {
                throw new IllegalArgumentException("Formato de archivo no permitido (." + extension + "). Formatos aceptados: " + String.join(", ", allowedExtensions));
            }
        }

        try {
            // Asegurar creación del subdirectorio
            Path targetDir = this.rootLocation.resolve(subfolder != null ? subfolder : "").normalize();
            if (!Files.exists(targetDir)) {
                Files.createDirectories(targetDir);
            }

            // Generar nombre de archivo único para evitar sobreescritura y colisiones
            String sanitizedBaseName = sanitizarNombre(getBaseName(originalFilename));
            String uniqueFilename = UUID.randomUUID().toString().substring(0, 8) + "_" + sanitizedBaseName + "." + extension;
            Path targetPath = targetDir.resolve(uniqueFilename).normalize();

            // Validación de seguridad contra Path Traversal
            if (!targetPath.startsWith(this.rootLocation)) {
                throw new SecurityException("No se puede almacenar el archivo fuera del directorio asignado.");
            }

            // Copiar el archivo físicamente
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            String relativePath = (subfolder != null && !subfolder.isBlank() ? subfolder + "/" : "") + uniqueFilename;

            logger.info("Archivo almacenado con éxito: {} ({} bytes)", relativePath, file.getSize());

            return new StoredFileResult(
                originalFilename,
                uniqueFilename,
                relativePath.replace("\\", "/"),
                targetPath.toString(),
                file.getSize(),
                file.getContentType()
            );

        } catch (IOException e) {
            logger.error("Error al almacenar archivo {}: {}", originalFilename, e.getMessage());
            throw new RuntimeException("Error interno al escribir el archivo en disco: " + e.getMessage(), e);
        }
    }

    /**
     * Carga un archivo físico como recurso de Spring para descargas seguras.
     */
    public Resource loadFileAsResource(String relativePath) {
        try {
            if (relativePath == null || relativePath.isBlank()) {
                throw new IllegalArgumentException("Ruta de archivo vacía.");
            }

            // Normalizar ruta evitando prefijos redundantes
            String clean = relativePath.replace("\\", "/");
            if (clean.startsWith("uploads/")) {
                clean = clean.substring("uploads/".length());
            }

            Path filePath = this.rootLocation.resolve(clean).normalize();

            // Seguridad Path Traversal
            if (!filePath.startsWith(this.rootLocation)) {
                throw new SecurityException("Acceso no autorizado a la ruta del archivo.");
            }

            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new RuntimeException("No se encontró el archivo físico o no se puede leer: " + relativePath);
            }
        } catch (MalformedURLException e) {
            throw new RuntimeException("Error al resolver URL del archivo: " + relativePath, e);
        }
    }

    /**
     * Elimina físicamente un archivo en disco.
     */
    public boolean deleteFile(String relativePath) {
        try {
            if (relativePath == null || relativePath.isBlank()) return false;
            String clean = relativePath.replace("\\", "/");
            if (clean.startsWith("uploads/")) {
                clean = clean.substring("uploads/".length());
            }
            Path filePath = this.rootLocation.resolve(clean).normalize();
            if (filePath.startsWith(this.rootLocation) && Files.exists(filePath)) {
                return Files.deleteIfExists(filePath);
            }
        } catch (Exception e) {
            logger.warn("No se pudo eliminar el archivo físico {}: {}", relativePath, e.getMessage());
        }
        return false;
    }

    private String getFileExtension(String filename) {
        if (filename == null) return "";
        int lastDotIndex = filename.lastIndexOf(".");
        return (lastDotIndex != -1) ? filename.substring(lastDotIndex + 1) : "";
    }

    private String getBaseName(String filename) {
        if (filename == null) return "archivo";
        int lastDotIndex = filename.lastIndexOf(".");
        return (lastDotIndex != -1) ? filename.substring(0, lastDotIndex) : filename;
    }

    private String sanitizarNombre(String entrada) {
        if (entrada == null) return "archivo";
        String normalized = Normalizer.normalize(entrada, Normalizer.Form.NFD);
        String limpia = normalized.replaceAll("[\\p{InCombiningDiacriticalMarks}]", "");
        return limpia.replaceAll("[^a-zA-Z0-9._-]", "_");
    }

    public static record StoredFileResult(
        String originalFilename,
        String storedFilename,
        String relativePath,
        String absolutePath,
        long sizeBytes,
        String contentType
    ) {}
}
