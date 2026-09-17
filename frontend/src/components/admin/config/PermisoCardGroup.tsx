import { Check } from "lucide-react";
import { SemestreSelector } from "./SemestreSelector";
import type { PermisoItem } from "./types";

interface PermisoCardGroupProps {
  categoria: string;
  permisos: PermisoItem[];
  isEstudiante: boolean;
  onTogglePermiso: (idPermiso: number, activo: boolean) => void;
  onUpdateSemestres: (idPermiso: number, semestres: string) => void;
}

export function PermisoCardGroup({
  categoria,
  permisos,
  isEstudiante,
  onTogglePermiso,
  onUpdateSemestres,
}: PermisoCardGroupProps) {
  const getCategoryTitle = (cat: string) => {
    switch (cat.toUpperCase()) {
      case "PORTAFOLIO":
        return "Portafolio";
      case "EVALUACIONES":
        return "Evaluaciones";
      case "OBSERVACIONES":
        return "Observaciones";
      case "ESTUDIANTES":
        return "Información de Estudiantes";
      case "INTELIGENCIA ARTIFICIAL":
      case "IA":
        return "Inteligencia Artificial";
      default:
        return cat;
    }
  };

  return (
    <div className="space-y-2">
      {/* Título limpio de la funcionalidad / módulo */}
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-200/80">
        {getCategoryTitle(categoria)}
      </h3>

      {/* Checklist de funcionalidades */}
      <div className="space-y-0.5">
        {permisos.map((permiso) => (
          <div key={permiso.idPermiso} className="py-0.5">
            <label className="flex items-center gap-3 py-1.5 px-2 -mx-2 rounded-md hover:bg-slate-100/70 transition-colors cursor-pointer select-none group">
              <div
                className={`size-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                  permiso.activo
                    ? "bg-slate-900 border-slate-900 text-white"
                    : "border-slate-300 bg-white group-hover:border-slate-400"
                }`}
              >
                {permiso.activo && <Check className="size-3 stroke-[3]" />}
              </div>
              <input
                type="checkbox"
                checked={permiso.activo}
                onChange={(e) =>
                  onTogglePermiso(permiso.idPermiso, e.target.checked)
                }
                className="sr-only"
              />
              <span
                className={`text-sm ${
                  permiso.activo
                    ? "text-slate-900 font-medium"
                    : "text-slate-600"
                }`}
              >
                {permiso.nombre}
              </span>
            </label>

            {/* Selector minimalista de semestres para estudiantes */}
            {isEstudiante && permiso.activo && (
              <SemestreSelector
                value={permiso.semestresPermitidos || "ALL"}
                onChange={(newSemestres) =>
                  onUpdateSemestres(permiso.idPermiso, newSemestres)
                }
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
