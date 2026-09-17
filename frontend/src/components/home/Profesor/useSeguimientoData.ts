import { useState, useMemo, useEffect, useCallback } from "react";
import type { EstudianteEvidenciaRow, SortState } from "./types";

export function useSeguimientoData(userRut?: string) {
  const [data, setData] = useState<EstudianteEvidenciaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [entregaFilter, setEntregaFilter] = useState("ALL");
  const [revisionFilter, setRevisionFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortState, setSortState] = useState<SortState>({ column: null, direction: null });

  const fetchEstudiantesYEvidencias = useCallback(async () => {
    setLoading(true);
    try {
      const profesorRut = userRut || "11111111-1";
      const res = await fetch(
        `http://localhost:8080/api/evidencias/seguimiento/profesor/${encodeURIComponent(profesorRut)}`
      );

      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json) && json.length > 0) {
          const rows: EstudianteEvidenciaRow[] = json.map((dto: any) => ({
            idEstudiante: dto.idEstudiante,
            idEvidencia: dto.idEvidencia,
            idActividad: dto.idActividad,
            rut: dto.rut || "—",
            nombre: dto.nombre || "Estudiante",
            correo: dto.correo || "",
            actividadTitulo: dto.actividadTitulo || "Evidencia de Práctica",
            estadoEntrega: dto.estadoEntrega || "PENDIENTE",
            estadoRevision: dto.estadoRevision || "SIN_ENTREGA",
            fechaSubida: dto.fechaSubida
              ? new Date(dto.fechaSubida).toLocaleString("es-CL", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : null,
            fechaSubidaRaw: dto.fechaSubida,
            nombreArchivo: dto.nombreArchivo,
            archivoUrl: dto.archivoUrl,
            comentarioEstudiante: dto.comentarioEstudiante,
            calificacion: dto.calificacion,
            retroalimentacion: dto.retroalimentacion,
            fechaRevision: dto.fechaRevision ? new Date(dto.fechaRevision).toLocaleString("es-CL") : null,
          }));
          setData(rows);
          return;
        }
      }

      const resEst = await fetch("http://localhost:8080/api/estudiantes");
      if (resEst.ok) {
        const estJson = await resEst.json();
        if (Array.isArray(estJson)) {
          setData(
            estJson.map((est: any) => ({
              idEstudiante: est.idEstudiante,
              rut: est.usuario?.rut || "—",
              nombre: est.usuario ? `${est.usuario.nombre} ${est.usuario.apellido}` : "Estudiante",
              correo: est.usuario?.correo || "",
              actividadTitulo: "Evidencia de Práctica",
              estadoEntrega: "PENDIENTE",
              estadoRevision: "SIN_ENTREGA",
              fechaSubida: null,
              calificacion: null,
              retroalimentacion: null,
            }))
          );
        }
      }
    } catch (error) {
      console.error("Error al obtener datos de la base de datos:", error);
    } finally {
      setLoading(false);
    }
  }, [userRut]);

  useEffect(() => {
    fetchEstudiantesYEvidencias();
  }, [fetchEstudiantesYEvidencias]);

  const handleSort = (column: keyof EstudianteEvidenciaRow) => {
    setSortState((prev) => {
      if (prev.column !== column) return { column, direction: "asc" };
      if (prev.direction === "asc") return { column, direction: "desc" };
      return { column: null, direction: null };
    });
  };

  const filteredAndSortedData = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = data.filter((item) => {
      if (entregaFilter !== "ALL" && item.estadoEntrega !== entregaFilter) return false;
      if (revisionFilter !== "ALL" && item.estadoRevision !== revisionFilter) return false;
      if (!query) return true;
      return (
        item.nombre.toLowerCase().includes(query) ||
        item.rut.toLowerCase().includes(query) ||
        item.correo.toLowerCase().includes(query)
      );
    });

    if (!sortState.column || !sortState.direction) return filtered;
    return [...filtered].sort((a, b) => {
      const col = sortState.column!;
      const valA = String(a[col] ?? "");
      const valB = String(b[col] ?? "");
      const comp = valA.localeCompare(valB, "es", { numeric: true });
      return sortState.direction === "asc" ? comp : -comp;
    });
  }, [data, searchQuery, entregaFilter, revisionFilter, sortState]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedData.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredAndSortedData.slice(start, start + pageSize);
  }, [filteredAndSortedData, page, pageSize]);

  return {
    data,
    setData,
    loading,
    searchQuery,
    setSearchQuery,
    entregaFilter,
    setEntregaFilter,
    revisionFilter,
    setRevisionFilter,
    page,
    setPage,
    pageSize,
    setPageSize,
    sortState,
    handleSort,
    totalPages,
    totalItems: filteredAndSortedData.length,
    paginatedData,
    refetch: fetchEstudiantesYEvidencias,
  };
}
