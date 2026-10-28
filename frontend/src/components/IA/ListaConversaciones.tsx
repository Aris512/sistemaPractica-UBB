import { formatDistanceToNowStrict } from "date-fns";
import { es } from "date-fns/locale";
import { AlertCircle, MessageSquare, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ChatConversacion } from "@/types/chat";

interface ListaConversacionesProps {
  conversaciones: ChatConversacion[];
  estado: "cargando" | "listo" | "error";
  error?: string;
  activaId: number | null;
  /** Conversación cuya respuesta se está generando: no se puede eliminar mientras tanto. */
  ocupadaId: number | null;
  onNueva: () => void;
  onSeleccionar: (id: number) => void;
  onRenombrar: (conversacion: ChatConversacion) => void;
  onEliminar: (conversacion: ChatConversacion) => void;
  onReintentar: () => void;
}

export function ListaConversaciones({
  conversaciones,
  estado,
  error,
  activaId,
  ocupadaId,
  onNueva,
  onSeleccionar,
  onRenombrar,
  onEliminar,
  onReintentar,
}: ListaConversacionesProps) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="p-3 border-b border-slate-100">
        <Button type="button" onClick={onNueva} className="w-full bg-sky-600 text-white hover:bg-sky-700">
          <Plus />
          Nueva conversación
        </Button>
      </div>

      <nav aria-label="Conversaciones" className="flex-1 min-h-0 overflow-y-auto p-2">
        {estado === "cargando" && (
          <div className="space-y-2 p-1" aria-label="Cargando conversaciones">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        )}

        {estado === "error" && (
          <div className="m-1 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
            <div className="flex items-start gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <p>{error || "No se pudieron cargar las conversaciones."}</p>
            </div>
            <Button type="button" variant="outline" size="xs" onClick={onReintentar} className="mt-2">
              <RotateCcw />
              Reintentar
            </Button>
          </div>
        )}

        {estado === "listo" && conversaciones.length === 0 && (
          <div className="px-3 py-8 text-center text-xs text-slate-500">
            <MessageSquare className="mx-auto mb-2 size-6 text-slate-300" />
            Aún no tienes conversaciones. Escribe tu primera pregunta para comenzar.
          </div>
        )}

        {estado === "listo" && conversaciones.length > 0 && (
          <ul className="space-y-1">
            {conversaciones.map((c) => {
              const activa = c.id === activaId;
              return (
                <li key={c.id} className="group relative">
                  <button
                    type="button"
                    onClick={() => onSeleccionar(c.id)}
                    aria-current={activa ? "true" : undefined}
                    className={`w-full rounded-lg py-2 pl-3 pr-16 text-left transition-colors cursor-pointer ${
                      activa ? "bg-sky-50 text-sky-900" : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span className={`block truncate text-sm ${activa ? "font-semibold" : "font-medium"}`}>{c.titulo}</span>
                    <span className="block text-[11px] text-slate-500">{fechaRelativa(c.fechaActualizacion)}</span>
                  </button>
                  <div
                    className={`absolute right-1.5 top-1/2 flex -translate-y-1/2 gap-0.5 transition-opacity ${
                      activa ? "" : "md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
                    }`}
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => onRenombrar(c)}
                      aria-label={`Renombrar «${c.titulo}»`}
                      className="text-slate-500 hover:text-slate-900"
                    >
                      <Pencil />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => onEliminar(c)}
                      disabled={c.id === ocupadaId}
                      aria-label={`Eliminar «${c.titulo}»`}
                      className="text-slate-500 hover:text-rose-700"
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </nav>
    </div>
  );
}

function fechaRelativa(iso: string): string {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "";
  return formatDistanceToNowStrict(fecha, { addSuffix: true, locale: es });
}
