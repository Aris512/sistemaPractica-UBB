import { useState } from "react";
import type { UserSession } from "@/types/auth";
import type { EstudianteEvidenciaRow } from "./types";
import { useSeguimientoData } from "./useSeguimientoData";
import { TableToolbar } from "./TableToolbar";
import { EstadoEntregaBadge, EstadoRevisionBadge } from "./TableBadges";
import { RevisionModal } from "./RevisionModal";
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
import { Clock, AlertCircle, Eye, Loader2 } from "lucide-react";
import { sileo } from "sileo";

const HEADERS: { id: keyof EstudianteEvidenciaRow; label: string; width: string }[] = [
  { id: "nombre", label: "Nombre", width: "min-w-[200px]" },
  { id: "estadoEntrega", label: "Estado entrega", width: "w-[160px]" },
  { id: "estadoRevision", label: "Estado revision", width: "w-[180px]" },
  { id: "fechaSubida", label: "Fecha de subida", width: "w-[170px]" },
];

export function TableEstudiantes({ user }: { user?: UserSession }) {
  const {
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
    totalItems,
    paginatedData,
    refetch,
  } = useSeguimientoData(user?.rut);

  const [selectedStudent, setSelectedStudent] = useState<EstudianteEvidenciaRow | null>(null);

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* ── Barra superior: Buscador, Filtros y Sincronizar ── */}
      <TableToolbar
        searchQuery={searchQuery}
        onSearchChange={(val) => { setSearchQuery(val); setPage(1); }}
        entregaFilter={entregaFilter}
        onEntregaFilterChange={(val) => { setEntregaFilter(val); setPage(1); }}
        revisionFilter={revisionFilter}
        onRevisionFilterChange={(val) => { setRevisionFilter(val); setPage(1); }}
        onClearFilters={() => { setSearchQuery(""); setEntregaFilter("ALL"); setRevisionFilter("ALL"); setPage(1); }}
        onSync={() => refetch().finally(() => sileo.success({ title: "Sincronizado", description: "Datos actualizados desde la BD" }))}
        loading={loading}
      />

      {/* ── Tabla de estudiantes: Nombre | Estado entrega | Estado revision | Fecha de subida ── */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden flex flex-col justify-between min-h-[380px]">
        <div className="flex-1 overflow-x-auto">
          <UiTable>
            <TableHeader className="bg-slate-50/75 border-b border-slate-200">
              <TableRow>
                {HEADERS.map((h) => (
                  <TableHead key={h.id} className={`text-xs font-bold text-slate-700 uppercase tracking-wider py-3.5 ${h.width}`}>
                    <button
                      type="button"
                      onClick={() => handleSort(h.id)}
                      className="inline-flex items-center gap-1.5 hover:text-slate-900 cursor-pointer"
                    >
                      <span>{h.label}</span>
                      <span className="text-xs text-slate-400 font-mono">
                        {sortState.column === h.id ? (sortState.direction === "asc" ? "↑" : "↓") : "↕"}
                      </span>
                    </button>
                  </TableHead>
                ))}
                <TableHead className="text-right text-xs font-bold text-slate-700 uppercase tracking-wider py-3.5 w-[110px]">
                  Acciones
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-44 text-center text-slate-500 text-sm">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="size-6 text-sky-600 animate-spin" />
                      <p className="font-medium text-slate-700">Cargando estudiantes desde la base de datos...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-44 text-center text-slate-500 text-sm">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="size-6 text-slate-400" />
                      <p className="font-medium">No se encontraron registros en la base de datos.</p>
                      <p className="text-xs text-slate-400">Intenta modificar los términos de búsqueda o sincronizar.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((row) => (
                  <TableRow key={row.rut} className="hover:bg-slate-50/80 transition-colors h-14 border-b border-slate-100 last:border-none">
                    {/* Solo el nombre del estudiante en el atributo nombre de la tabla */}
                    <TableCell className="font-semibold text-slate-900 text-sm py-3.5">
                      {row.nombre}
                    </TableCell>

                    <TableCell>
                      <EstadoEntregaBadge estado={row.estadoEntrega} />
                    </TableCell>

                    <TableCell>
                      <EstadoRevisionBadge estado={row.estadoRevision} calificacion={row.calificacion} />
                    </TableCell>

                    <TableCell className="text-slate-600 text-xs font-mono">
                      {row.fechaSubida ? (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="size-3 text-slate-400" />
                          {row.fechaSubida}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">—</span>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      {row.estadoEntrega === "ENTREGADO" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedStudent(row)}
                          className="h-8 px-2.5 text-xs font-medium text-sky-800 bg-sky-50/70 hover:bg-sky-100 border-sky-200 cursor-pointer shadow-2xs gap-1.5"
                        >
                          <Eye className="size-3.5 text-sky-700" />
                          <span>{row.estadoRevision === "REVISADO" ? "Ver/Editar" : "Revisar"}</span>
                        </Button>
                      ) : (
                        <span className="text-xs text-slate-400 italic px-2">Sin archivo</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </UiTable>
        </div>

        {/* ── Paginación inferior ── */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-500">
          <div>
            Mostrando <span className="font-semibold text-slate-700">{paginatedData.length === 0 ? 0 : (page - 1) * pageSize + 1}</span> a{" "}
            <span className="font-semibold text-slate-700">{Math.min(page * pageSize, totalItems)}</span> de{" "}
            <span className="font-semibold text-slate-700">{totalItems}</span> estudiantes
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span>Mostrar</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
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

      {/* ── Modal de Revisión ── */}
      <RevisionModal
        student={selectedStudent}
        profesorRut={user?.rut}
        onClose={() => setSelectedStudent(null)}
        onSaved={(updated) => {
          setData((prev) =>
            prev.map((item) =>
              item.rut === updated.rut
                ? {
                    ...item,
                    estadoRevision: updated.estadoRevision,
                    calificacion: updated.calificacion,
                    retroalimentacion: updated.retroalimentacion,
                    fechaRevision: new Date().toLocaleString("es-CL"),
                  }
                : item
            )
          );
          sileo.success({ title: "Revisión guardada", description: "Se registró la retroalimentación correctamente" });
        }}
      />
    </div>
  );
}

export default TableEstudiantes;
