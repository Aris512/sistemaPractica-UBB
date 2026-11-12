import { useEffect, useMemo, useState } from "react";
import { Check, FolderOpen, LayoutGrid, List, Loader2, RotateCcw, Search, X } from "lucide-react";
import { sileo } from "sileo";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { obtenerDocumentosPortafolio } from "@/services/portafolioApi";
import type { PortafolioItem } from "@/types/portafolio";
import { esAdjuntoCompatible, estiloArchivo } from "./archivoVisual";

type Vista = "lista" | "cuadricula";
const CLAVE_VISTA = "ubb_chat_portafolio_vista";

interface SelectorPortafolioProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rut: string;
  /** Recibe el archivo ya descargado del portafolio, listo para adjuntar. */
  onElegir: (archivo: File) => void;
}

function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** «2 nov, 7:55 p. m.» */
function formatearFecha(iso: string): string {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "";
  const dia = fecha.toLocaleDateString("es-CL", { day: "numeric", month: "short" }).replace(".", "");
  const hora = fecha.toLocaleTimeString("es-CL", { hour: "numeric", minute: "2-digit", hour12: true });
  return `${dia}, ${hora}`;
}

function leerVista(): Vista {
  try {
    return localStorage.getItem(CLAVE_VISTA) === "cuadricula" ? "cuadricula" : "lista";
  } catch {
    return "lista";
  }
}

