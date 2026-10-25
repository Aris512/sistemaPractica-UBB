import { useState, useEffect, useRef, useMemo } from "react";
import type React from "react";
import {
  X,
  Award,
  CheckCircle2,
  User,
  GraduationCap,
  Building2,
  BookOpen,
  FileText,
  UploadCloud,
  Download,
  Trash2,
  Save,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VoiceNoteRecorder } from "@/components/ui/VoiceNoteRecorder";
import {
  guardarEvaluacionProfesor,
  descargarArchivoEvaluacion,
} from "@/services/profesorEvaluacionApi";
import type { GuardarEvaluacionRequest } from "@/services/profesorEvaluacionApi";
import type { UserSession } from "@/types/auth";
import type { EstudianteTutorRow } from "./types";
import { sileo } from "sileo";

interface ModalEvaluarEstudianteTutorProps {
  isOpen: boolean;
  student: EstudianteTutorRow | null;
  user: UserSession;
  onClose: () => void;
  onSaved: () => void;
}

// Opciones de pautas según ciclo avanzado (según documento de formación práctica UBB)
const PAUTAS_PRACTICA_PEDAGOGICA = [
  "Pauta 1: Planificación Didáctica y Diseño Universal de Aprendizaje (DUA)",
  "Pauta 2: Gestión del Clima de Aula y Convivencia Escolar",
  "Pauta 3: Estrategias de Enseñanza e Interacción Pedagógica",
  "Pauta 4: Evaluación y Retroalimentación de los Aprendizajes",
];

const PAUTAS_PRACTICA_PROFESIONAL = [
  "Pauta 1 (Media Pauta - Colaborador): Dominio Curricular y Planificación",
  "Pauta 2 (Media Pauta - Tutor): Observación de Clases en Aula Escolar",
  "Pauta 3 (Media Pauta - Colaborador): Interacción con Comunidad y Jefatura",
  "Pauta 4 (Media Pauta - Tutor): Inclusión Educativa y DUA en Aula",
  "Pauta 5 (Final - Colaborador): Desempeño Docente Integral y Didáctica",
  "Pauta 6 (Final - Tutor): Visita de Supervisión Final en Establecimiento",
  "Pauta 7 (Final): Evaluación de Informe Final de Práctica (Metacognición)",
  "Pauta 8 (Final): Proyecto de Intervención y Propuesta de Mejora",
];

const PAUTAS_GENERALES = [
  "Pauta de Evaluación General de Desempeño en Práctica",
  "Pauta de Observación y Acompañamiento en Aula",
  "Pauta de Retroalimentación de Portafolio y Evidencias",
];

