import { useRef, useState } from "react";
import { Menu } from "@base-ui/react/menu";
import { FolderOpen, Paperclip, Plus } from "lucide-react";
import { SelectorPortafolio } from "./SelectorPortafolio";

interface MenuAdjuntarProps {
  /** RUT del estudiante: el selector muestra su portafolio. */
  rut: string;
  onElegir: (archivo: File) => void;
  deshabilitado?: boolean;
  ayuda?: string;
}

const ITEM =
  "flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left outline-none select-none data-[highlighted]:bg-slate-100";

/** Botón + del chat con un menú al estilo de los asistentes de IA: adjuntar desde este PC o desde el portafolio. */
export function MenuAdjuntar({ rut, onElegir, deshabilitado = false, ayuda }: MenuAdjuntarProps) {
  const archivoRef = useRef<HTMLInputElement>(null);
  const [portafolioAbierto, setPortafolioAbierto] = useState(false);

  return (
    <>
      <input
        ref={archivoRef}
        type="file"
        accept=".docx,.pdf"
        className="hidden"
        onChange={(e) => {
          const archivo = e.target.files?.[0];
          e.target.value = ""; // permite volver a elegir el mismo archivo
          if (archivo) onElegir(archivo);
        }}
      />

      <Menu.Root>
        <Menu.Trigger
          disabled={deshabilitado}
          aria-label="Adjuntar archivo"
          title={ayuda ?? "Adjuntar un archivo"}
          className="group flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full border border-slate-200 text-slate-600 transition-colors outline-none hover:bg-slate-100 focus-visible:ring-3 focus-visible:ring-sky-200/60 disabled:pointer-events-none disabled:opacity-50 data-[popup-open]:bg-slate-100"
        >
          <Plus className="size-4.5 transition-transform duration-200 group-data-[popup-open]:rotate-45" />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner side="top" align="start" sideOffset={10} className="z-50 outline-none">
            <Menu.Popup className="w-[min(22rem,calc(100vw-2rem))] origin-[var(--transform-origin)] rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_12px_40px_-12px_rgba(15,23,42,0.28)] transition-[transform,opacity] duration-150 outline-none data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
              <Menu.Item className={ITEM} onClick={() => archivoRef.current?.click()}>
                <Paperclip className="size-[18px] shrink-0 text-slate-500" aria-hidden />
                <span className="flex min-w-0 flex-wrap items-baseline gap-x-2">
                  <span className="text-sm text-slate-900">Agregar desde este PC</span>
                  <span className="text-xs text-slate-400">Cargar desde la computadora</span>
                </span>
              </Menu.Item>
              <Menu.Item className={ITEM} onClick={() => setPortafolioAbierto(true)}>
                <FolderOpen className="size-[18px] shrink-0 text-slate-500" aria-hidden />
                <span className="flex min-w-0 flex-wrap items-baseline gap-x-2">
                  <span className="text-sm text-slate-900">Agregar desde el portafolio</span>
                  <span className="text-xs text-slate-400">Explora y busca tus archivos</span>
                </span>
              </Menu.Item>
              <div className="mx-3 mt-1 border-t border-slate-100 pt-2 pb-1 text-[11px] text-slate-400">
                Tu planificación corregida, en .docx o .pdf
              </div>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      <SelectorPortafolio open={portafolioAbierto} onOpenChange={setPortafolioAbierto} rut={rut} onElegir={onElegir} />
    </>
  );
}
