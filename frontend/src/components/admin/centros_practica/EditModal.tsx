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
  FieldError,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil, Loader2, AlertCircle } from "lucide-react";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import type { CentroPractica, EditCentroPracticaDTO } from "./types";

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  centro: CentroPractica | null;
  onSave?: (id: number, updatedCentro: CentroPractica) => void;
}

export function EditModal({ isOpen, onClose, centro, onSave }: EditModalProps) {
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  useEffect(() => {
    if (isOpen && centro) {
      setNombre(centro.nombre || "");
      setDireccion(centro.direccion || "");
      setServerError(null);
      setSubmitting(false);
      setErrors({});
    }
  }, [isOpen, centro]);

  const validate = () => {
    const errs: Record<string, string | undefined> = {};
    if (!nombre.trim()) {
      errs.nombre = "El nombre del centro es obligatorio";
    }
    if (!direccion.trim()) {
      errs.direccion = "La dirección es obligatoria";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!centro || !validate()) return;

    setSubmitting(true);
    setServerError(null);

    const payload: EditCentroPracticaDTO = {
      idCentro: centro.idCentro,
      nombre: nombre.trim(),
      direccion: direccion.trim(),
    };

    try {
      const res = await fetch(`http://localhost:8080/api/centros-practica/${centro.idCentro}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(json?.error || `Error ${res.status}: No se pudo actualizar el centro.`);
      }

      onSave?.(centro.idCentro, json);
      onClose();
    } catch (err: any) {
      console.error("Error al actualizar centro:", err);
      const errorMsg = err.message || "Error al conectar con el servidor.";
      setServerError(errorMsg);
      sileo.error({
        title: "Error al modificar centro",
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
            <div className="p-2 bg-blue-50 rounded-lg text-blue-700">
              <Pencil className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-slate-900 font-bold">Editar Centro de Práctica</DialogTitle>
              <DialogDescription className="text-slate-500 text-xs">
                Modifica los datos del centro #{centro?.idCentro}.
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
            <Field>
              <FieldLabel className="text-xs font-semibold text-slate-700">
                Nombre de la Institución o Colegio *
              </FieldLabel>
              <Input
                placeholder="Ej. Colegio Concepción San Pedro"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                disabled={submitting}
                className={errors.nombre ? "border-rose-400 focus-visible:ring-rose-400" : ""}
              />
              {errors.nombre && <FieldError className="text-xs text-rose-600">{errors.nombre}</FieldError>}
            </Field>

            <Field>
              <FieldLabel className="text-xs font-semibold text-slate-700">
                Dirección (Búsqueda interactiva con Photon) *
              </FieldLabel>
              <AddressAutocomplete
                value={direccion}
                onChange={setDireccion}
                disabled={submitting}
              />
              {errors.direccion && <FieldError className="text-xs text-rose-600">{errors.direccion}</FieldError>}
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
