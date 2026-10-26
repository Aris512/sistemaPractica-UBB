import { useState, useRef, useCallback } from "react";

export interface FileValidationOptions {
  maxSizeMB?: number;
  allowedExtensions?: string[];
}

export interface UseFileUploadReturn {
  file: File | null;
  progress: number;
  isUploading: boolean;
  isSuccess: boolean;
  error: string | null;
  setFile: (file: File | null) => void;
  validateFile: (file: File, options?: FileValidationOptions) => { valid: boolean; error?: string };
  upload: (
    fileToUpload: File,
    endpoint: string,
    additionalData?: Record<string, string | number | boolean | undefined | null>,
    options?: FileValidationOptions
  ) => Promise<any>;
  cancelUpload: () => void;
  reset: () => void;
}

export const DEFAULT_MAX_SIZE_MB = 20;

export function useFileUpload(): UseFileUploadReturn {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const validateFile = useCallback((fileToValidate: File, options?: FileValidationOptions) => {
    const maxMB = options?.maxSizeMB ?? DEFAULT_MAX_SIZE_MB;
    const maxSizeBytes = maxMB * 1024 * 1024;

    if (fileToValidate.size > maxSizeBytes) {
      return {
        valid: false,
        error: `El archivo seleccionado (${(fileToValidate.size / (1024 * 1024)).toFixed(1)} MB) supera el límite máximo permitido de ${maxMB} MB.`,
      };
    }

    if (options?.allowedExtensions && options.allowedExtensions.length > 0) {
      const fileName = fileToValidate.name.toLowerCase();
      const hasValidExt = options.allowedExtensions.some((ext) => {
        const cleanExt = ext.startsWith(".") ? ext.toLowerCase() : `.${ext.toLowerCase()}`;
        return fileName.endsWith(cleanExt);
      });

      if (!hasValidExt) {
        return {
          valid: false,
          error: `Formato de archivo no válido. Solo se permiten formatos: ${options.allowedExtensions.join(", ")}`,
        };
      }
    }

    return { valid: true };
  }, []);

  const reset = useCallback(() => {
    if (xhrRef.current && isUploading) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }
    setFile(null);
    setProgress(0);
    setIsUploading(false);
    setIsSuccess(false);
    setError(null);
  }, [isUploading]);

  const cancelUpload = useCallback(() => {
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }
    setIsUploading(false);
    setProgress(0);
    setError("La carga del archivo fue cancelada.");
  }, []);

  const upload = useCallback(
    (
      fileToUpload: File,
      endpoint: string,
      additionalData?: Record<string, string | number | boolean | undefined | null>,
      options?: FileValidationOptions
    ): Promise<any> => {
      return new Promise((resolve, reject) => {
        // 1. Validación previa en el cliente
        const validation = validateFile(fileToUpload, options);
        if (!validation.valid) {
          const errMessage = validation.error || "Archivo no válido.";
          setError(errMessage);
          reject(new Error(errMessage));
          return;
        }

        setFile(fileToUpload);
        setError(null);
        setProgress(0);
        setIsUploading(true);
        setIsSuccess(false);

        const formData = new FormData();
        formData.append("file", fileToUpload);

        if (additionalData) {
          Object.entries(additionalData).forEach(([key, val]) => {
            if (val !== undefined && val !== null) {
              formData.append(key, String(val));
            }
          });
        }

        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;

        // Seguimiento de progreso
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            setProgress(percent);
          }
        };

        // Finalización exitosa o con código de error HTTP
        xhr.onload = () => {
          setIsUploading(false);
          xhrRef.current = null;

          if (xhr.status >= 200 && xhr.status < 300) {
            setProgress(100);
            setIsSuccess(true);
            try {
              const responseData = xhr.responseText ? JSON.parse(xhr.responseText) : {};
              resolve(responseData);
            } catch {
              resolve(xhr.responseText);
            }
          } else {
            let errorMsg = `Error del servidor (${xhr.status})`;
            try {
              const errObj = JSON.parse(xhr.responseText);
              if (errObj.error) errorMsg = errObj.error;
              else if (errObj.message) errorMsg = errObj.message;
            } catch {
              if (xhr.status === 413) {
                errorMsg = "El archivo supera el tamaño máximo permitido por el servidor (20 MB).";
              }
            }
            setError(errorMsg);
            reject(new Error(errorMsg));
          }
        };

        // Fallo de red
        xhr.onerror = () => {
          setIsUploading(false);
          xhrRef.current = null;
          const networkErr = "Error de red al intentar subir el archivo. Comprueba tu conexión.";
          setError(networkErr);
          reject(new Error(networkErr));
        };

        // Cancelación
        xhr.onabort = () => {
          setIsUploading(false);
          xhrRef.current = null;
          const abortMsg = "Carga cancelada por el usuario.";
          setError(abortMsg);
          reject(new Error(abortMsg));
        };

        xhr.open("POST", endpoint, true);
        xhr.send(formData);
      });
    },
    [validateFile]
  );

  return {
    file,
    progress,
    isUploading,
    isSuccess,
    error,
    setFile,
    validateFile,
    upload,
    cancelUpload,
    reset,
  };
}
