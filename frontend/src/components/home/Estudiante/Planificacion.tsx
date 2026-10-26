import { useState, useEffect, useCallback, useRef } from "react";
import {
  CalendarDays,
  ArrowLeft,
  Upload,
  FileText,
  Presentation,
  FileSpreadsheet,
  Layers,
  ClipboardList,
  Trash2,
  Download,
  BookOpen,
  RefreshCw,
  Plus,
  AlertCircle,
  CheckCircle2,
  Clock,
  X,
  Paperclip,
  type LucideIcon,
} from "lucide-react";
import type { UserSession } from "@/types/auth";
import { ConfirmDeleteDialog } from "@/components/ui/ConfirmDeleteDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { sileo } from "sileo";

interface PlanificacionProps {
  user?: UserSession;
  onBack?: () => void;
}

type Categoria = "PLANIFICACION" | "PRESENTACION" | "GUIA_ACTIVIDADES" | "RUBRICA_EVALUACION" | "MATERIAL_DIDACTICO";

interface ArchivoPlanificacion {
  categoria: Categoria;
  etiqueta: string;
  idDocumento: number | null;
  nombre: string | null;
  tamanioBytes: number | null;
  fechaCarga: string | null;
  urlDescarga: string | null;
}

interface PlanificacionItem {
  idPlanificacion: number;
  fechaCreacion: string;
  asignatura: string | null;
  archivos: ArchivoPlanificacion[];
  pendientes: Categoria[];
  completa: boolean;
}

/** Las 5 categorías obligatorias (deben coincidir con PlanificacionService en el backend). */
const CATEGORIAS: {
  key: Categoria;
  label: string;
  descripcion: string;
  extensiones: string[];
  icon: LucideIcon;
  colorBg: string;
  colorText: string;
}[] = [
  {
    key: "PLANIFICACION",
    label: "Planificación",
    descripcion: "Documento de planificación de la clase: objetivos, secuencia y tiempos.",
    extensiones: [".pdf", ".doc", ".docx", ".odt"],
    icon: FileText,
    colorBg: "bg-sky-50",
    colorText: "text-sky-700",
  },
  {
    key: "PRESENTACION",
    label: "Presentación",
    descripcion: "Diapositivas que usarás durante la sesión.",
    extensiones: [".ppt", ".pptx", ".odp", ".pdf"],
    icon: Presentation,
    colorBg: "bg-amber-50",
    colorText: "text-amber-700",
  },
  {
    key: "GUIA_ACTIVIDADES",
    label: "Guía de actividades",
    descripcion: "Guía de trabajo y actividades para los estudiantes.",
    extensiones: [".pdf", ".doc", ".docx", ".odt"],
    icon: ClipboardList,
    colorBg: "bg-violet-50",
    colorText: "text-violet-700",
  },
  {
    key: "RUBRICA_EVALUACION",
    label: "Rúbrica de evaluación",
    descripcion: "Rúbrica, lista de cotejo o escala con la que evaluarás la clase.",
    extensiones: [".pdf", ".doc", ".docx", ".xls", ".xlsx"],
    icon: FileSpreadsheet,
    colorBg: "bg-emerald-50",
    colorText: "text-emerald-700",
  },
  {
    key: "MATERIAL_DIDACTICO",
    label: "Material didáctico",
    descripcion: "Recursos de apoyo: lecturas, imágenes, fichas o archivos comprimidos.",
    extensiones: [".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx", ".zip", ".png", ".jpg", ".jpeg"],
    icon: Layers,
    colorBg: "bg-indigo-50",
    colorText: "text-indigo-700",
  },
];

const etiqueta = (c: Categoria) => CATEGORIAS.find((x) => x.key === c)?.label ?? c;
const MAX_BYTES = 20 * 1024 * 1024;

function formatoTamanio(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Ejecuta una petición a la API y devuelve el JSON, o lanza un error con el mensaje del backend. */
async function pedir<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || "No se pudo completar la operación.");
  }
  return data as T;
}

