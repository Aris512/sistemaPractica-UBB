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
  X,
  Send,
  GraduationCap,
  BookOpen,
  Calendar,
  ChevronDown,
  Trash2,
} from "lucide-react";
import { sileo } from "sileo";
import type { UserSession } from "@/types/auth";
import {
  getEstudiantesProfesor,
  guardarEvaluacionProfesor,
  type EstudianteEvaluacion,
} from "../../../services/profesorEvaluacionApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  const [tipoEvaluacion, setTipoEvaluacion] = useState("Evaluación Docente");
  const [nota, setNota] = useState("");
  const [observacion, setObservacion] = useState("");
  const [isSaving, setIsSaving] = useState(false);

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

  // Abrir modal con los datos del estudiante
  const handleOpenModal = (student: EstudianteEvaluacion) => {
    setSelectedStudent(student);
    setNota(student.nota != null ? String(student.nota) : "");
    setObservacion(student.observacion || "");
    setTipoEvaluacion(student.tipoEvaluacion || "Evaluación Docente");
  };

  const handleCloseModal = () => {
    setSelectedStudent(null);
    setNota("");
    setObservacion("");
    setIsSaving(false);
  };

  // Guardar evaluación (crear, actualizar o eliminar nota/observación en la BD)
  const handleGuardarEvaluacion = async () => {
    if (!selectedStudent) return;

    let puntajeFinal: number | null = null;
    if (nota.trim()) {
      const notaNum = parseFloat(nota.replace(",", "."));
      if (isNaN(notaNum) || notaNum < 1.0 || notaNum > 7.0) {
        sileo.error({
          title: "Nota inválida",
          description: "La nota debe ser un valor numérico entre 1.0 y 7.0.",
        });
        return;
      }
      puntajeFinal = Number(notaNum.toFixed(1));
    }

    const obsFinal = observacion.trim() || null;

    // Si el estudiante no tenía evaluación y ambos campos se dejan vacíos
    if (
      puntajeFinal === null &&
      obsFinal === null &&
      selectedStudent.nota == null &&
      !selectedStudent.observacion
    ) {
      sileo.warning({
        title: "Formulario vacío",
        description: "Debes ingresar al menos una calificación o una observación pedagógica.",
      });
      return;
    }

    setIsSaving(true);
    try {
      const updated = await guardarEvaluacionProfesor({
        idEstudiante: selectedStudent.idEstudiante,
        idEvaluacion: selectedStudent.idEvaluacion ?? null,
        rutProfesor: profesorRut,
        tipoEvaluacion: tipoEvaluacion.trim() || "Evaluación Docente",
        puntajeMinimo: 1.0,
        puntajeMaximo: 7.0,
        puntajeObtenido: puntajeFinal,
        observacion: obsFinal,
      });

      // Actualizar la lista local
      setEstudiantes((prev) =>
        prev.map((est) => (est.idEstudiante === updated.idEstudiante ? updated : est))
      );

      // Mensaje personalizado según los cambios realizados
      if (
        selectedStudent.nota != null &&
        puntajeFinal === null &&
        selectedStudent.observacion &&
        obsFinal === null
      ) {
        sileo.success({
          title: "Evaluación eliminada",
          description: `Se eliminaron la nota y observación de ${updated.nombre} ${updated.apellido}.`,
        });
      } else if (selectedStudent.nota != null && puntajeFinal === null) {
        sileo.success({
          title: "Nota eliminada",
          description: `Se eliminó la calificación de ${updated.nombre} ${updated.apellido} y se guardaron los cambios.`,
        });
      } else if (selectedStudent.observacion && obsFinal === null) {
        sileo.success({
          title: "Observación eliminada",
          description: `Se eliminó la observación pedagógica de ${updated.nombre} ${updated.apellido} y se guardaron los cambios.`,
        });
      } else {
        sileo.success({
          title: "Evaluación guardada",
          description: `Se guardaron los cambios para ${updated.nombre} ${updated.apellido} en la base de datos.`,
        });
      }

      handleCloseModal();
    } catch (err: any) {
      console.error("Error al guardar evaluación:", err);
      sileo.error({
        title: "Error al guardar",
        description: err?.message || "No se pudo registrar la evaluación en el sistema.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Quitar nota del formulario (se persiste al presionar Guardar Evaluación)
  const handleQuitarNota = () => {
    setNota("");
    sileo.info({
      title: "Nota eliminada del formulario",
      description: "Presiona 'Guardar Evaluación' para confirmar y aplicar los cambios en la base de datos.",
    });
  };

  // Quitar observación del formulario (se persiste al presionar Guardar Evaluación)
  const handleQuitarObservacion = () => {
    setObservacion("");
    sileo.info({
      title: "Observación eliminada del formulario",
      description: "Presiona 'Guardar Evaluación' para confirmar y aplicar los cambios en la base de datos.",
    });
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
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border ${
                filtroEstado === "TODOS"
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
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border flex items-center gap-2 ${
                filtroEstado === "EVALUADO"
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
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border flex items-center gap-2 ${
                filtroEstado === "NO_EVALUADO"
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
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border flex items-center gap-2 ${
                filtroEstado === "NO_ENTREGADO"
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
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border flex items-center gap-2 ${
                filtroEstado === "SIN_OBSERVACION"
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
                            <p className="font-semibold text-slate-900 truncate">
                              {student.nombre} {student.apellido}
                            </p>
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
                              className={`inline-flex items-center justify-center font-mono font-bold text-xs px-2.5 py-1 rounded-lg ${
                                student.nota >= 4.0
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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenModal(student)}
                            className="h-8 px-3 text-xs gap-1.5 font-medium border-sky-200 text-sky-800 bg-sky-50/50 hover:bg-sky-100 hover:border-sky-300 transition-all cursor-pointer shadow-2xs"
                          >
                            <Award className="size-3.5" />
                            {student.nota != null ? "Ver detalles" : "Evaluar"}
                          </Button>
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

      {/* ── MODAL: Detalles y Emisión de Evaluación ── */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Cabecera del Modal */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-linear-to-r from-sky-50 to-indigo-50/50">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-sky-600 flex items-center justify-center text-white shadow-xs">
                  <Award className="size-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {selectedStudent.nota != null ? "Detalles de Evaluación" : "Emitir Evaluación"}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    RUT {selectedStudent.rut}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseModal}
                className="size-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white/80 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Contenido del Modal */}
            <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto text-sm">
              {/* Tarjeta de información del alumno */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <GraduationCap className="size-4 text-sky-600" /> Información del Alumno
                  </span>
                  {selectedStudent.estadoEntrega === "ENTREGADO" ? (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <FileCheck2 className="size-3" /> Documentos entregados
                    </span>
                  ) : (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 flex items-center gap-1">
                      <FileX className="size-3" /> Sin entrega en plataforma
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <span className="text-slate-400 block">Nombre Completo:</span>
                    <span className="font-semibold text-slate-800">
                      {selectedStudent.nombre} {selectedStudent.apellido}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Correo Electrónico:</span>
                    <span className="font-semibold text-slate-800 truncate block">
                      {selectedStudent.correo}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Asignatura:</span>
                    <span className="font-semibold text-slate-800">
                      {selectedStudent.asignatura}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Centro de Práctica:</span>
                    <span className="font-semibold text-slate-800">
                      {selectedStudent.centroPractica || "No asignado / En gestión"}
                    </span>
                  </div>
                </div>

                {selectedStudent.fechaEvaluacion && (
                  <div className="pt-2 border-t border-slate-200/60 text-2xs text-slate-400 flex items-center gap-1">
                    <Calendar className="size-3" />
                    Última evaluación registrada:{" "}
                    <span className="font-medium text-slate-600">
                      {new Date(selectedStudent.fechaEvaluacion).toLocaleDateString("es-CL", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                )}
              </div>

              {/* Formulario de Calificación y Retroalimentación */}
              <div className="space-y-4 pt-1">
                {/* Tipo de Evaluación */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Tipo de Evaluación
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Evaluación Final, Evaluación Intermedia..."
                    value={tipoEvaluacion}
                    onChange={(e) => setTipoEvaluacion(e.target.value)}
                    className="w-full h-9 border border-slate-200 rounded-lg px-3 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  />
                </div>

                {/* Nota / Puntaje Obtenido */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700">
                      Nota de la Evaluación <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                      {nota.trim() !== "" && (
                        <button
                          type="button"
                          onClick={handleQuitarNota}
                          disabled={isSaving}
                          className="text-xs text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 cursor-pointer font-medium transition-colors"
                        >
                          <Trash2 className="size-3" />
                          Eliminar nota
                        </button>
                      )}
                      <span className="text-2xs text-slate-400 font-mono">
                        Escala chilena: 1.0 a 7.0
                      </span>
                    </div>
                  </div>
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.1"
                      min="1.0"
                      max="7.0"
                      placeholder="Ej: 6.5"
                      value={nota}
                      onChange={(e) => setNota(e.target.value)}
                      className="text-base font-mono font-bold h-10 pl-3 pr-10 border-slate-200"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-400">
                      / 7.0
                    </div>
                  </div>
                  {nota && (
                    <p className="text-2xs">
                      {parseFloat(nota) >= 4.0 ? (
                        <span className="text-emerald-700 font-medium">
                          ✓ Aprobado (calificación satisfactoria)
                        </span>
                      ) : (
                        <span className="text-rose-600 font-medium">
                          ⚠ Reprobado (calificación inferior a 4.0)
                        </span>
                      )}
                    </p>
                  )}
                </div>

                {/* Observación y Retroalimentación */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700">
                      Observación / Retroalimentación Pedagógica
                    </label>
                    <div className="flex items-center gap-2">
                      {observacion.trim() !== "" && (
                        <button
                          type="button"
                          onClick={handleQuitarObservacion}
                          disabled={isSaving}
                          className="text-xs text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 cursor-pointer font-medium transition-colors"
                        >
                          <Trash2 className="size-3" />
                          Eliminar observación
                        </button>
                      )}
                      <span className="text-2xs text-slate-400">
                        {observacion.length} caracteres
                      </span>
                    </div>
                  </div>
                  <textarea
                    rows={4}
                    placeholder="Escriba aquí los comentarios cualitativos, fortalezas y sugerencias de mejora pedagógica para el estudiante..."
                    value={observacion}
                    onChange={(e) => setObservacion(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-3 text-xs bg-white resize-none focus:outline-none focus:ring-2 focus:ring-sky-500/20 leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* Pie del Modal: Acciones */}
            <div className="flex items-center justify-end gap-2.5 p-4 sm:px-6 bg-slate-50 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCloseModal}
                disabled={isSaving}
                className="text-xs cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleGuardarEvaluacion}
                disabled={
                  isSaving ||
                  (nota === (selectedStudent.nota != null ? String(selectedStudent.nota) : "") &&
                    observacion === (selectedStudent.observacion || "") &&
                    tipoEvaluacion === (selectedStudent.tipoEvaluacion || "Evaluación Docente"))
                }
                className="text-xs gap-1.5 bg-sky-700 hover:bg-sky-800 text-white cursor-pointer shadow-xs"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="size-3.5 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Send className="size-3.5" />
                    Guardar Evaluación
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
