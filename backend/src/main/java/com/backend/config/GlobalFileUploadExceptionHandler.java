package com.backend.config;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

@ControllerAdvice
public class GlobalFileUploadExceptionHandler {

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, String>> handleMaxSizeException(MaxUploadSizeExceededException exc) {
        return ResponseEntity.status(HttpStatus.CONTENT_TOO_LARGE)
                .body(Map.of(
                    "error", "El archivo supera el tamaño máximo permitido de 20 MB.",
                    "codigo", "FILE_SIZE_LIMIT_EXCEEDED"
                ));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgumentException(IllegalArgumentException exc) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of(
                    "error", exc.getMessage() != null ? exc.getMessage() : "Parámetros de solicitud no válidos.",
                    "codigo", "BAD_REQUEST"
                ));
    }

    @ExceptionHandler(SecurityException.class)
    public ResponseEntity<Map<String, String>> handleSecurityException(SecurityException exc) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of(
                    "error", exc.getMessage() != null ? exc.getMessage() : "Operación no autorizada.",
                    "codigo", "FORBIDDEN"
                ));
    }
}
