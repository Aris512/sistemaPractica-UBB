import type { AsignaturaMalla } from "./types";
import { AREAS_TEMATICAS } from "./types";

interface AsignaturaCardProps {
  asignatura: AsignaturaMalla;
  isCursandoActualmente?: boolean;
  onSelect?: (asignatura: AsignaturaMalla) => void;
  isDimmed?: boolean;
}

export function AsignaturaCard({
  asignatura,
  isCursandoActualmente = false,
  onSelect,
  isDimmed = false,
}: AsignaturaCardProps) {
  const area = AREAS_TEMATICAS[asignatura.area];

  return (
    <div
      onClick={() => onSelect?.(asignatura)}
      className={`group relative rounded-md border px-2 py-1.5 transition-all duration-150 select-none text-left flex items-center gap-2 min-h-[34px] ${
        isCursandoActualmente
          ? "bg-sky-100/90 border-sky-500 text-sky-950 ring-2 ring-sky-500 font-bold shadow-xs scale-[1.01] z-10"
          : "bg-white hover:bg-slate-50 border-slate-200 text-slate-800 hover:border-slate-300 font-medium"
      } ${isDimmed ? "opacity-35 grayscale-[50%]" : "opacity-100"}`}
      title={`${asignatura.nombre} (${area?.nombre || asignatura.area})`}
    >
      {/* Punto de color */}
      <span
        className={`size-2 rounded-full shrink-0 ${area?.dotColor || "bg-slate-400"} ${
          isCursandoActualmente ? "ring-2 ring-sky-300 animate-pulse" : ""
        }`}
      />

      {/* Nombre de la asignatura */}
      <span
        className={`text-[11px] leading-tight line-clamp-2 flex-1 ${
          isCursandoActualmente ? "text-sky-950 font-bold" : "text-slate-800"
        }`}
      >
        {asignatura.nombre}
      </span>
    </div>
  );
}
