import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Mail,
  ChevronDown,
  Copy,
  Check,
  Download,
  GraduationCap,
  School,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Calendar,
  Loader2,
} from "lucide-react";
import type { EstudianteDetalleDocumentos, DocumentoItem } from "./types";
import { sileo } from "sileo";

interface DocumentosModalProps {
  isOpen: boolean;
  onClose: () => void;
  detalle: EstudianteDetalleDocumentos | null;
  loading: boolean;
  onDownloadFile: (doc: DocumentoItem) => void;
  onDownloadZip: (rut: string, studentName?: string) => Promise<void>;
}

export function DocumentosModal({
  isOpen,
  onClose,
  detalle,
  loading,
  onDownloadFile,
  onDownloadZip,
}: DocumentosModalProps) {
  const [isEmailDropdownOpen, setIsEmailDropdownOpen] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsEmailDropdownOpen(false);
      }
    }
    if (isEmailDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isEmailDropdownOpen]);

  const handleCopyEmail = (email: string, nombre: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    sileo.success({
      title: "Correo copiado",
      description: `${email} (${nombre}) copiado al portapapeles`,
    });
    setTimeout(() => {
      setCopiedEmail((prev) => (prev === email ? null : prev));
    }, 2000);
  };

  const handleZipClick = async () => {
    if (!detalle) return;
    setIsDownloadingZip(true);
    try {
      await onDownloadZip(detalle.rut, detalle.nombre);
    } finally {
      setIsDownloadingZip(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-white">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-6">
            <div>
              <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <span>Expediente de Documentación</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-1">
                Consulta los documentos entregados por el estudiante y profesores asociados.
              </DialogDescription>
            </div>

            {/* Menú desplegable para correos del estudiante y de los profesores */}
            {detalle && (
              <div className="relative" ref={dropdownRef}>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEmailDropdownOpen(!isEmailDropdownOpen)}
                  className="gap-1.5 bg-white text-slate-800 hover:bg-slate-100 border-slate-300 shadow-xs cursor-pointer text-xs font-medium"
                >
                  <Mail className="size-3.5 text-indigo-600" />
                  <span>Ver correos de contacto</span>
                  <ChevronDown
                    className={`size-3.5 text-slate-400 transition-transform duration-200 ${
                      isEmailDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </Button>

                {/* Dropdown flotante con los correos */}
                {isEmailDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-slate-200 bg-white p-3 shadow-xl z-50 animate-in fade-in-0 zoom-in-95 duration-100">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2.5">
                      <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                        <Mail className="size-3.5 text-indigo-600" />
                        Correos del Estudiante y Profesores
                      </span>
                      <span className="text-[10px] text-slate-400">Contacto</span>
                    </div>

                    <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                      {/* Correo del estudiante */}
                      <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700">
                            <GraduationCap className="size-3 text-slate-500" />
                            {detalle.nombre}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 font-medium">
                            Estudiante
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-1">
                          <span className="text-xs font-mono text-slate-600 truncate">
                            {detalle.correo || "Sin correo"}
                          </span>
                          {detalle.correo && (
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => handleCopyEmail(detalle.correo, detalle.nombre)}
                                className="p-1 rounded hover:bg-slate-200/70 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                                title="Copiar correo"
                              >
                                {copiedEmail === detalle.correo ? (
                                  <Check className="size-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="size-3.5" />
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Correos de los profesores */}
                      <div>
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5 px-0.5">
                          Profesores de la Asignatura
                        </span>
                        {detalle.profesores && detalle.profesores.length > 0 ? (
                          <div className="space-y-1.5">
                            {detalle.profesores.map((prof, idx) => (
                              <div
                                key={idx}
                                className="rounded-lg bg-slate-50 p-2.5 border border-slate-100"
                              >
                                <div className="flex items-center justify-between gap-1 mb-1">
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-800">
                                    <School className="size-3 text-slate-500" />
                                    {prof.nombre}
                                  </span>
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-medium">
                                    Profesor
                                  </span>
                                </div>
                                {(prof.asignatura || detalle.asignatura) && (
                                  <div className="flex items-center gap-1 text-[11px] text-slate-600 font-medium mb-1">
                                    <BookOpen className="size-3 text-slate-400" />
                                    <span>{prof.asignatura || detalle.asignatura}</span>
                                  </div>
                                )}
                                <div className="flex items-center justify-between gap-2 mt-1">
                                  <span className="text-xs font-mono text-slate-600 truncate">
                                    {prof.correo || "Sin correo"}
                                  </span>
                                  {prof.correo && (
                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        onClick={() => handleCopyEmail(prof.correo, prof.nombre)}
                                        className="p-1 rounded hover:bg-slate-200/70 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                                        title="Copiar correo"
                                      >
                                        {copiedEmail === prof.correo ? (
                                          <Check className="size-3.5 text-emerald-600" />
                                        ) : (
                                          <Copy className="size-3.5" />
                                        )}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400 p-2 text-center bg-slate-50 rounded-lg">
                            No hay profesores registrados para esta asignatura.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogHeader>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500 gap-3">
              <Loader2 className="size-8 animate-spin text-slate-400" />
              <span className="text-sm">Cargando expediente de documentos...</span>
            </div>
          ) : !detalle ? (
            <div className="py-8 text-center text-slate-500 text-sm">
              No se pudo cargar la información del estudiante.
            </div>
          ) : (
            <>
              {/* Tarjeta de información del estudiante y asignatura */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                      <span>{detalle.nombre}</span>
                      <span className="font-mono text-xs font-normal text-slate-500 px-2 py-0.5 rounded bg-white border border-slate-200">
                        {detalle.rut}
                      </span>
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mt-1">
                      <span className="flex items-center gap-1 font-medium text-slate-800">
                        <BookOpen className="size-3.5 text-slate-500" />
                        {detalle.asignatura}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3 text-slate-400" />
                        Semestre {detalle.semestre}
                      </span>
                    </div>
                  </div>

                  {/* Estado global */}
                  <div className="flex items-center gap-2 sm:self-center self-start">
                    {detalle.progreso === 100 ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="size-3.5 text-emerald-600" />
                        Completo (100%)
                      </span>
                    ) : detalle.progreso > 0 ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                        <Clock className="size-3.5 text-blue-600" />
                        En proceso (50%)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                        <AlertCircle className="size-3.5 text-amber-600" />
                        Pendiente (0%)
                      </span>
                    )}
                  </div>
                </div>

                {/* Barra de progreso */}
                <div className="space-y-1.5 pt-2 border-t border-slate-200/80">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>
                      Progreso de entrega: <strong>{detalle.totalDocumentos}</strong> de{" "}
                      <strong>{detalle.documentosRequeridos}</strong> documentos entregados
                    </span>
                    <span className="font-semibold text-slate-900 tabular-nums">
                      {detalle.progreso}%
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200/80">
                    <div
                      className={`h-full transition-all duration-300 ${
                        detalle.progreso === 100
                          ? "bg-emerald-500"
                          : detalle.progreso > 0
                          ? "bg-blue-500"
                          : "bg-slate-400"
                      }`}
                      style={{ width: `${detalle.progreso}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Lista de documentos requeridos */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-900 flex items-center justify-between">
                  <span>Documentos de la Práctica</span>
                  <span className="text-xs font-normal text-slate-500">
                    Almacenados localmente en el servidor
                  </span>
                </h4>

                <div className="space-y-3">
                  {detalle.documentos.map((doc, idx) => {
                    const isEntregado = doc.estado === "ENTREGADO";
                    const isEstudiante = doc.tipoDocumento === "ESTUDIANTE";

                    return (
                      <div
                        key={idx}
                        className={`rounded-xl border p-4 transition-all ${
                          isEntregado
                            ? "border-slate-200 bg-white shadow-xs hover:border-slate-300"
                            : "border-dashed border-slate-300 bg-slate-50/70"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div
                              className={`flex size-10 items-center justify-center rounded-lg shrink-0 mt-0.5 ${
                                isEntregado
                                  ? isEstudiante
                                    ? "bg-indigo-50 text-indigo-700"
                                    : "bg-emerald-50 text-emerald-700"
                                  : "bg-slate-100 text-slate-400"
                              }`}
                            >
                              <FileText className="size-5" />
                            </div>

                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-semibold text-slate-900">
                                  {doc.nombreDocumento}
                                </span>
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                    isEstudiante
                                      ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  }`}
                                >
                                  {isEstudiante ? "Estudiante" : "Profesor"}
                                </span>
                              </div>

                              {isEntregado ? (
                                <div className="text-xs text-slate-500 space-y-0.5">
                                  <p className="font-mono text-slate-700 font-medium">
                                    {doc.nombreArchivo}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                                    <span>Subido por: <strong>{doc.subidoPor}</strong></span>
                                    {doc.tamanio && doc.tamanio !== "—" && (
                                      <span>Tamaño: {doc.tamanio}</span>
                                    )}
                                    {doc.fechaCarga && (
                                      <span>
                                        Fecha: {new Date(doc.fechaCarga).toLocaleDateString("es-CL")}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <p className="text-xs text-amber-700 flex items-center gap-1 font-medium">
                                  <Clock className="size-3" />
                                  Documento pendiente de entrega por {isEstudiante ? "el estudiante" : "el profesor"}.
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Botón de descarga individual */}
                          <div className="sm:self-center self-end shrink-0">
                            {isEntregado ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onDownloadFile(doc)}
                                className="gap-1.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 cursor-pointer text-xs"
                                title="Descargar documento individual"
                              >
                                <Download className="size-3.5 text-slate-600" />
                                <span>Descargar PDF</span>
                              </Button>
                            ) : (
                              <span className="text-xs font-medium text-slate-400 px-3 py-1.5 rounded-md bg-slate-100">
                                No disponible
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/90 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="cursor-pointer text-xs h-9 px-4 text-slate-700 hover:bg-slate-100 border-slate-300"
          >
            Cerrar
          </Button>

          {detalle && (
            <Button
              type="button"
              onClick={handleZipClick}
              disabled={isDownloadingZip}
              className="gap-2 bg-slate-900 hover:bg-slate-800 text-white shadow-xs cursor-pointer text-xs h-9 px-4 font-medium"
            >
              {isDownloadingZip ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}
              <span>
                Descargar {detalle.nombre ? `${detalle.nombre.trim().replace(/\s+/g, "_")}_expediente` : "expediente"} (.ZIP)
              </span>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
