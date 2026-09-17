import { useState, useMemo, useEffect, useCallback } from "react";
import type { UserSession } from "@/types/auth";
import type { EstudianteTutorRow, SortState } from "./types";
import { TableToolbar } from "./TableToolbar";
import { ObservacionBadge, EvaluacionBadge } from "./TableBadges";
import { ModalDetalleEstudiante } from "./ModalDetalleEstudiante";
import { Button } from "@/components/ui/button";
import {
  Users,
  GraduationCap,
  ArrowUpDown,
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

      {/* Contenedor Principal de la Tabla */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {/* Encabezado del Recuadro */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50">
          <div>
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <GraduationCap className="size-5 text-sky-700" />
              Estudiantes Asignados a Evaluar ({filteredData.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Supervisión de prácticas, bitácora de observación en aula y registro de evaluación.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium bg-white px-2.5 py-1 rounded-md border border-slate-200">
              Rol: <strong>{user?.rol || "Profesor Colaborador / Tutor"}</strong>
            </span>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <RefreshCw className="size-7 animate-spin mx-auto text-sky-600" />
            <p className="text-sm font-medium">Cargando nómina de estudiantes...</p>
          </div>
        ) : paginatedData.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Users className="size-8 mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">No se encontraron estudiantes</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Intenta cambiar los filtros de búsqueda o el estado de observación y evaluación.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th
                    className="p-4 cursor-pointer hover:text-sky-700 transition-colors select-none"
                    onClick={() => handleSort("nombre")}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Estudiante</span>
                      <ArrowUpDown className="size-3 text-slate-400" />
                    </div>
                  </th>

                  <th
                    className="p-4 cursor-pointer hover:text-sky-700 transition-colors select-none"
                    onClick={() => handleSort("estadoObservacion")}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Estado de Observación</span>
                      <ArrowUpDown className="size-3 text-slate-400" />
                    </div>
                  </th>

                  <th
                    className="p-4 cursor-pointer hover:text-sky-700 transition-colors select-none"
                    onClick={() => handleSort("estadoEvaluacion")}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Estado de Evaluación</span>
                      <ArrowUpDown className="size-3 text-slate-400" />
                    </div>
                  </th>

                  <th className="p-4 text-right">Acción</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {paginatedData.map((item) => (
                  <tr
                    key={item.rut}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* Columna: Estudiante (Nombre y RUT únicamente) */}
                    <td className="p-4 align-middle">
                      <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 shrink-0">
                          {item.nombre.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 text-sm leading-tight">
                            {item.nombre}
                          </span>
                          <span className="text-xs font-mono text-slate-500 font-normal mt-0.5">
                            {item.rut}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Columna: Estado de Observación */}
                    <td className="p-4 align-middle">
                      <div className="space-y-1">
                        <ObservacionBadge estado={item.estadoObservacion} />
                        {item.observacionTexto && (
                          <p className="text-[11px] text-slate-500 line-clamp-1 italic max-w-xs">
                            "{item.observacionTexto}"
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Columna: Estado de Evaluación */}
                    <td className="p-4 align-middle">
                      <EvaluacionBadge
                        estado={item.estadoEvaluacion}
                        calificacion={item.calificacion}
                      />
                    </td>

                    {/* Columna: Acción (Ver Detalles) */}
                    <td className="p-4 text-right align-middle">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedStudent(item)}
                        className="h-8.5 px-3 text-xs font-medium border-slate-300 text-slate-700 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-300 gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Eye className="size-3.5" />
                        Ver Detalles
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        {sortedData.length > 0 && (
          <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 bg-slate-50/30">
            <span>
              Mostrando <strong>{paginatedData.length}</strong> de{" "}
              <strong>{sortedData.length}</strong> estudiantes
            </span>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="size-8 p-0 cursor-pointer"
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
                className="size-8 p-0 cursor-pointer"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

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
