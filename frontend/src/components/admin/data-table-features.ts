import { useState, useMemo, useEffect, useCallback } from "react";

// ── Tipo principal para la tabla de usuarios ──
export interface UsuarioRow {
  rut: string;
  nombre: string;
  correo?: string;
  rol: string;
  curso: string;
  centroPractica?: string;
  idCentro?: number | null;
  estado: boolean;
}

// ── Mantener el alias Invoice para no romper los modales existentes ──
export interface Invoice {
  invoice: string;
  paymentStatus: "Paid" | "Pending" | "Unpaid" | string;
  totalAmount: string;
  paymentMethod: string;
}

export type SortDirection = "asc" | "desc" | null;

export interface SortState {
  column: keyof UsuarioRow | null;
  direction: SortDirection;
}

// Roles posibles para filtro
export const USER_ROLES = [
  "ALL",
  "ESTUDIANTE",
  "PROFESOR_ASIGNATURA",
  "PROFESOR_COLABORADOR",
  "TUTOR_PRACTICA",
  "COORDINADOR",
] as const;

// Etiqueta visual amigable para cada rol
export function rolLabel(rol: string): string {
  const labels: Record<string, string> = {
    ESTUDIANTE: "Estudiante",
    PROFESOR_ASIGNATURA: "Profesor Asignatura",
    PROFESOR_COLABORADOR: "Profesor Colaborador",
    TUTOR_PRACTICA: "Tutor Práctica",
    COORDINADOR: "Coordinador",
  };
  return labels[rol] ?? rol;
}

// ── Helpers de Invoice mantenidos para modales ──
export const PAYMENT_METHODS = ["ALL", "Credit Card", "PayPal", "Bank Transfer"] as const;
export const PAYMENT_STATUSES = ["ALL", "Paid", "Pending", "Unpaid"] as const;

