import { useState, useEffect, useMemo } from "react";
import {
  MessageSquareText,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  Calendar,
  BookOpen,
  User,
  Download,
  Eye,
  X,
  Award,
  FileText,
  CheckCircle2,
  Clock,
  Building2,
  Paperclip,
  Search,
  Filter,
} from "lucide-react";
import { sileo } from "sileo";
import type { UserSession } from "@/types/auth";
import {
  getEvaluacionesEstudiante,
  descargarArchivoEvaluacion,
  type EstudianteEvaluacion,
} from "../../../services/profesorEvaluacionApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ObservacionesProps {
  user?: UserSession;
  onBack?: () => void;
}

type FiltroObservacion = "TODAS" | "CON_ARCHIVO" | "APROBADO" | "REPROBADO";

export function Observaciones({ user, onBack }: ObservacionesProps) {
  const rutEstudiante = user?.rut ?? "";

  // ── Estados de datos ──
  const [evaluaciones, setEvaluaciones] = useState<EstudianteEvaluacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Filtros y búsqueda ──
  const [searchQuery, setSearchQuery] = useState("");
  const [filtro, setFiltro] = useState<FiltroObservacion>("TODAS");

  // ── Modal de detalle ──
  const [selectedEval, setSelectedEval] = useState<EstudianteEvaluacion | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Cargar evaluaciones emitidas por el profesor
  const cargarEvaluaciones = async () => {
    if (!rutEstudiante) {
      setError("No se encontró información de usuario válida.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getEvaluacionesEstudiante(rutEstudiante);
      setEvaluaciones(data);
    } catch (err: any) {
      console.error("Error al cargar evaluaciones:", err);
      setError(err?.message || "No se pudo cargar la información de evaluaciones.");
      sileo.error({
        title: "Error al cargar datos",
        description: err?.message || "No se pudo conectar con el servidor.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarEvaluaciones();
  }, [rutEstudiante]);

  // Manejar descarga de archivo de evaluación / pauta
  const handleDescargar = async (item: EstudianteEvaluacion) => {
    setIsDownloading(true);
    try {
      await descargarArchivoEvaluacion(
        item.idEvaluacion ?? null,
        item.idEstudiante ?? null,
        item.nombreArchivo || `evaluacion_${item.asignatura || "practica"}.pdf`
      );
      sileo.success({
        title: "Descarga exitosa",
        description: `Se ha descargado el documento: ${item.nombreArchivo || "Pauta de evaluación"}`,
      });
    } catch (err: any) {
      console.error("Error al descargar archivo:", err);
      sileo.error({
        title: "Error al descargar",
        description: err?.message || "No se pudo obtener el documento adjunto.",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // Formato amigable de fecha
  const formatFecha = (iso?: string) => {
    if (!iso) return "Sin fecha registrada";
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      return d.toLocaleDateString("es-CL", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    } catch {
      return iso;
    }
  };

  // Solamente se muestran las evaluaciones una vez que el docente haya creado la nota Y la observación
  const evaluacionesValidas = useMemo(() => {
    return evaluaciones.filter(
      (ev) =>
        ev.nota != null &&
        ev.observacion != null &&
        ev.observacion.trim().length > 0
    );
  }, [evaluaciones]);

  // Filtrado según búsqueda y tipo de filtro
  const filteredEvaluaciones = useMemo(() => {
    return evaluacionesValidas.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        (item.asignatura && item.asignatura.toLowerCase().includes(q)) ||
        (item.evaluadorNombre && item.evaluadorNombre.toLowerCase().includes(q)) ||
        (item.tipoEvaluacion && item.tipoEvaluacion.toLowerCase().includes(q)) ||
        (item.observacion && item.observacion.toLowerCase().includes(q)) ||
        (item.centroPractica && item.centroPractica.toLowerCase().includes(q));

      if (!matchQuery) return false;

      if (filtro === "CON_ARCHIVO") return !!item.tieneArchivo;
      if (filtro === "APROBADO") return item.nota != null && item.nota >= 4.0;
      if (filtro === "REPROBADO") return item.nota != null && item.nota < 4.0;
      return true;
    });
  }, [evaluacionesValidas, searchQuery, filtro]);

  // Contadores para filtros
  const conteos = useMemo(() => {
    let conArchivos = 0;
    let aprobadas = 0;
    let reprobadas = 0;

    evaluacionesValidas.forEach((ev) => {
      if (ev.tieneArchivo) conArchivos++;
      if (ev.nota != null && ev.nota >= 4.0) aprobadas++;
      if (ev.nota != null && ev.nota < 4.0) reprobadas++;
    });

    return {
      total: evaluacionesValidas.length,
      conArchivos,
      aprobadas,
      reprobadas,
    };
  }, [evaluacionesValidas]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ── Encabezado Institucional ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-700">
              <MessageSquareText className="size-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Observaciones y Evaluaciones Docentes
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Consulta tus calificaciones de práctica, observaciones pedagógicas y pautas adjuntas por tu profesor
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={cargarEvaluaciones}
            disabled={loading}
            className="gap-1.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin text-sky-600" : ""}`} />
            Actualizar
          </Button>

          {onBack && (
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
              className="text-xs text-sky-800 bg-sky-50 border-sky-200 hover:bg-sky-100 gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="size-3.5" />
              Volver al Inicio
            </Button>
          )}
        </div>
      </div>

      {/* ── Filtros y Búsqueda ── */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Buscar por asignatura, profesor, tipo o contenido..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs border-slate-200 focus-visible:ring-sky-500"
            />
          </div>

          {/* Filtros tipo pills */}
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            <span className="text-xs text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="size-3" /> Filtrar:
            </span>
            <button
              type="button"
              onClick={() => setFiltro("TODAS")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer border ${
                filtro === "TODAS"
                  ? "bg-[#0b1329] text-white border-[#0b1329]"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              Todas ({conteos.total})
            </button>
            <button
              type="button"
              onClick={() => setFiltro("CON_ARCHIVO")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer border ${
                filtro === "CON_ARCHIVO"
                  ? "bg-[#0b1329] text-white border-[#0b1329]"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              Con Pauta / Archivo ({conteos.conArchivos})
            </button>
            {conteos.aprobadas > 0 && (
              <button
                type="button"
                onClick={() => setFiltro("APROBADO")}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer border ${
                  filtro === "APROBADO"
                    ? "bg-[#0b1329] text-white border-[#0b1329]"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                Aprobadas ({conteos.aprobadas})
              </button>
            )}
            {conteos.reprobadas > 0 && (
              <button
                type="button"
                onClick={() => setFiltro("REPROBADO")}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer border ${
                  filtro === "REPROBADO"
                    ? "bg-[#0b1329] text-white border-[#0b1329]"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                Reprobadas ({conteos.reprobadas})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Contenedor Principal: Tabla de Evaluaciones ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="size-8 text-sky-600 animate-spin" />
            <p className="text-sm font-medium text-slate-600">Cargando evaluaciones y observaciones...</p>
          </div>
        ) : error ? (
          <div className="p-10 flex flex-col items-center gap-3 text-center">
            <AlertCircle className="size-10 text-rose-500" />
            <h3 className="text-base font-bold text-slate-800">No se pudieron cargar los datos</h3>
            <p className="text-xs text-slate-500 max-w-md">{error}</p>
            <Button variant="outline" size="sm" onClick={cargarEvaluaciones} className="text-xs gap-1.5">
              <RefreshCw className="size-3" />
              Reintentar
            </Button>
          </div>
        ) : filteredEvaluaciones.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="size-14 rounded-2xl bg-sky-50 flex items-center justify-center mx-auto text-sky-600">
              <MessageSquareText className="size-7" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">
              No hay evaluaciones disponibles
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery || filtro !== "TODAS"
                ? "No hay evaluaciones que coincidan con los criterios de búsqueda o filtro aplicados."
                : "Tu profesor aún no ha registrado tu calificación y observación. Aparecerán aquí una vez que ambas hayan sido creadas."}
            </p>
            {(searchQuery || filtro !== "TODAS") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setFiltro("TODAS");
                }}
                className="text-xs"
              >
                Limpiar filtros
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/75 text-xs uppercase font-semibold text-slate-500 tracking-wider">
                  <th className="py-3.5 px-4">Asignatura / Evaluación</th>
                  <th className="py-3.5 px-4">Docente Evaluador</th>
                  <th className="py-3.5 px-4">Fecha</th>
                  <th className="py-3.5 px-4 text-center">Nota</th>
                  <th className="py-3.5 px-4">Observación</th>
                  <th className="py-3.5 px-4 text-center">Pauta / Archivo</th>
                  <th className="py-3.5 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEvaluaciones.map((item, idx) => {
                  const tieneNota = item.nota != null;
                  const notaNum = item.nota != null ? Number(item.nota) : null;
                  const aprobado = notaNum != null && notaNum >= 4.0;

                  return (
                    <tr
                      key={item.idEvaluacion ?? item.idEstudiante ?? idx}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Asignatura / Evaluación */}
                      <td className="py-3.5 px-4">
                        <div className="min-w-0 max-w-[240px]">
                          <p className="font-semibold text-slate-900 truncate flex items-center gap-1.5">
                            <BookOpen className="size-3.5 text-sky-600 shrink-0" />
                            {item.asignatura || "Práctica Profesional"}
                          </p>
                          <p className="text-xs text-slate-500 truncate mt-0.5">
                            {item.tipoEvaluacion || "Evaluación Docente"}
                          </p>
                          {item.centroPractica && (
                            <p className="text-2xs text-slate-400 truncate flex items-center gap-1 mt-0.5">
                              <Building2 className="size-2.5" />
                              {item.centroPractica}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Docente Evaluador */}
                      <td className="py-3.5 px-4">
                        <div className="min-w-0">
                          <p className="font-medium text-slate-800 text-xs flex items-center gap-1.5">
                            <User className="size-3 text-slate-400" />
                            {item.evaluadorNombre || "Profesor de Asignatura"}
                          </p>
                          {item.evaluadorRut && (
                            <p className="text-2xs font-mono text-slate-400 mt-0.5">
                              RUT {item.evaluadorRut}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Fecha de registro */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="size-3 text-slate-400" />
                          <span>{formatFecha(item.fechaEvaluacion)}</span>
                        </div>
                      </td>

                      {/* Calificación / Nota */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {tieneNota ? (
                          <span
                            className={`inline-flex items-center justify-center font-mono font-bold text-xs px-2.5 py-1 rounded-lg border ${
                              aprobado
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : "bg-rose-50 text-rose-800 border-rose-200"
                            }`}
                          >
                            {notaNum?.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 font-mono inline-flex items-center gap-1">
                            <Clock className="size-3 text-amber-500" />
                            Pendiente
                          </span>
                        )}
                      </td>

                      {/* Observación / Extracto */}
                      <td className="py-3.5 px-4 max-w-xs">
                        {item.observacion && item.observacion.trim().length > 0 ? (
                          <p className="text-xs text-slate-600 line-clamp-2 italic leading-relaxed">
                            "{item.observacion}"
                          </p>
                        ) : (
                          <span className="text-2xs text-slate-400 italic">
                            Sin observaciones registradas
                          </span>
                        )}
                      </td>

                      {/* Documento adjunto / Pauta */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {item.tieneArchivo ? (
                          <button
                            type="button"
                            onClick={() => handleDescargar(item)}
                            disabled={isDownloading}
                            title="Descargar pauta / documento"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 transition-colors cursor-pointer"
                          >
                            <Download className="size-3" />
                            <span className="max-w-[110px] truncate">
                              {item.nombreArchivo || "Pauta"}
                            </span>
                          </button>
                        ) : (
                          <span className="text-2xs text-slate-400 font-medium">—</span>
                        )}
                      </td>

                      {/* Botón de Acción */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedEval(item)}
                          className="h-8 px-3 text-xs gap-1.5 font-medium border-sky-200 text-sky-800 bg-sky-50/50 hover:bg-sky-100 hover:border-sky-300 transition-all cursor-pointer shadow-2xs"
                        >
                          <Eye className="size-3.5" />
                          Ver detalles
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── MODAL: Detalle de Evaluación y Retroalimentación ── */}
      {selectedEval && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            {/* Cabecera del modal */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-linear-to-r from-sky-50 to-indigo-50/40 shrink-0">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-sky-600 flex items-center justify-center text-white shadow-xs">
                  <Award className="size-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Detalle de Evaluación y Observaciones
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedEval.asignatura || "Práctica Profesional"} • {selectedEval.tipoEvaluacion || "Evaluación Docente"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedEval(null)}
                className="size-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white/80 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Contenido scrolleable */}
            <div className="p-6 space-y-5 overflow-y-auto text-sm">
              {/* Tarjeta de Contexto Académico */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <BookOpen className="size-4 text-sky-600" /> Información Académica
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">Docente Evaluador:</span>
                    <span className="font-semibold text-slate-800">
                      {selectedEval.evaluadorNombre || "Profesor de Asignatura"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Centro de Práctica:</span>
                    <span className="font-semibold text-slate-800">
                      {selectedEval.centroPractica || "No asignado / En gestión"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Fecha de Evaluación:</span>
                    <span className="font-semibold text-slate-800">
                      {formatFecha(selectedEval.fechaEvaluacion)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Estado de Registro:</span>
                    <span className="font-semibold text-slate-800">
                      {selectedEval.nota != null ? "Calificación Registrada" : "Pendiente de Calificación"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tarjeta de Calificación Obtenida */}
              <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Calificación Obtenida
                  </span>
                  <div className="flex items-baseline gap-2 justify-center sm:justify-start">
                    {selectedEval.nota != null ? (
                      <>
                        <span className="text-4xl font-mono font-bold text-slate-900">
                          {selectedEval.nota.toFixed(1)}
                        </span>
                        <span className="text-sm font-mono text-slate-400 font-semibold">
                          / 7.0
                        </span>
                      </>
                    ) : (
                      <span className="text-2xl font-mono text-slate-400 font-semibold">
                        Sin nota aún
                      </span>
                    )}
                  </div>
                  <p className="text-2xs text-slate-500 font-mono">Escala chilena oficial: 1.0 a 7.0</p>
                </div>

                {selectedEval.nota != null && (
                  <div className="text-center sm:text-right">
                    {selectedEval.nota >= 4.0 ? (
                      <div className="inline-flex flex-col items-center sm:items-end gap-1">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="size-3.5" />
                          Aprobado
                        </span>
                        <span className="text-2xs text-emerald-700 font-medium">
                          Rendimiento satisfactorio
                        </span>
                      </div>
                    ) : (
                      <div className="inline-flex flex-col items-center sm:items-end gap-1">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          <AlertCircle className="size-3.5" />
                          Reprobado
                        </span>
                        <span className="text-2xs text-rose-700 font-medium">
                          Calificación inferior a 4.0
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Tarjeta de Observación y Retroalimentación Pedagógica */}
              <div className="bg-slate-50/70 rounded-xl p-5 border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <MessageSquareText className="size-4 text-indigo-600" />
                    Retroalimentación y Observaciones del Docente
                  </span>
                  {selectedEval.observacion && (
                    <span className="text-2xs text-slate-400">
                      {selectedEval.observacion.length} caracteres
                    </span>
                  )}
                </div>

                {selectedEval.observacion && selectedEval.observacion.trim().length > 0 ? (
                  <div className="bg-white rounded-lg p-4 border border-slate-200/60 shadow-2xs">
                    <p className="text-xs sm:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                      {selectedEval.observacion}
                    </p>
                  </div>
                ) : (
                  <div className="bg-white/60 rounded-lg p-4 border border-dashed border-slate-200 text-center">
                    <p className="text-xs text-slate-400 italic">
                      El profesor no ha registrado comentarios u observaciones formativas adicionales para esta evaluación.
                    </p>
                  </div>
                )}
              </div>

              {/* Tarjeta de Documento / Pauta adjunta por el Profesor */}
              <div className="bg-slate-50/70 rounded-xl p-5 border border-slate-200/80 space-y-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Paperclip className="size-4 text-sky-600" />
                  Pauta o Documento de Evaluación Adjunto
                </span>

                {selectedEval.tieneArchivo ? (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-sky-100 shadow-2xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-10 rounded-lg bg-sky-50 border border-sky-200/80 flex items-center justify-center text-sky-700 shrink-0">
                        <FileText className="size-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 text-xs sm:text-sm truncate">
                          {selectedEval.nombreArchivo || "Pauta_Evaluacion_Docente.pdf"}
                        </p>
                        <p className="text-2xs text-slate-400">
                          Documento cargado por el docente evaluador
                        </p>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleDescargar(selectedEval)}
                      disabled={isDownloading}
                      className="gap-1.5 text-xs bg-sky-700 hover:bg-sky-800 text-white cursor-pointer shadow-xs shrink-0 w-full sm:w-auto"
                    >
                      <Download className="size-3.5" />
                      {isDownloading ? "Descargando..." : "Descargar Documento"}
                    </Button>
                  </div>
                ) : (
                  <div className="bg-white/60 rounded-lg p-4 border border-dashed border-slate-200 text-center">
                    <p className="text-xs text-slate-400 italic">
                      No se ha adjuntado ningún archivo ni pauta en esta evaluación.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Pie del modal */}
            <div className="flex items-center justify-between p-4 bg-slate-50 border-t border-slate-100 shrink-0">
              <span className="text-2xs text-slate-500 font-medium">
                {selectedEval.evaluadorNombre
                  ? `Docente: ${selectedEval.evaluadorNombre}`
                  : selectedEval.evaluadorRut
                    ? `Docente: ${selectedEval.evaluadorRut}`
                    : "Plataforma de Prácticas UBB"}
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedEval(null)}
                  className="text-xs cursor-pointer"
                >
                  Cerrar
                </Button>
                {selectedEval.tieneArchivo && (
                  <Button
                    size="sm"
                    onClick={() => handleDescargar(selectedEval)}
                    disabled={isDownloading}
                    className="gap-1.5 text-xs bg-sky-700 hover:bg-sky-800 text-white cursor-pointer shadow-xs"
                  >
                    <Download className="size-3.5" />
                    Descargar Pauta
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
