import { useState, useEffect, useMemo, useCallback } from "react";
import type { EstudiantePractica } from "./types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Search,
  RefreshCw,
  UserCheck,
  UserX,
  UserPlus,
  GraduationCap,
  Loader2,
} from "lucide-react";
import { sileo } from "sileo";

interface EstudiantesPracticaListProps {
  onGoToAsociar?: (preselectedEstudiante?: EstudiantePractica) => void;
}

export function EstudiantesPracticaList({
  onGoToAsociar,
}: EstudiantesPracticaListProps) {
  const [estudiantes, setEstudiantes] = useState<EstudiantePractica[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAsignatura, setFilterAsignatura] = useState<string>("TODAS");

  const fetchEstudiantes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/coordinador/estudiantes-practica");
      if (!res.ok) {
        throw new Error("No se pudieron cargar los estudiantes de práctica.");
      }
      const data = await res.json();
      setEstudiantes(Array.isArray(data) ? data : []);
    } catch (err: any) {
      sileo.error({
        title: "Error de conexión",
        description: err.message || "Error al consultar la base de datos.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEstudiantes();
  }, [fetchEstudiantes]);

  const filteredEstudiantes = useMemo(() => {
    return estudiantes.filter((est) => {
      const matchSearch = (est.nombre || "")
        .toLowerCase()
        .includes(searchQuery.trim().toLowerCase());

      if (!matchSearch) return false;

      if (filterAsignatura === "PEDAGOGICA") {
        return est.asignaturaNombre?.toLowerCase().includes("pedag");
      }
      if (filterAsignatura === "PROFESIONAL") {
        return est.asignaturaNombre?.toLowerCase().includes("profesional");
      }
      return true;
    });
  }, [estudiantes, searchQuery, filterAsignatura]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ── Encabezado y Acciones Principales ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-sky-50 text-sky-700 border border-sky-100">
              <GraduationCap className="size-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Estudiantes de Práctica
            </h1>
          </div>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Listado de estudiantes matriculados en <strong>Práctica Pedagógica</strong> y <strong>Práctica Profesional</strong>.
            Selecciona un estudiante para asociar o administrar su tutor y profesor colaborador.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchEstudiantes();
              sileo.info({ title: "Actualizado", description: "Datos sincronizados desde la BD" });
            }}
            disabled={loading}
            className="cursor-pointer gap-2 border-slate-200 text-slate-700 hover:bg-slate-100"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </Button>

          {onGoToAsociar && (
            <Button
              onClick={() => onGoToAsociar()}
              className="cursor-pointer gap-2 bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-xs"
            >
              <UserPlus className="size-4" />
              <span>Asociar Docentes</span>
            </Button>
          )}
        </div>
      </div>

      {/* ── Barra de Búsqueda y Filtros de Asignatura ── */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
        {/* Buscador Simple */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
          <Input
            type="text"
            placeholder="Buscar por nombre de estudiante..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-slate-50/70 border-slate-200 focus-visible:bg-white text-sm"
          />
        </div>

        {/* Pestañas de filtrado por asignatura */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setFilterAsignatura("TODAS")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer transition-colors ${
              filterAsignatura === "TODAS"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
            }`}
          >
            Todas las prácticas ({estudiantes.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterAsignatura("PEDAGOGICA")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer transition-colors ${
              filterAsignatura === "PEDAGOGICA"
                ? "bg-sky-700 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
            }`}
          >
            Práctica Pedagógica (
            {estudiantes.filter((e) => e.asignaturaNombre?.toLowerCase().includes("pedag")).length}
            )
          </button>
          <button
            type="button"
            onClick={() => setFilterAsignatura("PROFESIONAL")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer transition-colors ${
              filterAsignatura === "PROFESIONAL"
                ? "bg-indigo-700 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
            }`}
          >
            Práctica Profesional (
            {estudiantes.filter((e) => e.asignaturaNombre?.toLowerCase().includes("profesional")).length}
            )
          </button>
        </div>
      </div>

      {/* ── Tabla Simple de Estudiantes ── */}
      <UnifiedTableContainer className="min-h-[340px]">
        <UnifiedTable>
          <UnifiedTableHeader>
            <UnifiedTableRow className="bg-slate-50/80 hover:bg-slate-50/80">
              <UnifiedTableHead className="font-semibold text-slate-700 text-xs py-3.5 pl-6">
                Estudiante
              </UnifiedTableHead>
              <UnifiedTableHead className="font-semibold text-slate-700 text-xs py-3.5">
                Asignatura de Práctica
              </UnifiedTableHead>
              <UnifiedTableHead className="font-semibold text-slate-700 text-xs py-3.5">
                Estado Asociación
              </UnifiedTableHead>
              <UnifiedTableHead className="font-semibold text-slate-700 text-xs py-3.5 text-right pr-6">
                Acción
              </UnifiedTableHead>
            </UnifiedTableRow>
          </UnifiedTableHeader>

          <UnifiedTableBody>
            {loading ? (
              <UnifiedTableRow>
                <UnifiedTableCell colSpan={4} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                    <Loader2 className="size-6 animate-spin text-sky-600" />
                    <span className="text-xs font-medium">Cargando estudiantes de práctica...</span>
                  </div>
                </UnifiedTableCell>
              </UnifiedTableRow>
            ) : filteredEstudiantes.length === 0 ? (
              <UnifiedTableRow>
                <UnifiedTableCell colSpan={4} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                    <UserX className="size-8 text-slate-400 stroke-[1.5]" />
                    <span className="text-sm font-semibold text-slate-800">
                      No se encontraron estudiantes
                    </span>
                    <p className="text-xs text-slate-500 max-w-sm">
                      {searchQuery
                        ? `No hay resultados para "${searchQuery}".`
                        : "No existen estudiantes registrados en las asignaturas de práctica seleccionadas."}
                    </p>
                  </div>
                </UnifiedTableCell>
              </UnifiedTableRow>
            ) : (
              filteredEstudiantes.map((est) => {
                const esPedagogica = est.asignaturaNombre?.toLowerCase().includes("pedag");
                return (
                  <UnifiedTableRow
                    key={est.idEstudiante}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    {/* Nombre del estudiante */}
                    <UnifiedTableCell className="py-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700 group-hover:border-sky-300 transition-colors">
                          {est.nombre.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 text-sm group-hover:text-sky-700 transition-colors">
                            {est.nombre}
                          </span>
                          {est.rut && (
                            <span className="text-[11px] text-slate-400 font-mono">
                              {est.rut}
                            </span>
                          )}
                        </div>
                      </div>
                    </UnifiedTableCell>

                    {/* Asignatura */}
                    <UnifiedTableCell className="py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          esPedagogica
                            ? "bg-sky-50 text-sky-800 border-sky-200"
                            : "bg-indigo-50 text-indigo-800 border-indigo-200"
                        }`}
                      >
                        {est.asignaturaNombre}
                      </span>
                    </UnifiedTableCell>

                    {/* Estado de Asociación */}
                    <UnifiedTableCell className="py-4">
                      {est.tieneAsociacion ? (
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                            <span className="size-2 rounded-full bg-emerald-500" />
                            Asociado
                          </span>
                          {(est.colaboradorNombre || est.tutorNombre) && (
                            <span className="text-[11px] text-slate-500 truncate max-w-xs">
                              {est.colaboradorNombre !== "Sin asignar" ? `Colab: ${est.colaboradorNombre}` : ""}
                              {est.tutorNombre !== "Sin asignar" ? ` • Tutor: ${est.tutorNombre}` : ""}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                          <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
                          Pendiente de Asociación
                        </span>
                      )}
                    </UnifiedTableCell>

                    {/* Acción */}
                    <UnifiedTableCell className="py-4 text-right pr-6">
                      <Button
                        size="sm"
                        variant={est.tieneAsociacion ? "outline" : "default"}
                        onClick={() => onGoToAsociar?.(est)}
                        className={`cursor-pointer text-xs font-semibold ${
                          est.tieneAsociacion
                            ? "border-slate-300 text-slate-700 hover:bg-slate-100"
                            : "bg-sky-600 hover:bg-sky-700 text-white shadow-2xs"
                        }`}
                      >
                        {est.tieneAsociacion ? (
                          <>
                            <UserCheck className="size-3.5 mr-1 text-emerald-600" />
                            <span>Ver / Modificar</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="size-3.5 mr-1" />
                            <span>Asociar Docente</span>
                          </>
                        )}
                      </Button>
                    </UnifiedTableCell>
                  </UnifiedTableRow>
                );
              })
            )}
          </UnifiedTableBody>
        </UnifiedTable>
      </UnifiedTableContainer>
    </div>
  );
}
