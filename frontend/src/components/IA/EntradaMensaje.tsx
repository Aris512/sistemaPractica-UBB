import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { Loader2, Lock, SendHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CHAT_MAX_CARACTERES } from "@/types/chat";
import { estiloArchivo, formatearTamanio } from "./archivoVisual";
import { MenuAdjuntar } from "./MenuAdjuntar";

interface EntradaMensajeProps {
  valor: string;
  onCambiar: (valor: string) => void;
  onEnviar: () => void;
  enviando: boolean;
  deshabilitado: boolean;
  motivoDeshabilitado?: string;
  /** Si se pasa, aparece el botón + con su menú (este PC o portafolio); el archivo queda adjunto hasta enviar. */
  onAdjuntar?: (archivo: File) => void;
  /** RUT del estudiante, para mostrar su portafolio en el menú +. */
  rut?: string;
  /** Archivo elegido con +: se envía junto al texto (opcional) al presionar enviar. */
  adjunto?: File | null;
  onQuitarAdjunto?: () => void;
  adjuntando?: boolean;
  ayudaAdjuntar?: string;
  /** Preguntas usadas en la conversación y máximo permitido. */
  preguntas?: { usadas: number; max: number };
  /** Chat cerrado (sin preguntas disponibles): reemplaza la caja de texto por este aviso. */
  cerrado?: { mensaje: string; accion?: { etiqueta: string; onClick: () => void } };
}

export interface EntradaMensajeHandle {
  enfocar: () => void;
}

const ALTURA_MAXIMA_PX = 200;

/** Duración de la animación de carga del adjunto (solo visual: el archivo se sube al enviar). */
function duracionCarga(bytes: number): number {
  return 900 + Math.min(1100, (bytes / (1024 * 1024)) * 350);
}

