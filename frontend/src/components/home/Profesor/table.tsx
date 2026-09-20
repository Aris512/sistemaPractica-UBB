import { useState } from "react";
import type { UserSession } from "@/types/auth";
import type { EstudianteEvidenciaRow } from "./types";
import { useSeguimientoData } from "./useSeguimientoData";
import { TableToolbar } from "./TableToolbar";
import { EstadoEntregaBadge, EstadoRevisionBadge } from "./TableBadges";
import { RevisionModal } from "./RevisionModal";
import { ModalDetalleEstudianteProfesor } from "./ModalDetalleEstudianteProfesor";
import {
  UnifiedTableContainer,
  UnifiedTable,
  UnifiedTableHeader,
  UnifiedTableHead,
  UnifiedTableBody,
  UnifiedTableRow,
  UnifiedTableCell,
} from "@/components/ui/unified-table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Clock, AlertCircle, Eye, Loader2, Lock, User } from "lucide-react";
import { sileo } from "sileo";
import { usePermissions } from "@/hooks/usePermissions";

const HEADERS: { id: keyof EstudianteEvidenciaRow; label: string; width: string }[] = [
  { id: "nombre", label: "Nombre", width: "min-w-[200px]" },
  { id: "estadoEntrega", label: "Estado entrega", width: "w-[160px]" },
  { id: "estadoRevision", label: "Estado revision", width: "w-[180px]" },
  { id: "fechaSubida", label: "Fecha de subida", width: "w-[170px]" },
];

export function TableEstudiantes({ user }: { user?: UserSession }) {
  const { hasPermission } = usePermissions(user);
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
  const [studentForDetails, setStudentForDetails] = useState<EstudianteEvidenciaRow | null>(null);

  if (!hasPermission("ESTUDIANTES_CONSULTAR")) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-4 shadow-xs my-8">
        <div className="size-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mx-auto">
          <Lock className="size-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Acceso restringido</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          Tu rol no tiene autorización para consultar la lista ni expedientes de otros estudiantes.
          Si requieres acceso, solicita al administrador activar este permiso para tu rol.
        </p>
      </div>
    );
  }

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
        onSync={() =>
          refetch()
            .then(() => sileo.success({ title: "Sincronizado", description: "Datos actualizados desde la BD" }))
            .catch((err) => sileo.error({ title: "Error al sincronizar", description: err?.message || "No se pudieron actualizar los datos." }))
        }
        loading={loading}
      />

      {/* ── Tabla de estudiantes: Nombre | Estado entrega | Estado revision | Fecha de subida ── */}
      <UnifiedTableContainer className="min-h-[380px]">
        <UnifiedTable>
          <UnifiedTableHeader>
            <UnifiedTableRow className="hover:bg-transparent border-b border-slate-200">
              {HEADERS.map((h) => (
                <UnifiedTableHead key={h.id} className={h.width}>
                  <button
                    type="button"
                    onClick={() => handleSort(h.id)}
                    className="inline-flex items-center gap-1.5 hover:text-slate-900 transition-colors cursor-pointer group font-semibold text-slate-700"
                  >
                    <span>{h.label}</span>
                    <span className="text-xs text-slate-400 group-hover:text-slate-600 transition-colors">
                      {sortState.column === h.id ? (sortState.direction === "asc" ? "↑" : "↓") : "↕"}
                    </span>
                  </button>
                </UnifiedTableHead>
              ))}
              <UnifiedTableHead className="text-right w-[160px]">
                Acciones
              </UnifiedTableHead>
            </UnifiedTableRow>
          </UnifiedTableHeader>

          <UnifiedTableBody>
            {loading ? (
              <UnifiedTableRow className="hover:bg-transparent">
                <UnifiedTableCell colSpan={5} className="h-48 text-center text-slate-500 text-sm">
                  <div className="flex flex-col items-center justify-center gap-2.5">
                    <Loader2 className="size-6 text-sky-600 animate-spin" />
                    <p className="font-medium text-slate-700">Cargando estudiantes desde la base de datos...</p>
                  </div>
                </UnifiedTableCell>
              </UnifiedTableRow>
            ) : paginatedData.length === 0 ? (
              <UnifiedTableRow className="hover:bg-transparent">
                <UnifiedTableCell colSpan={5} className="h-48 text-center text-slate-500 text-sm">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <AlertCircle className="size-6 text-slate-400" />
                    <p className="font-medium text-slate-700">No se encontraron registros en la base de datos.</p>
                    <p className="text-xs text-slate-400">Intenta modificar los términos de búsqueda o sincronizar.</p>
                  </div>
                </UnifiedTableCell>
              </UnifiedTableRow>
            ) : (
              paginatedData.map((row) => (
                <UnifiedTableRow key={row.rut}>
                  {/* Nombre del estudiante con avatar sutil y RUT secundario */}
                  <UnifiedTableCell>
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-full bg-slate-100 border border-slate-200/80 flex items-center justify-center text-xs font-bold text-slate-700 shrink-0">
                        {row.nombre ? row.nombre.charAt(0).toUpperCase() : "E"}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-slate-900 text-sm truncate max-w-[280px]" title={row.nombre}>
                          {row.nombre}
                        </span>
                        <span className="text-xs font-mono text-slate-500 font-normal mt-0.5">
                          {row.rut}
                        </span>
                      </div>
                    </div>
                  </UnifiedTableCell>

                  <UnifiedTableCell>
                    <EstadoEntregaBadge estado={row.estadoEntrega} />
                  </UnifiedTableCell>

                  <UnifiedTableCell>
                    <EstadoRevisionBadge estado={row.estadoRevision} calificacion={row.calificacion} />
                  </UnifiedTableCell>

                  <UnifiedTableCell className="text-slate-600 text-xs font-mono">
                    {row.fechaSubida ? (
                      <span className="inline-flex items-center gap-1.5 text-slate-600">
                        <Clock className="size-3.5 text-slate-400 shrink-0" />
                        {row.fechaSubida}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">—</span>
                    )}
                  </UnifiedTableCell>

                  <UnifiedTableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setStudentForDetails(row)}
                        className="h-8.5 px-3 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border-slate-200 cursor-pointer shadow-2xs gap-1.5"
                      >
                        <User className="size-3.5 text-slate-500" />
                        <span>Detalles</span>
                      </Button>

                      {row.estadoEntrega === "ENTREGADO" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedStudent(row)}
                          className="h-8.5 px-3 text-xs font-medium text-sky-800 bg-sky-50/70 hover:bg-sky-100 border-sky-200 cursor-pointer shadow-2xs gap-1.5"
                        >
                          <Eye className="size-3.5 text-sky-700" />
                          <span>{row.estadoRevision === "REVISADO" ? "Ver/Editar" : "Revisar"}</span>
                        </Button>
                      )}
                    </div>
                  </UnifiedTableCell>
                </UnifiedTableRow>
              ))
            )}
          </UnifiedTableBody>
        </UnifiedTable>

        {/* ── Paginación inferior unificada ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-3.5 border-t border-slate-100 bg-slate-50/40 text-xs text-slate-500 gap-3">
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
                className="h-8 text-xs bg-white border border-slate-200 rounded-md px-2 text-slate-700 cursor-pointer outline-none focus:border-sky-500"
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
      </UnifiedTableContainer>

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

      {/* ── Modal de Detalles del Estudiante (Ancho completo) ── */}
      <ModalDetalleEstudianteProfesor
        student={studentForDetails}
        open={!!studentForDetails}
        onOpenChange={(open) => {
          if (!open) setStudentForDetails(null);
        }}
      />
    </div>
  );
}

export default TableEstudiantes;
