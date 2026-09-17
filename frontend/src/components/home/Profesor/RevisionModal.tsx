import { useState, useEffect } from "react";
import { sileo } from "sileo";
import type { EstudianteEvidenciaRow } from "./types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { FileText, X, Send, Star, Calendar as CalendarIcon } from "lucide-react";

interface RevisionModalProps {
  student: EstudianteEvidenciaRow | null;
  profesorRut?: string;
  onClose: () => void;
  onSaved: (updated: {
    rut: string;
    estadoRevision: "REVISADO" | "OBSERVADO";
    calificacion: number | null;
    retroalimentacion: string;
    fechaRevision?: string;
  }) => void;
}

export function RevisionModal({
  student,
  profesorRut,
  onClose,
  onSaved,
}: RevisionModalProps) {
  const [calificacion, setCalificacion] = useState("");
  const [retroalimentacion, setRetroalimentacion] = useState("");
  const [estadoRevision, setEstadoRevision] = useState<"REVISADO" | "OBSERVADO">("REVISADO");
  const [fechaRevision, setFechaRevision] = useState<Date>(() => new Date());
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (student) {
      setCalificacion(student.calificacion ? String(student.calificacion) : "");
      setRetroalimentacion(student.retroalimentacion || "");
      setEstadoRevision(student.estadoRevision === "OBSERVADO" ? "OBSERVADO" : "REVISADO");
      if (student.fechaRevision) {
        const d = new Date(student.fechaRevision);
        if (!isNaN(d.getTime())) {
          setFechaRevision(d);
        } else {
          setFechaRevision(new Date());
        }
      } else {
        setFechaRevision(new Date());
      }
    }
  }, [student]);

  if (!student) return null;

  const handleSave = async () => {
    let notaNum: number | null = null;
    if (calificacion.trim()) {
      notaNum = parseFloat(calificacion.replace(",", "."));
      if (isNaN(notaNum) || notaNum < 1.0 || notaNum > 7.0) {
        sileo.error({
          title: "Calificación inválida",
          description: "La nota debe ser un número entre 1.0 y 7.0 (ej. 5.5).",
        });
        return;
      }
    }

    setIsSaving(true);

    try {
      if (student.idEvidencia) {
        const res = await fetch(`http://localhost:8080/api/evidencias/${student.idEvidencia}/revisar`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rutProfesor: profesorRut || "11111111-1",
            retroalimentacion,
            calificacion: notaNum,
            estado: estadoRevision,
          }),
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => null);
          throw new Error(
            errJson?.message || errJson?.error || `Error ${res.status}: No se pudo guardar la revisión en el servidor.`
          );
        }
      }

      onSaved({
        rut: student.rut,
        estadoRevision,
        calificacion: notaNum,
        retroalimentacion,
        fechaRevision: fechaRevision.toLocaleDateString("es-CL"),
      });
      onClose();
    } catch (err: any) {
      console.error("Error al guardar revisión:", err);
      sileo.error({
        title: "Error al guardar revisión",
        description: err?.message || "No fue posible guardar la revisión en el servidor.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Revisión: {student.nombre}</h3>
            <p className="text-xs text-slate-500 font-mono">
              RUT {student.rut} • {student.actividadTitulo}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto text-sm">
          {/* Archivo adjunto */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <FileText className="size-3.5 text-sky-600" /> Archivo Adjunto
              </span>
              <span className="text-xs text-slate-400 font-mono">{student.fechaSubida}</span>
            </div>
            <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="text-xs font-medium text-slate-800 truncate">
                {student.nombreArchivo || "Documento_Evidencia.pdf"}
              </span>
              <a
                href={student.archivoUrl || "#"}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-medium text-sky-700 bg-sky-50 hover:bg-sky-100 px-2.5 py-1 rounded-md"
              >
                Ver archivo
              </a>
            </div>

            {student.comentarioEstudiante && (
              <div className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="font-semibold text-slate-700 block mb-1">Comentario del alumno:</span>
                <p className="italic">"{student.comentarioEstudiante}"</p>
              </div>
            )}
          </div>

          <div className="space-y-3.5">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Star className="size-3.5 text-amber-500" /> Evaluación y Retroalimentación
            </h4>

            {/* Calificación y Estado */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Calificación (1.0 - 7.0)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  min="1.0"
                  max="7.0"
                  placeholder="Ej: 6.5"
                  value={calificacion}
                  onChange={(e) => setCalificacion(e.target.value)}
                  className="text-sm h-9 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Estado de la Evidencia
                </label>
                <select
                  value={estadoRevision}
                  onChange={(e) => setEstadoRevision(e.target.value as any)}
                  className="w-full h-9 text-xs font-medium bg-white border border-slate-200 rounded-md px-2.5 text-slate-700 focus:ring-2 focus:ring-sky-500/20"
                >
                  <option value="REVISADO">Aprobado / Revisado</option>
                  <option value="OBSERVADO">Con Observaciones</option>
                </select>
              </div>
            </div>

            {/* Calendario compacto integrado con Retroalimentación */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-start bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80">
              <div className="sm:col-span-6 flex flex-col items-center justify-center bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
                <div className="w-full flex items-center justify-between mb-1 px-1">
                  <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                    <CalendarIcon className="size-3 text-sky-600" />
                    {estadoRevision === "OBSERVADO" ? "Plazo de Re-entrega" : "Fecha de Revisión"}
                  </span>
                  <span className="text-[10px] font-bold text-sky-800 bg-sky-50 border border-sky-200 px-1.5 py-0.5 rounded">
                    {fechaRevision.toLocaleDateString("es-CL", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </span>
                </div>
                <Calendar
                  mode="single"
                  selected={fechaRevision}
                  onSelect={(d) => d && setFechaRevision(d)}
                  disabled={
                    estadoRevision === "OBSERVADO"
                      ? (d) => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          return d < today;
                        }
                      : undefined
                  }
                  className="rounded-md scale-90 origin-top -my-2.5"
                />
              </div>

              <div className="sm:col-span-6 flex flex-col justify-between space-y-2 h-full">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Retroalimentación Pedagógica Formativa
                  </label>
                  <textarea
                    rows={5}
                    value={retroalimentacion}
                    onChange={(e) => setRetroalimentacion(e.target.value)}
                    placeholder="Escribe comentarios formativos, pautas de corrección o felicitaciones..."
                    className="w-full text-xs text-slate-800 p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-sky-500/20 bg-white resize-none"
                  />
                </div>

                <div className="text-[11px] text-slate-500 bg-white p-2 rounded-md border border-slate-200">
                  <strong className="text-slate-700">Registrado para:</strong>{" "}
                  {fechaRevision.toLocaleDateString("es-CL", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-2.5">
          <Button variant="outline" size="sm" onClick={onClose} className="h-9 px-4 text-xs cursor-pointer">
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="h-9 px-4 text-xs font-semibold bg-sky-700 hover:bg-sky-800 text-white gap-1.5 shadow-2xs cursor-pointer"
          >
            <Send className="size-3.5" />
            <span>{isSaving ? "Guardando..." : "Guardar Revisión"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
