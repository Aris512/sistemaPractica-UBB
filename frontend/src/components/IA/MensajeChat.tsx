import { useEffect, useState } from "react";
import { Bot, Check, Copy } from "lucide-react";
import { sileo } from "sileo";
import { Button } from "@/components/ui/button";
import type { ChatRol } from "@/types/chat";
import { MarkdownTexto } from "./MarkdownTexto";

interface MensajeChatProps {
  rol: ChatRol;
  contenido: string;
  /** Mensaje del usuario aún sin confirmar por el servidor o cuya respuesta falló. */
  estado?: "pendiente" | "fallido";
}

export function MensajeChat({ rol, contenido, estado }: MensajeChatProps) {
  const esUsuario = rol === "USER";

  return (
    <div className={`group flex gap-3 ${esUsuario ? "justify-end" : "justify-start"}`}>
      {!esUsuario && <AvatarIA />}
      <div className={`flex min-w-0 max-w-[85%] sm:max-w-[75%] flex-col ${esUsuario ? "items-end" : "items-start"}`}>
        <div
          className={
            esUsuario
              ? `rounded-2xl rounded-br-md px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                  estado === "fallido"
                    ? "bg-rose-50 text-rose-900 border border-rose-200"
                    : "bg-sky-600 text-white"
                } ${estado === "pendiente" ? "opacity-80" : ""}`
              : "rounded-2xl rounded-bl-md border border-slate-200/90 bg-white px-4 py-3 text-slate-800 shadow-2xs max-w-full"
          }
        >
          {esUsuario ? contenido : <MarkdownTexto texto={contenido} />}
        </div>
        {!estado && <BotonCopiar texto={contenido} />}
      </div>
    </div>
  );
}

export function AvatarIA() {
  return (
    <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl border border-sky-100 bg-sky-50 text-sky-600">
      <Bot className="size-4.5" />
    </div>
  );
}

/** Indicador mientras Groq genera la respuesta. */
export function IndicadorRespondiendo() {
  return (
    <div className="flex gap-3" role="status" aria-live="polite">
      <AvatarIA />
      <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-slate-200/90 bg-white px-4 py-3 text-sm text-slate-500 shadow-2xs">
        <span className="flex gap-1" aria-hidden="true">
          <span className="size-1.5 rounded-full bg-sky-500 animate-bounce [animation-delay:-0.3s]" />
          <span className="size-1.5 rounded-full bg-sky-500 animate-bounce [animation-delay:-0.15s]" />
          <span className="size-1.5 rounded-full bg-sky-500 animate-bounce" />
        </span>
        Respondiendo…
      </div>
    </div>
  );
}

function copiarConSeleccion(texto: string): boolean {
  const area = document.createElement("textarea");
  area.value = texto;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    document.body.removeChild(area);
  }
}

function BotonCopiar({ texto }: { texto: string }) {
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!copiado) return;
    const t = window.setTimeout(() => setCopiado(false), 2000);
    return () => window.clearTimeout(t);
  }, [copiado]);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      return;
    } catch {
      // Sin permiso para la API del portapapeles (p. ej. contexto no seguro): se usa el método clásico
    }
    if (copiarConSeleccion(texto)) {
      setCopiado(true);
    } else {
      sileo.error({ title: "No se pudo copiar", description: "Tu navegador no permitió acceder al portapapeles." });
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="xs"
      onClick={copiar}
      aria-label={copiado ? "Mensaje copiado" : "Copiar mensaje"}
      className="mt-1 text-slate-500 hover:text-slate-800 md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
    >
      {copiado ? <Check className="text-emerald-600" /> : <Copy />}
      {copiado ? "Copiado" : "Copiar"}
    </Button>
  );
}
