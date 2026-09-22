import type { UserSession } from "@/types/auth";
import type { DatosPracticaEstudiante, PracticaMenuKey } from "../types";
import {
  FileText,
  Clock,
  ArrowRight,
  AlertCircle,
  Building2,
  Upload,
  Calendar,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

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

  const curIndex = datos.etapas.findIndex((e) => e.estado === "cur");
  const progressValue = curIndex >= 0 ? (curIndex + 1) * 25 : 75;

  return (
    <div className="space-y-6">
      {/* 1. Hero Card: Estado de la Práctica y Ruta de Etapas */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-200/60 mb-2.5">
              <span className="size-2 rounded-full bg-sky-600 animate-pulse" />
              <span>Proceso de {datos.asignaturaNombre} ({datos.semestre}.º Semestre)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Hola, {user.nombre}. Vas en la etapa de seguimiento.
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

        {/* Stepper / Ruta de Etapas de la Práctica como Línea de Tiempo */}
        <div className="pt-6">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-5">
            Ruta de la Práctica Profesional
          </h2>

          <div className="overflow-x-auto pb-4 -mx-2 px-2 sm:overflow-x-visible">
            <div className="min-w-[560px] sm:min-w-0 relative">
              {/* Barra de progreso visual usando Progress de shadcn */}
              <div className="absolute top-[7px] left-0 right-0 z-0">
                <Progress
                  value={progressValue}
                  className="w-full gap-0 [&_[data-slot=progress-track]]:h-[3px] [&_[data-slot=progress-track]]:rounded-none [&_[data-slot=progress-track]]:bg-slate-200 [&_[data-slot=progress-indicator]]:bg-sky-600 [&_[data-slot=progress-indicator]]:rounded-none"
                />
              </div>

              {/* Hitos / Nodos de la línea de tiempo */}
              <div className="grid grid-cols-4 gap-0 relative z-10">
                {datos.etapas.map((etapa) => {
                  const isDone = etapa.estado === "done";
                  const isCur = etapa.estado === "cur";

                  return (
                    <div key={etapa.id} className="relative pt-6 text-left pr-2">
                      {/* Punto visual del hito */}
                      <div
                        className={`absolute top-0 left-0 size-[17px] rounded-full transition-all ${
                          isDone
                            ? "bg-sky-600 border-[3px] border-sky-600"
                            : isCur
                            ? "bg-white border-[3px] border-sky-600 shadow-[0_0_0_4px_rgba(2,132,199,0.25)]"
                            : "bg-white border-[3px] border-slate-300"
                        }`}
                        aria-hidden="true"
                      />

                      {/* Título y subtítulo con negros de alto contraste */}
                      <b className="block text-xs sm:text-sm font-extrabold text-slate-950 leading-snug">
                        {etapa.titulo}
                      </b>
                      <span
                        className={`block text-[11.5px] sm:text-xs leading-tight mt-0.5 ${
                          isCur
                            ? "font-bold text-slate-900"
                            : "font-semibold text-slate-700"
                        }`}
                      >
                        {etapa.subtitulo}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
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

      {/* 4. Actividad Reciente */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 mb-4">
          Actividad Reciente
        </h2>
        <div className="divide-y divide-slate-100">
          {datos.actividades.map((act) => (
            <div key={act.id} className="py-3 flex items-start gap-3">
              <div className="size-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 mt-0.5">
                {act.tipo === "up" ? (
                  <Upload className="size-4" />
                ) : (
                  <FileText className="size-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800">
                  {act.descripcion}
                </p>
                <span className="text-xs text-slate-400 mt-0.5 block">
                  {act.tiempo}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
