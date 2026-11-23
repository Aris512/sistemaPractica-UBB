import { useState, useEffect, useCallback, useMemo } from "react";
import { getAdminAuthHeader } from "@/lib/adminAuth";
import { sileo } from "sileo";
import type { PermisoItem, RolOption } from "./types";
import { rolMeta } from "./meta";

/** El administrador tiene acceso total al panel: no tiene permisos configurables. */
const esRolAdministrador = (nombre?: string) => (nombre ?? "").toUpperCase().includes("ADMIN");

const clonar = (lista: PermisoItem[]) => lista.map((p) => ({ ...p }));

export function usePermisosAdmin() {
  const [roles, setRoles] = useState<RolOption[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [permisos, setPermisos] = useState<PermisoItem[]>([]);
  const [originalPermisos, setOriginalPermisos] = useState<PermisoItem[]>([]);
  const [loadingRoles, setLoadingRoles] = useState<boolean>(true);
  const [loadingPermisos, setLoadingPermisos] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getAdminHeaders = useCallback(
    () => ({ ...getAdminAuthHeader(), "Content-Type": "application/json" }),
    []
  );

  // Roles configurables (sin el administrador)
  useEffect(() => {
    let cancelado = false;
    (async () => {
      setLoadingRoles(true);
      setError(null);
      try {
        const res = await fetch("/api/roles");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: RolOption[] = (await res.json()).filter((r: RolOption) => !esRolAdministrador(r.nombre));
        if (cancelado) return;
        setRoles(data);
        setSelectedRoleId((actual) => {
          if (actual !== null || data.length === 0) return actual;
          const estudiante = data.find((r) => r.nombre.toUpperCase() === "ESTUDIANTE");
          return (estudiante ?? data[0]).idRol;
        });
      } catch (err) {
        console.error("Error al cargar roles:", err);
        if (cancelado) return;
        setError("No se pudieron cargar los roles del sistema.");
        sileo.error({
          title: "Error al cargar roles",
          description: "No se pudieron obtener los roles desde la base de datos.",
        });
      } finally {
        if (!cancelado) setLoadingRoles(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, []);

  const fetchPermisosPorRol = useCallback(
    async (roleId: number) => {
      setLoadingPermisos(true);
      setError(null);
      try {
        const res = await fetch(`/admin/permisos/roles/${roleId}`, { headers: getAdminHeaders() });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: PermisoItem[] = await res.json();
        setPermisos(data);
        setOriginalPermisos(clonar(data));
      } catch (err) {
        console.error("Error al cargar permisos del rol:", err);
        setError("No se pudieron cargar los permisos para el rol seleccionado.");
        sileo.error({
          title: "Error al cargar permisos",
          description: "No se pudieron obtener los permisos del rol desde el servidor.",
        });
      } finally {
        setLoadingPermisos(false);
      }
    },
    [getAdminHeaders]
  );

  useEffect(() => {
    if (selectedRoleId !== null) fetchPermisosPorRol(selectedRoleId);
  }, [selectedRoleId, fetchPermisosPorRol]);

  const togglePermiso = (idPermiso: number, activo: boolean) => {
    setPermisos((prev) => prev.map((p) => (p.idPermiso === idPermiso ? { ...p, activo } : p)));
  };

  const updateSemestres = (idPermiso: number, semestresPermitidos: string) => {
    setPermisos((prev) => prev.map((p) => (p.idPermiso === idPermiso ? { ...p, semestresPermitidos } : p)));
  };

  /** Activa o desactiva de una vez los permisos indicados (o todos). */
  const setTodos = (activo: boolean, ids?: number[]) => {
    setPermisos((prev) => prev.map((p) => (!ids || ids.includes(p.idPermiso) ? { ...p, activo } : p)));
  };

  /** Permisos cuyo estado difiere de lo guardado. */
  const cambios = useMemo(() => {
    const originales = new Map(originalPermisos.map((p) => [p.idPermiso, p]));
    return new Set(
      permisos
        .filter((p) => {
          const o = originales.get(p.idPermiso);
          return !o || o.activo !== p.activo || (o.semestresPermitidos ?? "ALL") !== (p.semestresPermitidos ?? "ALL");
        })
        .map((p) => p.idPermiso)
    );
  }, [permisos, originalPermisos]);

  const hasUnsavedChanges = cambios.size > 0;

  const resetChanges = () => {
    setPermisos(clonar(originalPermisos));
  };

  const selectedRole = roles.find((r) => r.idRol === selectedRoleId) || null;
  const isEstudiante = selectedRole?.nombre?.toUpperCase() === "ESTUDIANTE";

  const savePermisos = async () => {
    if (selectedRoleId === null) return;
    setSaving(true);
    try {
      const payload = {
        permisos: permisos.map((p) => ({
          idPermiso: p.idPermiso,
          codigo: p.codigo,
          activo: p.activo,
          semestresPermitidos: p.semestresPermitidos,
        })),
      };
      const res = await fetch(`/admin/permisos/roles/${selectedRoleId}`, {
        method: "PUT",
        headers: getAdminHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const updated: PermisoItem[] = await res.json();
      setPermisos(updated);
      setOriginalPermisos(clonar(updated));
      sileo.success({
        title: "Permisos guardados",
        description: `Se actualizó la configuración de ${rolMeta(selectedRole?.nombre).nombre}.`,
      });
    } catch (err) {
      console.error("Error al guardar permisos:", err);
      sileo.error({
        title: "Error al guardar",
        description: "No se pudieron guardar los permisos en el servidor.",
      });
    } finally {
      setSaving(false);
    }
  };

  return {
    roles,
    selectedRoleId,
    selectedRole,
    isEstudiante,
    permisos,
    originalPermisos,
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
    reload: () => (selectedRoleId !== null ? fetchPermisosPorRol(selectedRoleId) : Promise.resolve()),
  };
}
