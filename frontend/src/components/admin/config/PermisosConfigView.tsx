import { useState, useMemo } from "react";
import { Save, RotateCcw, RefreshCw, Loader2, AlertCircle, Search, X, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { usePermisosAdmin } from "./usePermisosAdmin";
import { PermisoCardGroup } from "./PermisoCardGroup";
import { rolMeta } from "./meta";
import type { PermisoItem } from "./types";

/** Orden de los módulos (coincide con el catálogo del backend). */
const CATEGORIAS_ORDEN = ["PORTAFOLIO", "EVALUACIONES", "PAUTAS", "PRACTICAS", "INTELIGENCIA ARTIFICIAL"];

const normalizar = (texto: string) =>
  texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

export function PermisosConfigView() {
  const {
    roles,
    selectedRoleId,
    selectedRole,
    isEstudiante,
    permisos,
    cambios,
    loadingRoles,
    loadingPermisos,
    saving,
    error,
    hasUnsavedChanges,
    setSelectedRoleId,
    togglePermiso,
    updateSemestres,
    setTodos,
    savePermisos,
    resetChanges,
    reload,
  } = usePermisosAdmin();

  const [pendingRoleId, setPendingRoleId] = useState<number | null>(null);
  const [busqueda, setBusqueda] = useState("");

  // El backend ya devuelve solo las funciones que usa cada rol; aquí solo se agrupan y filtran por búsqueda
  const grupos = useMemo(() => {
    const termino = normalizar(busqueda.trim());
    const mapa = new Map<string, PermisoItem[]>();
    permisos
      .filter(
        (p) =>
          !termino ||
          normalizar(p.nombre ?? "").includes(termino) ||
          normalizar(p.descripcion ?? "").includes(termino)
      )
      .forEach((p) => {
        const cat = (p.categoria || "GENERAL").toUpperCase();
        if (!mapa.has(cat)) mapa.set(cat, []);
        mapa.get(cat)!.push(p);
      });
    const orden = (cat: string) => {
      const i = CATEGORIAS_ORDEN.indexOf(cat);
      return i === -1 ? CATEGORIAS_ORDEN.length : i;
    };
    return [...mapa.entries()]
      .sort(([a], [b]) => orden(a) - orden(b))
      .map(([categoria, items]) => ({ categoria, items }));
  }, [permisos, busqueda]);

  const totalActivos = permisos.filter((p) => p.activo).length;
  const porcentaje = permisos.length ? Math.round((totalActivos / permisos.length) * 100) : 0;
  const meta = rolMeta(selectedRole?.nombre);
  const IconoRol = meta.icono;

  const cambiarRol = (idRol: number) => {
    if (idRol === selectedRoleId) return;
    if (hasUnsavedChanges) {
      setPendingRoleId(idRol);
      return;
    }
    setBusqueda("");
    setSelectedRoleId(idRol);
  };

  const confirmarDescarte = () => {
    resetChanges();
    if (pendingRoleId !== null) {
      setBusqueda("");
      setSelectedRoleId(pendingRoleId);
    }
    setPendingRoleId(null);
  };

  const ocupado = loadingPermisos || saving;

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8 pb-28 space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Permisos por rol</h1>
          <p className="text-sm text-slate-500 max-w-2xl">
            Elige un rol y permite o bloquea cada función. Solo se muestran las funciones que ese rol usa en la
            plataforma.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => reload()}
          disabled={ocupado}
          className="text-xs h-8 gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`size-3.5 ${loadingPermisos ? "animate-spin" : ""}`} />
          Recargar
        </Button>
      </div>

      {error && (
        <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
          <button type="button" onClick={() => reload()} className="underline font-medium cursor-pointer">
            Reintentar
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-6 items-start">
        {/* ── Selector de rol ── */}
        <nav aria-label="Roles" className="lg:sticky lg:top-20">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 px-1">Roles</p>
          {loadingRoles ? (
            <div className="flex items-center gap-2 text-xs text-slate-400 py-4 px-1">
              <Loader2 className="size-4 animate-spin" />
              Cargando roles...
            </div>
          ) : (
            <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-2">
              {roles.map((rol) => {
                const m = rolMeta(rol.nombre);
                const Icono = m.icono;
                const activo = rol.idRol === selectedRoleId;
                return (
                  <li key={rol.idRol} className="min-w-0">
                    <button
                      type="button"
                      onClick={() => cambiarRol(rol.idRol)}
                      aria-current={activo ? "true" : undefined}
                      className={`w-full h-full flex items-center gap-2.5 sm:gap-3 rounded-xl border px-2.5 sm:px-3 py-2.5 text-left transition-colors cursor-pointer ${
                        activo
                          ? "border-slate-900 bg-white shadow-sm ring-1 ring-slate-900"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <span
                        className={`size-8 sm:size-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          activo ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        <Icono className="size-4.5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[13px] sm:text-sm font-medium text-slate-900 leading-tight">
                          {m.nombre}
                        </span>
                        {activo && hasUnsavedChanges && (
                          <span className="block text-[11px] text-amber-700 font-medium">Cambios sin guardar</span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </nav>

        {/* ── Permisos del rol ── */}
        <div className="space-y-4 min-w-0">
          {selectedRole && (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-4">
              <div className="flex items-start gap-3">
                <span className="size-11 rounded-xl flex items-center justify-center shrink-0 bg-slate-100 text-slate-600">
                  <IconoRol className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-semibold text-slate-900">{meta.nombre}</h2>
                  {meta.descripcion && <p className="text-sm text-slate-500">{meta.descripcion}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs">
                  <span className="text-slate-600">
                    <strong className="font-semibold text-slate-900">{totalActivos}</strong> de {permisos.length}{" "}
                    funciones permitidas
                  </span>
                  <div className="flex items-center gap-1 -mx-2 whitespace-nowrap">
                    <button
                      type="button"
                      disabled={ocupado || permisos.length === 0}
                      onClick={() => setTodos(true)}
                      className="px-2 py-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Permitir todo
                    </button>
                    <span className="text-slate-300">·</span>
                    <button
                      type="button"
                      disabled={ocupado || permisos.length === 0}
                      onClick={() => setTodos(false)}
                      className="px-2 py-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Bloquear todo
                    </button>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${porcentaje}%` }}
                  />
                </div>
              </div>

              {permisos.length > 4 && (
                <div className="relative">
                  <Search className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="search"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar función..."
                    className="w-full h-9 rounded-lg border border-slate-200 bg-white pl-9 pr-9 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  />
                  {busqueda && (
                    <button
                      type="button"
                      onClick={() => setBusqueda("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
                      aria-label="Limpiar búsqueda"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>
              )}

              {isEstudiante && (
                <p className="flex items-start gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                  <Info className="size-3.5 mt-0.5 shrink-0" />
                  Para estudiantes puedes limitar cada función a ciertos semestres de la carrera.
                </p>
              )}
            </div>
          )}

          {loadingPermisos ? (
            <div className="space-y-4">
              {[0, 1].map((i) => (
                <div key={i} className="h-40 rounded-2xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : permisos.length === 0 && !error ? (
            <div className="py-14 text-center text-sm text-slate-500 bg-white rounded-2xl border border-dashed border-slate-200">
              Este rol no tiene funciones configurables.
            </div>
          ) : grupos.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500">
              Ninguna función coincide con «{busqueda}».
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
              {grupos.map((grupo) => (
                <PermisoCardGroup
                  key={grupo.categoria}
                  categoria={grupo.categoria}
                  permisos={grupo.items}
                  isEstudiante={isEstudiante}
                  cambios={cambios}
                  disabled={saving}
                  onTogglePermiso={togglePermiso}
                  onUpdateSemestres={updateSemestres}
                  onSetGrupo={setTodos}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Barra de guardado ── */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-4 inset-x-4 sm:left-auto sm:right-6 sm:inset-x-auto z-30">
          <div className="flex items-center gap-3 rounded-2xl bg-slate-900 text-white shadow-xl px-4 py-3">
            <span className="text-sm">
              <strong className="font-semibold">{cambios.size}</strong>{" "}
              {cambios.size === 1 ? "cambio sin guardar" : "cambios sin guardar"}
            </span>
            <div className="flex items-center gap-2 ml-auto">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetChanges}
                disabled={saving}
                className="h-8 text-xs gap-1.5 text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <RotateCcw className="size-3.5" />
                Descartar
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={savePermisos}
                disabled={saving}
                className="h-8 text-xs gap-1.5 bg-white text-slate-900 hover:bg-slate-100 cursor-pointer"
              >
                {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                {saving ? "Guardando..." : "Guardar cambios"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirmación al cambiar de rol con cambios pendientes ── */}
      <Dialog open={pendingRoleId !== null} onOpenChange={(open) => !open && setPendingRoleId(null)}>
        <DialogContent className="sm:max-w-md p-6 bg-white rounded-2xl border border-slate-200 shadow-xl space-y-4">
          <DialogHeader className="space-y-1.5 text-left">
            <DialogTitle className="text-base font-semibold text-slate-900">¿Descartar cambios sin guardar?</DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Tienes {cambios.size} {cambios.size === 1 ? "cambio" : "cambios"} en {meta.nombre}. Si cambias de rol
              ahora, se perderán.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-3 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPendingRoleId(null)}
              className="text-xs h-8 cursor-pointer"
            >
              Seguir editando
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={confirmarDescarte}
              className="text-xs h-8 bg-slate-900 hover:bg-slate-800 text-white cursor-pointer"
            >
              Descartar y cambiar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
