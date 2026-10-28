import { useState } from "react";
import {
  CheckCircle2,
  Clock,
  ClipboardList,
  User,
  Calendar,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { HistorialItem } from "@/types/historialEstudiante";

interface HistorialActividadesProps {
  items: HistorialItem[];
  loading?: boolean;
}

export function HistorialActividades({ items, loading }: HistorialActividadesProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<"TODAS" | "ACTIVIDAD" | "EVALUACION">("TODAS");

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center shadow-xs">
        <div className="inline-block size-6 border-2 border-sky-600 border-t-transparent rounded-full animate-spin mb-2" />
        <p className="text-xs text-slate-500 font-medium">Cargando historial de actividades y evaluaciones...</p>
      </div>
    );
  }

  const itemsFiltrados = items.filter((it) => {
    if (filtroTipo === "TODAS") return true;
    return it.tipo === filtroTipo;
  });

  const totalCompletados = items.filter((it) => it.completado).length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="p-6 sm:p-8 space-y-6">
        {/* Cabecera del historial */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <ClipboardList className="size-5 text-sky-700" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Historial de Actividades y Evaluaciones
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Registro cronológico de entregas revisadas, evaluaciones formales y observaciones docentes.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="size-3.5 text-emerald-600" />
              <span>{totalCompletados} completadas</span>
            </span>
          </div>
        </div>

        {/* Filtros rápidos */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
            Filtrar:
          </span>
          <button
            type="button"
            onClick={() => setFiltroTipo("TODAS")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              filtroTipo === "TODAS"
                ? "bg-sky-50 text-sky-900 border border-sky-300"
                : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            Todas ({items.length})
          </button>
          <button
            type="button"
            onClick={() => setFiltroTipo("ACTIVIDAD")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              filtroTipo === "ACTIVIDAD"
                ? "bg-sky-50 text-sky-900 border border-sky-300"
                : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            Actividades ({items.filter((i) => i.tipo === "ACTIVIDAD").length})
          </button>
          <button
            type="button"
            onClick={() => setFiltroTipo("EVALUACION")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              filtroTipo === "EVALUACION"
                ? "bg-sky-50 text-sky-900 border border-sky-300"
                : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            Evaluaciones ({items.filter((i) => i.tipo === "EVALUACION").length})
          </button>
        </div>

        {/* Lista de comprobación con checks */}
        {itemsFiltrados.length === 0 ? (
          <div className="py-12 text-center rounded-lg border border-dashed border-slate-200 bg-slate-50/50">
            <ClipboardList className="size-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs sm:text-sm font-semibold text-slate-600">
              No hay actividades o evaluaciones registradas aún.
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              A medida que se califiquen tareas o se publiquen evaluaciones, aparecerán con su marca de verificación aquí.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {itemsFiltrados.map((it) => {
              const isExpanded = expandedId === it.id;
              const hasObservation = it.observacion && it.observacion.trim().length > 0;

              return (
                <div
                  key={`${it.tipo}-${it.id}`}
                  className="rounded-lg border border-slate-200/90 bg-white p-4 hover:border-slate-300 transition-colors shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Check e información principal */}
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0">
                        {it.completado ? (
                          <div className="size-6 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                            <CheckCircle2 className="size-4 stroke-[2.5]" />
                          </div>
                        ) : (
                          <div className="size-6 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                            <Clock className="size-3.5 stroke-[2]" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                            {it.titulo}
                          </h3>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                              it.tipo === "EVALUACION"
                                ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                : "bg-sky-50 text-sky-700 border border-sky-200"
                            }`}
                          >
                            {it.tipo}
                          </span>
                        </div>

                        {/* Metadatos */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="size-3 text-slate-400" />
                            {it.fechaFormateada}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <User className="size-3 text-slate-400" />
                            {it.evaluadorNombre || "Profesor de Asignatura"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Calificación y botón expandir */}
                    <div className="flex items-center gap-3 shrink-0">
                      {it.calificacion != null ? (
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                            Nota
                          </span>
                          <span className="text-xs sm:text-sm font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-mono">
                            {Number(it.calificacion).toFixed(1)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {it.estado}
                        </span>
                      )}

                      {hasObservation && (
                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : it.id)}
                          className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-50 cursor-pointer"
                          aria-label="Ver observación"
                          title="Ver observación"
                        >
                          {isExpanded ? (
                            <ChevronUp className="size-4" />
                          ) : (
                            <ChevronDown className="size-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Observación desplegable */}
                  {hasObservation && isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-xs text-slate-700">
                        <span className="font-bold text-slate-900 block mb-1">
                          Observación / Retroalimentación:
                        </span>
                        <p className="leading-relaxed whitespace-pre-line">{it.observacion}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
