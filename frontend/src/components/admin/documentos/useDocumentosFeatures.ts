import { useState, useMemo, useEffect, useCallback } from "react";
import type {
  EstudianteDocumentoRow,
  EstudianteDetalleDocumentos,
  DocumentoItem,
  DocumentosSortState,
  SortDirection,
} from "./types";
import { sileo } from "sileo";

export function sortEstudiantes(
  items: EstudianteDocumentoRow[],
  column: keyof EstudianteDocumentoRow | null,
  direction: SortDirection
): EstudianteDocumentoRow[] {
  if (!column || !direction) return items;

  return [...items].sort((a, b) => {
    const valA = a[column] ?? "";
    const valB = b[column] ?? "";

    if (column === "progreso" || column === "totalDocumentos") {
      const numA = Number(valA) || 0;
      const numB = Number(valB) || 0;
      return direction === "asc" ? numA - numB : numB - numA;
    }

    const comparison = String(valA).localeCompare(String(valB));
    return direction === "asc" ? comparison : -comparison;
  });
}

export function filterEstudiantes(
  items: EstudianteDocumentoRow[],
  searchQuery: string,
  asignaturaFilter: string = "ALL",
  estadoFilter: string = "ALL"
): EstudianteDocumentoRow[] {
  const query = searchQuery.trim().toLowerCase();

  return items.filter((item) => {
    const matchesAsignatura =
      asignaturaFilter === "ALL" ||
      item.asignatura.toLowerCase() === asignaturaFilter.toLowerCase();

    if (!matchesAsignatura) return false;

    const matchesEstado =
      estadoFilter === "ALL" ||
      item.estado.toLowerCase() === estadoFilter.toLowerCase();

    if (!matchesEstado) return false;

    if (!query) return true;

    return (
      item.rut.toLowerCase().includes(query) ||
      item.nombre.toLowerCase().includes(query) ||
      item.correo.toLowerCase().includes(query) ||
      item.asignatura.toLowerCase().includes(query)
    );
  });
}

