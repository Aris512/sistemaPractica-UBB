import { Switch } from "@/components/ui/switch";
import { SemestreSelector } from "./SemestreSelector";
import { categoriaMeta } from "./meta";
import type { PermisoItem } from "./types";

interface PermisoCardGroupProps {
  categoria: string;
  permisos: PermisoItem[];
  /** Solo el rol estudiante limita permisos por semestre */
  isEstudiante: boolean;
  /** Permisos modificados y aún no guardados */
  cambios: Set<number>;
  disabled?: boolean;
  onTogglePermiso: (idPermiso: number, activo: boolean) => void;
  onUpdateSemestres: (idPermiso: number, semestres: string) => void;
  onSetGrupo: (activo: boolean, ids: number[]) => void;
}

/** Un módulo de la plataforma con sus funciones: cada una se activa o desactiva con un interruptor. */
export function PermisoCardGroup({
  categoria,
  permisos,
  isEstudiante,
  cambios,
  disabled = false,
  onTogglePermiso,
  onUpdateSemestres,
  onSetGrupo,
}: PermisoCardGroupProps) {
  if (permisos.length === 0) return null;

  const { titulo, icono: Icono } = categoriaMeta(categoria);
  const activos = permisos.filter((p) => p.activo).length;
  const todosActivos = activos === permisos.length;
  const ids = permisos.map((p) => p.idPermiso);

  return (
    <section className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
      <header className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b border-slate-100 bg-slate-50/60">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="size-8 rounded-lg bg-white border border-slate-200 text-slate-600 flex items-center justify-center shrink-0">
            <Icono className="size-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-900 truncate">{titulo}</h3>
            <p className="text-[11px] text-slate-500">
              {activos} de {permisos.length} habilitada{permisos.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        {permisos.length > 1 && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onSetGrupo(!todosActivos, ids)}
            className="text-[11px] font-medium text-slate-500 hover:text-slate-900 px-2 py-1 rounded-md hover:bg-slate-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {todosActivos ? "Desactivar todas" : "Activar todas"}
          </button>
        )}
      </header>

      <ul className="divide-y divide-slate-100">
        {permisos.map((permiso) => {
          const modificado = cambios.has(permiso.idPermiso);
          const idSwitch = `permiso-${permiso.idPermiso}`;
          return (
            <li
              key={permiso.idPermiso}
              className={`px-4 sm:px-5 py-3.5 transition-colors ${modificado ? "bg-amber-50/60" : ""}`}
            >
              <div className="flex items-start gap-4">
                <label htmlFor={idSwitch} className="flex-1 min-w-0 cursor-pointer select-none">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-sm font-medium ${permiso.activo ? "text-slate-900" : "text-slate-500"}`}
                    >
                      {permiso.nombre}
                    </span>
                    {modificado && (
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-700 bg-amber-100 rounded px-1.5 py-0.5">
                        Sin guardar
                      </span>
                    )}
                  </div>
                  {permiso.descripcion && (
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{permiso.descripcion}</p>
                  )}
                </label>
                <div className="pt-0.5 flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[11px] font-medium w-14 text-right hidden sm:inline ${
                      permiso.activo ? "text-emerald-700" : "text-slate-400"
                    }`}
                  >
                    {permiso.activo ? "Permitido" : "Bloqueado"}
                  </span>
                  <Switch
                    id={idSwitch}
                    checked={permiso.activo}
                    disabled={disabled}
                    onCheckedChange={(valor) => onTogglePermiso(permiso.idPermiso, valor)}
                    className="cursor-pointer data-checked:bg-emerald-600"
                    aria-label={`${permiso.activo ? "Bloquear" : "Permitir"} ${permiso.nombre}`}
                  />
                </div>
              </div>

              {isEstudiante && permiso.activo && (
                <SemestreSelector
                  value={permiso.semestresPermitidos || "ALL"}
                  onChange={(valor) => onUpdateSemestres(permiso.idPermiso, valor)}
                />
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
