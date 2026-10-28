import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { AlertCircle, ArrowDown, Bot, PanelLeft, Pencil, RotateCcw, WifiOff } from "lucide-react";
import { sileo } from "sileo";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/ui/ConfirmDeleteDialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChatApiError,
  crearConversacion,
  eliminarConversacion,
  enviarMensaje,
  listarConversaciones,
  obtenerMensajes,
  renombrarConversacion,
} from "@/services/chatApi";
import type { ChatConversacion, ChatMensaje } from "@/types/chat";
import type { InicioRevision } from "@/types/retroalimentacion";
import { EntradaMensaje, type EntradaMensajeHandle } from "./EntradaMensaje";
import { ListaConversaciones } from "./ListaConversaciones";
import { IndicadorRespondiendo, MensajeChat } from "./MensajeChat";
import { RenombrarConversacionDialog } from "./RenombrarConversacionDialog";

type EstadoCarga = "cargando" | "listo" | "error";

interface EnvioEnCurso {
  conversacionId: number | null;
  texto: string;
}

interface EnvioFallido extends EnvioEnCurso {
  error: ChatApiError;
}

const SUGERENCIAS = [
  "Ayúdame a diseñar una actividad para introducir las fracciones en 5.° básico.",
  "¿Qué criterios debería incluir una rúbrica para evaluar la resolución de problemas?",
  "Dame ideas para iniciar una clase de funciones lineales de forma motivadora.",
];

/** Distancia al final (px) bajo la cual se considera que el usuario está leyendo lo último. */
const UMBRAL_FINAL_PX = 80;

function aChatError(e: unknown): ChatApiError {
  if (e instanceof ChatApiError) return e;
  return new ChatApiError("Ocurrió un error inesperado. Inténtalo nuevamente.", 0, "ERROR_DESCONOCIDO");
}

/** Une mensajes evitando duplicados por id (p. ej. si el historial se recargó mientras llegaba la respuesta). */
function unirMensajes(actuales: ChatMensaje[], nuevos: ChatMensaje[]): ChatMensaje[] {
  const ids = new Set(actuales.map((m) => m.id));
  return [...actuales, ...nuevos.filter((m) => !ids.has(m.id))].sort((a, b) => a.orden - b.orden);
}