export function ModalEvaluarEstudianteTutor({
  isOpen,
  student,
  user,
  onClose,
  onSaved,
}: ModalEvaluarEstudianteTutorProps) {
  if (!isOpen || !student) return null;

  // Determinar rol amigable del evaluador
  const userRoleRaw = (user.roles && user.roles[0]) || user.rol || "TUTOR_PRACTICA";
  const userFullName = `${user.nombre || ""} ${user.apellido || ""}`.trim() || "Evaluador UBB";
  const userRut = user.rut || "11111111-1";

  const getRolEtiqueta = (rol: string) => {
    switch (rol) {
      case "TUTOR_PRACTICA":
        return "Tutor de Práctica (UBB)";
      case "PROFESOR_COLABORADOR":
        return "Profesor Colaborador (Colegio)";
      case "PROFESOR":
        return "Profesor de Asignatura";
      case "COORDINADOR":
        return "Coordinador de Prácticas";
      default:
        return rol;
    }
  };

  const rolDisplay = getRolEtiqueta(userRoleRaw);

  const esTutor = userRoleRaw.toUpperCase().includes("TUTOR");
  const esColaborador = userRoleRaw.toUpperCase().includes("COLABORADOR");

  // Determinar si la asignatura es Práctica Profesional o Pedagógica
  const esProfesional =
    student.asignaturaNombre?.toLowerCase().includes("profesional") || false;
  const esPedagogica =
    student.asignaturaNombre?.toLowerCase().includes("pedagógica") ||
    student.asignaturaNombre?.toLowerCase().includes("pedagogica") ||
    false;

  // Lista de pautas según ciclo
  const listaPautas = useMemo(() => {
    if (esProfesional) {
      if (esTutor) {
        return [
          "Pauta 2 (Media Pauta - Tutor): Observación de Clases en Aula Escolar",
          "Pauta 4 (Media Pauta - Tutor): Inclusión Educativa y DUA en Aula",
          "Pauta 6 (Final - Tutor): Visita de Supervisión Final en Establecimiento",
          "Pauta 7 (Final): Evaluación de Informe Final de Práctica (Metacognición)",
        ];
      }
      if (esColaborador) {
        return [
          "Pauta 1 (Media Pauta - Colaborador): Dominio Curricular y Planificación",
          "Pauta 3 (Media Pauta - Colaborador): Interacción con Comunidad y Jefatura",
          "Pauta 5 (Final - Colaborador): Desempeño Docente Integral y Didáctica",
          "Pauta 8 (Final): Proyecto de Intervención y Propuesta de Mejora",
        ];
      }
      return PAUTAS_PRACTICA_PROFESIONAL;
    }
    if (esPedagogica) {
      return PAUTAS_PRACTICA_PEDAGOGICA;
    }
    return PAUTAS_GENERALES;
  }, [esProfesional, esPedagogica, esTutor, esColaborador]);

  // Estados del formulario
  const [tipoEvaluacion, setTipoEvaluacion] = useState<string>(listaPautas[0]);
  const [calificacion, setCalificacion] = useState<string>("");
  const [observacion, setObservacion] = useState<string>("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [eliminarArchivoActual, setEliminarArchivoActual] = useState(false);
  const [currentIdEvaluacion, setCurrentIdEvaluacion] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Inicializar campos con datos existentes del estudiante
  useEffect(() => {
    if (student) {
      setCalificacion(student.calificacion != null ? String(student.calificacion) : "");
      setObservacion(student.observacionTexto || "");
      setCurrentIdEvaluacion(student.idEvaluacion != null ? Number(student.idEvaluacion) : null);
      if (student.tipoEvaluacion) {
        setTipoEvaluacion(student.tipoEvaluacion);
      } else {
        setTipoEvaluacion(listaPautas[0]);
      }
      setArchivo(null);
      setEliminarArchivoActual(false);
    }
  }, [student, listaPautas]);

  const handleNotaChange = (val: string) => {
    const cleaned = val.replace(",", ".");
    if (cleaned === "" || /^[0-7](\.[0-9]{0,2})?$/.test(cleaned)) {
      setCalificacion(cleaned);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        sileo.error({
          title: "Archivo muy pesado",
          description: "El archivo no debe exceder los 20MB",
        });
        return;
      }
      setArchivo(file);
      setEliminarArchivoActual(false);
    }
  };

  const handleDescargarArchivo = async () => {
    if (!currentIdEvaluacion && !student.idEstudiante) return;
    setIsDownloading(true);
    try {
      await descargarArchivoEvaluacion(
        currentIdEvaluacion,
        Number(student.idEstudiante),
        student.nombreArchivo || "evaluacion_practica.pdf"
      );
      sileo.success({
        title: "Descarga completada",
        description: "El archivo se ha descargado correctamente",
      });
    } catch (err: any) {
      sileo.error({
        title: "Error en descarga",
        description: err.message || "No se pudo descargar el archivo",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSubmitEvaluacion = async (e: React.FormEvent) => {
    e.preventDefault();

    let califNumerica: number | null = null;
    if (calificacion.trim() !== "") {
      const parsed = parseFloat(calificacion);
      if (isNaN(parsed) || parsed < 1.0 || parsed > 7.0) {
        sileo.warning({
          title: "Calificación inválida",
          description: "La calificación debe ser un valor entre 1.0 y 7.0",
        });
        return;
      }
      califNumerica = parsed;
    }

    setIsSaving(true);
    try {
      const payload: GuardarEvaluacionRequest = {
        idEstudiante: Number(student.idEstudiante),
        idEvaluacion: currentIdEvaluacion,
        rutProfesor: userRut,
        rutEvaluador: userRut,
        nombreEvaluador: userFullName,
        tipoEvaluador: rolDisplay,
        idPractica: student.idPractica ? Number(student.idPractica) : undefined,
        tipoEvaluacion: tipoEvaluacion,
        puntajeObtenido: califNumerica,
        observacion: observacion.trim() || null,
        file: archivo,
        eliminarArchivo: eliminarArchivoActual,
      };

      const resp = await guardarEvaluacionProfesor(payload);

      if (resp.idEvaluacion) {
        setCurrentIdEvaluacion(resp.idEvaluacion);
      }

      sileo.success({
        title: "Evaluación Registrada",
        description: `Se registró correctamente la evaluación por ${userFullName} (${rolDisplay})`,
      });

      onSaved();
    } catch (err: any) {
      console.error("Error al guardar evaluación:", err);
      sileo.error({
        title: "Error al guardar",
        description: err.message || "No se pudo registrar la evaluación.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const notaNum = parseFloat(calificacion);
  const esAprobado = !isNaN(notaNum) && notaNum >= 4.0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Cabecera institucional */}
        <div className="flex items-center justify-between border-b border-sky-100 bg-gradient-to-r from-sky-900 via-sky-800 to-sky-900 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-xs border border-white/20 text-white">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                Registro de Evaluación de Práctica
                <span className="rounded-full bg-sky-500/30 border border-sky-300/30 px-2.5 py-0.5 text-[11px] font-semibold text-sky-100">
                  Ciclo Avanzado
                </span>
              </h3>
              <p className="text-xs text-sky-200">
                Pautas de observación, calificación y registro de retroalimentación por voz
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-sky-200 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Barra de contexto del estudiante & Evaluador autenticado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-b border-slate-100 bg-slate-50/70 p-4 text-xs">
          {/* Datos del estudiante */}
          <div className="space-y-1.5 rounded-xl bg-white p-3 border border-slate-200/80 shadow-2xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Estudiante a Evaluar
            </span>
            <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
              <User className="h-4 w-4 text-sky-600" />
              <span>{student.nombre}</span>
              <span className="font-mono text-xs font-normal text-slate-500">
                ({student.rut})
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
              <div className="flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                <span className="truncate" title={student.asignaturaNombre}>
                  {student.asignaturaNombre}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-slate-400" />
                <span className="truncate" title={student.centroPractica}>
                  {student.centroPractica}
                </span>
              </div>
            </div>
          </div>

          {/* Evaluador autenticado */}
          <div className="space-y-1.5 rounded-xl bg-sky-50/60 p-3 border border-sky-100 shadow-2xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-sky-700 flex items-center justify-between">
              <span>Evaluador Identificado </span>
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            </span>
            <div className="flex items-center gap-2 font-bold text-sky-950 text-sm">
              <GraduationCap className="h-4 w-4 text-sky-700" />
              <span>{userFullName}</span>
              <span className="font-mono text-xs font-normal text-sky-700">
                ({userRut})
              </span>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] text-slate-500">Rol asignado:</span>
              <span className="inline-flex items-center rounded-md bg-sky-600 px-2 py-0.5 text-[11px] font-semibold text-white shadow-2xs">
                {rolDisplay}
              </span>
            </div>
          </div>
        </div>

        {/* Contenido scrolleable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <form id="form-evaluacion-tutor" onSubmit={handleSubmitEvaluacion} className="space-y-6">
            {/* Selección de pauta de evaluación según ciclo */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4 text-sky-600" />
                  Pauta de Evaluación Aplicada
                </label>
                <span className="text-[11px] text-slate-400">
                  {esProfesional
                    ? "8 pautas en el semestre (Colaborador + Tutor)"
                    : esPedagogica
                      ? "4 pautas de observación (6 semanas)"
                      : "Pauta estándar"}
                </span>
              </div>

              <select
                value={tipoEvaluacion}
                onChange={(e) => setTipoEvaluacion(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
              >
                {listaPautas.map((pauta: string, idx: number) => (
                  <option key={idx} value={pauta}>
                    {pauta}
                  </option>
                ))}
              </select>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                {esProfesional
                  ? "En Práctica Profesional la evaluación se realiza de forma progresiva a mitad y al final del proceso por el Profesor Colaborador del colegio (4 pautas) y el Tutor UBB (4 pautas), sumando 8 pautas en total."
                  : "En Práctica Pedagógica el docente registra las 4 pautas evaluativas durante las semanas de intervención en aula."}
              </p>
            </div>

            {/* Calificación y Estado */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2">
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>Calificación Final (1.0 - 7.0)</span>
                  {calificacion && !isNaN(notaNum) && (
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${esAprobado
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-rose-100 text-rose-800"
                        }`}
                    >
                      {esAprobado ? "Aprobado" : "Reprobado"}
                    </span>
                  )}
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    placeholder="Ej: 6.5"
                    value={calificacion}
                    onChange={(e) => handleNotaChange(e.target.value)}
                    className="text-base font-bold font-mono h-10 w-28 text-center text-slate-800 focus:ring-sky-500"
                  />
                  <span className="text-xs text-slate-500">
                    Escala chilena de notas de 1.0 a 7.0 (nota mínima de aprobación 4.0).
                  </span>
                </div>
              </div>

              {/* Archivo de pauta o evidencia adjunta */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2">
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>Documento o Rúbrica Adjunta</span>
                  {student.tieneArchivo && !eliminarArchivoActual && (
                    <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Archivo disponible
                    </span>
                  )}
                </label>

                {student.tieneArchivo && !eliminarArchivoActual ? (
                  <div className="flex items-center justify-between rounded-lg bg-sky-50/60 p-2 border border-sky-100 text-xs">
                    <span className="font-medium text-sky-900 truncate max-w-[180px]">
                      {student.nombreArchivo || "documento_evaluacion.pdf"}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleDescargarArchivo}
                        disabled={isDownloading}
                        className="p-1 text-sky-700 hover:text-sky-900 rounded"
                        title="Descargar pauta"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEliminarArchivoActual(true)}
                        className="p-1 text-rose-600 hover:text-rose-800 rounded"
                        title="Eliminar archivo"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs gap-1.5 h-9"
                      >
                        <UploadCloud className="h-3.5 w-3.5 text-sky-600" />
                        {archivo ? "Cambiar archivo" : "Adjuntar Pauta PDF"}
                      </Button>
                      {archivo && (
                        <span className="text-xs text-slate-600 font-medium truncate max-w-[160px]">
                          {archivo.name}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Observaciones pedagógicas escritas */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-sky-600" />
                  Observaciones Pedagógicas y Retroalimentación
                </label>
                <span className="text-[11px] text-slate-400">
                  {observacion.length} caracteres
                </span>
              </div>
              <textarea
                rows={4}
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
                placeholder="Detalla aquí las fortalezas, aspectos a mejorar del estudiante en el aula y recomendaciones pedagógicas. También puedes dictar usando la pestaña 'Notas de Voz' e insertar el texto automáticamente..."
                className="w-full text-xs text-slate-800 bg-white p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500 leading-relaxed resize-y"
              />
            </div>

            {/* Componente de Notas de Voz integrado */}
            <div className="pt-1">
              <VoiceNoteRecorder
                idEvaluacion={currentIdEvaluacion}
                idEstudiante={student.idEstudiante ? Number(student.idEstudiante) : null}
                rutGrabador={userRut}
                onInsertTranscription={(transcripcion) => {
                  setObservacion((prev) =>
                    prev ? `${prev}\n${transcripcion}` : transcripcion
                  );
                  sileo.info({
                    title: "Transcripción insertada",
                    description: "El texto dictado se agregó al campo de observaciones.",
                  });
                }}
                onVoiceNoteCreated={() => {
                  sileo.success({
                    title: "Nota de voz adjuntada",
                    description: "La grabación y transcripción quedaron ligadas a esta evaluación.",
                  });
                }}
              />
            </div>
          </form>
        </div>

        {/* Pie de modal con acciones */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-6 py-3.5">
          <div className="text-[11px] text-slate-500">
            {currentIdEvaluacion ? (
              <span>Evaluación ID #{currentIdEvaluacion} activa</span>
            ) : (
              <span>Nueva evaluación en curso</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSaving}
              className="text-xs"
            >
              Cerrar
            </Button>

            <Button
              type="submit"
              form="form-evaluacion-tutor"
              size="sm"
              disabled={isSaving}
              className="bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs gap-1.5 shadow-xs"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  Guardar Evaluación
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
