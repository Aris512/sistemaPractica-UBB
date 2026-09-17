import type { EstudianteTutorRow } from "./types";
import { ObservacionBadge, EvaluacionBadge } from "./TableBadges";
import {
  X,
  User,
  Mail,
  School,
  BookOpen,
  FileText,
  Award,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ModalDetalleEstudianteProps {
  student: EstudianteTutorRow | null;
  onClose: () => void;
}

export function ModalDetalleEstudiante({ student, onClose }: ModalDetalleEstudianteProps) {
  if (!student) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700 font-bold text-sm">
              {student.nombre.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base leading-tight">
                {student.nombre}
              </h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                RUT: {student.rut}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="size-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Contenido con Scroll */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Estados actuales */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Estado de Observación
              </span>
              <ObservacionBadge estado={student.estadoObservacion} />
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Estado de Evaluación
              </span>
              <EvaluacionBadge
                estado={student.estadoEvaluacion}
                calificacion={student.calificacion}
              />
            </div>
          </div>

          {/* Información del Estudiante y Práctica */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <User className="size-3.5 text-sky-700" />
              Información del Estudiante y Práctica
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Asignatura */}
              <div className="p-3 rounded-lg border border-slate-100 bg-white shadow-2xs space-y-1">
                <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                  <BookOpen className="size-3 text-slate-400" />
                  Asignatura de Práctica
                </span>
                <p className="font-semibold text-slate-800">
                  {student.asignaturaNombre || "Práctica Pedagógica"}
                </p>
              </div>

              {/* Lugar / Centro de Práctica */}
              <div className="p-3 rounded-lg border border-slate-100 bg-white shadow-2xs space-y-1">
                <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                  <School className="size-3 text-slate-400" />
                  Centro de Práctica (Lugar)
                </span>
                <p className="font-semibold text-slate-800">
                  {student.centroPractica || "Sin centro asignado"}
                </p>
              </div>

              {/* Correo Electrónico */}
              <div className="p-3 rounded-lg border border-slate-100 bg-white shadow-2xs space-y-1">
                <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                  <Mail className="size-3 text-slate-400" />
                  Correo Institucional
                </span>
                <p className="font-semibold text-slate-800 break-all">
                  {student.correo || "No registrado"}
                </p>
              </div>

              {/* Calificación / Nota */}
              <div className="p-3 rounded-lg border border-slate-100 bg-white shadow-2xs space-y-1">
                <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                  <Award className="size-3 text-slate-400" />
                  Calificación Registrada
                </span>
                <p className="font-bold text-slate-800 font-mono text-sm">
                  {student.calificacion ? `${student.calificacion.toFixed(1)} / 7.0` : "Pendiente de nota"}
                </p>
              </div>
            </div>
          </div>

          {/* Observaciones y Retroalimentación */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="size-3.5 text-sky-700" />
              Observaciones Pedagógicas y Retroalimentación
            </h4>

            {student.observacionTexto ? (
              <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 text-xs text-slate-700 leading-relaxed italic">
                "{student.observacionTexto}"
              </div>
            ) : (
              <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-200/50 text-xs text-slate-400 italic">
                No hay observaciones registradas para este estudiante actualmente.
              </div>
            )}
          </div>

          {/* Fecha de actualización */}
          {student.fechaActualizacion && (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1">
              <Clock className="size-3" />
              <span>
                Última actualización:{" "}
                {new Date(student.fechaActualizacion).toLocaleDateString("es-CL", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs cursor-pointer px-4"
          >
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}
