import { useState, useEffect } from "react";
import { sileo } from "sileo";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil, Loader2, AlertCircle } from "lucide-react";
import type { Asignatura, EditAsignaturaDTO } from "./types";

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  asignatura: Asignatura | null;
  onSave?: (id: number, updatedAsignatura: Asignatura) => void;
}

const SEMESTRES_DISPONIBLES = [
  { value: "1", label: "1° Semestre" },
  { value: "2", label: "2° Semestre" },
  { value: "3", label: "3° Semestre" },
  { value: "4", label: "4° Semestre" },
  { value: "5", label: "5° Semestre" },
  { value: "6", label: "6° Semestre" },
  { value: "7", label: "7° Semestre" },
  { value: "8", label: "8° Semestre" },
  { value: "9", label: "9° Semestre" },
  { value: "10", label: "10° Semestre" },
];

export function EditModal({ isOpen, onClose, asignatura, onSave }: EditModalProps) {
  const [nombre, setNombre] = useState("");
  const [semestre, setSemestre] = useState("1");
  const [descripcion, setDescripcion] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  useEffect(() => {
    if (isOpen && asignatura) {
      setNombre(asignatura.nombre || "");
      setSemestre(asignatura.semestre || "1");
      setDescripcion(asignatura.descripcion || "");
      setServerError(null);
      setSubmitting(false);
      setErrors({});
    }
  }, [isOpen, asignatura]);

  const validate = () => {
    const errs: Record<string, string | undefined> = {};
    if (!nombre.trim()) {
      errs.nombre = "El nombre de la asignatura es obligatorio";
    }
    if (!semestre.trim()) {
      errs.semestre = "Debe indicar el semestre académico";
    }
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      const firstError = Object.values(errs)[0];
      sileo.error({
        title: "Error de validación",
        description: firstError || "Revisa los campos de la asignatura.",
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asignatura || !validate()) return;

    setSubmitting(true);
    setServerError(null);

    const payload: EditAsignaturaDTO = {
      idAsignatura: asignatura.idAsignatura,
      nombre: nombre.trim(),
      semestre: semestre.trim(),
      descripcion: descripcion.trim(),
    };

    try {
      const res = await fetch(`http://localhost:8080/api/asignaturas/${asignatura.idAsignatura}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          json?.error || json?.message || `Error ${res.status}: No se pudo actualizar la asignatura.`
        );
      }

      onSave?.(asignatura.idAsignatura, json);
      onClose();
    } catch (err: any) {
      console.error("Error al actualizar asignatura:", err);
      const errorMsg = err.message || "Error al conectar con el servidor para actualizar la asignatura.";
      setServerError(errorMsg);
      sileo.error({
        title: "Error al modificar asignatura",
        description: errorMsg,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md bg-white border border-slate-200">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-100 rounded-lg text-slate-800">
              <Pencil className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-slate-900 font-bold">Editar Asignatura</DialogTitle>
              <DialogDescription className="text-slate-500 text-xs">
                Modifica los datos de la asignatura #{asignatura?.idAsignatura}.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {serverError && (
          <div className="rounded-md border border-rose-200 bg-rose-50 p-3 flex items-start gap-2.5 text-xs text-rose-800">
            <AlertCircle className="size-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <FieldGroup className="space-y-3.5">
            {/* Nombre de la asignatura */}
            <Field>
              <FieldLabel className="text-xs font-semibold text-slate-700">
                Nombre de la Asignatura *
              </FieldLabel>
              <Input
                placeholder="Ej. Práctica Profesional II"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                disabled={submitting}
                className={errors.nombre ? "border-rose-400 focus-visible:ring-rose-400" : ""}
              />
              {errors.nombre && <FieldError className="text-xs text-rose-600">{errors.nombre}</FieldError>}
            </Field>

            {/* Semestre Académico */}
            <Field>
              <FieldLabel className="text-xs font-semibold text-slate-700">
                Semestre Académico *
              </FieldLabel>
              <div className="relative">
                <select
                  value={semestre}
                  onChange={(e) => setSemestre(e.target.value)}
                  disabled={submitting}
                  className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {SEMESTRES_DISPONIBLES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <FieldDescription className="text-[11px] text-slate-500">
                Nivel o semestre en la malla curricular.
              </FieldDescription>
              {errors.semestre && <FieldError className="text-xs text-rose-600">{errors.semestre}</FieldError>}
            </Field>

            {/* Descripción */}
            <Field>
              <FieldLabel className="text-xs font-semibold text-slate-700">
                Descripción (Opcional)
              </FieldLabel>
              <textarea
                placeholder="Breve descripción del programa o contenidos de la asignatura..."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                disabled={submitting}
                rows={3}
                className="w-full rounded-md border border-slate-200 bg-white p-2.5 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              />
            </Field>
          </FieldGroup>

          <DialogFooter className="pt-3 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
              className="cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-slate-900 hover:bg-slate-800 text-white cursor-pointer gap-2"
            >
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {submitting ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
