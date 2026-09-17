import { useState, useEffect, useCallback } from "react";
import { sileo } from "sileo";
import type { PermisoItem, RolOption } from "./types";

export function usePermisosAdmin() {
  const [roles, setRoles] = useState<RolOption[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [permisos, setPermisos] = useState<PermisoItem[]>([]);
  const [originalPermisos, setOriginalPermisos] = useState<PermisoItem[]>([]);
  const [loadingRoles, setLoadingRoles] = useState<boolean>(true);
  const [loadingPermisos, setLoadingPermisos] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getAdminHeaders = useCallback(() => {
    const credentials = btoa("admin:admin123");
    return {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
    };
  }, []);

  // Cargar lista de roles disponibles
  const fetchRoles = useCallback(async () => {
    setLoadingRoles(true);
    setError(null);
    try {
      let res = await fetch("/api/roles");
      if (!res.ok) {
        res = await fetch("http://localhost:8080/api/roles");
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: RolOption[] = await res.json();
      setRoles(data);
      if (data.length > 0 && selectedRoleId === null) {
        // Seleccionar ESTUDIANTE por defecto si existe, o el primer rol
        const estudianteRol = data.find((r) => r.nombre.toUpperCase() === "ESTUDIANTE");
        setSelectedRoleId(estudianteRol ? estudianteRol.idRol : data[0].idRol);
      }
    } catch (err: any) {
      console.error("Error al cargar roles:", err);
      setError("No se pudieron cargar los roles del sistema.");
    } finally {
      setLoadingRoles(false);
    }
  }, [selectedRoleId]);

  // Cargar permisos configurados para el rol seleccionado
  const fetchPermisosPorRol = useCallback(
    async (roleId: number) => {
      setLoadingPermisos(true);
      setError(null);
      try {
        let res = await fetch(`http://localhost:8080/admin/permisos/roles/${roleId}`, {
          headers: getAdminHeaders(),
        });
        if (!res.ok) {
          res = await fetch(`/admin/permisos/roles/${roleId}`, {
            headers: getAdminHeaders(),
          });
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: PermisoItem[] = await res.json();
        setPermisos(data);
        setOriginalPermisos(JSON.parse(JSON.stringify(data)));
      } catch (err: any) {
        console.error("Error al cargar permisos del rol:", err);
        setError("No se pudieron cargar los permisos para el rol seleccionado.");
      } finally {
        setLoadingPermisos(false);
      }
    },
    [getAdminHeaders]
  );

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  useEffect(() => {
    if (selectedRoleId !== null) {
      fetchPermisosPorRol(selectedRoleId);
    }
  }, [selectedRoleId, fetchPermisosPorRol]);

  const togglePermiso = (idPermiso: number, activo: boolean) => {
    setPermisos((prev) =>
      prev.map((item) => (item.idPermiso === idPermiso ? { ...item, activo } : item))
    );
  };

  const updateSemestres = (idPermiso: number, semestresPermitidos: string) => {
    setPermisos((prev) =>
      prev.map((item) =>
        item.idPermiso === idPermiso ? { ...item, semestresPermitidos } : item
      )
    );
  };

  const hasUnsavedChanges =
    JSON.stringify(permisos) !== JSON.stringify(originalPermisos);

  const resetChanges = () => {
    setPermisos(JSON.parse(JSON.stringify(originalPermisos)));
  };

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

      let res = await fetch(`http://localhost:8080/admin/permisos/roles/${selectedRoleId}`, {
        method: "PUT",
        headers: getAdminHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        res = await fetch(`/admin/permisos/roles/${selectedRoleId}`, {
          method: "PUT",
          headers: getAdminHeaders(),
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const updated: PermisoItem[] = await res.json();
      setPermisos(updated);
      setOriginalPermisos(JSON.parse(JSON.stringify(updated)));

      const selectedRol = roles.find((r) => r.idRol === selectedRoleId);
      sileo.success({
        title: "Configuración guardada",
        description: `Los permisos para el rol ${selectedRol?.nombre || ""} se actualizaron correctamente en la base de datos.`,
      });
    } catch (err: any) {
      console.error("Error al guardar permisos:", err);
      sileo.error({
        title: "Error al guardar",
        description: "No se pudieron persistir los permisos en el servidor.",
      });
    } finally {
      setSaving(false);
    }
  };

  const selectedRole = roles.find((r) => r.idRol === selectedRoleId) || null;
  const isEstudiante = selectedRole?.nombre?.toUpperCase() === "ESTUDIANTE";

  return {
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
    reload: () => {
      if (selectedRoleId !== null) {
        fetchPermisosPorRol(selectedRoleId);
      }
    },
  };
}