/** Ventana para elegir un archivo del portafolio del estudiante y adjuntarlo al chat (como «Agregar desde biblioteca»). */
export function SelectorPortafolio({ open, onOpenChange, rut, onElegir }: SelectorPortafolioProps) {
  const [documentos, setDocumentos] = useState<PortafolioItem[]>([]);
  const [estado, setEstado] = useState<"cargando" | "listo" | "error">("cargando");
  const [busqueda, setBusqueda] = useState("");
  const [vista, setVista] = useState<Vista>(leerVista);
  const [seleccionado, setSeleccionado] = useState<number | null>(null);
  const [descargando, setDescargando] = useState(false);
  const [recarga, setRecarga] = useState(0);

  // Cada vez que se abre se vuelve a leer el portafolio: pudo cambiar desde otra sección
  useEffect(() => {
    if (!open) return;
    let cancelado = false;
    obtenerDocumentosPortafolio(rut, true).then(
      (datos) => {
        if (cancelado) return;
        setDocumentos([...datos].sort((a, b) => (b.fechaCarga ?? "").localeCompare(a.fechaCarga ?? "")));
        setEstado("listo");
      },
      () => !cancelado && setEstado("error")
    );
    return () => {
      cancelado = true;
    };
  }, [open, rut, recarga]);

  const filtrados = useMemo(() => {
    const q = normalizar(busqueda.trim());
    return q ? documentos.filter((d) => normalizar(d.nombre).includes(q)) : documentos;
  }, [documentos, busqueda]);

  const elegido = documentos.find((d) => d.idDocumento === seleccionado) ?? null;

  const cambiarAbierto = (abierto: boolean) => {
    if (descargando) return;
    if (!abierto) {
      setBusqueda("");
      setSeleccionado(null);
      setEstado("cargando");
    }
    onOpenChange(abierto);
  };

  const cambiarVista = (nueva: Vista) => {
    setVista(nueva);
    try {
      localStorage.setItem(CLAVE_VISTA, nueva);
    } catch {
      // Sin almacenamiento: solo no se recuerda la vista
    }
  };

  const agregar = async (doc: PortafolioItem | null = elegido) => {
    if (!doc || descargando || !esAdjuntoCompatible(doc.nombre)) return;
    setDescargando(true);
    try {
      const res = await fetch(doc.urlDescarga || `/api/portafolio/archivos/${doc.idDocumento}/descargar`);
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const blob = await res.blob();
      onElegir(new File([blob], doc.nombre, { type: blob.type, lastModified: Date.now() }));
      setDescargando(false);
      cambiarAbierto(false);
    } catch {
      setDescargando(false);
      sileo.error({ title: "No se pudo agregar el archivo", description: "No fue posible leerlo desde tu portafolio. Inténtalo nuevamente." });
    }
  };

  const alternar = (doc: PortafolioItem) => {
    if (!esAdjuntoCompatible(doc.nombre)) return;
    setSeleccionado((actual) => (actual === doc.idDocumento ? null : doc.idDocumento));
  };

  return (
    <Dialog open={open} onOpenChange={cambiarAbierto}>
      <DialogContent showCloseButton={false} className="flex max-h-[85dvh] flex-col gap-0 overflow-hidden rounded-2xl bg-white p-0 sm:max-w-xl">
        <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3">
          <DialogTitle className="text-xl font-semibold tracking-tight text-slate-900">Agregar desde portafolio</DialogTitle>
          <DialogClose
            render={<Button variant="ghost" size="icon-sm" className="rounded-full text-slate-500" disabled={descargando} />}
          >
            <X />
            <span className="sr-only">Cerrar</span>
          </DialogClose>
        </div>
        <DialogDescription className="sr-only">
          Elige un archivo de tu portafolio para adjuntarlo a la conversación. La IA puede leer archivos .docx o .pdf.
        </DialogDescription>

        <div className="flex items-center gap-2 px-5 pb-3">
          <label className="flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-full border border-slate-200 px-4 focus-within:border-sky-400 focus-within:ring-3 focus-within:ring-sky-200/50">
            <Search className="size-4.5 shrink-0 text-slate-400" aria-hidden />
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar en el portafolio"
              aria-label="Buscar en el portafolio"
              className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
            />
          </label>
          <Button
            type="button"
            variant="ghost"
            size="icon-lg"
            onClick={() => cambiarVista(vista === "lista" ? "cuadricula" : "lista")}
            aria-label={vista === "lista" ? "Ver como cuadrícula" : "Ver como lista"}
            title={vista === "lista" ? "Ver como cuadrícula" : "Ver como lista"}
            className="rounded-full text-slate-500"
          >
            {vista === "lista" ? <LayoutGrid className="size-5" /> : <List className="size-5" />}
          </Button>
        </div>

        <div className="min-h-[18rem] flex-1 overflow-y-auto px-3 pb-3">
          {estado === "cargando" && (
            <div className="space-y-1 px-2" aria-label="Cargando portafolio">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 py-2.5">
                  <Skeleton className="size-11 rounded-xl" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {estado === "error" && (
            <div className="flex flex-col items-center gap-3 px-6 py-12 text-center text-sm text-slate-600">
              <p>No se pudo cargar tu portafolio.</p>
              <Button type="button" variant="outline" size="sm" onClick={() => { setEstado("cargando"); setRecarga((n) => n + 1); }}>
                <RotateCcw />
                Reintentar
              </Button>
            </div>
          )}

          {estado === "listo" && filtrados.length === 0 && (
            <div className="flex flex-col items-center px-6 py-12 text-center">
              <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <FolderOpen className="size-6" />
              </div>
              <p className="text-sm font-medium text-slate-800">
                {documentos.length === 0 ? "Tu portafolio está vacío" : `Sin resultados para «${busqueda.trim()}»`}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {documentos.length === 0 ? "Sube tus archivos en la sección Portafolio o agrégalos desde este PC." : "Prueba con otro nombre."}
              </p>
            </div>
          )}

          {estado === "listo" && filtrados.length > 0 && vista === "lista" && (
            <ul role="listbox" aria-label="Archivos del portafolio" className="space-y-0.5">
              {filtrados.map((doc) => {
                const compatible = esAdjuntoCompatible(doc.nombre);
                const activo = seleccionado === doc.idDocumento;
                const { Icono, claro, etiqueta } = estiloArchivo(doc.nombre);
                return (
                  <li key={doc.idDocumento} role="option" aria-selected={activo} aria-disabled={!compatible}>
                    <button
                      type="button"
                      onClick={() => alternar(doc)}
                      onDoubleClick={() => void agregar(doc)}
                      disabled={!compatible || descargando}
                      title={compatible ? doc.nombre : "La IA solo puede leer archivos .docx o .pdf"}
                      className={`group flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors ${
                        activo ? "bg-sky-50" : "hover:bg-slate-100"
                      } ${compatible ? "cursor-pointer" : "cursor-not-allowed opacity-45"}`}
                    >
                      <span className="relative flex size-11 shrink-0 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white shadow-xs">
                        <Icono className={`size-5 ${claro}`} aria-hidden />
                        <span className={`text-[8px] leading-none font-bold tracking-wide ${claro}`}>{etiqueta === "Documento" ? "DOC" : etiqueta.slice(0, 4).toUpperCase()}</span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] text-slate-900">{doc.nombre}</span>
                        <span className="block text-xs text-slate-500">
                          {formatearFecha(doc.fechaCarga)}
                          {!compatible && " · Formato no compatible"}
                        </span>
                      </span>
                      {compatible && (
                        <span
                          className={`flex size-5 shrink-0 items-center justify-center rounded-full border transition-opacity ${
                            activo ? "border-sky-600 bg-sky-600 text-white opacity-100" : "border-slate-300 bg-white opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
                          }`}
                          aria-hidden
                        >
                          {activo && <Check className="size-3.5" strokeWidth={3} />}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {estado === "listo" && filtrados.length > 0 && vista === "cuadricula" && (
            <ul role="listbox" aria-label="Archivos del portafolio" className="grid grid-cols-2 gap-2.5 px-2 sm:grid-cols-3">
              {filtrados.map((doc) => {
                const compatible = esAdjuntoCompatible(doc.nombre);
                const activo = seleccionado === doc.idDocumento;
                const { Icono, claro } = estiloArchivo(doc.nombre);
                return (
                  <li key={doc.idDocumento} role="option" aria-selected={activo} aria-disabled={!compatible}>
                    <button
                      type="button"
                      onClick={() => alternar(doc)}
                      onDoubleClick={() => void agregar(doc)}
                      disabled={!compatible || descargando}
                      title={compatible ? doc.nombre : "La IA solo puede leer archivos .docx o .pdf"}
                      className={`group relative flex w-full flex-col overflow-hidden rounded-xl border text-left transition-colors ${
                        activo ? "border-sky-500 ring-2 ring-sky-200" : "border-slate-200 hover:border-slate-300"
                      } ${compatible ? "cursor-pointer" : "cursor-not-allowed opacity-45"}`}
                    >
                      <span className="flex h-24 items-center justify-center bg-slate-50">
                        <Icono className={`size-10 ${claro}`} aria-hidden />
                      </span>
                      <span className="block px-2.5 py-2">
                        <span className="block truncate text-sm text-slate-900">{doc.nombre}</span>
                        <span className="block truncate text-[11px] text-slate-500">{compatible ? formatearFecha(doc.fechaCarga) : "Formato no compatible"}</span>
                      </span>
                      {compatible && (
                        <span
                          className={`absolute top-2 right-2 flex size-5 items-center justify-center rounded-full border transition-opacity ${
                            activo ? "border-sky-600 bg-sky-600 text-white opacity-100" : "border-slate-300 bg-white opacity-0 group-hover:opacity-100"
                          }`}
                          aria-hidden
                        >
                          {activo && <Check className="size-3.5" strokeWidth={3} />}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-3">
          <p className="min-w-0 truncate text-xs text-slate-500">
            {elegido ? <span className="font-medium text-slate-700">{elegido.nombre}</span> : "La IA lee archivos .docx o .pdf"}
          </p>
          <div className="flex shrink-0 gap-2">
            <Button type="button" variant="outline" onClick={() => cambiarAbierto(false)} disabled={descargando}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => void agregar()}
              disabled={!elegido || descargando}
              className="bg-sky-600 text-white hover:bg-sky-700"
            >
              {descargando && <Loader2 className="animate-spin" />}
              Agregar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