export function parseAmount(amountStr: string): number {
  const numeric = amountStr.replace(/[^0-9.-]+/g, "");
  return parseFloat(numeric) || 0;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function calculateTotalAmount(items: Invoice[]): string {
  const total = items.reduce((sum, item) => sum + parseAmount(item.totalAmount), 0);
  return formatCurrency(total);
}

// ── Sort y filter para UsuarioRow ──
export function sortUsuarios(
  items: UsuarioRow[],
  column: keyof UsuarioRow | null,
  direction: SortDirection
): UsuarioRow[] {
  if (!column || !direction) return items;

  return [...items].sort((a, b) => {
    const comparison = String(a[column]).localeCompare(String(b[column]));
    return direction === "asc" ? comparison : -comparison;
  });
}

export function filterUsuarios(
  items: UsuarioRow[],
  searchQuery: string,
  roleFilter: string = "ALL",
  asignaturaFilter: string = "ALL",
  estadoFilter: string = "ALL"
): UsuarioRow[] {
  const query = searchQuery.trim().toLowerCase();

  return items.filter((item) => {
    const matchesRole =
      roleFilter === "ALL" ||
      item.rol.toLowerCase() === roleFilter.toLowerCase();

    if (!matchesRole) return false;

    const matchesAsignatura =
      asignaturaFilter === "ALL" ||
      (asignaturaFilter === "NONE"
        ? item.curso === "—" || !item.curso
        : item.curso.toLowerCase() === asignaturaFilter.toLowerCase());

    if (!matchesAsignatura) return false;

    if (estadoFilter === "ACTIVO" && !item.estado) return false;
    if (estadoFilter === "INACTIVO" && item.estado) return false;

    if (!query) return true;

    return (
      item.rut.toLowerCase().includes(query) ||
      item.nombre.toLowerCase().includes(query) ||
      (item.correo && item.correo.toLowerCase().includes(query)) ||
      item.rol.toLowerCase().includes(query) ||
      item.curso.toLowerCase().includes(query) ||
      (item.estado ? "activo" : "inactivo").includes(query)
    );
  });
}

// ── Hook principal: fetch de usuarios reales ──
export function useDataTableFeatures(
  _initialData?: unknown,
  defaultPageSize: number = 10
) {
  const [data, setData] = useState<UsuarioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [asignaturaFilter, setAsignaturaFilter] = useState("ALL");
  const [estadoFilter, setEstadoFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [sortState, setSortState] = useState<SortState>({
    column: null,
    direction: null,
  });

  // Fetch usuarios desde el backend
  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const credentials = btoa("admin:admin123");
      const res = await fetch("http://localhost:8080/admin/usuarios", {
        headers: {
          Authorization: `Basic ${credentials}`,
        },
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);

      const json = await res.json();

      const rows: UsuarioRow[] = json.map(
        (u: { rut: string; nombre: string; roles: string[]; correo: string; curso?: string; centroPractica?: string; idCentro?: number; estado?: boolean }) => ({
          rut: u.rut,
          nombre: u.nombre,
          correo: u.correo,
          rol: u.roles && u.roles.length > 0 ? u.roles[0] : "SIN ROL",
          curso: u.curso || "—",
          centroPractica: u.centroPractica || "—",
          idCentro: u.idCentro || null,
          estado: u.estado !== undefined ? Boolean(u.estado) : true,
        })
      );

      setData(rows);
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
      setError("No se pudieron cargar los usuarios");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  // Reset to first page whenever real-time filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, roleFilter, asignaturaFilter, estadoFilter, pageSize]);

  const handleSort = (column: keyof UsuarioRow) => {
    setSortState((prev) => {
      if (prev.column !== column) {
        return { column, direction: "asc" };
      }
      if (prev.direction === "asc") {
        return { column, direction: "desc" };
      }
      return { column: null, direction: null };
    });
  };

  // Extraer lista de asignaturas disponibles de los datos cargados
  const availableAsignaturas = useMemo(() => {
    const set = new Set<string>();
    data.forEach((u) => {
      if (u.curso && u.curso !== "—") {
        set.add(u.curso);
      }
    });
    return Array.from(set).sort();
  }, [data]);

  const filteredAndSortedData = useMemo(() => {
    const filtered = filterUsuarios(data, searchQuery, roleFilter, asignaturaFilter, estadoFilter);
    return sortUsuarios(filtered, sortState.column, sortState.direction);
  }, [data, searchQuery, roleFilter, asignaturaFilter, estadoFilter, sortState]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredAndSortedData.length / pageSize));
  }, [filteredAndSortedData.length, pageSize]);

  // Ensure current page does not exceed totalPages
  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredAndSortedData.slice(start, start + pageSize);
  }, [filteredAndSortedData, page, pageSize]);

  const hasActiveFilters = useMemo(() => {
    return Boolean(
      searchQuery.trim() !== "" ||
      roleFilter !== "ALL" ||
      asignaturaFilter !== "ALL" ||
      estadoFilter !== "ALL"
    );
  }, [searchQuery, roleFilter, asignaturaFilter, estadoFilter]);

  const clearFilters = () => {
    setSearchQuery("");
    setRoleFilter("ALL");
    setAsignaturaFilter("ALL");
    setEstadoFilter("ALL");
    setPage(1);
  };

  // ── Operaciones CRUD ──
  const deleteUsuario = async (rut: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const credentials = btoa("admin:admin123");
      const res = await fetch(`http://localhost:8080/admin/usuarios/${encodeURIComponent(rut)}`, {
        method: "DELETE",
        headers: {
          Authorization: `Basic ${credentials}`,
        },
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(
          errJson?.error || errJson?.message || `Error ${res.status}: No se pudo eliminar el usuario.`
        );
      }

      // Eliminar de la lista local únicamente si la eliminación en base de datos fue exitosa
      setData((prev) => prev.filter((item) => item.rut !== rut));
      return { success: true };
    } catch (err: any) {
      console.error("Error al eliminar usuario:", err);
      return {
        success: false,
        error: err.message || "No se pudo eliminar el usuario de la base de datos.",
      };
    }
  };

  const toggleUsuarioEstado = async (rut: string, nuevoEstado: boolean) => {
    // Actualización optimista inmediata en la interfaz
    setData((prev) =>
      prev.map((user) =>
        user.rut === rut ? { ...user, estado: nuevoEstado } : user
      )
    );

    try {
      const credentials = btoa("admin:admin123");
      let res = await fetch(
        `http://localhost:8080/admin/usuarios/${encodeURIComponent(rut)}/estado`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${credentials}`,
          },
          body: JSON.stringify({ estado: nuevoEstado }),
        }
      );

      // Si el endpoint específico da 404, fallback al endpoint principal de usuarios
      if (res.status === 404) {
        res = await fetch(
          `http://localhost:8080/admin/usuarios/${encodeURIComponent(rut)}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Basic ${credentials}`,
            },
            body: JSON.stringify({ estado: nuevoEstado }),
          }
        );
      }

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || `Error ${res.status}`);
      }

      return { success: true };
    } catch (err: any) {
      console.error("Error al actualizar estado:", err);
      // Revertir cambio local si ocurrió un error en la persistencia
      setData((prev) =>
        prev.map((user) =>
          user.rut === rut ? { ...user, estado: !nuevoEstado } : user
        )
      );
      return {
        success: false,
        error: err.message || "No se pudo actualizar el estado en la base de datos",
      };
    }
  };

  return {
    data,
    setData,
    filteredAndSortedData,
    paginatedData,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    totalItems: filteredAndSortedData.length,
    searchQuery,
    setSearchQuery,
    roleFilter,
    setRoleFilter,
    asignaturaFilter,
    setAsignaturaFilter,
    estadoFilter,
    setEstadoFilter,
    availableAsignaturas,
    hasActiveFilters,
    clearFilters,
    sortState,
    handleSort,
    loading,
    error,
    refetch: fetchUsuarios,
    deleteUsuario,
    toggleUsuarioEstado,
    // Mantener compatibilidad con modales existentes (no se usan pero evitan errores)
    statusFilter: "ALL",
    setStatusFilter: (_v: string) => {},
    methodFilter: "ALL",
    setMethodFilter: (_v: string) => {},
    createInvoice: (_inv: Invoice) => {},
    updateInvoice: (_id: string, _inv: Invoice) => {},
    deleteInvoice: (_id: string) => {},
  };
}
