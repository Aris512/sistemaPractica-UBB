import { useState, useRef, useEffect, useCallback } from "react";
import {
  Upload,
  X,
  FileText,
  FileSpreadsheet,
  Presentation,
  FileArchive,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Ban,
} from "lucide-react";
import { sileo } from "sileo";
import { useFileUpload, DEFAULT_MAX_SIZE_MB, type FileValidationOptions } from "@/hooks/useFileUpload";

export interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  endpoint: string;
  additionalData?: Record<string, string | number | boolean | undefined | null>;
  maxSizeMB?: number;
  allowedExtensions?: string[];
  onSuccess?: (response: any) => void;
  onError?: (errorMessage: string) => void;
  acceptedMimeTypes?: string;
  showCategorySelect?: boolean;
  categoryOptions?: string[];
  categoryLabel?: string;
  defaultCategory?: string;
}

export function FileUploadModal({
  isOpen,
  onClose,
  title = "Cargar Archivo",
  description,
  endpoint,
  additionalData,
  maxSizeMB = DEFAULT_MAX_SIZE_MB,
  allowedExtensions = [".pdf", ".docx", ".doc", ".pptx", ".xlsx", ".zip"],
  onSuccess,
  onError,
  acceptedMimeTypes,
  showCategorySelect = false,
  categoryOptions = ["Documento", "Evidencia", "Informe", "Otro"],
  categoryLabel = "Categoría del documento",
  defaultCategory = "Documento",
}: FileUploadModalProps) {
  const {
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
  } = useFileUpload();

  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>(defaultCategory);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Limpiar estado al cerrar o abrir el modal
  useEffect(() => {
    if (!isOpen) {
      reset();
    } else {
      setSelectedCategory(defaultCategory);
    }
  }, [isOpen, reset, defaultCategory]);

  const validationOptions: FileValidationOptions = {
    maxSizeMB,
    allowedExtensions,
  };

  const handleFileSelection = (selectedFile: File | null) => {
    if (!selectedFile) return;

    const validation = validateFile(selectedFile, validationOptions);
    if (!validation.valid) {
      sileo.error({
        title: "Archivo no válido",
        description: validation.error || "No cumple los requisitos de formato o tamaño.",
      });
      return;
    }

    setFile(selectedFile);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);

      if (isUploading) return;

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFileSelection(e.dataTransfer.files[0]);
      }
    },
    [isUploading, validateFile, validationOptions]
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!isUploading) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleStartUpload = async () => {
    if (!file) return;

    try {
      const dataToSend = {
        ...additionalData,
        ...(showCategorySelect ? { tipo: selectedCategory } : {}),
      };

      const result = await upload(file, endpoint, dataToSend, validationOptions);
      sileo.success({
        title: "Carga completada",
        description: `El archivo ${file.name} se cargó exitosamente.`,
      });

      if (onSuccess) {
        onSuccess(result);
      }

      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      const msg = err?.message || "Ocurrió un error inesperado al subir el archivo.";
      if (onError) {
        onError(msg);
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const renderFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "pdf":
        return <FileText className="size-8 text-rose-500" />;
      case "pptx":
      case "ppt":
        return <Presentation className="size-8 text-amber-500" />;
      case "xlsx":
      case "xls":
        return <FileSpreadsheet className="size-8 text-emerald-500" />;
      case "zip":
      case "rar":
        return <FileArchive className="size-8 text-purple-500" />;
      case "png":
      case "jpg":
      case "jpeg":
        return <ImageIcon className="size-8 text-sky-500" />;
      default:
        return <FileText className="size-8 text-slate-500" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
              <Upload className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{title}</h3>
              <p className="text-xs text-slate-500">
                {description || `Formatos: ${allowedExtensions.join(", ")} • Máximo ${maxSizeMB} MB`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={isUploading ? cancelUpload : onClose}
            disabled={isUploading}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-40 cursor-pointer"
            title="Cerrar"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div className="p-6 space-y-5">
          {/* Clasificador / Selector de Categoría */}
          {showCategorySelect && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 tracking-wide">
                {categoryLabel} <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                disabled={isUploading}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all cursor-pointer disabled:opacity-50"
              >
                {categoryOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Zona de Selección o Drag & Drop */}
          {!file && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 select-none ${
                isDragOver
                  ? "border-sky-500 bg-sky-50/80 scale-[1.01]"
                  : "border-slate-300 hover:border-sky-400 hover:bg-slate-50/60"
              }`}
            >
              <div className="size-12 rounded-full bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
                <Upload className="size-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Haz clic para seleccionar o arrastra tu archivo aquí
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Permite documentos y recursos de hasta{" "}
                  <strong className="text-slate-700 font-semibold">{maxSizeMB} MB</strong>
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2">
                {allowedExtensions.map((ext) => (
                  <span
                    key={ext}
                    className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 uppercase"
                  >
                    {ext.replace(".", "")}
                  </span>
                ))}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept={acceptedMimeTypes || allowedExtensions.join(",")}
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileSelection(e.target.files[0]);
                  }
                }}
                className="hidden"
              />
            </div>
          )}

          {/* Tarjeta de Archivo Seleccionado */}
          {file && (
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 overflow-hidden">
                {renderFileIcon(file.name)}
                <div className="overflow-hidden">
                  <p className="text-sm font-semibold text-slate-900 truncate" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                </div>
              </div>

              {!isUploading && !isSuccess && (
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 px-2.5 py-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                >
                  Cambiar
                </button>
              )}
            </div>
          )}

          {/* Barra de Progreso Activa */}
          {isUploading && (
            <div className="space-y-2 p-3 bg-sky-50/70 border border-sky-100 rounded-xl">
              <div className="flex justify-between items-center text-xs font-semibold text-sky-900">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="size-3.5 animate-spin text-sky-600" />
                  Subiendo archivo...
                </span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-2.5 bg-sky-200/60 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-600 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={cancelUpload}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 border border-rose-200 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                >
                  <Ban className="size-3" />
                  <span>Cancelar Carga</span>
                </button>
              </div>
            </div>
          )}

          {/* Mensaje de Éxito */}
          {isSuccess && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold">
              <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
              <span>¡Archivo subido correctamente con éxito!</span>
            </div>
          )}

          {/* Mensaje de Error Específico */}
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
              <AlertCircle className="size-4 shrink-0 text-rose-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-rose-900">No se pudo cargar el archivo</p>
                <p className="mt-0.5 text-rose-700">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Pie del Modal con Acciones */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={isUploading ? cancelUpload : onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/70 rounded-lg transition-colors cursor-pointer"
          >
            {isUploading ? "Cancelar" : "Cerrar"}
          </button>

          {file && !isUploading && !isSuccess && (
            <button
              type="button"
              onClick={handleStartUpload}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm hover:shadow transition-all cursor-pointer"
            >
              <Upload className="size-3.5" />
              <span>Iniciar Carga ({formatFileSize(file.size)})</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
