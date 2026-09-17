import { useMemo } from "react";
import {
  ShieldCheck,
  Save,
  RotateCcw,
  RefreshCw,
  Loader2,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePermisosAdmin } from "./usePermisosAdmin";
import { PermisoCardGroup } from "./PermisoCardGroup";
import type { PermisoItem } from "./types";

const CATEGORIAS_ORDEN = [
  "PORTAFOLIO",
  "EVALUACIONES",
  "OBSERVACIONES",
  "ESTUDIANTES",
  "INTELIGENCIA ARTIFICIAL",
];

export function PermisosConfigView() {
  const {
    roles,
    selectedRoleId,
    selectedRole,
    isEstudiante,
    permisos,
    loadingRoles,
    loadingPermisos,
    saving,
    error,
    hasUnsavedChanges,
    setSelectedRoleId,
    togglePermiso,
    updateSemestres,
    savePermisos,
    resetChanges,
    reload,
  } = usePermisosAdmin();

  // Agrupar permisos por categoría respetando el orden lógico
  const gruposCategorias = useMemo(() => {
    const mapa = new Map<string, PermisoItem[]>();

    permisos.forEach((p) => {
      const cat = p.categoria ? p.categoria.toUpperCase() : "GENERAL";
      if (!mapa.has(cat)) {
        mapa.set(cat, []);
      }
      mapa.get(cat)!.push(p);
    });

    const ordenados: { categoria: string; items: PermisoItem[] }[] = [];

    // Primero las categorías conocidas en orden
    CATEGORIAS_ORDEN.forEach((cat) => {
      if (mapa.has(cat)) {
        ordenados.push({ categoria: cat, items: mapa.get(cat)! });
        mapa.delete(cat);
      }
    });

    // Luego cualquier otra categoría adicional futura
    mapa.forEach((items, categoria) => {
      ordenados.push({ categoria, items });
    });

    return ordenados;
  }, [permisos]);

  const getRolFriendlyName = (nombre?: string) => {
    switch (nombre?.toUpperCase()) {
      case "ESTUDIANTE":
        return "Estudiante";
      case "PROFESOR_ASIGNATURA":
        return "Profesor de Asignatura";
      case "PROFESOR_COLABORADOR":
        return "Profesor Colaborador";
      case "TUTOR_PRACTICA":
        return "Tutor de Práctica";
      case "COORDINADOR":
        return "Coordinador de Práctica";
      default:
        return nombre || "Rol";
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6 w-full pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-sky-100 dark:bg-sky-950 flex items-center justify-center text-sky-700 dark:text-sky-400">
              <ShieldCheck className="size-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Administración de Permisos por Rol
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl leading-relaxed">
            Configura qué funcionalidades y módulos están disponibles para cada rol del sistema.
            El frontend adaptará su navegación y visibilidad según los permisos activos.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:self-auto self-start">
          <Button
            variant="outline"
            size="sm"
            onClick={reload}
            disabled={loadingPermisos || saving}
            className="gap-1.5 cursor-pointer text-slate-700"
          >
            <RefreshCw className={`size-3.5 ${loadingPermisos ? "animate-spin" : ""}`} />
            <span>Recargar</span>
          </Button>

          <Button
            onClick={savePermisos}
            disabled={!hasUnsavedChanges || saving || loadingPermisos}
            className={`gap-1.5 cursor-pointer shadow-xs ${
              hasUnsavedChanges
                ? "bg-sky-600 hover:bg-sky-700 text-white"
                : "bg-slate-900 text-white"
            }`}
          >
            {saving ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Save className="size-3.5" />
            )}
            <span>{saving ? "Guardando..." : "Guardar cambios"}</span>
          </Button>
        </div>
      </div>

      {/* Error banner si existe */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 flex items-center gap-3 text-sm text-rose-800">
          <AlertCircle className="size-5 text-rose-500 shrink-0" />
          <span>{error}</span>
          <Button
            variant="ghost"
            size="xs"
            onClick={reload}
            className="ml-auto text-rose-600 hover:text-rose-700 hover:bg-rose-100 cursor-pointer"
          >
            Reintentar
          </Button>
        </div>
      )}

      {/* Selector de Rol */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Paso 1: Selecciona un rol para configurar
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <UserCheck className="size-4 text-sky-600" />
              <span className="font-semibold text-slate-900 text-sm">
                Rol actual seleccionado:
              </span>
              <span className="text-sm font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
                {getRolFriendlyName(selectedRole?.nombre)}
              </span>
            </div>
          </div>

          {hasUnsavedChanges && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full animate-pulse">
              Cambios pendientes sin guardar
            </span>
          )}
        </div>

        {/* Botones de selección de Rol */}
        {loadingRoles ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
            <Loader2 className="size-4 animate-spin text-slate-400" />
            <span>Cargando roles del sistema...</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {roles.map((r) => {
              const isSelected = r.idRol === selectedRoleId;
              return (
                <button
                  key={r.idRol}
                  type="button"
                  onClick={() => {
                    if (hasUnsavedChanges) {
                      const confirmChange = window.confirm(
                        "Tienes cambios sin guardar para este rol. ¿Deseas descartarlos y cambiar de rol?"
                      );
                      if (!confirmChange) return;
                    }
                    setSelectedRoleId(r.idRol);
                  }}
                  className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? "bg-sky-50/80 border-sky-500 shadow-xs ring-1 ring-sky-500"
                      : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60"
                  }`}
                >
                  <span
                    className={`text-xs font-bold ${
                      isSelected ? "text-sky-900" : "text-slate-800"
                    }`}
                  >
                    {getRolFriendlyName(r.nombre)}
                  </span>
                  <span className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                    {r.nombre}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Alerta especial cuando es rol ESTUDIANTE */}
        {isEstudiante && (
          <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-3.5 flex items-start gap-3 text-xs text-sky-900">
            <Sparkles className="size-4 text-sky-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold block">
                Condición especial para estudiantes:
              </span>
              <p className="text-sky-800 leading-relaxed">
                Para el rol <strong>ESTUDIANTE</strong>, puedes definir si una funcionalidad aplica a todos los semestres o si requiere que el estudiante esté cursando un semestre determinado (por ejemplo, permitir herramientas de IA a partir del 3° semestre).
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Lista de grupos de permisos por categoría */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Paso 2: Activa o desactiva las funcionalidades para {getRolFriendlyName(selectedRole?.nombre)}
          </span>
          <span className="text-xs text-slate-500">
            {permisos.filter((p) => p.activo).length} de {permisos.length} permitidos
          </span>
        </div>

        {loadingPermisos ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 flex flex-col items-center justify-center gap-3 text-slate-500">
            <Loader2 className="size-8 animate-spin text-slate-400" />
            <span className="text-sm font-medium">Cargando permisos del rol...</span>
          </div>
        ) : gruposCategorias.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500">
            <ShieldCheck className="size-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm">No se encontraron permisos registrados en el catálogo.</p>
          </div>
        ) : (
          gruposCategorias.map((grupo) => (
            <PermisoCardGroup
              key={grupo.categoria}
              categoria={grupo.categoria}
              permisos={grupo.items}
              isEstudiante={isEstudiante}
              onTogglePermiso={togglePermiso}
              onUpdateSemestres={updateSemestres}
            />
          ))
        )}
      </div>

      {/* Barra de acciones inferior */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-4 border border-slate-800 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="size-2 rounded-full bg-amber-400 animate-ping" />
            <span>Tienes cambios pendientes en los permisos de {getRolFriendlyName(selectedRole?.nombre)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={resetChanges}
              disabled={saving}
              className="text-xs text-slate-300 hover:text-white border-slate-700 bg-transparent hover:bg-slate-800 cursor-pointer"
            >
              <RotateCcw className="size-3 mr-1" />
              Descartar
            </Button>
            <Button
              type="button"
              size="xs"
              onClick={savePermisos}
              disabled={saving}
              className="text-xs bg-sky-500 hover:bg-sky-600 text-white font-semibold cursor-pointer shadow-xs"
            >
              {saving ? (
                <Loader2 className="size-3 animate-spin mr-1" />
              ) : (
                <CheckCircle2 className="size-3 mr-1" />
              )}
              {saving ? "Guardando..." : "Guardar ahora"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
