import React, { useState, useMemo, useEffect, useCallback } from "react";
import type { UserSession } from "@/types/auth";
import {
  Table as UiTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Clock,
  AlertCircle,
  FileText,
  Eye,
  RefreshCw,
  X,
  Send,
  Star,
  Loader2,
} from "lucide-react";
import { sileo } from "sileo";

// ── Interfaz de datos para la fila de estudiante y evidencia ──
export interface EstudianteEvidenciaRow {
  idEstudiante: number | string;
  idEvidencia?: number | null;
  idActividad?: number | null;
  rut: string;
  nombre: string;
  correo: string;
  actividadTitulo: string;
  estadoEntrega: "ENTREGADO" | "PENDIENTE" | "NO_ENTREGADO";
  estadoRevision: "REVISADO" | "PENDIENTE_REVISION" | "OBSERVADO" | "SIN_ENTREGA";
  fechaSubida: string | null;
  fechaSubidaRaw?: string | null;
  nombreArchivo?: string | null;
  archivoUrl?: string | null;
  comentarioEstudiante?: string | null;
  calificacion?: number | null;
  retroalimentacion?: string | null;
  fechaRevision?: string | null;
}

// ── Definición de columnas tipo ColumnDef ──
export interface ColumnDef<T> {
  id: string;
  header: string;
  sortable?: boolean;
  headerClassName?: string;
  className?: string;
  cell: (item: T, onAction?: (action: string, item: T) => void) => React.ReactNode;
}

export type SortDirection = "asc" | "desc" | null;

interface SortState {
  column: keyof EstudianteEvidenciaRow | null;
  direction: SortDirection;
}

// ── Badges con diseño coherente con admin/columns.tsx ──
export function EstadoEntregaBadge({ estado }: { estado: EstudianteEvidenciaRow["estadoEntrega"] }) {
  if (estado === "ENTREGADO") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
        <span className="size-1.5 rounded-full bg-emerald-500" />
        Entregado
      </span>
    );
  }
  if (estado === "PENDIENTE") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/80 shadow-2xs">
        <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
        Pendiente
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 shadow-2xs">
      <span className="size-1.5 rounded-full bg-slate-400" />
      No entregado
    </span>
  );
}

export function EstadoRevisionBadge({
  estado,
  calificacion,
}: {
  estado: EstudianteEvidenciaRow["estadoRevision"];
  calificacion?: number | null;
}) {
  if (estado === "REVISADO") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-200/80 shadow-2xs">
        <span className="size-1.5 rounded-full bg-sky-600" />
        Revisado {calificacion ? `(${calificacion.toFixed(1)})` : ""}
      </span>
    );
  }
  if (estado === "PENDIENTE_REVISION") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-800 border border-orange-200/80 shadow-2xs">
        <span className="size-1.5 rounded-full bg-orange-500" />
        Por revisar
      </span>
    );
  }
  if (estado === "OBSERVADO") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-800 border border-rose-200/80 shadow-2xs">
        <span className="size-1.5 rounded-full bg-rose-500" />
        Con observaciones
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-50 text-slate-400 border border-slate-200/70">
      <span className="size-1.5 rounded-full bg-slate-300" />
      Sin entrega
    </span>
  );
}

interface TableProps {
  user?: UserSession;
}