/** Tarjeta del archivo adjunto, con una animación de carga al elegirlo. */
function AdjuntoChip({
  archivo,
  adjuntando,
  onQuitar,
  onCargado,
}: {
  archivo: File;
  adjuntando: boolean;
  onQuitar?: () => void;
  onCargado: (archivo: File) => void;
}) {
  const [progreso, setProgreso] = useState(0);
  const cargado = progreso >= 100;
  const { Icono, etiqueta, solido } = estiloArchivo(archivo.name);

  useEffect(() => {
    let frame = 0;
    const inicio = performance.now();
    const duracion = duracionCarga(archivo.size);
    const avanzar = (ahora: number) => {
      const t = Math.min(1, (ahora - inicio) / duracion);
      // Avanza rápido al principio y frena al final, con una pausa breve a mitad de camino
      const curva = t < 0.45 ? (t / 0.45) * 0.55 : t < 0.6 ? 0.55 + ((t - 0.45) / 0.15) * 0.07 : 0.62 + (1 - Math.pow(1 - (t - 0.6) / 0.4, 3)) * 0.38;
      // 100 % solo al terminar de verdad: así el porcentaje y el botón de enviar cambian juntos
      setProgreso(t >= 1 ? 100 : Math.min(99, Math.round(curva * 100)));
      if (t < 1) frame = requestAnimationFrame(avanzar);
      else onCargado(archivo);
    };
    frame = requestAnimationFrame(avanzar);
    return () => cancelAnimationFrame(frame);
  }, [archivo, onCargado]);

  const radio = 15;
  const circunferencia = 2 * Math.PI * radio;

  return (
    <div className="group relative mb-2 flex w-fit max-w-full items-center gap-3 overflow-hidden rounded-xl border border-slate-200 bg-white py-2 pr-9 pl-2 shadow-xs sm:w-72">
      <span className={`relative flex size-10 shrink-0 items-center justify-center rounded-lg text-white ${solido}`}>
        <Icono className={`size-5 transition-opacity ${cargado && !adjuntando ? "opacity-100" : "opacity-30"}`} aria-hidden />
        {(!cargado || adjuntando) && (
          <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/25">
            {adjuntando ? (
              <Loader2 className="size-5 animate-spin" aria-hidden />
            ) : (
              <svg viewBox="0 0 36 36" className="size-8 -rotate-90" aria-hidden>
                <circle cx="18" cy="18" r={radio} fill="none" stroke="currentColor" strokeOpacity="0.35" strokeWidth="3" />
                <circle
                  cx="18"
                  cy="18"
                  r={radio}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={circunferencia}
                  strokeDashoffset={circunferencia * (1 - progreso / 100)}
                />
              </svg>
            )}
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-slate-900" title={archivo.name}>
          {archivo.name}
        </span>
        <span className="block text-xs text-slate-500" aria-live="polite">
          {adjuntando ? "Enviando a la IA…" : cargado ? `${etiqueta} · ${formatearTamanio(archivo.size)}` : `Cargando… ${progreso}%`}
        </span>
      </span>
      {!adjuntando && onQuitar && (
        <button
          type="button"
          onClick={onQuitar}
          aria-label={`Quitar ${archivo.name}`}
          className="absolute top-1.5 right-1.5 flex size-6 cursor-pointer items-center justify-center rounded-full bg-slate-900/80 text-white opacity-90 transition-opacity hover:bg-slate-900 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100"
        >
          <X className="size-3.5" />
        </button>
      )}
      {!cargado && (
        <span className="absolute bottom-0 left-0 h-0.5 bg-sky-500 transition-[width] duration-75" style={{ width: `${progreso}%` }} aria-hidden />
      )}
    </div>
  );
}

/** Puntos que muestran cuántas preguntas quedan en la conversación. */
function ContadorPreguntas({ usadas, max }: { usadas: number; max: number }) {
  const restantes = Math.max(0, max - usadas);
  const color = restantes === 0 ? "text-rose-600" : restantes === 1 ? "text-amber-700" : "text-slate-500";
  return (
    <span className={`flex items-center gap-1.5 ${color}`} title={`Puedes hacer hasta ${max} preguntas en esta conversación`}>
      <span className="flex gap-0.5" aria-hidden>
        {Array.from({ length: max }, (_, i) => (
          <span key={i} className={`size-1.5 rounded-full ${i < usadas ? (restantes === 0 ? "bg-rose-400" : "bg-sky-500") : "bg-slate-200"}`} />
        ))}
      </span>
      <span className="tabular-nums">
        {restantes === 0 ? "Sin preguntas disponibles" : restantes === 1 ? "Te queda 1 pregunta" : `${restantes} de ${max} preguntas disponibles`}
      </span>
    </span>
  );
}

/** Caja de texto del chat: Enter envía, Shift+Enter inserta un salto de línea. */
export const EntradaMensaje = forwardRef<EntradaMensajeHandle, EntradaMensajeProps>(function EntradaMensaje(
  {
    valor,
    onCambiar,
    onEnviar,
    enviando,
    deshabilitado,
    motivoDeshabilitado,
    onAdjuntar,
    rut,
    adjunto = null,
    onQuitarAdjunto,
    adjuntando = false,
    ayudaAdjuntar,
    preguntas,
    cerrado,
  },
  ref
) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Último adjunto que terminó su animación de carga: mientras no coincida con el actual, no se puede enviar
  const [adjuntoCargado, setAdjuntoCargado] = useState<File | null>(null);
  const cargandoAdjunto = adjunto !== null && adjuntoCargado !== adjunto;
  // Cerrado: solo se puede enviar un archivo nuevo (con un comentario opcional)
  const bloqueado = !!cerrado && adjunto === null;

  useImperativeHandle(ref, () => ({ enfocar: () => textareaRef.current?.focus() }), []);

  // Ajusta la altura al contenido hasta un máximo, luego aparece el scroll interno
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, ALTURA_MAXIMA_PX)}px`;
  }, [valor, bloqueado]);

  const excedido = valor.length > CHAT_MAX_CARACTERES;
  // Con un archivo adjunto el texto es opcional
  const puedeEnviar =
    (valor.trim().length > 0 || adjunto !== null) && !excedido && !enviando && !deshabilitado && !adjuntando && !cargandoAdjunto && !bloqueado;

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (puedeEnviar) onEnviar();
    }
  };

  return (
    <div className="border-t border-slate-200/90 bg-white p-3 sm:p-4">
      <div
        className={`rounded-2xl border bg-white px-3 py-2 transition-colors focus-within:ring-3 ${
          excedido
            ? "border-rose-300 focus-within:ring-rose-200/60"
            : bloqueado
              ? "border-slate-200 bg-slate-50"
              : "border-slate-200 focus-within:border-sky-400 focus-within:ring-sky-200/50"
        }`}
      >
        {adjunto && (
          <AdjuntoChip
            key={`${adjunto.name}-${adjunto.size}-${adjunto.lastModified}`}
            archivo={adjunto}
            adjuntando={adjuntando}
            onQuitar={onQuitarAdjunto}
            onCargado={setAdjuntoCargado}
          />
        )}
        <div className="flex items-end gap-2">
          {onAdjuntar && rut && (
            <MenuAdjuntar
              rut={rut}
              onElegir={(archivo) => {
                onAdjuntar(archivo);
                textareaRef.current?.focus();
              }}
              deshabilitado={enviando || deshabilitado || adjuntando}
              ayuda={ayudaAdjuntar}
            />
          )}
          {bloqueado && cerrado ? (
            <div className="flex min-h-8 flex-1 flex-wrap items-center gap-x-3 gap-y-1.5 py-0.5 text-sm text-slate-600" role="status">
              <span className="flex min-w-0 flex-1 items-start gap-2">
                <Lock className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden />
                <span>{cerrado.mensaje}</span>
              </span>
              {cerrado.accion && (
                <Button type="button" size="sm" onClick={cerrado.accion.onClick} className="bg-sky-600 text-white hover:bg-sky-700">
                  {cerrado.accion.etiqueta}
                </Button>
              )}
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={valor}
              onChange={(e) => onCambiar(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder={adjunto ? "Agrega un mensaje para la IA (opcional)…" : "Escribe tu mensaje…"}
              aria-label="Mensaje para el asistente de IA"
              className="max-h-[200px] min-h-6 flex-1 resize-none self-center bg-transparent py-1 text-sm text-slate-800 outline-none placeholder:text-slate-400"
            />
          )}
          {!bloqueado && (
            <Button
              type="button"
              size="icon"
              onClick={onEnviar}
              disabled={!puedeEnviar}
              aria-label={enviando ? "Esperando respuesta" : "Enviar mensaje"}
              className="rounded-full bg-sky-600 text-white hover:bg-sky-700"
            >
              {enviando || adjuntando ? <Loader2 className="animate-spin" /> : <SendHorizontal />}
            </Button>
          )}
        </div>
      </div>
      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-1 text-[11px] text-slate-400">
        <span className="min-w-0">
          {deshabilitado && motivoDeshabilitado ? (
            <span className="text-amber-700">{motivoDeshabilitado}</span>
          ) : adjuntando ? (
            <span className="text-sky-700">Subiendo tu planificación y pidiendo la revisión a la IA…</span>
          ) : cargandoAdjunto ? (
            <span className="text-sky-700">Preparando el archivo…</span>
          ) : onAdjuntar && ayudaAdjuntar ? (
            <span>{ayudaAdjuntar}</span>
          ) : (
            <span className="hidden sm:inline">Enter para enviar · Shift + Enter para salto de línea</span>
          )}
        </span>
        <span className="flex items-center gap-3">
          {valor.length > CHAT_MAX_CARACTERES * 0.8 && (
            <span className={excedido ? "font-semibold text-rose-600" : ""}>
              {valor.length.toLocaleString("es-CL")} / {CHAT_MAX_CARACTERES.toLocaleString("es-CL")}
            </span>
          )}
          {preguntas && <ContadorPreguntas usadas={preguntas.usadas} max={preguntas.max} />}
        </span>
      </div>
    </div>
  );
});
