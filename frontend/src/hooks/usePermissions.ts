import { useState, useEffect, useCallback } from "react";
import type { UserSession } from "@/types/auth";

export function usePermissions(user?: UserSession | null) {
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<boolean>(true);

  const fetchPermissions = useCallback(async () => {
    if (!user) {
      setPermissions(new Set());
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // 1. Intentar resolver permisos efectivos por RUT del usuario
      if (user.rut) {
        const res = await fetch(`/api/permisos/usuario/${encodeURIComponent(user.rut)}`);
        if (res.ok) {
          const data: string[] = await res.json();
          setPermissions(new Set(data.map((c) => c.toUpperCase())));
          setLoading(false);
          return;
        }
      }

      // 2. Fallback: Consultar por el rol principal del usuario
      const mainRole = (user.rol || (user.roles && user.roles[0]) || "ESTUDIANTE").toUpperCase();
      const res = await fetch(`/api/permisos/rol/${encodeURIComponent(mainRole)}`);
      if (res.ok) {
        const data: string[] = await res.json();
        setPermissions(new Set(data.map((c) => c.toUpperCase())));
      } else {
        // Fallback por defecto si no responde
        setPermissions(
          new Set([
            "PORTAFOLIO_CONSULTAR",
            "PORTAFOLIO_SUBIR",
            "EVALUACIONES_CONSULTAR",
            "OBSERVACIONES_CONSULTAR",
            "IA_ACCESO",
          ])
        );
      }
    } catch (err) {
      console.warn("No se pudieron cargar permisos del servidor, usando defaults:", err);
      setPermissions(
        new Set([
          "PORTAFOLIO_CONSULTAR",
          "PORTAFOLIO_SUBIR",
          "EVALUACIONES_CONSULTAR",
          "OBSERVACIONES_CONSULTAR",
          "IA_ACCESO",
        ])
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const hasPermission = useCallback(
    (codigo: string): boolean => {
      if (!codigo) return false;
      return permissions.has(codigo.toUpperCase());
    },
    [permissions]
  );

  return {
    permissions,
    hasPermission,
    loading,
    refetch: fetchPermissions,
  };
}
