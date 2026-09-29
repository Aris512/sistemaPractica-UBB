import { useState, useEffect, useRef } from "react";
import {
  ClipboardCheck,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  Calendar,
  BookOpen,
  User,
  Upload,
  FileCheck2,
  Clock,
  X,
  Download,
  MessageSquare,
  ChevronRight,
  Paperclip,
  Star,
  Eye,
  CheckCircle2,
} from "lucide-react";
import { sileo } from "sileo";
import type { UserSession } from "@/types/auth";
import {
  getActividadesEstudiante,
  subirEvidenciaArchivo,
  eliminarEvidencia,
  getArchivoDownloadUrl,
  type ActividadEstudiante,
} from "../../../services/actividadEstudianteApi";
import { Button } from "@/components/ui/button";

interface EvaluacionesProps {
  user?: UserSession;
  onBack?: () => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatFecha(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatFechaHora(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function estadoEvidenciaBadge(act: ActividadEstudiante) {
  if (!act.idEvidencia) {
    // Sin entrega — revisar si está vencida
    const vencida =
      act.fechaLimite && new Date(act.fechaLimite) < new Date();
    return vencida ? (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
        <X className="size-3" />
        Vencida
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <Clock className="size-3 animate-pulse" />
        Pendiente
      </span>
    );
  }
  if (act.estadoEvidencia === "REVISADO") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
        <CheckCircle2 className="size-3" />
        Revisado
      </span>
    );
  }
  if (act.estadoEvidencia === "OBSERVADO") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
        <MessageSquare className="size-3" />
        Observado
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
      <FileCheck2 className="size-3" />
      Entregado
    </span>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export function Evaluaciones({ user, onBack }: EvaluacionesProps) {
  const rutEstudiante = user?.rut ?? "";

  // Datos
  const [actividades, setActividades] = useState<ActividadEstudiante[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal detalle
  const [selectedActividad, setSelectedActividad] =
    useState<ActividadEstudiante | null>(null);

  // Upload
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [comentario, setComentario] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isDeletingEvidencia, setIsDeletingEvidencia] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Carga de datos ────────────────────────────────────────────────────────

  const cargarActividades = async () => {
    if (!rutEstudiante) {
      setError("No se encontró información del usuario.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getActividadesEstudiante(rutEstudiante);
      setActividades(data);
    } catch (err: any) {
      console.error("Error al cargar actividades:", err);
      setError(err?.message || "No se pudo cargar la lista de actividades.");
      sileo.error({
        title: "Error al cargar actividades",
        description:
          err?.message || "No se pudo conectar con el servidor.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarActividades();
  }, [rutEstudiante]);

  // ── Modal helpers ─────────────────────────────────────────────────────────

  const handleOpenModal = (act: ActividadEstudiante) => {
    setSelectedActividad(act);
    setUploadFile(null);
    setComentario(act.comentarioEstudiante ?? "");
  };

  const handleCloseModal = () => {
    setSelectedActividad(null);
    setUploadFile(null);
    setComentario("");
    setIsUploading(false);
    setIsDeletingEvidencia(false);
  };

  // ── Eliminar evidencia ────────────────────────────────────────────────────

  const handleEliminarEvidencia = async () => {
    if (!selectedActividad?.idEvidencia) return;
    setIsDeletingEvidencia(true);
    try {
      await eliminarEvidencia(selectedActividad.idEvidencia);
      sileo.success({
        title: "Entrega eliminada",
        description: "Tu entrega fue eliminada correctamente.",
      });
      handleCloseModal();
      await cargarActividades();
    } catch (err: any) {
      sileo.error({
        title: "Error al eliminar",
        description: err?.message || "No se pudo eliminar la entrega.",
      });
    } finally {
      setIsDeletingEvidencia(false);
    }
  };

  // ── Subir evidencia ───────────────────────────────────────────────────────

  const handleUpload = async () => {
    if (!selectedActividad || !uploadFile) return;

    setIsUploading(true);
    try {
      await subirEvidenciaArchivo({
        idActividad: selectedActividad.idActividad,
        rutEstudiante,
        file: uploadFile,
        comentario,
      });

      sileo.success({
        title: "Entrega realizada",
        description: `Tu archivo "${uploadFile.name}" fue entregado correctamente.`,
      });

      handleCloseModal();
      await cargarActividades();
    } catch (err: any) {
      console.error("Error al subir evidencia:", err);
      sileo.error({
        title: "Error al subir archivo",
        description:
          err?.message || "No se pudo procesar el archivo. Inténtalo de nuevo.",
      });
    } finally {
      setIsUploading(false);
    }
  };


  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ── Encabezado ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-700">
            <ClipboardCheck className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Mis Evaluaciones
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Actividades y evaluaciones publicadas por tu profesor de asignatura
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={cargarActividades}
            disabled={loading}
            className="gap-1.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            <RefreshCw
              className={`size-3.5 ${loading ? "animate-spin text-sky-600" : ""}`}
            />
            Actualizar
          </Button>

          {onBack && (
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
              className="text-xs text-sky-800 bg-sky-50 border-sky-200 hover:bg-sky-100 gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="size-3.5" />
              Volver
            </Button>
          )}
        </div>
      </div>

      {/* ── Lista de actividades ── */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs py-20 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="size-8 text-sky-600 animate-spin" />
            <p className="text-sm font-medium text-slate-600">
              Cargando actividades...
            </p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-10 flex flex-col items-center gap-4 text-center">
            <AlertCircle className="size-10 text-rose-500" />
            <div>
              <h3 className="text-base font-bold text-slate-800 mb-1">
                No se pudieron cargar las actividades
              </h3>
              <p className="text-xs text-slate-500 max-w-md">{error}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={cargarActividades}
              className="text-xs gap-1.5"
            >
              <RefreshCw className="size-3" />
              Intentar de nuevo
            </Button>
          </div>
        ) : actividades.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs py-16 flex flex-col items-center gap-4 text-center">
            <div className="size-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
              <ClipboardCheck className="size-7" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-800 mb-1">
                Sin actividades disponibles
              </h3>
              <p className="text-sm text-slate-500 max-w-sm">
                Tu profesor de asignatura aún no ha publicado actividades o no
                tienes una asignatura asignada.
              </p>
            </div>
          </div>
        ) : (
          actividades.map((act) => {
            const yaEntrego = !!act.idEvidencia;
            const vencida =
              !yaEntrego &&
              act.fechaLimite &&
              new Date(act.fechaLimite) < new Date();

            return (
              <div
                key={act.idActividad}
                className={`bg-white rounded-2xl border shadow-xs transition-all hover:shadow-md group ${
                  vencida
                    ? "border-rose-200/80"
                    : yaEntrego
                      ? "border-emerald-200/80"
                      : "border-slate-200/80"
                }`}
              >
                <div className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  {/* Info principal */}
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Ícono de estado */}
                    <div
                      className={`size-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        yaEntrego
                          ? act.estadoEvidencia === "REVISADO"
                            ? "bg-sky-100 text-sky-700"
                            : "bg-emerald-100 text-emerald-700"
                          : vencida
                            ? "bg-rose-100 text-rose-600"
                            : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {yaEntrego ? (
                        act.estadoEvidencia === "REVISADO" ? (
                          <CheckCircle2 className="size-5" />
                        ) : (
                          <FileCheck2 className="size-5" />
                        )
                      ) : (
                        <Clock className="size-5" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <h2 className="font-bold text-slate-900 truncate">
                        {act.titulo}
                      </h2>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500">
                        {act.nombreAsignatura && (
                          <span className="flex items-center gap-1">
                            <BookOpen className="size-3 text-sky-500" />
                            {act.nombreAsignatura}
                          </span>
                        )}
                        {(act.nombreProfesor || act.apellidoProfesor) && (
                          <span className="flex items-center gap-1">
                            <User className="size-3 text-slate-400" />
                            {act.nombreProfesor} {act.apellidoProfesor}
                          </span>
                        )}
                        {act.fechaLimite && (
                          <span
                            className={`flex items-center gap-1 font-medium ${
                              vencida ? "text-rose-600" : "text-slate-500"
                            }`}
                          >
                            <Calendar className="size-3" />
                            Entrega: {formatFecha(act.fechaLimite)}
                          </span>
                        )}
                      </div>

                      {/* Calificación si fue revisado */}
                      {act.calificacion != null && (
                        <div className="mt-2 flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold font-mono border ${
                              act.calificacion >= 4.0
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : "bg-rose-50 text-rose-800 border-rose-200"
                            }`}
                          >
                            <Star className="size-3" />
                            {act.calificacion.toFixed(1)}
                          </span>
                          <span className="text-2xs text-slate-400">
                            {act.calificacion >= 4.0
                              ? "Aprobado"
                              : "Reprobado"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Badge + Botón */}
                  <div className="flex items-center gap-3 sm:shrink-0">
                    {estadoEvidenciaBadge(act)}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenModal(act)}
                      className="h-8 px-3 text-xs gap-1.5 border-sky-200 text-sky-800 bg-sky-50/50 hover:bg-sky-100 hover:border-sky-300 cursor-pointer shadow-2xs"
                    >
                      <Eye className="size-3.5" />
                      Ver detalles
                      <ChevronRight className="size-3 opacity-60" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── MODAL: Detalles y Entrega ── */}
      {selectedActividad && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Cabecera */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-gradient-to-r from-sky-50 to-indigo-50/50">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-sky-600 flex items-center justify-center text-white shadow-xs">
                  <ClipboardCheck className="size-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base leading-tight">
                    {selectedActividad.titulo}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Detalle de la actividad
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="size-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white/80 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Contenido */}
            <div className="p-5 sm:p-6 space-y-4 max-h-[72vh] overflow-y-auto text-sm">
              {/* Metadatos */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Información de la actividad
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  {selectedActividad.nombreAsignatura && (
                    <div>
                      <span className="text-slate-400 block mb-0.5">
                        Asignatura:
                      </span>
                      <span className="font-semibold text-slate-800 flex items-center gap-1">
                        <BookOpen className="size-3 text-sky-500" />
                        {selectedActividad.nombreAsignatura}
                      </span>
                    </div>
                  )}
                  {(selectedActividad.nombreProfesor ||
                    selectedActividad.apellidoProfesor) && (
                    <div>
                      <span className="text-slate-400 block mb-0.5">
                        Profesor:
                      </span>
                      <span className="font-semibold text-slate-800">
                        {selectedActividad.nombreProfesor}{" "}
                        {selectedActividad.apellidoProfesor}
                      </span>
                    </div>
                  )}
                  {selectedActividad.fechaCreacion && (
                    <div>
                      <span className="text-slate-400 block mb-0.5">
                        Publicada:
                      </span>
                      <span className="font-semibold text-slate-800">
                        {formatFechaHora(selectedActividad.fechaCreacion)}
                      </span>
                    </div>
                  )}
                  {selectedActividad.fechaLimite && (
                    <div>
                      <span className="text-slate-400 block mb-0.5">
                        Fecha límite:
                      </span>
                      <span
                        className={`font-semibold ${
                          !selectedActividad.idEvidencia &&
                          new Date(selectedActividad.fechaLimite) < new Date()
                            ? "text-rose-600"
                            : "text-slate-800"
                        }`}
                      >
                        {formatFechaHora(selectedActividad.fechaLimite)}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-400 block mb-0.5">Estado:</span>
                    <span
                      className={`font-semibold ${
                        selectedActividad.estado === "ACTIVA"
                          ? "text-emerald-700"
                          : "text-slate-500"
                      }`}
                    >
                      {selectedActividad.estado === "ACTIVA"
                        ? "Activa"
                        : "Cerrada"}
                    </span>
                  </div>
                </div>

                {/* Descripción */}
                {selectedActividad.descripcion && (
                  <div className="pt-3 border-t border-slate-200/60">
                    <span className="text-xs text-slate-400 block mb-1">
                      Descripción:
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {selectedActividad.descripcion}
                    </p>
                  </div>
                )}
              </div>

              {/* ── Sección: Mi entrega actual ── */}
              {selectedActividad.idEvidencia ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                      <FileCheck2 className="size-4" />
                      Mi entrega
                    </p>
                    <div className="flex items-center gap-2">
                      {estadoEvidenciaBadge(selectedActividad)}
                      <button
                        type="button"
                        onClick={handleEliminarEvidencia}
                        disabled={isDeletingEvidencia || isUploading}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      >
                        {isDeletingEvidencia ? (
                          <RefreshCw className="size-3 animate-spin" />
                        ) : (
                          <X className="size-3" />
                        )}
                        {isDeletingEvidencia ? "Eliminando..." : "Eliminar entrega"}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {selectedActividad.fechaEntrega && (
                      <div>
                        <span className="text-slate-400 block mb-0.5">
                          Fecha de entrega:
                        </span>
                        <span className="font-semibold text-slate-800">
                          {formatFechaHora(selectedActividad.fechaEntrega)}
                        </span>
                      </div>
                    )}
                    {selectedActividad.calificacion != null && (
                      <div>
                        <span className="text-slate-400 block mb-0.5">
                          Calificación:
                        </span>
                        <span
                          className={`font-bold font-mono text-sm ${
                            selectedActividad.calificacion >= 4.0
                              ? "text-emerald-700"
                              : "text-rose-600"
                          }`}
                        >
                          {selectedActividad.calificacion.toFixed(1)}{" "}
                          <span className="text-slate-400 font-normal text-xs">
                            / 7.0
                          </span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Archivo entregado */}
                  {selectedActividad.nombreArchivo && (
                    <div className="flex items-center gap-2 pt-2 border-t border-emerald-200/60">
                      <Paperclip className="size-3.5 text-emerald-600 shrink-0" />
                      <span className="text-xs text-slate-700 truncate flex-1">
                        {selectedActividad.nombreArchivo}
                      </span>
                      {selectedActividad.archivoUrl && (
                        <a
                          href={getArchivoDownloadUrl(
                            selectedActividad.archivoUrl
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-sky-700 font-medium hover:underline shrink-0"
                        >
                          <Download className="size-3" />
                          Descargar
                        </a>
                      )}
                    </div>
                  )}

                  {/* Comentario propio */}
                  {selectedActividad.comentarioEstudiante && (
                    <div className="pt-2 border-t border-emerald-200/60">
                      <span className="text-xs text-slate-400 block mb-0.5">
                        Tu comentario:
                      </span>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {selectedActividad.comentarioEstudiante}
                      </p>
                    </div>
                  )}

                  {/* Retroalimentación del profesor */}
                  {selectedActividad.retroalimentacion && (
                    <div className="pt-2 border-t border-emerald-200/60 bg-white/70 rounded-lg p-3 -mx-1">
                      <span className="text-xs font-semibold text-sky-700 flex items-center gap-1 mb-1">
                        <MessageSquare className="size-3" />
                        Retroalimentación del profesor:
                      </span>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {selectedActividad.retroalimentacion}
                      </p>
                      {selectedActividad.fechaRevision && (
                        <p className="text-2xs text-slate-400 mt-1">
                          Revisado el{" "}
                          {formatFechaHora(selectedActividad.fechaRevision)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : null}

              {/* ── Sección: Subir/Actualizar entrega ── */}
              {selectedActividad.estado === "ACTIVA" && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <Upload className="size-4" />
                    {selectedActividad.idEvidencia
                      ? "Actualizar mi entrega"
                      : "Subir entrega"}
                  </p>

                  {/* Drop zone / selector de archivo */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
                      uploadFile
                        ? "border-sky-400 bg-sky-50"
                        : "border-slate-300 hover:border-sky-400 hover:bg-sky-50/30"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.zip"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) setUploadFile(f);
                      }}
                    />
                    {uploadFile ? (
                      <div className="flex items-center justify-center gap-2 text-sky-700">
                        <Paperclip className="size-4 shrink-0" />
                        <span className="text-xs font-semibold truncate max-w-xs">
                          {uploadFile.name}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setUploadFile(null);
                            if (fileInputRef.current)
                              fileInputRef.current.value = "";
                          }}
                          className="text-rose-500 hover:text-rose-700 transition-colors ml-1"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="size-6 text-slate-400 mx-auto mb-2" />
                        <p className="text-xs text-slate-600 font-medium">
                          Haz clic para seleccionar un archivo
                        </p>
                        <p className="text-2xs text-slate-400 mt-1">
                          PDF, Word, Excel, PowerPoint, imágenes o ZIP · Máx.
                          20 MB
                        </p>
                      </>
                    )}
                  </div>

                  {/* Comentario */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Comentario{" "}
                      <span className="font-normal text-slate-400">
                        (opcional)
                      </span>
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Agrega una nota o comentario sobre tu entrega..."
                      value={comentario}
                      onChange={(e) => setComentario(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl p-3 text-xs bg-white resize-none focus:outline-none focus:ring-2 focus:ring-sky-500/20 leading-relaxed"
                    />
                  </div>
                </div>
              )}

              {/* Actividad cerrada sin entrega */}
              {selectedActividad.estado === "CERRADA" &&
                !selectedActividad.idEvidencia && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 text-center">
                    <X className="size-5 text-rose-500 mx-auto mb-1" />
                    <p className="text-xs font-semibold text-rose-700">
                      Esta actividad está cerrada y no admite nuevas entregas.
                    </p>
                  </div>
                )}
            </div>

            {/* Pie del modal */}
            <div className="flex items-center justify-end gap-2.5 p-4 sm:px-6 bg-slate-50 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCloseModal}
                disabled={isUploading}
                className="text-xs cursor-pointer"
              >
                Cerrar
              </Button>

              {selectedActividad.estado === "ACTIVA" && (
                <Button
                  size="sm"
                  onClick={handleUpload}
                  disabled={!uploadFile || isUploading || isDeletingEvidencia}
                  className="text-xs gap-1.5 bg-sky-700 hover:bg-sky-800 text-white cursor-pointer shadow-xs"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="size-3.5 animate-spin" />
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <Upload className="size-3.5" />
                      {selectedActividad.idEvidencia ? "Actualizar" : "Entregar"}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
