import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const MAX_TITULO = 100;

interface RenombrarConversacionDialogProps {
  open: boolean;
  tituloActual: string;
  onOpenChange: (open: boolean) => void;
  onGuardar: (titulo: string) => Promise<void>;
}

/** Se monta con key = id de la conversación, así el campo parte siempre con el título actual. */
export function RenombrarConversacionDialog({ open, tituloActual, onOpenChange, onGuardar }: RenombrarConversacionDialogProps) {
  const [titulo, setTitulo] = useState(tituloActual);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const limpio = titulo.trim();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!limpio || guardando) return;
    setGuardando(true);
    setError("");
    try {
      await onGuardar(limpio);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo renombrar la conversación.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !guardando && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md bg-white border border-slate-200">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-slate-900 font-bold">Renombrar conversación</DialogTitle>
            <DialogDescription className="text-slate-500">Elige un nombre que te ayude a encontrarla después.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              maxLength={MAX_TITULO}
              autoFocus
              aria-label="Título de la conversación"
              aria-invalid={!!error || undefined}
            />
            {error && <p className="text-xs text-rose-600">{error}</p>}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={guardando}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!limpio || guardando} className="bg-sky-600 text-white hover:bg-sky-700">
              {guardando ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
