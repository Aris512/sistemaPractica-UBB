import type { UserSession } from "@/types/auth";
import type { DatosPracticaEstudiante } from "../types";
import {
  ClipboardCheck,
  MessageSquareText,
  Clock,
  Calendar,
} from "lucide-react";

interface PracticaEvaluacionesViewProps {
  user: UserSession;
  datos: DatosPracticaEstudiante;
}

export function PracticaEvaluacionesView({
  datos,
}: PracticaEvaluacionesViewProps) {
  const getInitials = (nombre: string) => {
    return nombre
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0].toUpperCase())
      .join("");
  };

  return (
    <div className="space-y-6">
      {/* Cabecera Principal */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <ClipboardCheck className="size-6 text-sky-600" />
              <span>Evaluaciones y Observaciones Docentes</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Calificaciones oficiales, pautas de evaluación y observaciones pedagógicas registradas.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-200/80">
            <span className="size-2 rounded-full bg-emerald-500" />
            <span>Acceso formativo de solo lectura</span>
          </div>
        </div>
      </div>

      {/* Lista de Evaluaciones Formativas y Sumativas */}
      <div className="space-y-4">
        {datos.evaluaciones.map((ev) => (
          <article
            key={ev.id}
            className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4"
          >
            {/* Cabecera de la Evaluación */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                  {ev.titulo}
                </h2>
                <p className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                  <span>Evaluado por: <strong>{ev.evaluador}</strong></span>
                  <span className="text-slate-300">•</span>
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="size-3 text-slate-400" />
                    {ev.fecha}
                  </span>
                </p>
              </div>

              <div>
                {ev.nota ? (
                  <div className="flex items-center gap-2">
                    <div className="text-right hidden sm:block">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Nota Obtenida
                      </span>
                      <span className="text-xs font-semibold text-emerald-700">
                        Aprobada
                      </span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-sky-800 bg-sky-50 px-4 py-1.5 rounded-xl border border-sky-100 tracking-tight">
                      {ev.nota}
                    </div>
                  </div>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/80">
                    <Clock className="size-3 text-amber-600" />
                    Pendiente de evaluación
                  </span>
                )}
              </div>
            </div>

            {/* Hilo de Observaciones asociadas */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Observaciones y Retroalimentación
              </h3>

              {ev.observaciones.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2">
                  Aún no se han registrado observaciones específicas para este hito evaluativo.
                </p>
              ) : (
                ev.observaciones.map((obs) => (
                  <div
                    key={obs.id}
                    className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/70"
                  >
                    <div className="size-8 rounded-full bg-sky-100 text-sky-800 font-bold text-xs flex items-center justify-center shrink-0 border border-sky-200/70">
                      {getInitials(obs.autor)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <strong className="text-xs font-bold text-slate-900">
                          {obs.autor}
                        </strong>
                        <span className="text-[11px] text-slate-400">
                          {obs.rol} · {obs.fecha}
                        </span>
                        {obs.editada && (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60">
                            Editada
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                        {obs.texto}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>
        ))}
      </div>

      {/* Observaciones Generales de Terreno y Visitas */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <MessageSquareText className="size-5 text-indigo-600" />
            <span>Observaciones de Visitas en Centro Educativo</span>
          </h2>
          <p className="text-xs text-slate-500">
            Registros de supervisión directa y notas de campo del tutor de práctica y profesor colaborador
          </p>
        </div>

        <div className="divide-y divide-slate-100">
          {datos.observacionesGenerales.map((obs) => (
            <div key={obs.id} className="py-4 flex items-start gap-3.5">
              <div className="size-9 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 border border-indigo-100">
                {getInitials(obs.autor)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <h3 className="text-xs font-bold text-slate-900">
                    {obs.autor}
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    {obs.rol} · {obs.fecha}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  {obs.texto}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
