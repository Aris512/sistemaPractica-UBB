import { useState, useMemo, useEffect, useCallback } from "react";

// ── Tipo principal para la tabla de usuarios ──
export interface UsuarioRow {
  rut: string;
  nombre: string;
  rol: string;
  curso: string;
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
  roleFilter: string = "ALL"
): UsuarioRow[] {
  const query = searchQuery.trim().toLowerCase();

  return items.filter((item) => {
    const matchesRole =
      roleFilter === "ALL" ||
      item.rol.toLowerCase() === roleFilter.toLowerCase();

    if (!matchesRole) return false;
    if (!query) return true;

    return (
      item.rut.toLowerCase().includes(query) ||
      item.nombre.toLowerCase().includes(query) ||
      item.rol.toLowerCase().includes(query) ||
      item.curso.toLowerCase().includes(query)
    );
  });
}

// ── Hook principal: fetch de usuarios reales ──
export function useDataTableFeatures(
  _initialData?: unknown,
  defaultPageSize: number = 5
) {
  const [data, setData] = useState<UsuarioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(defaultPageSize);
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
        (u: { rut: string; nombre: string; roles: string[]; correo: string; curso?: string }) => ({
          rut: u.rut,
          nombre: u.nombre,
          rol: u.roles.length > 0 ? u.roles[0] : "SIN ROL",
          curso: u.curso || "—",
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
  }, [searchQuery, roleFilter]);

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

  const filteredAndSortedData = useMemo(() => {
    const filtered = filterUsuarios(data, searchQuery, roleFilter);
    return sortUsuarios(filtered, sortState.column, sortState.direction);
  }, [data, searchQuery, roleFilter, sortState]);

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
    return Boolean(searchQuery.trim() !== "" || roleFilter !== "ALL");
  }, [searchQuery, roleFilter]);

  const clearFilters = () => {
    setSearchQuery("");
    setRoleFilter("ALL");
    setPage(1);
  };

  // ── Operaciones CRUD (stub para mantener la interfaz) ──
  const deleteUsuario = (rut: string) => {
    setData((prev) => prev.filter((item) => item.rut !== rut));
  };

  return {
    data,
    setData,
    filteredAndSortedData,
    paginatedData,
    page,
    setPage,
    pageSize,
    totalPages,
    totalItems: filteredAndSortedData.length,
    searchQuery,
    setSearchQuery,
    roleFilter,
    setRoleFilter,
    hasActiveFilters,
    clearFilters,
    sortState,
    handleSort,
    loading,
    error,
    refetch: fetchUsuarios,
    deleteUsuario,
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
