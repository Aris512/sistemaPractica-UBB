import { CheckCircle2, Clock, AlertTriangle, FileText, Eye } from "lucide-react";

interface ObservacionBadgeProps {
  estado: "SIN_OBSERVACION" | "OBSERVADO" | "VISITA_PENDIENTE" | string;
}

export function ObservacionBadge({ estado }: ObservacionBadgeProps) {
  switch (estado) {
    case "OBSERVADO":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <AlertTriangle className="size-3.5 text-amber-600" />
          Con Observaciones
        </span>
      );
    case "VISITA_PENDIENTE":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
          <Eye className="size-3.5 text-sky-600" />
          Visita Pendiente
        </span>
      );
    case "SIN_OBSERVACION":
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
          <FileText className="size-3.5 text-slate-400" />
          Sin Observaciones
        </span>
      );
  }
}

interface EvaluacionBadgeProps {
  estado: "PENDIENTE" | "EN_EVALUACION" | "EVALUADO" | string;
  calificacion?: number | null;
}

export function EvaluacionBadge({ estado, calificacion }: EvaluacionBadgeProps) {
  switch (estado) {
    case "EVALUADO":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="size-3.5 text-emerald-600" />
          Evaluado {calificacion ? `(${calificacion.toFixed(1)})` : ""}
        </span>
      );
    case "EN_EVALUACION":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
          <Clock className="size-3.5 text-indigo-600" />
          En Evaluación
        </span>
      );
    case "PENDIENTE":
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
          <Clock className="size-3.5 text-slate-400" />
          Pendiente
        </span>
      );
  }
}