export function TableEstudiantes({ user }: TableProps) {
  // Datos cargados puramente de la base de datos (sin datos prehechos)
  const [data, setData] = useState<EstudianteEvidenciaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [entregaFilter, setEntregaFilter] = useState<string>("ALL");
  const [revisionFilter, setRevisionFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortState, setSortState] = useState<SortState>({
    column: null,
    direction: null,
  });

  // Modal de revisión y retroalimentación docente
  const [selectedStudent, setSelectedStudent] = useState<EstudianteEvidenciaRow | null>(null);
  const [calificacionInput, setCalificacionInput] = useState<string>("");
  const [retroalimentacionInput, setRetroalimentacionInput] = useState<string>("");
  const [estadoRevisionInput, setEstadoRevisionInput] = useState<"REVISADO" | "OBSERVADO">("REVISADO");
  const [isSavingReview, setIsSavingReview] = useState(false);

  // ── Cargar datos directamente desde la base de datos (Backend Spring Boot) ──
  const fetchEstudiantesYEvidencias = useCallback(async () => {
    setLoading(true);
    try {
      const profesorRut = user?.rut || "11111111-1";

      // Intentar obtener el seguimiento consolidado desde el backend
      const res = await fetch(
        `http://localhost:8080/api/evidencias/seguimiento/profesor/${encodeURIComponent(profesorRut)}`
      );

      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json) && json.length > 0) {
          const rows: EstudianteEvidenciaRow[] = json.map((dto: any) => {
            const formatFecha = dto.fechaSubida
              ? new Date(dto.fechaSubida).toLocaleString("es-CL", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : null;

            return {
              idEstudiante: dto.idEstudiante,
              idEvidencia: dto.idEvidencia,
              idActividad: dto.idActividad,
              rut: dto.rut || "—",
              nombre: dto.nombre || "Estudiante",
              correo: dto.correo || "",
              actividadTitulo: dto.actividadTitulo || "Evidencia de Práctica",
              estadoEntrega: (dto.estadoEntrega as any) || "PENDIENTE",
              estadoRevision: (dto.estadoRevision as any) || "SIN_ENTREGA",
              fechaSubida: formatFecha,
              fechaSubidaRaw: dto.fechaSubida,
              nombreArchivo: dto.nombreArchivo,
              archivoUrl: dto.archivoUrl,
              comentarioEstudiante: dto.comentarioEstudiante,
              calificacion: dto.calificacion,
              retroalimentacion: dto.retroalimentacion,
              fechaRevision: dto.fechaRevision
                ? new Date(dto.fechaRevision).toLocaleString("es-CL")
                : null,
            };
          });

          setData(rows);
          setLoading(false);
          return;
        }
      }

      // Fallback a /api/estudiantes si el endpoint de seguimiento aún no devuelve datos
      const resEstudiantes = await fetch("http://localhost:8080/api/estudiantes");
      if (resEstudiantes.ok) {
        const estJson = await resEstudiantes.json();
        if (Array.isArray(estJson)) {
          const rows: EstudianteEvidenciaRow[] = estJson.map((est: any) => ({
            idEstudiante: est.idEstudiante,
            rut: est.usuario?.rut || "—",
            nombre: est.usuario
              ? `${est.usuario.nombre} ${est.usuario.apellido}`
              : "Estudiante",
            correo: est.usuario?.correo || "",
            actividadTitulo: "Evidencia de Práctica",
            estadoEntrega: "PENDIENTE",
            estadoRevision: "SIN_ENTREGA",
            fechaSubida: null,
            fechaSubidaRaw: null,
            calificacion: null,
            retroalimentacion: null,
          }));
          setData(rows);
        }
      }
    } catch (error) {
      console.error("Error al obtener estudiantes desde la base de datos:", error);
      sileo.error({
        title: "Error de conexión",
        description: "No se pudieron obtener los datos de los estudiantes desde la base de datos.",
      });
    } finally {
      setLoading(false);
    }
  }, [user?.rut]);

  useEffect(() => {
    fetchEstudiantesYEvidencias();
  }, [fetchEstudiantesYEvidencias]);

  // Manejo de ordenamiento por columnas
  const handleSort = (column: keyof EstudianteEvidenciaRow) => {
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

  // Filtrado y ordenamiento de datos
  const filteredAndSortedData = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = data.filter((item) => {
      const matchesEntrega =
        entregaFilter === "ALL" || item.estadoEntrega === entregaFilter;
      if (!matchesEntrega) return false;

      const matchesRevision =
        revisionFilter === "ALL" || item.estadoRevision === revisionFilter;
      if (!matchesRevision) return false;

      if (!query) return true;
      return (
        item.nombre.toLowerCase().includes(query) ||
        item.rut.toLowerCase().includes(query) ||
        item.correo.toLowerCase().includes(query) ||
        (item.nombreArchivo && item.nombreArchivo.toLowerCase().includes(query))
      );
    });

    if (!sortState.column || !sortState.direction) return filtered;

    return [...filtered].sort((a, b) => {
      const col = sortState.column!;
      const valA = a[col] ?? "";
      const valB = b[col] ?? "";
      const comparison = String(valA).localeCompare(String(valB), "es", { numeric: true });
      return sortState.direction === "asc" ? comparison : -comparison;
    });
  }, [data, searchQuery, entregaFilter, revisionFilter, sortState]);

  // Paginación
  const totalPages = Math.max(1, Math.ceil(filteredAndSortedData.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredAndSortedData.slice(start, start + pageSize);
  }, [filteredAndSortedData, page, pageSize]);

  // Modal de revisión
  const handleOpenReview = (item: EstudianteEvidenciaRow) => {
    setSelectedStudent(item);
    setCalificacionInput(item.calificacion ? String(item.calificacion) : "");
    setRetroalimentacionInput(item.retroalimentacion || "");
    setEstadoRevisionInput(item.estadoRevision === "OBSERVADO" ? "OBSERVADO" : "REVISADO");
  };

  const handleSaveReview = async () => {
    if (!selectedStudent) return;
    setIsSavingReview(true);

    const notaNum = calificacionInput ? parseFloat(calificacionInput.replace(",", ".")) : null;

    try {
      if (selectedStudent.idEvidencia) {
        const res = await fetch(`http://localhost:8080/api/evidencias/${selectedStudent.idEvidencia}/revisar`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rutProfesor: user?.rut || "11111111-1",
            retroalimentacion: retroalimentacionInput,
            calificacion: notaNum,
            estado: estadoRevisionInput,
          }),
        });
        if (!res.ok) throw new Error("Error al guardar la revisión en el servidor");
      }

      // Actualizar estado local inmediatamente
      setData((prev) =>
        prev.map((item) =>
          item.rut === selectedStudent.rut
            ? {
                ...item,
                estadoRevision: estadoRevisionInput,
                calificacion: notaNum,
                retroalimentacion: retroalimentacionInput,
                fechaRevision: new Date().toLocaleString("es-CL"),
              }
            : item
        )
      );

      sileo.success({
        title: "Revisión guardada",
        description: `Se registró la retroalimentación para ${selectedStudent.nombre}`,
      });
      setSelectedStudent(null);
    } catch (err) {
      console.error(err);
      sileo.error({
        title: "Error",
        description: "No se pudo guardar la revisión en la base de datos.",
      });
    } finally {
      setIsSavingReview(false);
    }
  };

  // ── Columnas de la tabla con el formato exacto requerido:
  // "Nombre | Estado entrega | Estado revision | Fecha de subida" ──
  const columns: ColumnDef<EstudianteEvidenciaRow>[] = [
    {
      id: "nombre",
      header: "Nombre",
      sortable: true,
      headerClassName: "min-w-[220px]",
      cell: (item) => (
        <div className="flex items-center gap-3 py-1">
          <div className="size-9 rounded-full bg-sky-100 text-sky-800 font-semibold text-xs flex items-center justify-center shrink-0 border border-sky-200">
            {item.nombre
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-slate-900 text-sm">{item.nombre}</span>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
              <span>{item.rut}</span>
              {item.correo && (
                <>
                  <span>•</span>
                  <span className="font-sans truncate max-w-[150px]">{item.correo}</span>
                </>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "estadoEntrega",
      header: "Estado entrega",
      sortable: true,
      headerClassName: "w-[160px]",
      cell: (item) => <EstadoEntregaBadge estado={item.estadoEntrega} />,
    },
    {
      id: "estadoRevision",
      header: "Estado revision",
      sortable: true,
      headerClassName: "w-[180px]",
      cell: (item) => (
        <EstadoRevisionBadge estado={item.estadoRevision} calificacion={item.calificacion} />
      ),
    },
    {
      id: "fechaSubida",
      header: "Fecha de subida",
      sortable: true,
      headerClassName: "w-[170px]",
      cell: (item) => (
        <span className="text-slate-600 text-xs font-mono">
          {item.fechaSubida ? (
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3 text-slate-400" />
              {item.fechaSubida}
            </span>
          ) : (
            <span className="text-slate-400 italic">—</span>
          )}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Acciones",
      headerClassName: "text-right w-[110px]",
      className: "text-right",
      sortable: false,
      cell: (item) => (
        <div className="flex items-center justify-end">
          {item.estadoEntrega === "ENTREGADO" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenReview(item)}
              className="h-8 px-2.5 text-xs font-medium text-sky-800 bg-sky-50/70 hover:bg-sky-100 border-sky-200 cursor-pointer shadow-2xs gap-1.5"
            >
              <Eye className="size-3.5 text-sky-700" />
              <span>{item.estadoRevision === "REVISADO" ? "Ver/Editar" : "Revisar"}</span>
            </Button>
          ) : (
            <span className="text-xs text-slate-400 italic px-2">Sin archivo</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* ── Barra superior: Buscador, Filtros y Botón de Sincronizar con el círculo ── */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Buscador */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Buscar estudiante por nombre, RUT o correo..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="pl-9 text-sm h-10 bg-slate-50/50 border-slate-200 focus-visible:bg-white"
            />
          </div>

          {/* Filtros y Botón Sincronizar */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Filtro Estado Entrega */}
            <select
              value={entregaFilter}
              onChange={(e) => {
                setEntregaFilter(e.target.value);
                setPage(1);
              }}
              className="h-10 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20 cursor-pointer w-full sm:w-auto"
            >
              <option value="ALL">Entrega: Todos</option>
              <option value="ENTREGADO">Entregados</option>
              <option value="PENDIENTE">Pendientes</option>
              <option value="NO_ENTREGADO">No entregados</option>
            </select>

            {/* Filtro Estado Revisión */}
            <select
              value={revisionFilter}
              onChange={(e) => {
                setRevisionFilter(e.target.value);
                setPage(1);
              }}
              className="h-10 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20 cursor-pointer w-full sm:w-auto"
            >
              <option value="ALL">Revisión: Todos</option>
              <option value="REVISADO">Revisados</option>
              <option value="PENDIENTE_REVISION">Por revisar</option>
              <option value="OBSERVADO">Con observaciones</option>
              <option value="SIN_ENTREGA">Sin entrega</option>
            </select>

            {(searchQuery || entregaFilter !== "ALL" || revisionFilter !== "ALL") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setEntregaFilter("ALL");
                  setRevisionFilter("ALL");
                  setPage(1);
                }}
                className="h-10 text-xs text-slate-500 hover:text-slate-800"
              >
                Limpiar
              </Button>
            )}

            {/* Botón Sincronizar con el icono de círculo */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fetchEstudiantesYEvidencias().finally(() => {
                  sileo.success({ title: "Sincronizado", description: "Datos actualizados desde la base de datos" });
                });
              }}
              disabled={loading}
              className="h-10 px-3.5 gap-2 text-xs font-medium cursor-pointer shrink-0 bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
              title="Sincronizar con la base de datos"
            >
              <RefreshCw className={`size-4 text-slate-600 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Sincronizar</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ── Tabla Principal con el diseño de data-table.tsx ── */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden flex flex-col justify-between min-h-[380px]">
        <div className="flex-1 overflow-x-auto">
          <UiTable>
            <TableHeader className="bg-slate-50/75 border-b border-slate-200">
              <TableRow>
                {columns.map((column) => {
                  const isSorted = sortState.column === column.id;
                  return (
                    <TableHead
                      key={column.id}
                      className={`text-xs font-bold text-slate-700 uppercase tracking-wider py-3.5 ${
                        column.headerClassName || column.className || ""
                      }`}
                    >
                      {column.sortable ? (
                        <button
                          type="button"
                          onClick={() => handleSort(column.id as keyof EstudianteEvidenciaRow)}
                          className="inline-flex items-center gap-1.5 hover:text-slate-900 cursor-pointer select-none"
                        >
                          <span>{column.header}</span>
                          <span className="text-xs text-slate-400 font-mono">
                            {isSorted
                              ? sortState.direction === "asc"
                                ? "↑"
                                : sortState.direction === "desc"
                                ? "↓"
                                : "↕"
                              : "↕"}
                          </span>
                        </button>
                      ) : (
                        column.header
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-44 text-center text-slate-500 text-sm">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="size-6 text-sky-600 animate-spin" />
                      <p className="font-medium text-slate-700">Cargando estudiantes desde la base de datos...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-44 text-center text-slate-500 text-sm">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="size-6 text-slate-400" />
                      <p className="font-medium">No se encontraron registros en la base de datos.</p>
                      <p className="text-xs text-slate-400">Intenta modificar los términos de búsqueda o sincronizar.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((row) => (
                  <TableRow
                    key={row.rut}
                    className="hover:bg-slate-50/80 transition-colors h-14 border-b border-slate-100 last:border-none"
                  >
                    {columns.map((column) => (
                      <TableCell key={column.id} className={column.className || ""}>
                        {column.cell(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </UiTable>
        </div>

        {/* ── Barra de paginación inferior idéntica a data-table.tsx ── */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-500">
          <div>
            Mostrando{" "}
            <span className="font-semibold text-slate-700">
              {filteredAndSortedData.length === 0 ? 0 : (page - 1) * pageSize + 1}
            </span>{" "}
            a{" "}
            <span className="font-semibold text-slate-700">
              {Math.min(page * pageSize, filteredAndSortedData.length)}
            </span>{" "}
            de <span className="font-semibold text-slate-700">{filteredAndSortedData.length}</span> estudiantes
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500">Mostrar</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="h-8 text-xs bg-white border border-slate-200 rounded px-2 text-slate-700 cursor-pointer"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>

            <Pagination className="w-auto">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    aria-disabled={page <= 1}
                    className={page <= 1 ? "pointer-events-none opacity-40" : "cursor-pointer"}
                  />
                </PaginationItem>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                  <PaginationItem key={num}>
                    <PaginationLink
                      isActive={page === num}
                      onClick={() => setPage(num)}
                      className="cursor-pointer size-8 text-xs"
                    >
                      {num}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    aria-disabled={page >= totalPages}
                    className={page >= totalPages ? "pointer-events-none opacity-40" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      </div>

      {/* ── Modal de Revisión y Retroalimentación Docente ── */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Cabecera del modal */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                  {selectedStudent.nombre.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Revisión de Evidencia: {selectedStudent.nombre}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    RUT {selectedStudent.rut} • {selectedStudent.actividadTitulo}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="size-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Contenido del modal */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-sm">
              {/* Información del archivo entregado */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <FileText className="size-3.5 text-sky-600" />
                    Archivo Adjunto
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{selectedStudent.fechaSubida}</span>
                </div>
                <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="size-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                      <FileText className="size-4" />
                    </div>
                    <span className="text-xs font-medium text-slate-800 truncate">
                      {selectedStudent.nombreArchivo || "Documento_Evidencia.pdf"}
                    </span>
                  </div>
                  <a
                    href={selectedStudent.archivoUrl || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-md transition-colors shrink-0"
                  >
                    Ver archivo
                  </a>
                </div>

                {selectedStudent.comentarioEstudiante && (
                  <div className="text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-200">
                    <span className="font-semibold text-slate-700 block mb-1">Comentario del alumno:</span>
                    <p className="italic">"{selectedStudent.comentarioEstudiante}"</p>
                  </div>
                )}
              </div>

              {/* Formulario de Revisión Docente */}
              <div className="space-y-4 pt-1">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Star className="size-3.5 text-amber-500" />
                  Evaluación y Retroalimentación
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  {/* Calificación */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Calificación (1.0 - 7.0)
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      min="1.0"
                      max="7.0"
                      placeholder="Ej: 6.5"
                      value={calificacionInput}
                      onChange={(e) => setCalificacionInput(e.target.value)}
                      className="text-sm h-10 font-mono"
                    />
                  </div>

                  {/* Estado de revisión */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Estado de la Evidencia
                    </label>
                    <select
                      value={estadoRevisionInput}
                      onChange={(e) => setEstadoRevisionInput(e.target.value as any)}
                      className="w-full h-10 text-xs font-medium bg-white border border-slate-200 rounded-lg px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20 cursor-pointer"
                    >
                      <option value="REVISADO">Aprobado / Revisado</option>
                      <option value="OBSERVADO">Con Observaciones</option>
                    </select>
                  </div>
                </div>

                {/* Campo de Retroalimentación formativa */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Retroalimentación Pedagógica Formativa
                  </label>
                  <textarea
                    rows={4}
                    value={retroalimentacionInput}
                    onChange={(e) => setRetroalimentacionInput(e.target.value)}
                    placeholder="Escribe aquí las fortalezas observadas, aspectos a mejorar y recomendaciones para el desempeño en aula..."
                    className="w-full text-xs text-slate-800 p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 bg-slate-50/50 focus:bg-white transition-all resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Footer del modal */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedStudent(null)}
                className="h-9 px-4 text-xs cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleSaveReview}
                disabled={isSavingReview}
                className="h-9 px-4 text-xs font-semibold bg-sky-700 hover:bg-sky-800 text-white cursor-pointer gap-1.5 shadow-2xs"
              >
                <Send className="size-3.5" />
                <span>{isSavingReview ? "Guardando..." : "Guardar Revisión"}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TableEstudiantes;
