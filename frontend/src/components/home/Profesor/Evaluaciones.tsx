import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Filter,
  Users,
  Award,
  FileCheck2,
  FileX,
  CheckCircle2,
  Clock,
  MessageSquare,
  AlertCircle,
  RefreshCw,
  BookOpen,
  ChevronDown,
  Paperclip,
  Trash2,
} from "lucide-react";
import { sileo } from "sileo";
import type { UserSession } from "@/types/auth";
import {
  getEstudiantesProfesor,
  eliminarEvaluacionCompleta,
  type EstudianteEvaluacion,
} from "../../../services/profesorEvaluacionApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ModalEvaluaciones } from "./ModalEvaluaciones";
import { ConfirmDeleteDialog } from "@/components/ui/ConfirmDeleteDialog";

interface EvaluacionesProps {
  user?: UserSession;
  onBack?: () => void;
}

type EstadoFiltro = "TODOS" | "EVALUADO" | "NO_EVALUADO" | "NO_ENTREGADO" | "SIN_OBSERVACION";

export function Evaluaciones({ user, onBack }: EvaluacionesProps) {
  const profesorRut = user?.rut || "11111111-1";

  // ── Datos y carga ──
  const [estudiantes, setEstudiantes] = useState<EstudianteEvaluacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Filtros y búsqueda ──
  const [searchQuery, setSearchQuery] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<EstadoFiltro>("TODOS");
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // ── Modal de Evaluación ──
  const [selectedStudent, setSelectedStudent] = useState<EstudianteEvaluacion | null>(null);

  // ── Modal de Confirmación de Eliminación ──
  const [studentToDelete, setStudentToDelete] = useState<EstudianteEvaluacion | null>(null);

  // Cargar estudiantes del profesor
  const cargarEstudiantes = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getEstudiantesProfesor(profesorRut);
      setEstudiantes(data);
    } catch (err: any) {
      console.error("Error al cargar estudiantes:", err);
      setError(err?.message || "No se pudo cargar la lista de estudiantes.");
      sileo.error({
        title: "Error al cargar datos",
        description: err?.message || "No se pudo conectar con el servidor de evaluaciones.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarEstudiantes();
  }, [profesorRut]);

  // Abrir y cerrar modal
  const handleOpenModal = (student: EstudianteEvaluacion) => {
    setSelectedStudent(student);
  };

  const handleCloseModal = () => {
    setSelectedStudent(null);
  };

  // Actualizar la lista cuando se guarda una evaluación en el modal
  const handleStudentUpdated = (updated: EstudianteEvaluacion) => {
    setEstudiantes((prev) =>
      prev.map((est) => (est.idEstudiante === updated.idEstudiante ? updated : est))
    );
  };

  // Eliminar completamente entrega, nota y observación directamente desde la tabla
  const handleConfirmDelete = async () => {
    if (!studentToDelete) return;
    try {
      const updated = await eliminarEvaluacionCompleta(studentToDelete.idEstudiante);
      setEstudiantes((prev) =>
        prev.map((est) => (est.idEstudiante === updated.idEstudiante ? updated : est))
      );
      sileo.success({
        title: "Evaluación eliminada",
        description: `Se eliminaron las entregas, la nota y la observación de ${studentToDelete.nombre} ${studentToDelete.apellido}.`,
      });
      setStudentToDelete(null);
    } catch (err: any) {
      console.error("Error al eliminar evaluación completa:", err);
      sileo.error({
        title: "Error al eliminar",
        description: err?.message || "No se pudo eliminar la entrega, nota y observación del estudiante.",
      });
    }
  };



  // Filtrado de estudiantes
  const filteredEstudiantes = useMemo(() => {
    return estudiantes.filter((est) => {
      // Filtro por texto de búsqueda
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        est.nombre.toLowerCase().includes(q) ||
        est.apellido.toLowerCase().includes(q) ||
        est.rut.toLowerCase().includes(q) ||
        est.correo.toLowerCase().includes(q) ||
        est.asignatura.toLowerCase().includes(q);

      if (!matchQuery) return false;

      // Filtro por estado
      if (filtroEstado === "TODOS") return true;
      if (filtroEstado === "EVALUADO") return est.estadoEvaluacion === "EVALUADO";
      if (filtroEstado === "NO_EVALUADO") return est.estadoEvaluacion === "NO_EVALUADO";
      if (filtroEstado === "NO_ENTREGADO") return est.estadoEntrega === "NO_ENTREGADO";
      if (filtroEstado === "SIN_OBSERVACION") return est.estadoEvaluacion === "SIN_OBSERVACION";

      return true;
    });
  }, [estudiantes, searchQuery, filtroEstado]);

  // Paginación
  const totalPages = Math.ceil(filteredEstudiantes.length / rowsPerPage) || 1;
  const paginatedEstudiantes = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredEstudiantes.slice(start, start + rowsPerPage);
  }, [filteredEstudiantes, currentPage, rowsPerPage]);

  // Contadores para insignias
  const conteos = useMemo(() => {
    let evaluados = 0;
    let noEvaluados = 0;
    let noEntregados = 0;
    let sinObs = 0;

    estudiantes.forEach((e) => {
      if (e.estadoEvaluacion === "EVALUADO") evaluados++;
      if (e.estadoEvaluacion === "NO_EVALUADO") noEvaluados++;
      if (e.estadoEntrega === "NO_ENTREGADO") noEntregados++;
      if (e.estadoEvaluacion === "SIN_OBSERVACION") sinObs++;
    });

    return {
      total: estudiantes.length,
      evaluados,
      noEvaluados,
      noEntregados,
      sinObs,
    };
  }, [estudiantes]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ── Encabezado y Contexto Docente ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="size-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-700">
              <Award className="size-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Módulo de Evaluaciones
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Calificación y retroalimentación formativa de estudiantes matriculados en tus asignaturas
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={cargarEstudiantes}
            disabled={loading}
            className="gap-1.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin text-sky-600" : ""}`} />
            Sincronizar
          </Button>

          {onBack && (
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
              className="text-xs text-sky-800 bg-sky-50 border-sky-200 hover:bg-sky-100 cursor-pointer"
            >
              Volver al Inicio
            </Button>
          )}
        </div>
      </div>

      {/* ── Tarjeta de Búsqueda y Filtros Avanzados (Inspirado en diseño UBB) ── */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        {/* Fila superior: Input de búsqueda + Selectores de estado y filas */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Barra de búsqueda */}
          <div className="md:col-span-6 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Buscar por RUT, nombre, correo, asignatura..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 h-10 text-sm bg-slate-50/60 border-slate-200 focus:bg-white rounded-xl transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Selector desplegable de estado */}
          <div className="md:col-span-3">
            <div className="relative">
              <select
                value={filtroEstado}
                onChange={(e) => {
                  setFiltroEstado(e.target.value as EstadoFiltro);
                  setCurrentPage(1);
                }}
                className="w-full h-10 appearance-none bg-slate-50/60 hover:bg-slate-100/80 border border-slate-200 rounded-xl px-3.5 pr-8 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20 cursor-pointer transition-colors"
              >
                <option value="TODOS">Estado: Todos los estados</option>
                <option value="EVALUADO">Solo Evaluados ({conteos.evaluados})</option>
                <option value="NO_EVALUADO">Solo No evaluados ({conteos.noEvaluados})</option>
                <option value="NO_ENTREGADO">Solo No entregados ({conteos.noEntregados})</option>
                <option value="SIN_OBSERVACION">Sin observación ({conteos.sinObs})</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Selector de cantidad de filas */}
          <div className="md:col-span-3">
            <div className="relative">
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="w-full h-10 appearance-none bg-slate-50/60 hover:bg-slate-100/80 border border-slate-200 rounded-xl px-3.5 pr-8 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20 cursor-pointer transition-colors"
              >
                <option value={5}>Mostrar: 5 filas</option>
                <option value={10}>Mostrar: 10 filas</option>
                <option value={20}>Mostrar: 20 filas</option>
                <option value={50}>Mostrar: 50 filas</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Fila inferior: Filtros rápidos tipo Pills y Contador de resultados */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 font-medium mr-1 flex items-center gap-1">
              <Filter className="size-3" /> Filtro:
            </span>

            <button
              type="button"
              onClick={() => {
                setFiltroEstado("TODOS");
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border ${filtroEstado === "TODOS"
                  ? "bg-[#0b1329] text-white border-[#0b1329] shadow-xs"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                }`}
            >
              Todos ({conteos.total})
            </button>

            <button
              type="button"
              onClick={() => {
                setFiltroEstado("EVALUADO");
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border flex items-center gap-2 ${filtroEstado === "EVALUADO"
                  ? "bg-[#0b1329] text-white border-[#0b1329] shadow-xs"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                }`}
            >
              <span className="size-2 rounded-full bg-blue-500 shrink-0" />
              Evaluados ({conteos.evaluados})
            </button>

            <button
              type="button"
              onClick={() => {
                setFiltroEstado("NO_EVALUADO");
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border flex items-center gap-2 ${filtroEstado === "NO_EVALUADO"
                  ? "bg-[#0b1329] text-white border-[#0b1329] shadow-xs"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                }`}
            >
              <span className="size-2 rounded-full bg-amber-500 shrink-0" />
              No evaluados ({conteos.noEvaluados})
            </button>

            <button
              type="button"
              onClick={() => {
                setFiltroEstado("NO_ENTREGADO");
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border flex items-center gap-2 ${filtroEstado === "NO_ENTREGADO"
                  ? "bg-[#0b1329] text-white border-[#0b1329] shadow-xs"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                }`}
            >
              <span className="size-2 rounded-full bg-rose-500 shrink-0" />
              No entregados ({conteos.noEntregados})
            </button>

            <button
              type="button"
              onClick={() => {
                setFiltroEstado("SIN_OBSERVACION");
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border flex items-center gap-2 ${filtroEstado === "SIN_OBSERVACION"
                  ? "bg-[#0b1329] text-white border-[#0b1329] shadow-xs"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                }`}
            >
              <span className="size-2 rounded-full bg-purple-500 shrink-0" />
              Sin observación ({conteos.sinObs})
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
            <Users className="size-3.5 text-slate-400" />
            <span>{filteredEstudiantes.length} estudiantes encontrados</span>
          </div>
        </div>
      </div>

      {/* ── Tabla Principal de Estudiantes ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="size-8 text-sky-600 animate-spin" />
            <p className="text-sm font-medium text-slate-600">Cargando nómina de estudiantes...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <AlertCircle className="size-10 text-rose-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No se pudieron cargar los datos</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={cargarEstudiantes}
              className="mt-2 text-xs gap-1.5"
            >
              <RefreshCw className="size-3" /> Intentar de nuevo
            </Button>
          </div>
        ) : filteredEstudiantes.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="size-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Users className="size-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">
              No se encontraron estudiantes
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery || filtroEstado !== "TODOS"
                ? "No hay alumnos que coincidan con los criterios de búsqueda o filtro seleccionados."
                : "No tienes estudiantes matriculados en tus asignaturas actualmente."}
            </p>
            {(searchQuery || filtroEstado !== "TODOS") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setFiltroEstado("TODOS");
                }}
                className="text-xs"
              >
                Limpiar filtros
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/75 text-xs uppercase font-semibold text-slate-500 tracking-wider">
                    <th className="py-3.5 px-4 font-semibold">Estudiante</th>
                    <th className="py-3.5 px-4 font-semibold">RUT</th>
                    <th className="py-3.5 px-4 font-semibold">Asignatura</th>
                    <th className="py-3.5 px-4 font-semibold text-center">Entrega</th>
                    <th className="py-3.5 px-4 font-semibold text-center">Evaluación</th>
                    <th className="py-3.5 px-4 font-semibold text-center">Nota</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedEstudiantes.map((student) => {
                    return (
                      <tr
                        key={student.idEstudiante}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        {/* Estudiante */}
                        <td className="py-3.5 px-4">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-slate-900 truncate">
                                {student.nombre} {student.apellido}
                              </p>
                              {student.tieneArchivo && (
                                <span
                                  title={`Pauta adjunta: ${student.nombreArchivo || "Documento"}`}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-2xs font-medium bg-sky-100 text-sky-800 border border-sky-200 shrink-0"
                                >
                                  <Paperclip className="size-2.5" />
                                  Pauta
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 truncate">{student.correo}</p>
                          </div>
                        </td>

                        {/* RUT */}
                        <td className="py-3.5 px-4 font-mono text-xs font-medium text-slate-700 whitespace-nowrap">
                          {student.rut}
                        </td>

                        {/* Asignatura */}
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200/60 max-w-[200px] truncate">
                            <BookOpen className="size-3 text-sky-600 shrink-0" />
                            <span className="truncate">{student.asignatura}</span>
                          </span>
                        </td>

                        {/* Estado de entrega de documentos */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {student.estadoEntrega === "ENTREGADO" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <FileCheck2 className="size-3" />
                              Entregado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                              <FileX className="size-3 text-slate-400" />
                              No entregado
                            </span>
                          )}
                        </td>

                        {/* Estado de evaluación */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {student.estadoEvaluacion === "EVALUADO" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-200">
                              <CheckCircle2 className="size-3 text-sky-600" />
                              Evaluado
                            </span>
                          )}
                          {student.estadoEvaluacion === "SIN_OBSERVACION" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              <MessageSquare className="size-3 text-indigo-500" />
                              S/o (Sin obs.)
                            </span>
                          )}
                          {student.estadoEvaluacion === "NO_EVALUADO" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="size-3 text-amber-500" />
                              No evaluado
                            </span>
                          )}
                        </td>

                        {/* Nota */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {student.nota != null ? (
                            <span
                              className={`inline-flex items-center justify-center font-mono font-bold text-xs px-2.5 py-1 rounded-lg ${student.nota >= 4.0
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                  : "bg-rose-50 text-rose-800 border border-rose-200"
                                }`}
                            >
                              {student.nota.toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-mono text-xs">-</span>
                          )}
                        </td>

                        {/* Botón de acción */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenModal(student)}
                              className="h-8 px-3 text-xs gap-1.5 font-medium border-sky-200 text-sky-800 bg-sky-50/50 hover:bg-sky-100 hover:border-sky-300 transition-all cursor-pointer shadow-2xs"
                            >
                              <Award className="size-3.5" />
                              {student.nota != null ? "Ver detalles" : "Evaluar"}
                            </Button>

                            {(() => {
                              const tieneContenido =
                                student.estadoEntrega === "ENTREGADO" ||
                                student.nota != null ||
                                !!student.observacion ||
                                !!student.tieneArchivo;

                              return (
                                <button
                                  type="button"
                                  onClick={() => setStudentToDelete(student)}
                                  disabled={!tieneContenido}
                                  title={
                                    tieneContenido
                                      ? "Eliminar entrega, nota y observación del estudiante"
                                      : "Sin entregas ni evaluaciones para eliminar"
                                  }
                                  className={`p-2 rounded-lg border transition-all inline-flex items-center justify-center ${tieneContenido
                                      ? "text-rose-600 bg-rose-50/60 hover:bg-rose-100 hover:text-rose-700 border-rose-200/80 hover:border-rose-300 cursor-pointer shadow-2xs"
                                      : "text-slate-300 bg-slate-50 border-slate-200/50 cursor-not-allowed opacity-50"
                                    }`}
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              );
                            })()}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-100 bg-slate-50/40 text-xs text-slate-500">
              <div>
                Mostrando{" "}
                <span className="font-semibold text-slate-800">
                  {Math.min(
                    (currentPage - 1) * rowsPerPage + 1,
                    filteredEstudiantes.length
                  )}
                </span>{" "}
                a{" "}
                <span className="font-semibold text-slate-800">
                  {Math.min(currentPage * rowsPerPage, filteredEstudiantes.length)}
                </span>{" "}
                de{" "}
                <span className="font-semibold text-slate-800">
                  {filteredEstudiantes.length}
                </span>{" "}
                estudiantes
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="h-7 text-xs px-2.5 cursor-pointer"
                >
                  Anterior
                </Button>
                <span className="px-2 font-medium">
                  Página {currentPage} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="h-7 text-xs px-2.5 cursor-pointer"
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── MODAL: Detalles y Emisión de Evaluación (Pantalla Completa & Subida de Documentos) ── */}
      <ModalEvaluaciones
        key={selectedStudent?.idEstudiante ?? "cerrado"}
        isOpen={!!selectedStudent}
        student={selectedStudent}
        profesorRut={profesorRut}
        onClose={handleCloseModal}
        onSaved={handleStudentUpdated}
      />

      {/* ── MODAL DE CONFIRMACIÓN DE ELIMINACIÓN COMPLETA ── */}
      <ConfirmDeleteDialog
        open={!!studentToDelete}
        onOpenChange={(open) => {
          if (!open) setStudentToDelete(null);
        }}
        title="Eliminar entrega, nota y observación"
        description={
          studentToDelete
            ? `¿Estás seguro de que deseas eliminar la evaluación de ${studentToDelete.nombre} ${studentToDelete.apellido}? Se eliminarán los archivos entregados por el alumno, la calificación asignada (${studentToDelete.nota != null ? studentToDelete.nota.toFixed(1) : "sin nota"
            }) y la observación pedagógica. Esta acción no se puede deshacer.`
            : "Esta acción no se puede deshacer."
        }
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
