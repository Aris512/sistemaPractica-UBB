import { useState, useEffect, useRef } from "react";
import {
  Award,
  X,
  Maximize2,
  Minimize2,
  GraduationCap,
  User,
  Mail,
  BookOpen,
  Calendar,
  FileCheck2,
  FileX,
  FileText,
  UploadCloud,
  Download,
  Trash2,
  RefreshCw,
  Send,
  Building2,
  Paperclip,
  ExternalLink,
  Eye,
} from "lucide-react";
import { sileo } from "sileo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDeleteDialog } from "@/components/ui/ConfirmDeleteDialog";
import {
  guardarEvaluacionProfesor,
  descargarArchivoEvaluacion,
  obtenerArchivoEntregaAlumno,
  type EstudianteEvaluacion,
} from "../../../services/profesorEvaluacionApi";

interface ModalEvaluacionesProps {
  isOpen: boolean;
  student: EstudianteEvaluacion | null;
  profesorRut?: string;
  rutProfesor?: string;
  onClose: () => void;
  onSaved: (updatedStudent: EstudianteEvaluacion) => void;
}

export function ModalEvaluaciones({
  isOpen,
  student,
  profesorRut,
  rutProfesor: rutProfesorProp,
  onClose,
  onSaved,
}: ModalEvaluacionesProps) {
  const rutProfesor = rutProfesorProp || profesorRut || "11111111-1";
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tipoEvaluacion, setTipoEvaluacion] = useState("Evaluación Docente");
  const [nota, setNota] = useState("");
  const [observacion, setObservacion] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [eliminarArchivoActual, setEliminarArchivoActual] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [campoAEliminar, setCampoAEliminar] = useState<"nota" | "observacion" | "archivo" | null>(null);
  const [pestanaActiva, setPestanaActiva] = useState<"evaluacion" | "entrega">("evaluacion");
  const [entregaUrl, setEntregaUrl] = useState<string | null>(null);
  const [entregaTipo, setEntregaTipo] = useState("");
  const [entregaCargando, setEntregaCargando] = useState(false);
  const [entregaError, setEntregaError] = useState<string | null>(null);
  const [entregaIntento, setEntregaIntento] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Inicializar estado cuando se abre con un estudiante
  useEffect(() => {
    if (student) {
      setNota(student.nota != null ? String(student.nota) : "");
      setObservacion(student.observacion || "");
      setTipoEvaluacion(student.tipoEvaluacion || "Evaluación Docente");
      setArchivo(null);
      setEliminarArchivoActual(false);
    }
  }, [student]);

  // Al cambiar de estudiante se vuelve a la pestaña de evaluación y se descarta la vista previa anterior
  useEffect(() => {
    setPestanaActiva("evaluacion");
    setEntregaUrl(null);
    setEntregaError(null);
  }, [student?.idEstudiante, student?.idEvidencia]);

  // Carga la entrega del alumno solo cuando se abre su pestaña
  useEffect(() => {
    if (pestanaActiva !== "entrega" || entregaUrl || !student?.idEvidencia || !student.tieneArchivoEntrega) return;
    let cancelado = false;
    setEntregaCargando(true);
    setEntregaError(null);
    obtenerArchivoEntregaAlumno(student.idEvidencia, student.nombreArchivoEntrega)
      .then((blob) => {
        if (cancelado) return;
        setEntregaTipo(blob.type);
        setEntregaUrl(URL.createObjectURL(blob));
      })
      .catch((err: any) => {
        if (!cancelado) setEntregaError(err?.message || "No se pudo cargar el archivo del alumno.");
      })
      .finally(() => {
        if (!cancelado) setEntregaCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [pestanaActiva, entregaUrl, entregaIntento, student?.idEvidencia, student?.tieneArchivoEntrega, student?.nombreArchivoEntrega]);

  // Libera la URL temporal de la vista previa
  useEffect(() => {
    return () => {
      if (entregaUrl) URL.revokeObjectURL(entregaUrl);
    };
  }, [entregaUrl]);

  if (!isOpen || !student) return null;

  // Formatear tamaño de archivo en bytes a texto legible
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Manejador de selección de archivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validación de 20MB
    const MAX_SIZE = 20 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      sileo.error({
        title: "Archivo muy pesado",
        description: "El documento excede el límite máximo institucional de 20 MB.",
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setArchivo(file);
    setEliminarArchivoActual(false);
    sileo.info({
      title: "Documento adjuntado",
      description: `"${file.name}" listo para subirse al guardar la evaluación.`,
    });
  };

  // Descargar el documento de evaluación existente
  const handleDescargarDocumento = async () => {
    try {
      setIsDownloading(true);
      sileo.show({
        title: "Descargando documento",
        description: `Preparando archivo de evaluación...`,
      });
      await descargarArchivoEvaluacion(student.idEvaluacion, student.idEstudiante, student.nombreArchivo);
      sileo.success({
        title: "Descarga completada",
        description: `Se descargó el archivo de evaluación correctamente.`,
      });
    } catch (err: any) {
      console.error("Error al descargar archivo de evaluación:", err);
      sileo.error({
        title: "Error de descarga",
        description: err.message || "No se pudo descargar el archivo de evaluación.",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDescargarEntrega = () => {
    if (!entregaUrl) return;
    const a = document.createElement("a");
    a.href = entregaUrl;
    a.download = student.nombreArchivoEntrega || `entrega_${student.idEvidencia}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Guardar evaluación con nota, observación y documento adjunto
  const handleGuardarEvaluacion = async () => {
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

    // Si no había evaluación y todos los campos quedan vacíos
    if (
      puntajeFinal === null &&
      obsFinal === null &&
      !archivo &&
      !student.tieneArchivo &&
      student.nota == null &&
      !student.observacion
    ) {
      sileo.warning({
        title: "Formulario vacío",
        description: "Debes ingresar al menos una calificación, una observación pedagógica o adjuntar un documento.",
      });
      return;
    }

    setIsSaving(true);
    try {
      const updated = await guardarEvaluacionProfesor({
        idEstudiante: student.idEstudiante,
        idEvaluacion: student.idEvaluacion ?? null,
        rutProfesor,
        tipoEvaluacion: tipoEvaluacion.trim() || "Evaluación Docente",
        puntajeMinimo: 1.0,
        puntajeMaximo: 7.0,
        puntajeObtenido: puntajeFinal,
        observacion: obsFinal,
        file: archivo,
        eliminarArchivo: eliminarArchivoActual,
      });

      onSaved(updated);
      sileo.success({
        title: "Evaluación guardada",
        description: `Se registraron los cambios para ${updated.nombre} ${updated.apellido} con éxito.`,
      });
      onClose();
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

  const handleQuitarNota = () => {
    setNota("");
    sileo.info({
      title: "Nota eliminada del formulario",
      description: "Presiona 'Guardar Evaluación' para persistir los cambios en la base de datos.",
    });
  };

  const handleQuitarObservacion = () => {
    setObservacion("");
    sileo.info({
      title: "Observación eliminada del formulario",
      description: "Presiona 'Guardar Evaluación' para persistir los cambios en la base de datos.",
    });
  };

  const handleQuitarArchivo = () => {
    if (archivo) {
      setArchivo(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } else if (student.tieneArchivo) {
      setEliminarArchivoActual(true);
      sileo.info({
        title: "Archivo marcado para eliminar",
        description: "El documento adjunto se eliminará al presionar 'Guardar Evaluación'.",
      });
    }
  };

  const hayCambios =
    nota !== (student.nota != null ? String(student.nota) : "") ||
    observacion !== (student.observacion || "") ||
    tipoEvaluacion !== (student.tipoEvaluacion || "Evaluación Docente") ||
    archivo !== null ||
    eliminarArchivoActual;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
      <div
        className={`bg-white shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
          isFullscreen
            ? "fixed inset-0 z-50 w-screen h-screen max-w-none max-h-none rounded-none"
            : "relative z-50 rounded-2xl max-w-4xl w-full max-h-[92vh] border border-slate-200"
        }`}
      >
        {/* Cabecera del Modal con botón de Pantalla Completa y Cerrar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-linear-to-r from-sky-50 via-slate-50 to-indigo-50/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-sky-700 flex items-center justify-center text-white shadow-xs">
              <Award className="size-5.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-lg">
                  {student.nota != null ? "Detalle y Modificación de Evaluación" : "Emitir Evaluación"}
                </h3>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-sky-800 bg-sky-100/80 px-2.5 py-0.5 rounded-full border border-sky-200">
                  {student.asignatura}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Estudiante: <strong>{student.nombre} {student.apellido}</strong> • RUT: {student.rut}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Botón Pantalla Completa */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="size-8.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200 flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
              title={isFullscreen ? "Restaurar ventana" : "Ver en pantalla completa"}
            >
              {isFullscreen ? (
                <Minimize2 className="size-4 text-slate-700" />
              ) : (
                <Maximize2 className="size-4 text-slate-700" />
              )}
            </button>

            {/* Botón Cerrar */}
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="size-8.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white border border-transparent hover:border-slate-200 flex items-center justify-center cursor-pointer transition-colors"
              title="Cerrar modal"
            >
              <X className="size-4.5" />
            </button>
          </div>
        </div>

        {/* Pestañas estilo navegador: evaluación y entrega del alumno */}
        <div className="flex items-end gap-1 px-4 pt-2 bg-slate-100 border-b border-slate-200 shrink-0 overflow-x-auto" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={pestanaActiva === "evaluacion"}
            onClick={() => setPestanaActiva("evaluacion")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-t-lg border border-b-0 cursor-pointer transition-colors -mb-px ${
              pestanaActiva === "evaluacion"
                ? "bg-white text-slate-900 border-slate-200"
                : "bg-transparent text-slate-500 border-transparent hover:bg-slate-200/70 hover:text-slate-700"
            }`}
          >
            <Award className="size-3.5 text-sky-700 shrink-0" />
            <span className="truncate">Evaluación</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={pestanaActiva === "entrega"}
            onClick={() => setPestanaActiva("entrega")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-t-lg border border-b-0 cursor-pointer transition-colors -mb-px ${
              pestanaActiva === "entrega"
                ? "bg-white text-slate-900 border-slate-200"
                : "bg-transparent text-slate-500 border-transparent hover:bg-slate-200/70 hover:text-slate-700"
            }`}
            title={student.nombreArchivoEntrega || "Entrega del alumno"}
          >
            <Eye className="size-3.5 text-emerald-700 shrink-0" />
            <span className="truncate max-w-56">
              {student.nombreArchivoEntrega || "Entrega del alumno"}
            </span>
          </button>
        </div>

        {pestanaActiva === "entrega" ? (
          <div className="flex-1 flex flex-col min-h-0 bg-slate-50">
            {/* Barra tipo dirección con los datos de la entrega */}
            <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-white border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-2 min-w-0 flex-1 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-600">
                <FileText className="size-3.5 text-slate-400 shrink-0" />
                <span className="truncate font-medium">
                  {student.nombreArchivoEntrega || "Sin archivo"}
                </span>
                {student.tituloActividad && (
                  <span className="truncate text-slate-400 hidden sm:inline">• {student.tituloActividad}</span>
                )}
                {student.fechaEntrega && (
                  <span className="text-slate-400 font-mono shrink-0 hidden md:inline">
                    • {new Date(student.fechaEntrega).toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" })}
                  </span>
                )}
              </div>
              {entregaUrl && (
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(entregaUrl, "_blank", "noopener")}
                    className="text-xs h-8 gap-1.5 bg-white cursor-pointer"
                    title="Abrir en una pestaña nueva del navegador"
                  >
                    <ExternalLink className="size-3" />
                    <span className="hidden sm:inline">Abrir</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDescargarEntrega}
                    className="text-xs h-8 gap-1.5 bg-white cursor-pointer"
                  >
                    <Download className="size-3" />
                    <span className="hidden sm:inline">Descargar</span>
                  </Button>
                </div>
              )}
            </div>

            <div className={`flex-1 min-h-0 ${isFullscreen ? "" : "h-[60vh]"}`}>
              {!student.idEvidencia || !student.tieneArchivoEntrega ? (
                <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-500 p-6 text-center">
                  <FileX className="size-8 text-slate-300" />
                  <p className="text-sm font-semibold text-slate-700">El alumno aún no ha subido un archivo</p>
                  <p className="text-xs">Cuando entregue la actividad podrás revisarlo aquí.</p>
                </div>
              ) : entregaCargando ? (
                <div className="h-full flex items-center justify-center gap-2 text-xs text-slate-500">
                  <RefreshCw className="size-4 animate-spin" />
                  Cargando archivo del alumno...
                </div>
              ) : entregaError ? (
                <div className="h-full flex flex-col items-center justify-center gap-3 p-6 text-center">
                  <p className="text-xs text-rose-600 font-medium">{entregaError}</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEntregaError(null);
                      setEntregaIntento((n) => n + 1);
                    }}
                    className="text-xs h-8 gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="size-3" />
                    Reintentar
                  </Button>
                </div>
              ) : entregaUrl && entregaTipo.startsWith("image/") ? (
                <div className="h-full overflow-auto flex items-start justify-center p-4">
                  <img
                    src={entregaUrl}
                    alt={student.nombreArchivoEntrega || "Entrega del alumno"}
                    className="max-w-full rounded-lg border border-slate-200 shadow-xs bg-white"
                  />
                </div>
              ) : entregaUrl && (entregaTipo === "application/pdf" || entregaTipo.startsWith("text/")) ? (
                <iframe
                  src={entregaUrl}
                  title={student.nombreArchivoEntrega || "Entrega del alumno"}
                  className="w-full h-full border-0 bg-white"
                />
              ) : entregaUrl ? (
                <div className="h-full flex flex-col items-center justify-center gap-3 p-6 text-center">
                  <FileText className="size-8 text-slate-300" />
                  <p className="text-sm font-semibold text-slate-700">Este tipo de archivo no se puede previsualizar</p>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleDescargarEntrega}
                    className="text-xs h-8 gap-1.5 bg-sky-700 hover:bg-sky-800 text-white cursor-pointer"
                  >
                    <Download className="size-3" />
                    Descargar archivo
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        ) : (
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Columna Izquierda: Información Académica del Estudiante */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200/70 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <User className="size-4 text-sky-700" />
                    Ficha del Alumno
                  </span>
                  {student.estadoEntrega === "ENTREGADO" ? (
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <FileCheck2 className="size-3" /> Entregado
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 border border-slate-300 flex items-center gap-1">
                      <FileX className="size-3" /> Sin entrega
                    </span>
                  )}
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold uppercase tracking-wider">
                      Nombre Completo
                    </span>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">
                      {student.nombre} {student.apellido}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-400 block text-[10px] font-semibold uppercase tracking-wider">
                        RUT Institucional
                      </span>
                      <p className="font-mono font-semibold text-slate-800 text-xs mt-0.5">
                        {student.rut}
                      </p>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px] font-semibold uppercase tracking-wider">
                        Carrera
                      </span>
                      <p className="font-semibold text-slate-800 text-xs mt-0.5 flex items-center gap-1">
                        <GraduationCap className="size-3 text-sky-700" />
                        Pedagogía UBB
                      </p>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold uppercase tracking-wider">
                      Correo Electrónico
                    </span>
                    <a
                      href={`mailto:${student.correo}`}
                      className="font-medium text-sky-800 hover:underline flex items-center gap-1 mt-0.5 truncate"
                    >
                      <Mail className="size-3 text-slate-400 shrink-0" />
                      {student.correo || "Sin correo"}
                    </a>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold uppercase tracking-wider">
                      Asignatura en Curso
                    </span>
                    <p className="font-semibold text-slate-900 flex items-center gap-1.5 mt-0.5">
                      <BookOpen className="size-3.5 text-sky-700 shrink-0" />
                      {student.asignatura}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold uppercase tracking-wider">
                      Centro de Práctica
                    </span>
                    <p className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                      <Building2 className="size-3.5 text-slate-500 shrink-0" />
                      {student.centroPractica || "No asignado / En gestión"}
                    </p>
                  </div>

                  {student.fechaEvaluacion && (
                    <div className="pt-2 border-t border-slate-200/60 text-[11px] text-slate-500 flex items-center gap-1.5">
                      <Calendar className="size-3.5 text-slate-400" />
                      <span>
                        Última fecha de evaluación:{" "}
                        <strong className="text-slate-700 font-mono">
                          {new Date(student.fechaEvaluacion).toLocaleDateString("es-CL", {
                            day: "2-digit", 
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </strong>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Caja explicativa de rúbrica institucional */}
              <div className="bg-sky-50/60 rounded-xl p-3.5 border border-sky-100 text-xs text-sky-900 space-y-1">
                <span className="font-bold flex items-center gap-1 text-sky-800">
                  <Award className="size-3.5" />
                  Criterio de Aprobación
                </span>
                <p className="text-[11px] text-sky-700 leading-relaxed">
                  Las asignaturas de práctica exigen una calificación igual o superior a <strong>4.0</strong> en la escala de 1.0 a 7.0 para ser computadas en el avance curricular del estudiante.
                </p>
              </div>
            </div>

            {/* Columna Derecha: Formulario de Evaluación, Calificación y Documento */}
            <div className="lg:col-span-7 space-y-5">
              {/* 1. Tipo de Evaluación */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Tipo o Título de la Evaluación <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej: Evaluación Final de Práctica, Evaluación Intermedia..."
                  value={tipoEvaluacion}
                  onChange={(e) => setTipoEvaluacion(e.target.value)}
                  className="w-full h-10 border border-slate-200 rounded-xl px-3.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-medium text-slate-800"
                />
              </div>

              {/* 2. Calificación / Nota */}
              <div className="space-y-2 bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    Nota de la Evaluación <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    {nota.trim() !== "" && (
                      <button
                        type="button"
                        onClick={() => setCampoAEliminar("nota")}
                        disabled={isSaving}
                        className="text-xs text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 cursor-pointer font-medium transition-colors"
                      >
                        <Trash2 className="size-3" />
                        Eliminar nota
                      </button>
                    )}
                    <span className="text-[11px] text-slate-400 font-mono">
                      Escala de 1.0 a 7.0
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
                    className="text-lg font-mono font-black h-11 pl-3.5 pr-12 border-slate-200 bg-white"
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 font-mono text-xs font-semibold text-slate-400">
                    / 7.0
                  </div>
                </div>

                {nota && (
                  <p className="text-xs font-medium">
                    {parseFloat(nota) >= 4.0 ? (
                      <span className="text-emerald-700 flex items-center gap-1">
                        ✓ Calificación aprobatoria (satisfactoria para avance académico)
                      </span>
                    ) : (
                      <span className="text-rose-600 flex items-center gap-1">
                        ⚠ Calificación reprobatoria (menor al requisito mínimo de 4.0)
                      </span>
                    )}
                  </p>
                )}
              </div>

              {/* 3. Observación y Retroalimentación Pedagógica */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    Observación y Retroalimentación Pedagógica
                  </label>
                  <div className="flex items-center gap-2">
                    {observacion.trim() !== "" && (
                      <button
                        type="button"
                        onClick={() => setCampoAEliminar("observacion")}
                        disabled={isSaving}
                        className="text-xs text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 cursor-pointer font-medium transition-colors"
                      >
                        <Trash2 className="size-3" />
                        Eliminar observación
                      </button>
                    )}
                    <span className="text-[11px] text-slate-400 font-mono">
                      {observacion.length} caracteres
                    </span>
                  </div>
                </div>
                <textarea
                  rows={isFullscreen ? 6 : 4}
                  placeholder="Escriba los comentarios cualitativos, fortalezas observadas y sugerencias de mejora pedagógica para el estudiante..."
                  value={observacion}
                  onChange={(e) => setObservacion(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3.5 text-xs bg-white resize-none focus:outline-none focus:ring-2 focus:ring-sky-500/20 leading-relaxed font-sans"
                />
              </div>

              {/* 4. Subida y Gestión de Documento de Evaluación */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Paperclip className="size-3.5 text-sky-700" />
                    Documento de Evaluación / Pauta Docente Adjunta
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">
                    PDF, Word, Excel o ZIP (hasta 20 MB)
                  </span>
                </div>

                {/* Si ya existe un archivo cargado en el servidor y no está marcado para eliminar */}
                {student.tieneArchivo && !eliminarArchivoActual && !archivo && (
                  <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/60">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="size-8 rounded-lg bg-emerald-100 border border-emerald-200 text-emerald-800 flex items-center justify-center shrink-0">
                        <FileText className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-800 truncate block" title={student.nombreArchivo || "Documento de evaluación"}>
                          {student.nombreArchivo || "Pauta_Evaluacion_Docente.pdf"}
                        </span>
                        <span className="text-[10px] text-emerald-700 font-medium">
                          ✓ Documento archivado en el servidor
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isDownloading}
                        onClick={handleDescargarDocumento}
                        className="text-xs h-8 gap-1.5 text-emerald-800 hover:text-emerald-900 bg-white border-emerald-300 hover:bg-emerald-50 cursor-pointer shadow-2xs"
                      >
                        {isDownloading ? (
                          <RefreshCw className="size-3 animate-spin" />
                        ) : (
                          <Download className="size-3" />
                        )}
                        <span>Descargar</span>
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setCampoAEliminar("archivo")}
                        className="text-xs h-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 cursor-pointer"
                        title="Eliminar este archivo de la evaluación"
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Archivo marcado para eliminar */}
                {eliminarArchivoActual && !archivo && (
                  <div className="p-3 rounded-xl border border-dashed border-rose-200 bg-rose-50/50 flex items-center justify-between text-xs text-rose-800">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Trash2 className="size-3.5 text-rose-600" />
                      El documento actual será eliminado al guardar.
                    </span>
                    <button
                      type="button"
                      onClick={() => setEliminarArchivoActual(false)}
                      className="text-xs text-slate-600 hover:text-slate-900 hover:underline font-semibold cursor-pointer"
                    >
                      Cancelar eliminación
                    </button>
                  </div>
                )}

                {/* Si se seleccionó un archivo nuevo desde el equipo */}
                {archivo && (
                  <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-sky-200 bg-sky-50/60">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="size-8 rounded-lg bg-sky-100 border border-sky-200 text-sky-800 flex items-center justify-center shrink-0">
                        <FileText className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-800 truncate block">
                          {archivo.name}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {formatFileSize(archivo.size)} • Listo para subirse
                        </span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setArchivo(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="text-xs h-8 text-slate-500 hover:text-rose-600 hover:bg-white cursor-pointer"
                      title="Quitar archivo seleccionado"
                    >
                      <X className="size-3.5" />
                      <span>Quitar</span>
                    </Button>
                  </div>
                )}

                {/* Input selector de archivo */}
                {!archivo && (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      id="evaluacion-file-input"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.png,.jpg,.jpeg"
                      className="hidden"
                    />
                    <label
                      htmlFor="evaluacion-file-input"
                      className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 hover:border-sky-400 bg-slate-50/50 hover:bg-sky-50/30 rounded-xl cursor-pointer transition-all text-center gap-1.5 group"
                    >
                      <UploadCloud className="size-5 text-slate-400 group-hover:text-sky-600 transition-colors" />
                      <p className="text-xs font-semibold text-slate-700 group-hover:text-sky-800">
                        {student.tieneArchivo && !eliminarArchivoActual
                          ? "Haga clic para reemplazar el documento actual"
                          : "Haga clic aquí para seleccionar el documento de evaluación"}
                      </p>
                      <span className="text-[10px] text-slate-400">
                        Formatos permitidos: PDF, DOCX, XLSX, ZIP o imágenes (máximo 20 MB)
                      </span>
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Footer del Modal */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200 shrink-0">
          <div className="text-[11px] text-slate-500 font-medium">
            Facultad de Educación y Humanidades • Universidad del Bío-Bío
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSaving}
              className="text-xs cursor-pointer bg-white border-slate-300"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => handleGuardarEvaluacion()}
              disabled={isSaving || !hayCambios}
              className="text-xs gap-1.5 bg-sky-700 hover:bg-sky-800 text-white cursor-pointer shadow-xs font-semibold px-4"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="size-3.5 animate-spin" />
                  Guardando evaluación...
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

      {/* Confirmación para eliminar nota, observación o archivo */}
      <ConfirmDeleteDialog
        open={!!campoAEliminar}
        onOpenChange={(open) => !open && setCampoAEliminar(null)}
        onConfirm={() => {
          if (campoAEliminar === "nota") handleQuitarNota();
          if (campoAEliminar === "observacion") handleQuitarObservacion();
          if (campoAEliminar === "archivo") handleQuitarArchivo();
          setCampoAEliminar(null);
        }}
      />
    </div>
  );
}
