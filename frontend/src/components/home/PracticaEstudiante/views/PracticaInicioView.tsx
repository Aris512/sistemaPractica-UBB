import type { UserSession } from "@/types/auth";
import type { DatosPracticaEstudiante, PracticaMenuKey } from "../types";
import {
  Clock,
  ArrowRight,
  AlertCircle,
  Building2,
  Calendar,
} from "lucide-react";

interface PracticaInicioViewProps {
  user: UserSession;
  datos: DatosPracticaEstudiante;
  onNavigate: (menu: PracticaMenuKey) => void;
}

export function PracticaInicioView({
  user,
  datos,
  onNavigate,
}: PracticaInicioViewProps) {

  return (
    <div className="space-y-6">
      {/* 1. Hero Card: Estado de la Práctica */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-200/60 mb-2.5">
              <span className="size-2 rounded-full bg-sky-600 animate-pulse" />
              <span>Proceso de {datos.asignaturaNombre} ({datos.semestre}.º Semestre)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Hola, {user.nombre}.
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1.5 flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-800">{datos.asignaturaNombre} ({datos.codigoAsignatura})</span>
              <span className="text-slate-300">•</span>
              <span className="inline-flex items-center gap-1">
                <Building2 className="size-3.5 text-slate-400" />
                {datos.centroPractica}
              </span>
              <span className="text-slate-300">•</span>
              <span className="inline-flex items-center gap-1">
                <Calendar className="size-3.5 text-slate-400" />
                {datos.periodo}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* 3. Sección: Pendientes para ti (Ancho completo) */}
      <div className="w-full bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertCircle className="size-4.5 text-amber-500" />
              <span>Pendientes para ti</span>
            </h2>
            <p className="text-xs text-slate-500">
              Tareas y entregas prioritarias para tu avance en práctica
            </p>
          </div>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/70">
            {datos.pendientes.length} pendientes
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {datos.pendientes.map((p) => (
            <div key={p.id} className="py-3.5 px-2 -mx-2 rounded-xl flex items-center justify-between gap-3 group hover:bg-slate-50/70 transition-colors">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800 group-hover:text-sky-700 transition-colors">
                  {p.titulo}
                </p>
                {p.fechaLimite && (
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <Clock className="size-3 text-slate-400" />
                    <span>{p.fechaLimite}</span>
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => onNavigate(p.menuDestino)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200/60 transition-colors cursor-pointer shrink-0"
              >
                <span>Abrir</span>
                <ArrowRight className="size-3" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
