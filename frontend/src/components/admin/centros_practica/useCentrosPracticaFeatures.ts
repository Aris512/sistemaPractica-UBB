import { useState, useMemo, useEffect, useCallback } from "react";
import type { CentroPractica, CentroPracticaSortState, SortDirection } from "./types";

export function sortCentros(
  items: CentroPractica[],
  column: keyof CentroPractica | null,
  direction: SortDirection
): CentroPractica[] {
  if (!column || !direction) return items;

  return [...items].sort((a, b) => {
    const valA = a[column] ?? "";
    const valB = b[column] ?? "";

    if (column === "idCentro") {
      const numA = Number(valA) || 0;
      const numB = Number(valB) || 0;
      return direction === "asc" ? numA - numB : numB - numA;
    }

    const comparison = String(valA).localeCompare(String(valB));
    return direction === "asc" ? comparison : -comparison;
  });
}

export function filterCentros(items: CentroPractica[], searchQuery: string): CentroPractica[] {
  const query = searchQuery.trim().toLowerCase();
  if (!query) return items;

  return items.filter((item) => {
    const nombre = (item.nombre || "").toLowerCase();
    const direccion = (item.direccion || "").toLowerCase();
    const id = String(item.idCentro || "");
    return nombre.includes(query) || direccion.includes(query) || id.includes(query);
  });
}

export function useCentrosPracticaFeatures(initialPageSize = 10) {
  const [data, setData] = useState<CentroPractica[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortState, setSortState] = useState<CentroPracticaSortState>({
    column: "idCentro",
    direction: "asc",
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const fetchCentros = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:8080/api/centros-practica");
      if (!res.ok) {
        throw new Error(`Error ${res.status}: No se pudieron cargar los centros de práctica.`);
      }
      const json = await res.json();
      setData(Array.isArray(json) ? json : []);
    } catch (err: any) {
      console.error("Error al obtener centros:", err);
      setError("No se pudieron cargar los centros de práctica desde la base de datos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCentros();
  }, [fetchCentros]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, pageSize]);

  const hasActiveFilters = useMemo(() => searchQuery.trim() !== "", [searchQuery]);

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setPage(1);
  }, []);

  const handleSort = (column: keyof CentroPractica) => {
    setSortState((prev) => {
      if (prev.column !== column) return { column, direction: "asc" };
      if (prev.direction === "asc") return { column, direction: "desc" };
      return { column: null, direction: null };
    });
  };

  const filteredData = useMemo(() => filterCentros(data, searchQuery), [data, searchQuery]);
  const sortedData = useMemo(() => sortCentros(filteredData, sortState.column, sortState.direction), [filteredData, sortState.column, sortState.direction]);

  const totalItems = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, page, pageSize]);

  const deleteCentro = async (id: number): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`http://localhost:8080/api/centros-practica/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error || `Error ${res.status}: No se pudo eliminar el centro de práctica.`);
      }
      setData((prev) => prev.filter((item) => item.idCentro !== id));
      return { success: true };
    } catch (err: any) {
      console.error("Error al eliminar centro:", err);
      return { success: false, error: err.message || "Error al eliminar el centro de práctica." };
    }
  };

  return {
    data,
    paginatedData,
    loading,
    error,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    totalItems,
    searchQuery,
    setSearchQuery,
    hasActiveFilters,
    clearFilters,
    sortState,
    handleSort,
    refetch: fetchCentros,
    deleteCentro,
  };
}
