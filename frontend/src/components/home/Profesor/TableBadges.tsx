import type { EstudianteEvidenciaRow } from "./types";

export function EstadoEntregaBadge({ estado }: { estado: EstudianteEvidenciaRow["estadoEntrega"] }) {
  if (estado === "ENTREGADO") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
        <span className="size-1.5 rounded-full bg-emerald-500" />
        Entregado
      </span>
    );
  }
  if (estado === "PENDIENTE") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/80 shadow-2xs">
        <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
        Pendiente
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 shadow-2xs">
      <span className="size-1.5 rounded-full bg-slate-400" />
      No entregado
    </span>
  );
}

export function EstadoRevisionBadge({
  estado,
  calificacion,
}: {
  estado: EstudianteEvidenciaRow["estadoRevision"];
  calificacion?: number | null;
}) {
  if (estado === "REVISADO") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-200/80 shadow-2xs">
        <span className="size-1.5 rounded-full bg-sky-600" />
        Revisado {calificacion ? `(${calificacion.toFixed(1)})` : ""}
      </span>
    );
  }
  if (estado === "PENDIENTE_REVISION") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-800 border border-orange-200/80 shadow-2xs">
        <span className="size-1.5 rounded-full bg-orange-500" />
        Por revisar
      </span>
    );
  }
  if (estado === "OBSERVADO") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-800 border border-rose-200/80 shadow-2xs">
        <span className="size-1.5 rounded-full bg-rose-500" />
        Con observaciones
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-50 text-slate-400 border border-slate-200/70">
      <span className="size-1.5 rounded-full bg-slate-300" />
      Sin entrega
    </span>
  );
}
