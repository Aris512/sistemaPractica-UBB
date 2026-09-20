import { useState, useMemo, useEffect, useCallback } from "react";
import type { UserSession } from "@/types/auth";
import type { EstudianteTutorRow, SortState } from "./types";
import { TableToolbar } from "./TableToolbar";
import { ObservacionBadge, EvaluacionBadge } from "./TableBadges";
import { ModalDetalleEstudiante } from "./ModalDetalleEstudiante";
import { Button } from "@/components/ui/button";
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
  Users,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  Lock,
} from "lucide-react";
import { sileo } from "sileo";
import { usePermissions } from "@/hooks/usePermissions";

interface TableEstudiantesProps {
  user: UserSession;
}

export function TableEstudiantes({ user }: TableEstudiantesProps) {
  const { hasPermission, loading: loadingPermissions } = usePermissions(user);
  const [data, setData] = useState<EstudianteTutorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [observacionFilter, setObservacionFilter] = useState("ALL");
  const [evaluacionFilter, setEvaluacionFilter] = useState("ALL");
  const [selectedStudent, setSelectedStudent] = useState<EstudianteTutorRow | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(8);
  const [sortState, setSortState] = useState<SortState>({ column: null, direction: null });

  const tutorRut = user?.rut || "11111111-1";

  // Cargar estudiantes a evaluar desde el endpoint de seguimiento
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8080/api/practicas/seguimiento/${encodeURIComponent(tutorRut)}`);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json) && json.length > 0) {
          const activos = json.filter(
            (item: any) =>
              item.activo !== false &&
              item.estado?.toLowerCase() !== "inactivo" &&
              item.estadoObservacion !== "INACTIVO" &&
              item.estadoEvaluacion !== "INACTIVO"
          );
          setData(activos);
          return;
        }
      }

      // Fallback a estudiantes generales
      const resEst = await fetch("http://localhost:8080/api/estudiantes");
      if (resEst.ok) {
        const estJson = await resEst.json();
        if (Array.isArray(estJson)) {
          const activos = estJson.filter(
            (est: any) =>
              est.usuario?.activo !== false &&
              est.usuario?.estado?.toLowerCase() !== "inactivo" &&
              est.estado?.toUpperCase() !== "INACTIVO"
          );
          setData(
            activos.map((est: any) => ({
              idEstudiante: est.idEstudiante,
              rut: est.usuario?.rut || "—",
              nombre: est.usuario ? `${est.usuario.nombre} ${est.usuario.apellido}` : "Estudiante",
              correo: est.usuario?.correo || "",
              asignaturaNombre: est.asignatura ? est.asignatura.nombre : "Práctica Pedagógica",
              centroPractica: "Colegio San Agustín Concepción",
              estadoObservacion: "SIN_OBSERVACION",
              estadoEvaluacion: "PENDIENTE",
              calificacion: null,
              observacionTexto: null,
            }))
          );
        }
      }
    } catch (err) {
      console.error("Error al cargar estudiantes:", err);
    } finally {
      setLoading(false);
    }
  }, [tutorRut]);

  useEffect(() => {
    if (!loadingPermissions && hasPermission("ESTUDIANTES_CONSULTAR")) {
      fetchData();
    }
  }, [fetchData, loadingPermissions, hasPermission]);

  // Filtrado de datos
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // Filtro por búsqueda
      const query = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !query ||
        item.nombre.toLowerCase().includes(query) ||
        item.rut.toLowerCase().includes(query) ||
        item.correo.toLowerCase().includes(query) ||
        item.asignaturaNombre.toLowerCase().includes(query);

      // Filtro de Observación
      const matchesObs =
        observacionFilter === "ALL" || item.estadoObservacion === observacionFilter;

      // Filtro de Evaluación
      const matchesEval =
        evaluacionFilter === "ALL" || item.estadoEvaluacion === evaluacionFilter;

      return matchesQuery && matchesObs && matchesEval;
    });
  }, [data, searchQuery, observacionFilter, evaluacionFilter]);

  // Ordenamiento
  const sortedData = useMemo(() => {
    if (!sortState.column || !sortState.direction) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortState.column!] ?? "";
      const bVal = b[sortState.column!] ?? "";

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortState.direction === "asc" ? aVal - bVal : bVal - aVal;
      }

      return sortState.direction === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [filteredData, sortState]);

  // Paginación
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, page, pageSize]);

  const handleSort = (col: keyof EstudianteTutorRow) => {
    setSortState((prev) => {
      if (prev.column !== col) return { column: col, direction: "asc" };
      if (prev.direction === "asc") return { column: col, direction: "desc" };
      return { column: null, direction: null };
    });
  };

  if (loadingPermissions) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center max-w-2xl mx-auto space-y-3 shadow-xs my-8">
        <RefreshCw className="size-7 animate-spin mx-auto text-sky-600" />
        <p className="text-sm font-medium text-slate-700">Verificando permisos de acceso...</p>
      </div>
    );
  }

  if (!hasPermission("ESTUDIANTES_CONSULTAR")) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-4 shadow-xs my-8">
        <div className="size-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mx-auto">
          <Lock className="size-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Acceso restringido</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          Tu rol no tiene autorización para consultar la lista de estudiantes asignados.
          Si requieres acceso, solicita al administrador activar este permiso para tu rol.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barra de Filtros y Búsqueda */}
      <TableToolbar
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          setPage(1);
        }}
        observacionFilter={observacionFilter}
        onObservacionFilterChange={(v) => {
          setObservacionFilter(v);
          setPage(1);
        }}
        evaluacionFilter={evaluacionFilter}
        onEvaluacionFilterChange={(v) => {
          setEvaluacionFilter(v);
          setPage(1);
        }}
        onRefresh={() => {
          fetchData()
            .then(() => {
              sileo.success({
                title: "Nómina Actualizada",
                description: "Datos de estudiantes sincronizados desde la base de datos.",
              });
            })
            .catch((err) => {
              sileo.error({
                title: "Error de sincronización",
                description: err?.message || "No fue posible actualizar la nómina de estudiantes.",
              });
            });
        }}
        loading={loading}
      />

      {/* Información contextual del rol y conteo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <GraduationCap className="size-4 text-sky-700" />
          <h2 className="text-sm font-semibold text-slate-900">
            Estudiantes Asignados a Evaluar ({filteredData.length})
          </h2>
        </div>
        <span className="text-xs text-slate-500 font-medium">
          Rol: <strong className="text-slate-700">{user?.rol || "Profesor Colaborador / Tutor"}</strong>
        </span>
      </div>

      {/* Contenedor Principal de la Tabla Unificada */}
      <UnifiedTableContainer className="min-h-[380px]">
        <UnifiedTable>
          <UnifiedTableHeader>
            <UnifiedTableRow className="hover:bg-transparent border-b border-slate-200">
              <UnifiedTableHead className="min-w-[220px]">
                <button
                  type="button"
                  onClick={() => handleSort("nombre")}
                  className="inline-flex items-center gap-1.5 hover:text-slate-900 transition-colors cursor-pointer group font-semibold text-slate-700"
                >
                  <span>Estudiante</span>
                  <span className="text-xs text-slate-400 group-hover:text-slate-600 transition-colors">
                    {sortState.column === "nombre" ? (sortState.direction === "asc" ? "↑" : "↓") : "↕"}
                  </span>
                </button>
              </UnifiedTableHead>

              <UnifiedTableHead className="w-[200px]">
                <button
                  type="button"
                  onClick={() => handleSort("estadoObservacion")}
                  className="inline-flex items-center gap-1.5 hover:text-slate-900 transition-colors cursor-pointer group font-semibold text-slate-700"
                >
                  <span>Estado de Observación</span>
                  <span className="text-xs text-slate-400 group-hover:text-slate-600 transition-colors">
                    {sortState.column === "estadoObservacion" ? (sortState.direction === "asc" ? "↑" : "↓") : "↕"}
                  </span>
                </button>
              </UnifiedTableHead>

              <UnifiedTableHead className="w-[190px]">
                <button
                  type="button"
                  onClick={() => handleSort("estadoEvaluacion")}
                  className="inline-flex items-center gap-1.5 hover:text-slate-900 transition-colors cursor-pointer group font-semibold text-slate-700"
                >
                  <span>Estado de Evaluación</span>
                  <span className="text-xs text-slate-400 group-hover:text-slate-600 transition-colors">
                    {sortState.column === "estadoEvaluacion" ? (sortState.direction === "asc" ? "↑" : "↓") : "↕"}
                  </span>
                </button>
              </UnifiedTableHead>

              <UnifiedTableHead className="text-right w-[140px]">
                Acción
              </UnifiedTableHead>
            </UnifiedTableRow>
          </UnifiedTableHeader>

          <UnifiedTableBody>
            {loading ? (
              <UnifiedTableRow className="hover:bg-transparent">
                <UnifiedTableCell colSpan={4} className="h-48 text-center text-slate-500 text-sm">
                  <div className="flex flex-col items-center justify-center gap-2.5">
                    <RefreshCw className="size-6 text-sky-600 animate-spin" />
                    <p className="font-medium text-slate-700">Cargando nómina de estudiantes...</p>
                  </div>
                </UnifiedTableCell>
              </UnifiedTableRow>
            ) : paginatedData.length === 0 ? (
              <UnifiedTableRow className="hover:bg-transparent">
                <UnifiedTableCell colSpan={4} className="h-48 text-center text-slate-500 text-sm">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Users className="size-7 text-slate-300" />
                    <p className="font-medium text-slate-700">No se encontraron estudiantes</p>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Intenta cambiar los filtros de búsqueda o el estado de observación y evaluación.
                    </p>
                  </div>
                </UnifiedTableCell>
              </UnifiedTableRow>
            ) : (
              paginatedData.map((item) => (
                <UnifiedTableRow key={item.rut}>
                  {/* Columna: Estudiante (Nombre y RUT únicamente) */}
                  <UnifiedTableCell>
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-full bg-slate-100 border border-slate-200/80 flex items-center justify-center text-xs font-bold text-slate-700 shrink-0">
                        {item.nombre.charAt(0)}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-slate-900 text-sm truncate max-w-[280px]" title={item.nombre}>
                          {item.nombre}
                        </span>
                        <span className="text-xs font-mono text-slate-500 font-normal mt-0.5">
                          {item.rut}
                        </span>
                      </div>
                    </div>
                  </UnifiedTableCell>

                  {/* Columna: Estado de Observación */}
                  <UnifiedTableCell>
                    <div className="space-y-1">
                      <ObservacionBadge estado={item.estadoObservacion} />
                      {item.observacionTexto && (
                        <p className="text-[11px] text-slate-500 line-clamp-1 italic max-w-xs">
                          &ldquo;{item.observacionTexto}&rdquo;
                        </p>
                      )}
                    </div>
                  </UnifiedTableCell>

                  {/* Columna: Estado de Evaluación */}
                  <UnifiedTableCell>
                    <EvaluacionBadge
                      estado={item.estadoEvaluacion}
                      calificacion={item.calificacion}
                    />
                  </UnifiedTableCell>

                  {/* Columna: Acción (Ver Detalles) */}
                  <UnifiedTableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedStudent(item)}
                      className="h-8.5 px-3 text-xs font-medium border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Eye className="size-3.5 text-slate-500" />
                      Ver Detalles
                    </Button>
                  </UnifiedTableCell>
                </UnifiedTableRow>
              ))
            )}
          </UnifiedTableBody>
        </UnifiedTable>

        {/* ── Paginación inferior unificada ── */}
        {sortedData.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-3.5 border-t border-slate-100 bg-slate-50/40 text-xs text-slate-500 gap-3">
            <div>
              Mostrando <span className="font-semibold text-slate-700">{paginatedData.length === 0 ? 0 : (page - 1) * pageSize + 1}</span> a{" "}
              <span className="font-semibold text-slate-700">{Math.min(page * pageSize, sortedData.length)}</span> de{" "}
              <span className="font-semibold text-slate-700">{sortedData.length}</span> estudiantes
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="size-8 p-0 cursor-pointer border-slate-200 bg-white hover:bg-slate-50"
              >
                <ChevronLeft className="size-4" />
              </Button>

              <span className="px-2 font-medium text-slate-700">
                Página {page} de {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="size-8 p-0 cursor-pointer border-slate-200 bg-white hover:bg-slate-50"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </UnifiedTableContainer>

      {/* Modal de Detalles del Estudiante */}
      {selectedStudent && (
        <ModalDetalleEstudiante
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
}
