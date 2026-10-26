import { forwardRef, useImperativeHandle, useLayoutEffect, useRef, type KeyboardEvent } from "react";
import { Loader2, Plus, SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CHAT_MAX_CARACTERES } from "@/types/chat";

interface EntradaMensajeProps {
  valor: string;
  onCambiar: (valor: string) => void;
  onEnviar: () => void;
  enviando: boolean;
  deshabilitado: boolean;
  motivoDeshabilitado?: string;
  /** Si se pasa, aparece el botón + para adjuntar un archivo (.docx o .pdf). */
  onAdjuntar?: (archivo: File) => void;
  adjuntando?: boolean;
  ayudaAdjuntar?: string;
}

export interface EntradaMensajeHandle {
  enfocar: () => void;
}

const ALTURA_MAXIMA_PX = 200;

/** Caja de texto del chat: Enter envía, Shift+Enter inserta un salto de línea. */
export const EntradaMensaje = forwardRef<EntradaMensajeHandle, EntradaMensajeProps>(function EntradaMensaje(
  { valor, onCambiar, onEnviar, enviando, deshabilitado, motivoDeshabilitado, onAdjuntar, adjuntando = false, ayudaAdjuntar },
  ref
) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const archivoRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({ enfocar: () => textareaRef.current?.focus() }), []);

  // Ajusta la altura al contenido hasta un máximo, luego aparece el scroll interno
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, ALTURA_MAXIMA_PX)}px`;
  }, [valor]);

  const excedido = valor.length > CHAT_MAX_CARACTERES;
  const puedeEnviar = valor.trim().length > 0 && !excedido && !enviando && !deshabilitado && !adjuntando;

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (puedeEnviar) onEnviar();
    }
  };

  return (
    <div className="border-t border-slate-200/90 bg-white p-3 sm:p-4">
      <div
        className={`flex items-end gap-2 rounded-xl border bg-white px-3 py-2 transition-colors focus-within:ring-3 ${
          excedido
            ? "border-rose-300 focus-within:ring-rose-200/60"
            : "border-slate-200 focus-within:border-sky-400 focus-within:ring-sky-200/50"
        }`}
      >
        {onAdjuntar && (
          <>
            <input
              ref={archivoRef}
              type="file"
              accept=".docx,.pdf"
              className="hidden"
              onChange={(e) => {
                const archivo = e.target.files?.[0];
                e.target.value = ""; // permite volver a elegir el mismo archivo
                if (archivo) onAdjuntar(archivo);
              }}
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => archivoRef.current?.click()}
              disabled={enviando || deshabilitado || adjuntando}
              aria-label="Adjuntar nueva versión de la planificación"
              title={ayudaAdjuntar ?? "Adjuntar un archivo"}
              className="shrink-0 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100"
            >
              {adjuntando ? <Loader2 className="animate-spin" /> : <Plus />}
            </Button>
          </>
        )}
        <textarea
          ref={textareaRef}
          value={valor}
          onChange={(e) => onCambiar(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Escribe tu mensaje…"
          aria-label="Mensaje para el asistente de IA"
          className="max-h-[200px] min-h-6 flex-1 resize-none bg-transparent py-1 text-sm text-slate-800 outline-none placeholder:text-slate-400"
        />
        <Button
          type="button"
          size="icon"
          onClick={onEnviar}
          disabled={!puedeEnviar}
          aria-label={enviando ? "Esperando respuesta" : "Enviar mensaje"}
          className="bg-sky-600 text-white hover:bg-sky-700"
        >
          {enviando ? <Loader2 className="animate-spin" /> : <SendHorizontal />}
        </Button>
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-2 px-1 text-[11px] text-slate-400">
        <span>
          {deshabilitado && motivoDeshabilitado ? (
            <span className="text-amber-700">{motivoDeshabilitado}</span>
          ) : adjuntando ? (
            <span className="text-sky-700">Subiendo tu planificación y pidiendo la revisión a la IA…</span>
          ) : onAdjuntar && ayudaAdjuntar ? (
            <span>{ayudaAdjuntar}</span>
          ) : (
            <span className="hidden sm:inline">Enter para enviar · Shift + Enter para salto de línea</span>
          )}
        </span>
        {valor.length > CHAT_MAX_CARACTERES * 0.8 && (
          <span className={excedido ? "font-semibold text-rose-600" : ""}>
            {valor.length.toLocaleString("es-CL")} / {CHAT_MAX_CARACTERES.toLocaleString("es-CL")}
          </span>
        )}
      </div>
    </div>
  );
});