function useEnLinea(): boolean {
  const [enLinea, setEnLinea] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));
  useEffect(() => {
    const on = () => setEnLinea(true);
    const off = () => setEnLinea(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  return enLinea;
}

/** Conversaciones de revisión de planificación: habilitan el botón + para subir una versión corregida. */
export interface RevisionChat {
  esRevision: (idConversacion: number) => boolean;
  /** Reemplaza el archivo de la planificación y devuelve la conversación a mostrar (nueva si se reinició el ciclo). */
  reemplazarArchivo: (idConversacion: number, archivo: File, mensaje: string) => Promise<InicioRevision>;
}

interface ChatIAProps {
  rut: string;
  revision?: RevisionChat;
}

const AYUDA_ADJUNTAR = "Usa + para adjuntar tu planificación corregida (.docx o .pdf); puedes escribir un mensaje y luego enviar.";

export function ChatIA({ rut, revision }: ChatIAProps) {
  const claveActiva = `ubb_chat_activa_${rut}`;
  const enLinea = useEnLinea();

  const [conversaciones, setConversaciones] = useState<ChatConversacion[]>([]);
  const [estadoLista, setEstadoLista] = useState<EstadoCarga>("cargando");
  const [errorLista, setErrorLista] = useState("");

  const [activaId, setActivaId] = useState<number | null>(null);
  const activaRef = useRef<number | null>(null);
  const [mensajes, setMensajes] = useState<ChatMensaje[]>([]);
  const [estadoMensajes, setEstadoMensajes] = useState<EstadoCarga>("listo");
  const [errorMensajes, setErrorMensajes] = useState("");
  const solicitudMensajesRef = useRef(0);

  const [borrador, setBorrador] = useState("");
  const [enCurso, setEnCurso] = useState<EnvioEnCurso | null>(null);
  const enviandoRef = useRef(false);
  const [fallido, setFallido] = useState<EnvioFallido | null>(null);

  const [renombrando, setRenombrando] = useState<ChatConversacion | null>(null);
  // Se conserva la conversación al cerrar el diálogo para que su texto no cambie durante la animación
  const [eliminando, setEliminando] = useState<ChatConversacion | null>(null);
  const [confirmarEliminarAbierto, setConfirmarEliminarAbierto] = useState(false);
  const [listaMovilAbierta, setListaMovilAbierta] = useState(false);
  const [adjuntando, setAdjuntando] = useState(false);
  // Archivo elegido con + en una conversación de revisión; se envía al presionar enviar
  const [adjunto, setAdjunto] = useState<{ conversacionId: number; archivo: File } | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const pegadoAlFinalRef = useRef(true);
  const forzarScrollRef = useRef(false);
  const [mostrarIrAlFinal, setMostrarIrAlFinal] = useState(false);
  const entradaRef = useRef<EntradaMensajeHandle>(null);

  const activa = conversaciones.find((c) => c.id === activaId) ?? null;

  // ---------------------------------------------------------------------------------------------
  // Carga de datos
  // ---------------------------------------------------------------------------------------------

  const cargarMensajes = useCallback(
    async (id: number) => {
      const solicitud = ++solicitudMensajesRef.current;
      setEstadoMensajes("cargando");
      setErrorMensajes("");
      try {
        const datos = await obtenerMensajes(rut, id);
        if (solicitud !== solicitudMensajesRef.current) return;
        forzarScrollRef.current = true;
        setMensajes(datos);
        setEstadoMensajes("listo");
      } catch (e) {
        if (solicitud !== solicitudMensajesRef.current) return;
        setErrorMensajes(aChatError(e).message);
        setEstadoMensajes("error");
      }
    },
    [rut]
  );

  const seleccionar = useCallback(
    (id: number | null, { cargar = true }: { cargar?: boolean } = {}) => {
      activaRef.current = id;
      setActivaId(id);
      setListaMovilAbierta(false);
      try {
        if (id === null) sessionStorage.removeItem(claveActiva);
        else sessionStorage.setItem(claveActiva, String(id));
      } catch {
        // Sin almacenamiento de sesión: solo no se recuerda la conversación abierta
      }
      if (id === null || !cargar) {
        solicitudMensajesRef.current++;
        setMensajes([]);
        setEstadoMensajes("listo");
        return;
      }
      void cargarMensajes(id);
    },
    [cargarMensajes, claveActiva]
  );

  const cargarConversaciones = useCallback(
    () =>
      listarConversaciones(rut).then(
        (datos) => {
          setConversaciones(datos);
          setEstadoLista("listo");
          // Restaurar la conversación abierta antes de recargar la página
          if (activaRef.current === null) {
            let guardada: number | null = null;
            try {
              guardada = Number(sessionStorage.getItem(claveActiva)) || null;
            } catch {
              guardada = null;
            }
            if (guardada !== null && datos.some((c) => c.id === guardada)) {
              seleccionar(guardada);
            }
          }
        },
        (e: unknown) => {
          setErrorLista(aChatError(e).message);
          setEstadoLista("error");
        }
      ),
    [rut, claveActiva, seleccionar]
  );

  useEffect(() => {
    void cargarConversaciones();
  }, [cargarConversaciones]);

  // ---------------------------------------------------------------------------------------------
  // Scroll automático: solo si el usuario ya estaba al final (o acaba de enviar / abrir un chat)
  // ---------------------------------------------------------------------------------------------

  const irAlFinal = useCallback((suave = false) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: suave ? "smooth" : "auto" });
  }, []);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const alFinal = el.scrollHeight - el.scrollTop - el.clientHeight < UMBRAL_FINAL_PX;
    pegadoAlFinalRef.current = alFinal;
    setMostrarIrAlFinal(!alFinal);
  };

  useLayoutEffect(() => {
    if (forzarScrollRef.current || pegadoAlFinalRef.current) {
      forzarScrollRef.current = false;
      pegadoAlFinalRef.current = true;
      setMostrarIrAlFinal(false);
      irAlFinal();
    }
  }, [mensajes, enCurso, fallido, activaId, irAlFinal]);

  // ---------------------------------------------------------------------------------------------
  // Adjuntar nueva versión de la planificación (solo conversaciones de revisión)
  // ---------------------------------------------------------------------------------------------

  const puedeAdjuntar = !!revision && activaId !== null && revision.esRevision(activaId);
  // El adjunto pertenece a la conversación donde se eligió: al cambiar de conversación deja de mostrarse
  const adjuntoActivo = puedeAdjuntar && adjunto?.conversacionId === activaId ? adjunto.archivo : null;

  const elegirAdjunto = (archivo: File) => {
    if (activaId === null) return;
    const extension = archivo.name.split(".").pop()?.toLowerCase();
    if (extension !== "docx" && extension !== "pdf") {
      sileo.error({ title: "Formato no soportado", description: "La IA solo puede leer planificaciones en .docx o .pdf." });
      return;
    }
    setAdjunto({ conversacionId: activaId, archivo });
  };

  const adjuntarArchivo = async (archivo: File, mensaje: string) => {
    if (!revision || activaId === null || adjuntando || !enLinea) return;
    setAdjuntando(true);
    try {
      const inicio = await revision.reemplazarArchivo(activaId, archivo, mensaje.trim());
      // El texto y el archivo se limpian solo si se enviaron, para no perderlos ante un error
      setAdjunto(null);
      setBorrador("");
      await cargarConversaciones();
      seleccionar(inicio.idConversacion);
      sileo.success({
        title: "Planificación actualizada",
        description: inicio.conversacionNueva
          ? "Empezó una revisión nueva con tu versión corregida."
          : (inicio.aviso ?? "La IA está revisando tu versión corregida."),
      });
      if (inicio.conversacionNueva && inicio.aviso) {
        sileo.warning({ title: "Revisión con IA", description: inicio.aviso });
      }
    } catch (e) {
      sileo.error({ title: "No se pudo adjuntar el archivo", description: aChatError(e).message });
    } finally {
      setAdjuntando(false);
    }
  };

  // ---------------------------------------------------------------------------------------------
  // Envío
  // ---------------------------------------------------------------------------------------------

  const enviar = async (textoOriginal: string) => {
    const texto = textoOriginal.trim();
    if (!texto || enviandoRef.current || !enLinea) return;
    enviandoRef.current = true;

    let conversacionId = activaRef.current;
    forzarScrollRef.current = true;
    setFallido(null);
    setBorrador("");
    setEnCurso({ conversacionId, texto });

    try {
      if (conversacionId === null) {
        const nueva = await crearConversacion(rut);
        conversacionId = nueva.id;
        setConversaciones((prev) => [nueva, ...prev]);
        // Si el usuario sigue en el borrador, la nueva conversación pasa a ser la activa
        if (activaRef.current === null) seleccionar(nueva.id, { cargar: false });
        setEnCurso({ conversacionId, texto });
      }

      const resultado = await enviarMensaje(rut, conversacionId, texto);
      setConversaciones((prev) => [resultado.conversacion, ...prev.filter((c) => c.id !== resultado.conversacion.id)]);
      if (activaRef.current === conversacionId) {
        setMensajes((prev) => unirMensajes(prev, [resultado.mensajeUsuario, resultado.mensajeAsistente]));
      }
    } catch (e) {
      const error = aChatError(e);
      setFallido({ conversacionId, texto, error });
      if (error.codigo === "CHAT_CONVERSACION_NO_ENCONTRADA" && conversacionId !== null) {
        setConversaciones((prev) => prev.filter((c) => c.id !== conversacionId));
      }
    } finally {
      enviandoRef.current = false;
      setEnCurso(null);
    }
  };

  const editarFallido = () => {
    if (!fallido) return;
    setBorrador(fallido.texto);
    setFallido(null);
    entradaRef.current?.enfocar();
  };

  // ---------------------------------------------------------------------------------------------
  // Renombrar y eliminar
  // ---------------------------------------------------------------------------------------------

  const guardarTitulo = async (titulo: string) => {
    if (!renombrando) return;
    const actualizada = await renombrarConversacion(rut, renombrando.id, titulo);
    setConversaciones((prev) => prev.map((c) => (c.id === actualizada.id ? actualizada : c)));
  };

  const confirmarEliminacion = async () => {
    if (!eliminando) return;
    const id = eliminando.id;
    try {
      await eliminarConversacion(rut, id);
      setConversaciones((prev) => prev.filter((c) => c.id !== id));
      if (activaRef.current === id) seleccionar(null);
      if (fallido?.conversacionId === id) setFallido(null);
      sileo.success({ title: "Conversación eliminada", description: `Se eliminó «${eliminando.titulo}».` });
    } catch (e) {
      sileo.error({ title: "No se pudo eliminar", description: aChatError(e).message });
    }
  };

  // ---------------------------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------------------------

  const enCursoAqui = enCurso !== null && enCurso.conversacionId === activaId;
  const fallidoAqui = fallido !== null && fallido.conversacionId === activaId;
  const sinMensajes = mensajes.length === 0 && !enCursoAqui && !fallidoAqui;

  const lista = (
    <ListaConversaciones
      conversaciones={conversaciones}
      estado={estadoLista}
      error={errorLista}
      activaId={activaId}
      ocupadaId={enCurso?.conversacionId ?? null}
      onNueva={() => {
        seleccionar(null);
        entradaRef.current?.enfocar();
      }}
      onSeleccionar={(id) => {
        if (id !== activaRef.current) seleccionar(id);
        else setListaMovilAbierta(false);
      }}
      onRenombrar={setRenombrando}
      onEliminar={(c) => {
        setEliminando(c);
        setConfirmarEliminarAbierto(true);
      }}
      onReintentar={() => {
        setEstadoLista("cargando");
        setErrorLista("");
        void cargarConversaciones();
      }}
    />
  );

  return (
    // contain:inline-size evita que textos largos sin salto (títulos truncados) ensanchen el layout de la página
    <div className="flex h-[calc(100dvh-8rem)] sm:h-[calc(100dvh-9.5rem)] min-h-[28rem] overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs [contain:inline-size]">
      {/* Lista lateral (escritorio) */}
      <aside className="hidden md:flex w-72 shrink-0 flex-col border-r border-slate-200/90 bg-slate-50/60">{lista}</aside>

      {/* Lista lateral (móvil) */}
      <Sheet open={listaMovilAbierta} onOpenChange={setListaMovilAbierta}>
        <SheetContent side="left" className="w-[85%] max-w-xs gap-0 bg-white p-0">
          <SheetHeader className="border-b border-slate-100 p-4">
            <SheetTitle>Conversaciones</SheetTitle>
            <SheetDescription className="sr-only">Lista de tus conversaciones con el asistente de IA</SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1">{lista}</div>
        </SheetContent>
      </Sheet>

      <section className="flex min-w-0 flex-1 flex-col">
        {/* Cabecera de la conversación */}
        <header className="flex items-center gap-2 border-b border-slate-200/90 px-3 py-2.5 sm:px-4">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setListaMovilAbierta(true)}
            aria-label="Ver conversaciones"
            className="md:hidden text-slate-600"
          >
            <PanelLeft />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-semibold text-slate-900">{activa?.titulo ?? "Nueva conversación"}</h1>
            <p className="text-[11px] text-slate-500">Asistente de IA · Las respuestas pueden contener errores, verifícalas.</p>
          </div>
          {activa && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setRenombrando(activa)}
              aria-label="Renombrar conversación"
              className="text-slate-500"
            >
              <Pencil />
            </Button>
          )}
        </header>

        {!enLinea && (
          <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800" role="status">
            <WifiOff className="size-4 shrink-0" />
            Sin conexión a internet. Podrás enviar mensajes cuando se restablezca.
          </div>
        )}

        {/* Mensajes */}
        <div className="relative min-h-0 flex-1">
          <div ref={scrollRef} onScroll={handleScroll} className="h-full overflow-y-auto px-3 py-5 sm:px-6" aria-live="polite">
            {estadoMensajes === "cargando" && (
              <div className="mx-auto max-w-3xl space-y-4" aria-label="Cargando mensajes">
                <Skeleton className="ml-auto h-10 w-2/3 rounded-2xl" />
                <Skeleton className="h-24 w-3/4 rounded-2xl" />
                <Skeleton className="ml-auto h-10 w-1/2 rounded-2xl" />
              </div>
            )}

            {estadoMensajes === "error" && activaId !== null && (
              <div className="mx-auto mt-10 max-w-md rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                <div className="flex items-start gap-2">
                  <AlertCircle className="size-4 mt-0.5 shrink-0" />
                  <p>{errorMensajes || "No se pudieron cargar los mensajes."}</p>
                </div>
                <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => void cargarMensajes(activaId)}>
                  <RotateCcw />
                  Reintentar
                </Button>
              </div>
            )}

            {estadoMensajes === "listo" && sinMensajes && (
              <div className="mx-auto flex max-w-xl flex-col items-center py-8 text-center">
                <div className="mb-4 flex size-14 items-center justify-center rounded-2xl border border-sky-100 bg-sky-50 text-sky-600">
                  <Bot className="size-7" />
                </div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900">¿En qué te puedo ayudar?</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Pregúntame sobre planificación de clases, actividades didácticas, instrumentos de evaluación u orientación en el aula de matemáticas.
                </p>
                <div className="mt-6 grid w-full gap-2">
                  {SUGERENCIAS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setBorrador(s);
                        entradaRef.current?.enfocar();
                      }}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-700 transition-colors hover:border-sky-300 hover:bg-sky-50/60 cursor-pointer"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {estadoMensajes === "listo" && !sinMensajes && (
              <div className="mx-auto max-w-3xl space-y-5">
                {mensajes.map((m) => (
                  <MensajeChat key={m.id} rol={m.rol} contenido={m.contenido} />
                ))}

                {enCursoAqui && enCurso && (
                  <>
                    <MensajeChat rol="USER" contenido={enCurso.texto} estado="pendiente" />
                    <IndicadorRespondiendo />
                  </>
                )}

                {fallidoAqui && fallido && (
                  <>
                    <MensajeChat rol="USER" contenido={fallido.texto} estado="fallido" />
                    <div className="ml-auto max-w-[85%] sm:max-w-[75%] rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800" role="alert">
                      <div className="flex items-start gap-2">
                        {fallido.error.sinConexion ? <WifiOff className="mt-0.5 size-4 shrink-0" /> : <AlertCircle className="mt-0.5 size-4 shrink-0" />}
                        <div>
                          <p className="font-semibold">No se obtuvo respuesta. Tu mensaje no se guardó.</p>
                          <p className="mt-0.5 text-xs text-rose-700">{fallido.error.message}</p>
                        </div>
                      </div>
                      <div className="mt-2.5 flex flex-wrap justify-end gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={editarFallido}>
                          <Pencil />
                          Editar mensaje
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => void enviar(fallido.texto)}
                          disabled={!enLinea || enCurso !== null}
                          className="bg-sky-600 text-white hover:bg-sky-700"
                        >
                          <RotateCcw />
                          Reintentar
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {mostrarIrAlFinal && estadoMensajes === "listo" && !sinMensajes && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => irAlFinal(true)}
              className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-white shadow-md"
            >
              <ArrowDown />
              Ir al final
            </Button>
          )}
        </div>

        <EntradaMensaje
          ref={entradaRef}
          valor={borrador}
          onCambiar={setBorrador}
          onEnviar={() => void (adjuntoActivo ? adjuntarArchivo(adjuntoActivo, borrador) : enviar(borrador))}
          enviando={enCurso !== null}
          deshabilitado={!enLinea || estadoMensajes === "cargando"}
          motivoDeshabilitado={!enLinea ? "Sin conexión" : undefined}
          onAdjuntar={puedeAdjuntar ? elegirAdjunto : undefined}
          adjunto={adjuntoActivo}
          onQuitarAdjunto={() => setAdjunto(null)}
          adjuntando={adjuntando}
          ayudaAdjuntar={AYUDA_ADJUNTAR}
        />
      </section>

      <RenombrarConversacionDialog
        key={renombrando?.id ?? "ninguna"}
        open={renombrando !== null}
        tituloActual={renombrando?.titulo ?? ""}
        onOpenChange={(open) => !open && setRenombrando(null)}
        onGuardar={guardarTitulo}
      />

      <ConfirmDeleteDialog
        open={confirmarEliminarAbierto}
        onOpenChange={setConfirmarEliminarAbierto}
        onConfirm={confirmarEliminacion}
        title="Eliminar conversación"
        description={
          eliminando && revision?.esRevision(eliminando.id)
            ? `Se eliminará «${eliminando.titulo}» con todos sus mensajes y su retroalimentación: la planificación quedará sin revisión. Esta acción no se puede deshacer.`
            : `Se eliminará «${eliminando?.titulo ?? ""}» con todos sus mensajes. Esta acción no se puede deshacer.`
        }
      />
    </div>
  );
}
