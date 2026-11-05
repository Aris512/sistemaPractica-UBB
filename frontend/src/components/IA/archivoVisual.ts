import { File as FileIcon, FileSpreadsheet, FileText, Image as ImageIcon, Presentation } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/** Formatos que la IA puede leer como planificación. */
export const EXTENSIONES_ADJUNTO = ["docx", "pdf"] as const;

export function extensionDe(nombre: string): string {
  const partes = nombre.split(".");
  return partes.length > 1 ? (partes.pop() ?? "").toLowerCase() : "";
}

export function esAdjuntoCompatible(nombre: string): boolean {
  return (EXTENSIONES_ADJUNTO as readonly string[]).includes(extensionDe(nombre));
}

export interface EstiloArchivo {
  Icono: LucideIcon;
  etiqueta: string;
  /** Ícono sobre fondo claro (listas). */
  claro: string;
  /** Mosaico de color sólido (archivo adjunto). */
  solido: string;
}

/** Ícono, color y etiqueta según la extensión del archivo. */
export function estiloArchivo(nombre: string): EstiloArchivo {
  const ext = extensionDe(nombre);
  if (ext === "pdf") return { Icono: FileText, etiqueta: "PDF", claro: "text-red-500", solido: "bg-red-500" };
  if (ext === "doc" || ext === "docx") return { Icono: FileText, etiqueta: "Documento", claro: "text-blue-600", solido: "bg-blue-600" };
  if (["png", "jpg", "jpeg", "gif", "webp", "heic"].includes(ext))
    return { Icono: ImageIcon, etiqueta: "Imagen", claro: "text-pink-500", solido: "bg-pink-500" };
  if (["xls", "xlsx", "csv"].includes(ext))
    return { Icono: FileSpreadsheet, etiqueta: "Planilla", claro: "text-emerald-600", solido: "bg-emerald-600" };
  if (["ppt", "pptx"].includes(ext))
    return { Icono: Presentation, etiqueta: "Presentación", claro: "text-orange-500", solido: "bg-orange-500" };
  return { Icono: FileIcon, etiqueta: ext ? ext.toUpperCase() : "Archivo", claro: "text-slate-500", solido: "bg-slate-500" };
}

export function formatearTamanio(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toLocaleString("es-CL", { maximumFractionDigits: 1 })} MB`;
}
