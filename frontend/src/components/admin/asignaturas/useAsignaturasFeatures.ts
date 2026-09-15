import { useState, useMemo, useEffect, useCallback } from "react";
import type { Asignatura, AsignaturaSortState, SortDirection } from "./types";

export function sortAsignaturas(
  items: Asignatura[],
  column: keyof Asignatura | null,
  direction: SortDirection
): Asignatura[] {
  if (!column || !direction) return items;

  return [...items].sort((a, b) => {
    const valA = a[column] ?? "";
    const valB = b[column] ?? "";

    if (column === "idAsignatura") {
      const numA = Number(valA) || 0;
      const numB = Number(valB) || 0;
      return direction === "asc" ? numA - numB : numB - numA;
    }

    if (column === "semestre") {
      const numA = parseInt(String(valA), 10);
      const numB = parseInt(String(valB), 10);
      if (!isNaN(numA) && !isNaN(numB)) {
        return direction === "asc" ? numA - numB : numB - numA;
      }
    }

    const comparison = String(valA).localeCompare(String(valB));
    return direction === "asc" ? comparison : -comparison;
  });
}

export function filterAsignaturas(
  items: Asignatura[],
  searchQuery: string,
  semestreFilter: string = "ALL"
): Asignatura[] {
  const query = searchQuery.trim().toLowerCase();

  return items.filter((item) => {
    const matchesSemestre =
      semestreFilter === "ALL" ||
      String(item.semestre ?? "").trim() === semestreFilter.trim();

    if (!matchesSemestre) return false;

    if (!query) return true;

    const nombre = (item.nombre || "").toLowerCase();
    const descripcion = (item.descripcion || "").toLowerCase();
    const semestre = String(item.semestre || "").toLowerCase();
    const id = String(item.idAsignatura || "");

    return (
      nombre.includes(query) ||
      descripcion.includes(query) ||
      semestre.includes(query) ||
      id.includes(query)
    );
  });
}

export function useAsignaturasFeatures(initialPageSize = 10) {
  const [data, setData] = useState<Asignatura[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [semestreFilter, setSemestreFilter] = useState("ALL");

  const [sortState, setSortState] = useState<AsignaturaSortState>({
    column: "idAsignatura",
    direction: "asc",
  });

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Cargar asignaturas desde el backend
  const fetchAsignaturas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:8080/api/asignaturas");
      if (!res.ok) {
        throw new Error(`Error ${res.status}: No se pudieron cargar las asignaturas.`);
      }
      const json = await res.json();
      if (Array.isArray(json)) {
        setData(json);
      } else {
        setData([]);
      }
    } catch (err: any) {
      console.error("Error al obtener asignaturas:", err);
      setError("No se pudieron cargar las asignaturas desde la base de datos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAsignaturas();
  }, [fetchAsignaturas]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, semestreFilter, pageSize]);

  // Semestres únicos disponibles para el filtro
  const availableSemestres = useMemo(() => {
    const semestres = new Set<string>();
    data.forEach((item) => {
      if (item.semestre && item.semestre.trim() !== "") {
        semestres.add(item.semestre.trim());
      }
    });
    return Array.from(semestres).sort((a, b) => {
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });
  }, [data]);

  const hasActiveFilters = useMemo(() => {
    return searchQuery.trim() !== "" || semestreFilter !== "ALL";
  }, [searchQuery, semestreFilter]);

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setSemestreFilter("ALL");
    setPage(1);
  }, []);

  const handleSort = (column: keyof Asignatura) => {
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

  // Filtrado y ordenamiento en tiempo real
  const filteredData = useMemo(() => {
    return filterAsignaturas(data, searchQuery, semestreFilter);
  }, [data, searchQuery, semestreFilter]);

  const sortedData = useMemo(() => {
    return sortAsignaturas(filteredData, sortState.column, sortState.direction);
  }, [filteredData, sortState.column, sortState.direction]);

  const totalItems = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, page, pageSize]);

  // Eliminar asignatura llamando al backend
  const deleteAsignatura = async (id: number): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`http://localhost:8080/api/asignaturas/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(
          json?.error || `Error ${res.status}: No se pudo eliminar la asignatura.`
        );
      }

      // Actualizar estado local inmediatamente
      setData((prev) => prev.filter((item) => item.idAsignatura !== id));
      return { success: true };
    } catch (err: any) {
      console.error("Error al eliminar asignatura:", err);
      return { success: false, error: err.message || "Error al eliminar la asignatura." };
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
    semestreFilter,
    setSemestreFilter,
    availableSemestres,
    hasActiveFilters,
    clearFilters,
    sortState,
    handleSort,
    refetch: fetchAsignaturas,
    deleteAsignatura,
  };
}