interface ArchivoSeleccionado {
  id: number;
  file: File;
  categoria: Categoria | "";
}

export function Planificacion({ user, onBack }: PlanificacionProps) {
  const rut = user?.rut ?? "";
  const [planificaciones, setPlanificaciones] = useState<PlanificacionItem[]>([]);
  const [seleccionadaId, setSeleccionadaId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [creando, setCreando] = useState(false);
  const [deleteAction, setDeleteAction] = useState<(() => Promise<void>) | null>(null);

  // Modal de subida
  const [modalAbierto, setModalAbierto] = useState(false);
  const [seleccion, setSeleccion] = useState<ArchivoSeleccionado[]>([]);
  const [subiendo, setSubiendo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const siguienteId = useRef(0);

  const seleccionada = planificaciones.find((p) => p.idPlanificacion === seleccionadaId) ?? null;
  // Numeración estable: la más antigua es la #1 (la API las devuelve de la más nueva a la más antigua)
  const numero = (id: number) => planificaciones.length - planificaciones.findIndex((p) => p.idPlanificacion === id);

  const cargar = useCallback(async () => {
    if (!rut) return;
    setLoading(true);
    try {
      const data = await pedir<PlanificacionItem[]>(`/api/planificaciones/estudiante/${encodeURIComponent(rut)}`);
      setPlanificaciones(data);
      setSeleccionadaId((actual) =>
        data.some((p) => p.idPlanificacion === actual) ? actual : data[0]?.idPlanificacion ?? null
      );
    } catch (err) {
      sileo.error({ title: "Error al cargar", description: err instanceof Error ? err.message : "Intenta nuevamente." });
    } finally {
      setLoading(false);
    }
  }, [rut]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  /** Reemplaza la planificación modificada en la lista con la versión que devuelve la API. */
  const actualizar = (plan: PlanificacionItem) =>
    setPlanificaciones((lista) => lista.map((p) => (p.idPlanificacion === plan.idPlanificacion ? plan : p)));

  const crearPlanificacion = async () => {
    setCreando(true);
    try {
      const nueva = await pedir<PlanificacionItem>(`/api/planificaciones/estudiante/${encodeURIComponent(rut)}`, {
        method: "POST",
      });
      setPlanificaciones((lista) => [nueva, ...lista]);
      setSeleccionadaId(nueva.idPlanificacion);
      sileo.success({ title: "Planificación creada", description: "Sube sus 5 archivos para completarla." });
    } catch (err) {
      sileo.error({ title: "No se pudo crear", description: err instanceof Error ? err.message : "" });
    } finally {
      setCreando(false);
    }
  };

  const eliminarArchivo = async (plan: PlanificacionItem, archivo: ArchivoPlanificacion) => {
    try {
      const actualizado = await pedir<PlanificacionItem>(
        `/api/planificaciones/${plan.idPlanificacion}/archivos/${archivo.categoria}?rutUsuario=${encodeURIComponent(rut)}`,
        { method: "DELETE" }
      );
      actualizar(actualizado);
      sileo.success({ title: "Archivo eliminado", description: `${archivo.etiqueta} quedó pendiente de subir.` });
    } catch (err) {
      sileo.error({ title: "No se pudo eliminar", description: err instanceof Error ? err.message : "" });
    }
  };

  const eliminarPlanificacion = async (plan: PlanificacionItem) => {
    try {
      await pedir(`/api/planificaciones/${plan.idPlanificacion}?rutUsuario=${encodeURIComponent(rut)}`, { method: "DELETE" });
      sileo.success({ title: "Planificación eliminada", description: "Se eliminaron también sus archivos." });
      await cargar();
    } catch (err) {
      sileo.error({ title: "No se pudo eliminar", description: err instanceof Error ? err.message : "" });
    }
  };

  // ── Modal de subida ──────────────────────────────────────────────────────

  const abrirModal = () => {
    setSeleccion([]);
    setModalAbierto(true);
  };

  /** Agrega archivos a la selección, sugiriendo para cada uno la siguiente categoría pendiente. */
  const agregarArchivos = (files: FileList | null) => {
    if (!files || !seleccionada) return;
    setSeleccion((actual) => {
      const usadas = new Set(actual.map((a) => a.categoria));
      const nuevos = Array.from(files).map((file) => {
        const sugerida = seleccionada.pendientes.find((c) => !usadas.has(c)) ?? "";
        if (sugerida) usadas.add(sugerida);
        return { id: siguienteId.current++, file, categoria: sugerida as Categoria | "" };
      });
      return [...actual, ...nuevos];
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const errorDe = (item: ArchivoSeleccionado): string | null => {
    if (!item.categoria) return "Elige la categoría de este archivo.";
    if (seleccion.filter((s) => s.categoria === item.categoria).length > 1) {
      return `Solo puede haber un archivo de ${etiqueta(item.categoria)}.`;
    }
    const meta = CATEGORIAS.find((c) => c.key === item.categoria)!;
    const ext = "." + (item.file.name.split(".").pop() ?? "").toLowerCase();
    if (!meta.extensiones.includes(ext)) return `Formato no válido para ${meta.label} (${meta.extensiones.join(", ")}).`;
    if (item.file.size > MAX_BYTES) return "El archivo supera el máximo de 20 MB.";
    return null;
  };

  const hayErrores = seleccion.some((s) => errorDe(s) !== null);
  // Categorías que seguirán pendientes después de esta subida
  const pendientesTrasSubir = seleccionada
    ? seleccionada.pendientes.filter((c) => !seleccion.some((s) => s.categoria === c))
    : [];

  const subir = async () => {
    if (!seleccionada || seleccion.length === 0 || hayErrores) return;
    setSubiendo(true);
    try {
      const form = new FormData();
      seleccion.forEach((s) => {
        form.append("archivos", s.file);
        form.append("categorias", s.categoria);
      });
      form.append("rutUsuario", rut);
      const actualizado = await pedir<PlanificacionItem>(`/api/planificaciones/${seleccionada.idPlanificacion}/archivos`, {
        method: "POST",
        body: form,
      });
      actualizar(actualizado);
      setModalAbierto(false);
      if (actualizado.completa) {
        sileo.success({ title: "Planificación completa", description: "Subiste los 5 archivos obligatorios." });
      } else {
        sileo.warning({
          title: "Archivos subidos",
          description: `Aún está pendiente de subir: ${actualizado.pendientes.map(etiqueta).join(", ")}.`,
        });
      }
    } catch (err) {
      sileo.error({ title: "No se pudieron subir los archivos", description: err instanceof Error ? err.message : "" });
    } finally {
      setSubiendo(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  const subidos = seleccionada ? 5 - seleccionada.pendientes.length : 0;

  return (
    <div className="max-w-6xl mx-auto py-2 space-y-6">
      {onBack && (
        <div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-sky-800 bg-sky-50 hover:bg-sky-100/80 border border-sky-200 transition-colors cursor-pointer"
          >
            <ArrowLeft className="size-3.5" />
            <span>Volver al Inicio</span>
          </button>
        </div>
      )}

      {/* Encabezado */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shadow-2xs shrink-0">
              <CalendarDays className="size-7" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Planificación</h1>
              <p className="text-slate-600 text-xs sm:text-sm mt-1">
                Cada planificación requiere 5 archivos: planificación, presentación, guía de actividades, rúbrica de
                evaluación y material didáctico.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={cargar}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              title="Actualizar datos"
            >
              <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Actualizar</span>
            </button>
            <button
              type="button"
              onClick={crearPlanificacion}
              disabled={creando || loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Plus className="size-3.5" />
              <span>Nueva planificación</span>
            </button>
          </div>
        </div>
      </div>

      {loading && planificaciones.length === 0 ? (
        <div className="py-16 flex flex-col items-center justify-center text-center">
          <RefreshCw className="size-7 text-sky-600 animate-spin mb-2" />
          <p className="text-sm text-slate-600">Cargando planificaciones...</p>
        </div>
      ) : planificaciones.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center">
          <CalendarDays className="size-10 text-slate-300 mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-800">Aún no tienes planificaciones</h2>
          <p className="text-sm text-slate-500 mt-1">Crea una planificación y sube sus 5 archivos obligatorios.</p>
        </div>
      ) : (
        <>
          {/* Selector de planificaciones */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {planificaciones.map((plan) => {
              const activa = plan.idPlanificacion === seleccionadaId;
              return (
                <button
                  key={plan.idPlanificacion}
                  type="button"
                  onClick={() => setSeleccionadaId(plan.idPlanificacion)}
                  className={`px-4 py-2.5 rounded-xl text-left border transition-all shrink-0 cursor-pointer ${
                    activa
                      ? "bg-sky-600 border-sky-600 text-white font-bold shadow-xs"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <p className="text-xs">Planificación #{numero(plan.idPlanificacion)}</p>
                  <p className={`text-[10px] ${activa ? "text-sky-100" : plan.completa ? "text-emerald-600" : "text-amber-600"}`}>
                    {plan.completa ? "Completa" : `${5 - plan.pendientes.length} de 5 archivos`}
                  </p>
                </button>
              );
            })}
          </div>

          {seleccionada && (
            <>
              {/* Resumen de la planificación seleccionada */}
              <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="size-4.5 text-sky-400" />
                    <h2 className="text-base sm:text-lg font-bold">Planificación #{numero(seleccionada.idPlanificacion)}</h2>
                    {seleccionada.completa ? (
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        COMPLETA
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        INCOMPLETA
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={abrirModal}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <Upload className="size-3.5" />
                      <span>Subir archivos</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteAction(() => () => eliminarPlanificacion(seleccionada))}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Eliminar planificación"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span>
                      {seleccionada.asignatura ? `${seleccionada.asignatura} • ` : ""}Creada el{" "}
                      {new Date(seleccionada.fechaCreacion).toLocaleDateString("es-CL")}
                    </span>
                    <span className="font-semibold text-white">{subidos} de 5 archivos</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full transition-all ${seleccionada.completa ? "bg-emerald-400" : "bg-sky-400"}`}
                      style={{ width: `${(subidos / 5) * 100}%` }}
                    />
                  </div>
                </div>

                {!seleccionada.completa && (
                  <p className="text-xs text-amber-200 flex items-start gap-1.5">
                    <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
                    <span>Pendiente de subir: {seleccionada.pendientes.map(etiqueta).join(", ")}.</span>
                  </p>
                )}
              </div>

              {/* Las 5 categorías */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {CATEGORIAS.map((cat) => {
                  const Icon = cat.icon;
                  const archivo = seleccionada.archivos.find((a) => a.categoria === cat.key);
                  const subido = !!archivo?.idDocumento;
                  return (
                    <div key={cat.key} className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`size-10 rounded-xl ${cat.colorBg} ${cat.colorText} flex items-center justify-center`}>
                            <Icon className="size-5" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-slate-900">{cat.label}</h3>
                            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{cat.descripcion}</p>
                          </div>
                        </div>
                        {subido ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                            <CheckCircle2 className="size-3" />
                            Subido
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                            <Clock className="size-3" />
                            Pendiente
                          </span>
                        )}
                      </div>

                      {subido && archivo ? (
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <Icon className={`size-4 ${cat.colorText} shrink-0`} />
                            <div className="overflow-hidden">
                              <p className="text-xs font-semibold text-slate-800 truncate max-w-[220px]" title={archivo.nombre ?? ""}>
                                {archivo.nombre}
                              </p>
                              <p className="text-[10px] text-slate-500">
                                {formatoTamanio(archivo.tamanioBytes)} •{" "}
                                {archivo.fechaCarga ? new Date(archivo.fechaCarga).toLocaleDateString("es-CL") : ""}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <a
                              href={archivo.urlDescarga ?? undefined}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                              title="Descargar archivo"
                            >
                              <Download className="size-3.5" />
                            </a>
                            <button
                              type="button"
                              onClick={() => setDeleteAction(() => () => eliminarArchivo(seleccionada, archivo))}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Eliminar archivo"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="py-3.5 border border-dashed border-amber-300 rounded-xl text-center bg-amber-50/40">
                          <p className="text-xs font-semibold text-amber-700">Pendiente de subir</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Formatos: {cat.extensiones.join(", ")}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      {/* Modal de subida: varios archivos, cada uno con su categoría */}
      <Dialog open={modalAbierto} onOpenChange={(open) => !subiendo && setModalAbierto(open)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Subir archivos de la planificación</DialogTitle>
            <DialogDescription>
              Selecciona tus archivos y elige la categoría de cada uno. Un archivo nuevo reemplaza al que ya exista en su
              categoría. Máximo 20 MB por archivo.
            </DialogDescription>
          </DialogHeader>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => agregarArchivos(e.target.files)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-slate-300 hover:border-sky-400 hover:bg-sky-50/30 rounded-xl p-5 text-center cursor-pointer transition-colors"
          >
            <Upload className="size-6 text-slate-400 mx-auto mb-1.5" />
            <p className="text-xs font-semibold text-slate-700">Haz clic para seleccionar archivos</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Puedes elegir varios a la vez</p>
          </button>

          {seleccion.length > 0 && (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {seleccion.map((item) => {
                const error = errorDe(item);
                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border ${error ? "border-rose-200 bg-rose-50/40" : "border-slate-200 bg-slate-50"}`}
                  >
                    <div className="flex items-center gap-2">
                      <Paperclip className="size-3.5 text-slate-400 shrink-0" />
                      <span className="text-xs font-semibold text-slate-800 truncate flex-1" title={item.file.name}>
                        {item.file.name}
                      </span>
                      <select
                        value={item.categoria}
                        onChange={(e) =>
                          setSeleccion((lista) =>
                            lista.map((s) => (s.id === item.id ? { ...s, categoria: e.target.value as Categoria } : s))
                          )
                        }
                        className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                        aria-label={`Categoría de ${item.file.name}`}
                      >
                        <option value="">Elegir categoría…</option>
                        {CATEGORIAS.map((c) => (
                          <option key={c.key} value={c.key}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setSeleccion((lista) => lista.filter((s) => s.id !== item.id))}
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-white cursor-pointer"
                        title="Quitar archivo"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                    {error && <p className="text-[11px] text-rose-600 mt-1.5 pl-5">{error}</p>}
                  </div>
                );
              })}
            </div>
          )}

          {seleccionada && (
            <p
              className={`text-xs flex items-start gap-1.5 ${pendientesTrasSubir.length ? "text-amber-700" : "text-emerald-700"}`}
            >
              {pendientesTrasSubir.length ? (
                <>
                  <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
                  <span>Quedará pendiente de subir: {pendientesTrasSubir.map(etiqueta).join(", ")}.</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-3.5 shrink-0 mt-0.5" />
                  <span>Con estos archivos la planificación queda completa.</span>
                </>
              )}
            </p>
          )}

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setModalAbierto(false)} disabled={subiendo} className="text-xs">
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={subir}
              disabled={seleccion.length === 0 || hayErrores || subiendo}
              className="text-xs gap-1.5 bg-sky-700 hover:bg-sky-800 text-white"
            >
              {subiendo ? <RefreshCw className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
              {subiendo ? "Subiendo..." : `Subir ${seleccion.length || ""} ${seleccion.length === 1 ? "archivo" : "archivos"}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={!!deleteAction}
        onOpenChange={(open) => !open && setDeleteAction(null)}
        onConfirm={async () => deleteAction?.()}
      />
    </div>
  );
}
