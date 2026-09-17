import type { EstudianteEvidenciaRow } from "./types";
import { EstadoEntregaBadge, EstadoRevisionBadge } from "./TableBadges";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  User,
  Mail,
  GraduationCap,
  Calendar,
  FileText,
  Clock,
  ExternalLink,
  MessageSquare,
  Award,
  BookOpen,
  School,
  FileCheck,
} from "lucide-react";

interface ModalDetalleEstudianteProfesorProps {
  student: EstudianteEvidenciaRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ModalDetalleEstudianteProfesor({
  student,
  open,
  onOpenChange,
}: ModalDetalleEstudianteProfesorProps) {
  if (!student) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        style={{ width: "94vw", maxWidth: "min(1150px, 94vw)" }}
        className="!w-[94vw] !max-w-5xl sm:!max-w-5xl lg:!max-w-6xl max-h-[92vh] overflow-y-auto overflow-x-hidden p-6 sm:p-8 bg-white rounded-2xl border border-slate-200 shadow-2xl space-y-6"
      >
        {/* Cabecera del Modal Institucional */}
        <DialogHeader className="border-b border-slate-100 pb-5 space-y-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="size-12 rounded-xl bg-sky-100/80 border border-sky-200 flex items-center justify-center text-sky-800 font-bold text-lg shadow-2xs shrink-0">
                {student.nombre ? student.nombre.charAt(0).toUpperCase() : "E"}
              </div>
              <div>
                <DialogTitle className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {student.nombre}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 font-mono mt-0.5 flex flex-wrap items-center gap-2">
                  <span>RUT: {student.rut}</span>
                  <span>•</span>
                  <span className="font-sans font-medium text-slate-600">Expediente de Entrega y Evaluación</span>
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 flex items-center gap-1.5">
                <School className="size-3.5 text-slate-500" />
                Universidad del Bío-Bío
              </span>
            </div>
          </div>
        </DialogHeader>

        {/* Sección 1: Ficha Académica del Estudiante */}
        <div className="bg-slate-50/90 rounded-2xl border border-slate-200/90 p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/70 pb-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
              <User className="size-4 text-sky-700" />
              Ficha del Estudiante
            </h4>
            <span className="text-[11px] font-medium text-slate-400">Datos registrados en plataforma</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="space-y-1 bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] block">
                Nombre Completo
              </span>
              <p className="font-bold text-slate-900 text-sm">{student.nombre}</p>
            </div>

            <div className="space-y-1 bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] block">
                RUT Institucional
              </span>
              <p className="font-mono font-semibold text-slate-800 text-sm">{student.rut}</p>
            </div>

            <div className="space-y-1 bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] block">
                Correo Electrónico
              </span>
              <p className="text-slate-800 font-medium truncate flex items-center gap-1.5" title={student.correo}>
                <Mail className="size-3.5 text-slate-400 shrink-0" />
                {student.correo ? (
                  <a href={`mailto:${student.correo}`} className="hover:text-sky-700 hover:underline">
                    {student.correo}
                  </a>
                ) : (
                  <span className="text-slate-400 italic">No registrado</span>
                )}
              </p>
            </div>

            <div className="space-y-1 bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] block">
                Carrera
              </span>
              <p className="font-semibold text-slate-900 flex items-center gap-1.5 text-xs">
                <GraduationCap className="size-4 text-sky-700 shrink-0" />
                Pedagogía en Educación Matemática
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-700">
              <BookOpen className="size-4 text-sky-700 shrink-0" />
              <span className="font-medium text-slate-500">Actividad Evaluada:</span>
              <span className="font-semibold text-slate-900">{student.actividadTitulo}</span>
            </div>
          </div>
        </div>

        {/* Sección 2: Estado de Entrega y Estado de Revisión en 2 Columnas Balanceadas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
          {/* Tarjeta: Proceso de Entrega de Evidencia */}
          <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 bg-white shadow-2xs flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <FileText className="size-4 text-sky-700" />
                  Estado de Entrega
                </span>
                <EstadoEntregaBadge estado={student.estadoEntrega} />
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Fecha de subida:</span>
                  <span className="font-medium text-slate-800 font-mono">
                    {student.fechaSubida ? (
                      <span className="inline-flex items-center gap-1.5 text-slate-700 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200/60">
                        <Clock className="size-3.5 text-slate-400" />
                        {student.fechaSubida}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Sin entrega registrada</span>
                    )}
                  </span>
                </div>

                <div className="space-y-1.5 py-1.5">
                  <span className="text-slate-500 font-medium block">Documento de evidencia:</span>
                  {student.nombreArchivo ? (
                    <div className="flex items-center justify-between gap-3 bg-slate-50/90 p-3 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileCheck className="size-4 text-sky-700 shrink-0" />
                        <span className="font-semibold text-slate-800 text-xs truncate" title={student.nombreArchivo}>
                          {student.nombreArchivo}
                        </span>
                      </div>
                      {student.archivoUrl ? (
                        <a
                          href={student.archivoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-sky-800 bg-sky-100/80 hover:bg-sky-200/80 border border-sky-200 transition-colors shrink-0 cursor-pointer shadow-2xs"
                        >
                          <ExternalLink className="size-3" />
                          <span>Ver archivo</span>
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Enlace no disponible</span>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-slate-400 italic text-xs">
                      No se ha adjuntado ningún archivo de evidencia
                    </div>
                  )}
                </div>

                {student.comentarioEstudiante && (
                  <div className="pt-2">
                    <span className="text-slate-500 font-medium text-[11px] block mb-1">Comentario del estudiante:</span>
                    <p className="text-slate-700 bg-slate-50/80 p-3 rounded-xl border border-slate-200/70 text-xs italic leading-relaxed">
                      &ldquo;{student.comentarioEstudiante}&rdquo;
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tarjeta: Proceso de Revisión y Calificación */}
          <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 bg-white shadow-2xs flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <Award className="size-4 text-sky-700" />
                  Estado de Revisión
                </span>
                <EstadoRevisionBadge estado={student.estadoRevision} calificacion={student.calificacion} />
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Fecha de revisión:</span>
                  <span className="font-medium text-slate-800 font-mono">
                    {student.fechaRevision ? (
                      <span className="inline-flex items-center gap-1.5 text-slate-700 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200/60">
                        <Calendar className="size-3.5 text-slate-400" />
                        {student.fechaRevision}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Pendiente de revisión docente</span>
                    )}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 bg-slate-50/90 p-3.5 rounded-xl border border-slate-200">
                  <div className="space-y-0.5">
                    <span className="text-slate-600 font-bold block text-xs">Calificación Obtenida:</span>
                    <span className="text-[11px] text-slate-400">Escala de 1.0 a 7.0 (Aprobación $\ge$ 4.0)</span>
                  </div>

                  {student.calificacion !== null && student.calificacion !== undefined ? (
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-black text-lg px-3 py-1 rounded-xl border shadow-2xs ${
                          student.calificacion >= 4.0
                            ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                            : "bg-rose-50 text-rose-800 border-rose-300"
                        }`}
                      >
                        {student.calificacion.toFixed(1)}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">/ 7.0</span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic bg-white px-2.5 py-1 rounded-md border border-slate-200">
                      Sin calificar
                    </span>
                  )}
                </div>

                <div className="pt-2">
                  <span className="text-slate-500 font-medium text-[11px] block mb-1.5 flex items-center gap-1.5">
                    <MessageSquare className="size-3.5 text-slate-400" />
                    Retroalimentación y Observaciones del Docente:
                  </span>
                  {student.retroalimentacion ? (
                    <div className="text-slate-800 bg-sky-50/40 p-3.5 rounded-xl border border-sky-200/60 text-xs leading-relaxed">
                      {student.retroalimentacion}
                    </div>
                  ) : (
                    <p className="text-slate-400 italic text-xs bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200">
                      Aún no se ha registrado retroalimentación para esta entrega.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer del Modal */}
        <DialogFooter className="pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-[11px] text-slate-400 font-medium">
            Facultad de Educación y Humanidades • Universidad del Bío-Bío
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs font-medium text-slate-700 hover:text-slate-900 h-8.5 px-5 cursor-pointer bg-white border-slate-300 hover:bg-slate-50"
          >
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
