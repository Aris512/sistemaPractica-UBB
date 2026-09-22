import { useState, useRef, type DragEvent, type ChangeEvent } from "react";
import { adminFetch } from "@/lib/adminAuth";
import { sileo } from "sileo";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Attachment,
  AttachmentMedia,
  AttachmentContent,
  AttachmentTitle,
  AttachmentDescription,
  AttachmentActions,
  AttachmentAction,
} from "@/components/ui/attachment";
import {
  FileSpreadsheet,
  UploadCloud,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";

interface OmitidoItem {
  usuario: string;
  motivo: string;
}

interface ImportResponse {
  totalProcesados: number;
  totalIngresados: number;
  totalOmitidos: number;
  omitidos: OmitidoItem[];
  message?: string;
  error?: string;
}

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess?: () => void;
}

export function ImportModal({ isOpen, onClose, onImportSuccess }: ImportModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setSelectedFile(null);
    setIsDragging(false);
    setUploading(false);
    setResult(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    if (uploading) return;
    const hasSuccessfulImports = result && result.totalIngresados > 0;
    resetState();
    onClose();
    if (hasSuccessfulImports && onImportSuccess) {
      onImportSuccess();
    }
  };

  const validateAndSetFile = (file: File) => {
    setErrorMessage(null);
    setResult(null);

    const fileName = file.name.toLowerCase();
    const isExcel =
      fileName.endsWith(".xlsx") ||
      fileName.endsWith(".xls") ||
      file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.type === "application/vnd.ms-excel";

    if (!isExcel) {
      const msg = "Solo se permiten archivos Excel (.xlsx, .xls). Formatos como PDF, CSV o imágenes no son aceptados.";
      setErrorMessage(msg);
      sileo.error({
        title: "Formato no permitido",
        description: msg,
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      validateAndSetFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setErrorMessage(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const handleProcessImport = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await adminFetch("http://localhost:8080/admin/usuarios/importar", {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const errorText = data?.error || data?.message || "Error al procesar el archivo Excel en el servidor.";
        setErrorMessage(errorText);
        sileo.error({
          title: "Error de importación",
          description: errorText,
        });
        return;
      }

      setResult(data);

      if (data.totalIngresados > 0) {
        sileo.success({
          title: "Importación finalizada",
          description: `Se ingresaron ${data.totalIngresados} usuario(s) correctamente.`,
        });
      } else {
        sileo.warning({
          title: "Importación completada",
          description: "No se ingresó ningún usuario nuevo. Revisa los motivos de omisión.",
        });
      }
    } catch (err: any) {
      const msg = err?.message || "No se pudo conectar con el servidor backend.";
      setErrorMessage(msg);
      sileo.error({
        title: "Error de conexión",
        description: msg,
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl border border-slate-200 shadow-xl p-6">
        <DialogHeader className="space-y-1 pb-2 border-b border-slate-100">
          <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="size-5 text-emerald-600" />
            Importar Usuarios desde Excel
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Carga de usuarios mediante archivo Excel (.xlsx, .xls).
          </DialogDescription>
          <p className="text-xs text-slate-500">
            formato: rut contrasena rol nombre apellido correo asignatura (op) lugar de practica(op)
          </p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Mensaje de error general si ocurre */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/80 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="size-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {/* Estado 1: No hay resultados de importación aún (mostrar selector y dropzone) */}
          {!result && (
            <div className="space-y-4">
              {/* Zona de Arrastre Drag & Drop estilo Shadcn Attachment */}
              {!selectedFile ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                    isDragging
                      ? "border-sky-500 bg-sky-50/60 scale-[0.99]"
                      : "border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                  <div className="size-14 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-slate-500">
                    <UploadCloud className="size-7 text-sky-600" />
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-800">
                      Adjuntar archivo Excel
                    </p>
                    <p className="text-xs text-slate-500">
                      Arrastra tu archivo aquí <br /> o selecciona uno desde tu equipo
                    </p>
                  </div>

                  <div className="mt-1">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                      <FileSpreadsheet className="size-3 text-emerald-600" />
                      Solo se permiten archivos .xlsx o .xls
                    </span>
                  </div>
                </div>
              ) : (
                /* Archivo seleccionado: Tarjeta utilizando componente Attachment de shadcn/ui */
                <div className="space-y-3">
                  <span className="text-xs font-semibold text-slate-700 block">
                    Archivo seleccionado para procesar:
                  </span>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                    <Attachment state="done" size="default" className="bg-white border-slate-200/80 shadow-2xs">
                      <AttachmentMedia variant="icon" className="bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                        <FileSpreadsheet className="size-5" />
                      </AttachmentMedia>
                      <AttachmentContent>
                        <AttachmentTitle className="font-semibold text-slate-900 text-xs truncate max-w-[280px]">
                          {selectedFile.name}
                        </AttachmentTitle>
                        <AttachmentDescription className="text-[11px] text-slate-500 font-mono">
                          Excel • {formatFileSize(selectedFile.size)}
                        </AttachmentDescription>
                      </AttachmentContent>
                      <AttachmentActions>
                        <AttachmentAction
                          onClick={handleRemoveFile}
                          disabled={uploading}
                          title="Quitar archivo"
                          className="hover:text-rose-600"
                        >
                          <X className="size-4" />
                        </AttachmentAction>
                      </AttachmentActions>
                    </Attachment>

                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="text-xs text-slate-600 hover:text-slate-900"
                    >
                      Cambiar
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Estado 2: Resultados de la Importación */}
          {result && (
            <div className="space-y-4 animate-in fade-in-50 duration-200">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600" />
                    Importación finalizada
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Resumen del procesamiento del archivo Excel.
                  </p>
                </div>
              </div>

              {/* Indicadores numéricos */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl border border-slate-200 bg-white shadow-2xs text-center space-y-1">
                  <span className="text-[11px] font-medium text-slate-500 block uppercase tracking-wider">
                    Procesados
                  </span>
                  <span className="text-xl font-bold text-slate-900 block">
                    {result.totalProcesados}
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/60 shadow-2xs text-center space-y-1">
                  <span className="text-[11px] font-semibold text-emerald-700 block uppercase tracking-wider">
                    Ingresados
                  </span>
                  <span className="text-xl font-bold text-emerald-800 block">
                    {result.totalIngresados}
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/60 shadow-2xs text-center space-y-1">
                  <span className="text-[11px] font-semibold text-amber-700 block uppercase tracking-wider">
                    Omitidos
                  </span>
                  <span className="text-xl font-bold text-amber-800 block">
                    {result.totalOmitidos}
                  </span>
                </div>
              </div>

              {/* Lista detallada de usuarios omitidos */}
              {result.omitidos && result.omitidos.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <AlertTriangle className="size-4 text-amber-600" />
                    <span>Usuarios omitidos ({result.omitidos.length}):</span>
                  </div>

                  <div className="max-h-52 overflow-y-auto space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50/50 scrollbar-thin">
                    {result.omitidos.map((item, idx) => (
                      <div
                        key={idx}
                        className="text-xs bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-2xs space-y-0.5"
                      >
                        <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <span className="size-1.5 rounded-full bg-amber-500 shrink-0" />
                          {item.usuario}
                        </p>
                        <p className="text-[11px] text-slate-500 pl-3 font-medium">
                          {item.motivo}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-center text-xs text-emerald-800 font-medium">
                  ¡Excelente! Todos los usuarios del archivo fueron ingresados con éxito.
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-slate-100 pt-3 gap-2 sm:gap-0 flex-row justify-end">
          {!result ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClose}
                disabled={uploading}
                className="cursor-pointer text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleProcessImport}
                disabled={!selectedFile || uploading}
                className="bg-slate-900 hover:bg-slate-800 text-white gap-2 cursor-pointer text-xs"
              >
                {uploading ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Procesando Excel...
                  </>
                ) : (
                  <>
                    <UploadCloud className="size-3.5" />
                    Procesar e Importar
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={handleClose}
              className="bg-slate-900 hover:bg-slate-800 text-white cursor-pointer text-xs"
            >
              Cerrar y Actualizar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
