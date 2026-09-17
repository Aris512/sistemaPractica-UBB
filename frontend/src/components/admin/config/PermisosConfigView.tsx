import { useState, useMemo } from "react";
import { Save, RotateCcw, RefreshCw, Loader2, AlertCircle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sileo } from "sileo";
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
import type { PermisoItem } from "./types";

const CATEGORIAS_ORDEN = [
  "SUBIR ARCHIVOS",
  "EVALUACIONES",
  "OBSERVACIONES",
  "ESTUDIANTES",
  "INTELIGENCIA ARTIFICIAL",
];

export function PermisosConfigView() {
  const {
    roles,
    selectedRoleId,
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

  const [pendingRoleId, setPendingRoleId] = useState<number | null>(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Determinar si el rol seleccionado es Profesor Colaborador o Tutor
  const isColaboradorOTutor = useMemo(() => {
    const currentRole = roles.find((r) => r.idRol === selectedRoleId);
    const nombre = currentRole?.nombre?.toUpperCase() || "";
    return nombre.includes("COLABORADOR") || nombre.includes("TUTOR");
  }, [roles, selectedRoleId]);

  // Agrupar permisos por categoría aplicando los filtros específicos por rol:
  // 1. Eliminar sección/permiso "Portafolio" (PORTAFOLIO_CONSULTAR) de Administrar Roles
  // 2. El permiso "Subir archivos" (PORTAFOLIO_SUBIR) se muestra en su propia categoría "SUBIR ARCHIVOS"
  // 3. Eliminar sección "Subir Archivos" para los roles Profesor Colaborador y Tutor de Práctica
  // 4. Rol ESTUDIANTE: se elimina "Información de Estudiantes"
  // 5. Demás roles: se elimina "Inteligencia Artificial" (solo disponible para ESTUDIANTE)
  const gruposCategorias = useMemo(() => {
    const mapa = new Map<string, PermisoItem[]>();

    permisos.forEach((p) => {
      // Eliminar permiso "Portafolio" / "PORTAFOLIO_CONSULTAR" de Administrar Roles
      if (p.codigo === "PORTAFOLIO_CONSULTAR") {
        return;
      }

      let cat = p.categoria ? p.categoria.toUpperCase() : "GENERAL";

      // Reubicar "Subir archivos" bajo categoría independiente "SUBIR ARCHIVOS"
      if (p.codigo === "PORTAFOLIO_SUBIR" || cat === "PORTAFOLIO") {
        cat = "SUBIR ARCHIVOS";
      }

      // Eliminar "Subir Archivos" para roles Profesor Colaborador y Tutor
      if (
        isColaboradorOTutor &&
        (p.codigo === "PORTAFOLIO_SUBIR" || cat === "SUBIR ARCHIVOS" || cat === "SUBIR_ARCHIVOS")
      ) {
        return;
      }

      // Eliminar Información de Estudiantes para el rol ESTUDIANTE
      if (isEstudiante && (cat === "ESTUDIANTES" || cat === "INFORMACIÓN DE ESTUDIANTES")) {
        return;
      }

      // Eliminar Inteligencia Artificial para todos los roles que NO sean ESTUDIANTE
      if (!isEstudiante && (cat === "INTELIGENCIA ARTIFICIAL" || cat === "IA")) {
        return;
      }

      if (!mapa.has(cat)) {
        mapa.set(cat, []);
      }
      mapa.get(cat)!.push(p);
    });

    const ordenados: { categoria: string; items: PermisoItem[] }[] = [];

    CATEGORIAS_ORDEN.forEach((cat) => {
      if (mapa.has(cat)) {
        ordenados.push({ categoria: cat, items: mapa.get(cat)! });
        mapa.delete(cat);
      }
    });

    mapa.forEach((items, categoria) => {
      ordenados.push({ categoria, items });
    });

    return ordenados;
  }, [permisos, isEstudiante, isColaboradorOTutor]);

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

  const handleRoleChange = (newRoleId: number) => {
    if (newRoleId === selectedRoleId) return;
    if (hasUnsavedChanges) {
      setPendingRoleId(newRoleId);
      setShowDiscardConfirm(true);
    } else {
      setSelectedRoleId(newRoleId);
      const targetRol = roles.find((r) => r.idRol === newRoleId);
      sileo.show({
        title: "Rol seleccionado",
        description: `Mostrando permisos para ${getRolFriendlyName(targetRol?.nombre)}.`,
      });
    }
  };

  const handleConfirmDiscard = () => {
    resetChanges();
    if (pendingRoleId !== null) {
      setSelectedRoleId(pendingRoleId);
      const targetRol = roles.find((r) => r.idRol === pendingRoleId);
      sileo.info({
        title: "Cambios descartados",
        description: `Se descartaron los cambios y se cargó el rol ${getRolFriendlyName(targetRol?.nombre)}.`,
      });
    }
    setShowDiscardConfirm(false);
    setPendingRoleId(null);
  };

  const handleCancelDiscard = () => {
    setShowDiscardConfirm(false);
    setPendingRoleId(null);
  };

  const handleReload = async () => {
    sileo.show({
      title: "Recargando permisos",
      description: "Consultando la base de datos...",
    });
    await reload();
    sileo.success({
      title: "Permisos actualizados",
      description: "Se recargó la configuración desde el servidor.",
    });
  };

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8 space-y-8">
      {/* ── Barra Superior Minimalista ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex flex-wrap items-center gap-4">
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Permisos por Rol
          </h1>

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          {/* Selector de Rol Minimalista */}
          <div className="flex items-center gap-2">
            <label htmlFor="role-select" className="text-xs font-medium text-slate-500">
              Rol:
            </label>
            <div className="relative">
              {loadingRoles ? (
                <div className="flex items-center gap-1.5 text-xs text-slate-400 py-1">
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Cargando roles...</span>
                </div>
              ) : (
                <>
                  <select
                    id="role-select"
                    value={selectedRoleId ?? ""}
                    onChange={(e) => handleRoleChange(Number(e.target.value))}
                    className="appearance-none bg-white text-slate-900 font-medium text-xs border border-slate-200 rounded-lg px-3 py-1.5 pr-8 hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer transition-colors shadow-2xs"
                  >
                    {roles.map((r) => (
                      <option key={r.idRol} value={r.idRol}>
                        {getRolFriendlyName(r.nombre)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="size-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </>
              )}
            </div>
          </div>
        </div>

        {/* Acciones Minimalistas */}
        <div className="flex items-center gap-2 sm:self-auto self-start">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReload}
            disabled={loadingPermisos || saving}
            className="text-xs text-slate-600 hover:text-slate-900 cursor-pointer h-8 px-2.5 gap-1.5"
            title="Recargar permisos"
          >
            <RefreshCw className={`size-3.5 ${loadingPermisos ? "animate-spin" : ""}`} />
            <span>Recargar</span>
          </Button>

          {hasUnsavedChanges && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetChanges}
              disabled={saving}
              className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer h-8 px-2.5 gap-1.5"
            >
              <RotateCcw className="size-3.5" />
              <span>Descartar</span>
            </Button>
          )}

          <Button
            type="button"
            onClick={savePermisos}
            disabled={!hasUnsavedChanges || saving || loadingPermisos}
            className={`h-8 px-4 text-xs font-medium rounded-lg cursor-pointer transition-all gap-1.5 shadow-2xs ${
              hasUnsavedChanges
                ? "bg-slate-900 hover:bg-slate-800 text-white"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
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

      {/* ── Alerta Minimalista de Error ── */}
      {error && (
        <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={handleReload}
            className="underline font-medium hover:text-rose-800 cursor-pointer"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* ── Checklist de Funcionalidades en 2 Columnas Balanceadas ── */}
      {loadingPermisos ? (
        <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-400">
          <Loader2 className="size-6 animate-spin" />
          <span className="text-xs">Cargando permisos...</span>
        </div>
      ) : gruposCategorias.length === 0 ? (
        <div className="py-16 text-center text-slate-400 text-xs">
          No hay permisos registrados en el catálogo.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-10 items-start">
          {gruposCategorias.map((grupo) => (
            <PermisoCardGroup
              key={grupo.categoria}
              categoria={grupo.categoria}
              permisos={grupo.items}
              isEstudiante={isEstudiante}
              onTogglePermiso={togglePermiso}
              onUpdateSemestres={updateSemestres}
            />
          ))}
        </div>
      )}

      {/* ── Modal de Confirmación de Descarte Minimalista ── */}
      <Dialog
        open={showDiscardConfirm}
        onOpenChange={(open) => {
          if (!open) handleCancelDiscard();
        }}
      >
        <DialogContent className="sm:max-w-md p-6 bg-white rounded-2xl border border-slate-200 shadow-xl space-y-4">
          <DialogHeader className="space-y-1.5 text-left">
            <DialogTitle className="text-base font-semibold text-slate-900 tracking-tight">
              ¿Descartar cambios sin guardar?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 leading-relaxed">
              Tienes modificaciones en los permisos que aún no han sido guardadas. Si cambias de rol ahora, se descartarán todos los cambios pendientes.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-3 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancelDiscard}
              className="text-xs text-slate-600 hover:text-slate-900 h-8 px-3 cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmDiscard}
              className="text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white h-8 px-3.5 cursor-pointer shadow-2xs"
            >
              Descartar y cambiar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