export function useDocumentosFeatures(initialPageSize = 10) {
  const [data, setData] = useState<EstudianteDocumentoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [asignaturaFilter, setAsignaturaFilter] = useState("ALL");
  const [estadoFilter, setEstadoFilter] = useState("ALL");

  const [sortState, setSortState] = useState<DocumentosSortState>({
    column: "progreso",
    direction: "desc",
  });

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Detalle de estudiante
  const [selectedStudentDetail, setSelectedStudentDetail] =
    useState<EstudianteDetalleDocumentos | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const getAuthHeader = () => {
    return {
      Authorization: `Basic ${btoa("admin:admin123")}`,
    };
  };

  // Cargar estudiantes con su progreso desde el backend
  const fetchEstudiantes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:8080/admin/documentos/estudiantes", {
        headers: getAuthHeader(),
      });
      if (!res.ok) {
        throw new Error(`Error ${res.status}: No se pudo consultar la documentación.`);
      }
      const json = await res.json();
      if (Array.isArray(json)) {
        setData(json);
      } else {
        setData([]);
      }
    } catch (err: any) {
      console.error("Error al obtener documentación de estudiantes:", err);
      setError("No se pudieron cargar los documentos desde la base de datos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEstudiantes();
  }, [fetchEstudiantes]);

  // Reset page al cambiar filtros
  useEffect(() => {
    setPage(1);
  }, [searchQuery, asignaturaFilter, estadoFilter, pageSize]);

  // Lista de asignaturas disponibles para el filtro
  const availableAsignaturas = useMemo(() => {
    const set = new Set<string>();
    data.forEach((item) => {
      if (item.asignatura && item.asignatura !== "—") {
        set.add(item.asignatura);
      }
    });
    return Array.from(set).sort();
  }, [data]);

  const hasActiveFilters = useMemo(() => {
    return searchQuery.trim() !== "" || asignaturaFilter !== "ALL" || estadoFilter !== "ALL";
  }, [searchQuery, asignaturaFilter, estadoFilter]);

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setAsignaturaFilter("ALL");
    setEstadoFilter("ALL");
    setPage(1);
  }, []);

  const handleSort = (column: keyof EstudianteDocumentoRow) => {
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

  const filteredData = useMemo(() => {
    return filterEstudiantes(data, searchQuery, asignaturaFilter, estadoFilter);
  }, [data, searchQuery, asignaturaFilter, estadoFilter]);

  const sortedData = useMemo(() => {
    return sortEstudiantes(filteredData, sortState.column, sortState.direction);
  }, [filteredData, sortState.column, sortState.direction]);

  const totalItems = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, page, pageSize]);

  // Consultar detalle de un estudiante para el modal
  const fetchStudentDetail = async (rut: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`http://localhost:8080/admin/documentos/estudiantes/${encodeURIComponent(rut)}`, {
        headers: getAuthHeader(),
      });
      if (!res.ok) {
        throw new Error(`Error ${res.status}: No se pudo cargar el detalle del estudiante.`);
      }
      const json = await res.json();
      setSelectedStudentDetail(json);
    } catch (err: any) {
      console.error("Error al obtener detalle del estudiante:", err);
      sileo.error({
        title: "Error al cargar detalle",
        description: err.message || "No se pudo obtener el expediente de documentos.",
      });
    } finally {
      setDetailLoading(false);
    }
  };

  // Descargar archivo individual
  const downloadSingleFile = async (doc: DocumentoItem) => {
    if (!doc.id) {
      sileo.error({
        title: "Archivo no disponible",
        description: "Este documento aún no ha sido entregado.",
      });
      return;
    }

    try {
      sileo.show({
        title: "Descargando archivo",
        description: `Preparando ${doc.nombreArchivo}...`,
      });

      const res = await fetch(`http://localhost:8080/admin/documentos/archivo/${doc.id}`, {
        headers: getAuthHeader(),
      });

      if (!res.ok) {
        throw new Error(`Error ${res.status}: No se pudo descargar el archivo.`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.nombreArchivo || `documento_${doc.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      sileo.success({
        title: "Descarga completada",
        description: `Se descargó "${doc.nombreArchivo}" con éxito.`,
      });
    } catch (err: any) {
      console.error("Error al descargar archivo:", err);
      sileo.error({
        title: "Error de descarga",
        description: err.message || "No se pudo completar la descarga del archivo.",
      });
    }
  };

  // Descargar todos los documentos en formato ZIP
  const downloadStudentZip = async (rut: string, studentName?: string) => {
    try {
      const student = data.find((s) => s.rut === rut) || (selectedStudentDetail?.rut === rut ? selectedStudentDetail : null);
      const rawName = studentName || student?.nombre || "estudiante";
      const cleanName = rawName.trim().replace(/\s+/g, "_");
      const fallbackFilename = `${cleanName}_expediente.zip`;

      sileo.show({
        title: "Generando archivo ZIP",
        description: `Comprimiendo la documentación de ${rawName}...`,
      });

      const res = await fetch(
        `http://localhost:8080/admin/documentos/estudiantes/${encodeURIComponent(rut)}/descargar`,
        {
          headers: getAuthHeader(),
        }
      );

      if (!res.ok) {
        throw new Error(`Error ${res.status}: No se pudo generar el archivo ZIP.`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      // Extraer nombre de archivo si viene en el header Content-Disposition
      const disposition = res.headers.get("Content-Disposition");
      let filename = fallbackFilename;
      if (disposition && disposition.includes("filename=")) {
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, "");
        }
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      sileo.success({
        title: "ZIP descargado con éxito",
        description: `Se guardó "${filename}" correctamente.`,
      });
    } catch (err: any) {
      console.error("Error al descargar ZIP:", err);
      sileo.error({
        title: "Error al generar ZIP",
        description: err.message || "Ocurrió un problema al descargar los documentos.",
      });
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
    asignaturaFilter,
    setAsignaturaFilter,
    estadoFilter,
    setEstadoFilter,
    availableAsignaturas,
    hasActiveFilters,
    clearFilters,
    sortState,
    handleSort,
    refetch: fetchEstudiantes,
    selectedStudentDetail,
    setSelectedStudentDetail,
    detailLoading,
    fetchStudentDetail,
    downloadSingleFile,
    downloadStudentZip,
  };
}
