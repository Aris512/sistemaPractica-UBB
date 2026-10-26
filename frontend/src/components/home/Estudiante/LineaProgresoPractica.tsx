import { Building2, UserCheck, Clock, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { EstadoPractica } from "@/types/historialEstudiante";

interface LineaProgresoPracticaProps {
  estadoPractica: EstadoPractica | null;
  loading?: boolean;
}

const ETAPAS = [
  { id: "INSCRIPCION", titulo: "1. Inscripción", desc: "Asignación formal" },
  { id: "INICIO", titulo: "2. Inicio e Inducción", desc: "Presentación en centro" },
  { id: "SEGUIMIENTO", titulo: "3. Seguimiento", desc: "Clases y bitácoras" },
  { id: "EVALUACION_FINAL", titulo: "4. Evaluación Final", desc: "Cierre y nota" },
];

export function LineaProgresoPractica({ estadoPractica, loading }: LineaProgresoPracticaProps) {
  // Guarda condicional: Si el estudiante es regular (sin práctica), NO se renderiza la línea de tiempo
  if (loading || !estadoPractica || !estadoPractica.esPractica) {
    return null;
  }

  const etapaIndex = estadoPractica.etapaIndex >= 0 ? estadoPractica.etapaIndex : 2;
  const progresoPorcentaje = estadoPractica.progresoPorcentaje || (etapaIndex + 1) * 25;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="p-6 sm:p-8 space-y-6">
        {/* Cabecera de la sección */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-200/80 mb-2">
              <span className="size-1.5 rounded-full bg-sky-600 animate-pulse" />
              <span>{estadoPractica.asignaturaNombre || "Práctica Profesional"}</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Línea de Formación Práctica y Etapa Actual
            </h2>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Avance del Proceso
            </span>
            <span className="text-sm font-extrabold text-sky-700">
              {progresoPorcentaje}% completado
            </span>
          </div>
        </div>

        {/* Stepper / Línea de progreso de 4 etapas */}
        <div className="pt-2">
          <div className="relative">
            {/* Barra de progreso de fondo */}
            <div className="absolute top-[13px] left-6 right-6 z-0">
              <Progress
                value={progresoPorcentaje}
                className="w-full h-1 bg-slate-100 [&_[data-slot=progress-indicator]]:bg-sky-600"
              />
            </div>

            {/* Hitos */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 relative z-10">
              {ETAPAS.map((etapa, idx) => {
                const isPast = idx < etapaIndex;
                const isCurrent = idx === etapaIndex;

                return (
                  <div key={etapa.id} className="flex flex-col items-start sm:items-center sm:text-center">
                    <div
                      className={`size-7 rounded-full flex items-center justify-center transition-all ${
                        isPast
                          ? "bg-sky-600 text-white shadow-2xs"
                          : isCurrent
                          ? "bg-white text-sky-700 border-2 border-sky-600 shadow-sm ring-4 ring-sky-100"
                          : "bg-white text-slate-400 border-2 border-slate-200"
                      }`}
                    >
                      {isPast ? (
                        <CheckCircle2 className="size-4 stroke-[2.5]" />
                      ) : (
                        <span className="text-xs font-black">{idx + 1}</span>
                      )}
                    </div>

                    <div className="mt-2.5">
                      <span
                        className={`block text-xs font-bold ${
                          isCurrent
                            ? "text-sky-900"
                            : isPast
                            ? "text-slate-800"
                            : "text-slate-400"
                        }`}
                      >
                        {etapa.titulo}
                      </span>
                      <span className="block text-[11px] text-slate-500 mt-0.5">
                        {isCurrent ? "En curso" : isPast ? "Completada" : etapa.desc}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Ficha de datos de la práctica en curso */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
          <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-100 flex items-start gap-2.5">
            <Building2 className="size-4 text-sky-700 shrink-0 mt-0.5" />
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Centro de Práctica
              </span>
              <span className="text-xs font-semibold text-slate-800">
                {estadoPractica.centroPractica || "Colegio de Aplicación UBB"}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-100 flex items-start gap-2.5">
            <UserCheck className="size-4 text-sky-700 shrink-0 mt-0.5" />
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Tutor / Supervisión
              </span>
              <span className="text-xs font-semibold text-slate-800">
                {estadoPractica.tutorNombre || estadoPractica.profesorNombre || "Comisión de Práctica"}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-100 flex items-start gap-2.5">
            <Clock className="size-4 text-sky-700 shrink-0 mt-0.5" />
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Horas Cronológicas
              </span>
              <span className="text-xs font-semibold text-slate-800">
                {estadoPractica.horasRealizadas || 128} de {estadoPractica.horasTotales || 250} hrs
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
