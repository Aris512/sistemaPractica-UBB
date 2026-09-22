import { useState, useMemo } from "react";
import type { UserSession } from "@/types/auth";
import type { DatosPracticaEstudiante, DocumentoFiltroItem } from "../types";
import {
  Search,
  Upload,
  Download,
  Trash2,
  FileText,
  RefreshCw,
  FolderOpen,
} from "lucide-react";
import { FileUploadModal } from "@/components/ui/FileUploadModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { sileo } from "sileo";

interface PracticaDocumentosViewProps {
  user: UserSession;
  datos: DatosPracticaEstudiante;
  onReload?: () => void;
}

type CategoriaFiltro = "Todos" | "Documentos" | "Evidencias" | "Informes" | "Otros";

export function PracticaDocumentosView({
  user,
  datos,
  onReload,
}: PracticaDocumentosViewProps) {
  const [busqueda, setBusqueda] = useState<string>("");
  const [categoriaActiva, setCategoriaActiva] = useState<CategoriaFiltro>("Todos");
  const [modalSubidaAbierto, setModalSubidaAbierto] = useState<boolean>(false);
  const [docAEliminar, setDocAEliminar] = useState<DocumentoFiltroItem | null>(null);

  const categorias: CategoriaFiltro[] = [
    "Todos",
    "Documentos",
    "Evidencias",
    "Informes",
    "Otros",
  ];

  // Conteo por categoría
  const countPorCategoria = (cat: CategoriaFiltro) => {
    if (cat === "Todos") return datos.documentos.length;
    return datos.documentos.filter((d) => d.categoria === cat).length;
  };

  // Filtrado reactivo
  const docsFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return datos.documentos.filter((doc) => {
      const coincideCat =
        categoriaActiva === "Todos" || doc.categoria === categoriaActiva;
      const coincideBusqueda =
        !q ||
        doc.nombre.toLowerCase().includes(q) ||
        doc.subidoPor.toLowerCase().includes(q) ||
        doc.ext.toLowerCase().includes(q);
      return coincideCat && coincideBusqueda;
    });
  }, [datos.documentos, categoriaActiva, busqueda]);

  const getExtBadgeClass = (ext: string) => {
    switch (ext.toLowerCase()) {
      case "pdf":
        return "bg-rose-50 text-rose-700 border-rose-200/80";
      case "doc":
      case "docx":
        return "bg-sky-50 text-sky-700 border-sky-200/80";
      case "xls":
      case "xlsx":
        return "bg-emerald-50 text-emerald-700 border-emerald-200/80";
      case "ppt":
      case "pptx":
        return "bg-amber-50 text-amber-700 border-amber-200/80";
      case "jpg":
      case "jpeg":
      case "png":
        return "bg-indigo-50 text-indigo-700 border-indigo-200/80";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getInitials = (nombre: string) => {
    return nombre
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0].toUpperCase())
      .join("");
  };

  const handleDescargar = (doc: DocumentoFiltroItem) => {
    if (doc.urlDescarga) {
      window.open(doc.urlDescarga, "_blank");
    } else {
      sileo.info({
        title: "Descarga iniciada",
        description: `Descargando archivo «${doc.nombre}».`,
      });
    }
  };

  const handleConfirmarEliminar = async () => {
    if (!docAEliminar) return;

    try {
      if (typeof docAEliminar.id === "number") {
        const res = await fetch(`/api/portafolio/${docAEliminar.id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          throw new Error("No se pudo eliminar el archivo del servidor.");
        }
      }
      sileo.success({
        title: "Archivo eliminado",
        description: `Se ha eliminado «${docAEliminar.nombre}».`,
      });
      setDocAEliminar(null);
      onReload?.();
    } catch (err: any) {
      sileo.error({
        title: "Error al eliminar",
        description: err.message || "Ocurrió un error al intentar eliminar.",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Modal de Subida de Documentos */}
      <FileUploadModal
        isOpen={modalSubidaAbierto}
        onClose={() => setModalSubidaAbierto(false)}
        endpoint="/api/portafolio/subir"
        title="Subir Archivo al Portafolio de Práctica"
        description="Puedes subir informes, bitácoras, registros o pautas en PDF, Word, Excel, PPTX o imágenes (máx. 20 MB)."
        additionalData={{
          rutEstudiante: user.rut,
          tipo: categoriaActiva === "Informes" ? "INFORME" : "EVIDENCIA",
          rutUsuarioSubio: user.rut,
        }}
        onSuccess={() => {
          setModalSubidaAbierto(false);
          sileo.success({
            title: "Archivo subido",
            description: "El archivo ha sido agregado exitosamente.",
          });
          onReload?.();
        }}
      />

      {/* Diálogo de Confirmación de Eliminación */}
      <Dialog open={!!docAEliminar} onOpenChange={(open) => !open && setDocAEliminar(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>¿Eliminar este archivo?</DialogTitle>
            <DialogDescription>
              Se eliminará «<strong>{docAEliminar?.nombre}</strong>» de tu portafolio de práctica. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-3">
            <button
              type="button"
              onClick={() => setDocAEliminar(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmarEliminar}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors cursor-pointer shadow-xs"
            >
              Eliminar Archivo
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cabecera y Barra de Acciones */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="size-6 text-sky-600" />
              <span>Documentos y Archivos de Práctica</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Administración de informes, convenios, bitácoras y documentación acreditada.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onReload}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
              title="Recargar archivos"
            >
              <RefreshCw className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setModalSubidaAbierto(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 shadow-xs hover:shadow transition-all cursor-pointer"
            >
              <Upload className="size-3.5" />
              <span>Subir Archivo</span>
            </button>
          </div>
        </div>

        {/* Buscador y Filtros */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
          {/* Campo de Búsqueda */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input
              type="search"
              placeholder="Buscar por nombre, autor o tipo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Filtros de Categoría */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {categorias.map((cat) => {
              const active = categoriaActiva === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoriaActiva(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    active
                      ? "bg-sky-600 text-white shadow-2xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                  }`}
                >
                  {cat} ({countPorCategoria(cat)})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Lista / Tabla de Documentos */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {docsFiltrados.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center justify-center p-6">
            <div className="size-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mb-3">
              <FolderOpen className="size-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              No se encontraron documentos
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              {busqueda
                ? `No hay archivos que coincidan con la búsqueda «${busqueda}».`
                : "No hay archivos cargados en esta categoría todavía."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-slate-400 uppercase tracking-wider font-semibold text-[11px]">
                  <th className="py-3 px-4">Nombre del Archivo</th>
                  <th className="py-3 px-3 hidden sm:table-cell">Tipo</th>
                  <th className="py-3 px-3 hidden md:table-cell">Tamaño</th>
                  <th className="py-3 px-3 hidden lg:table-cell">Fecha de Carga</th>
                  <th className="py-3 px-4">Subido por</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {docsFiltrados.map((doc) => (
                  <tr
                    key={doc.id}
                    className="hover:bg-sky-50/40 transition-colors group"
                  >
                    {/* Nombre y Extensión */}
                    <td className="py-3.5 px-4 min-w-[220px]">
                      <div className="flex items-center gap-3">
                        <span
                          className={`size-9 rounded-lg border font-extrabold text-[10px] flex items-center justify-center uppercase shrink-0 ${getExtBadgeClass(
                            doc.ext
                          )}`}
                        >
                          {doc.ext}
                        </span>
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold text-slate-900 truncate" title={doc.nombre}>
                            {doc.nombre}
                          </h4>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {doc.categoria}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Tipo */}
                    <td className="py-3.5 px-3 uppercase text-slate-500 font-bold hidden sm:table-cell">
                      {doc.ext}
                    </td>

                    {/* Tamaño */}
                    <td className="py-3.5 px-3 text-slate-600 font-medium hidden md:table-cell">
                      {doc.tamanio}
                    </td>

                    {/* Fecha */}
                    <td className="py-3.5 px-3 text-slate-500 hidden lg:table-cell">
                      {doc.fecha}
                    </td>

                    {/* Subido por */}
                    <td className="py-3.5 px-4 min-w-[160px]">
                      <div className="flex items-center gap-2">
                        <div className="size-7 rounded-full bg-sky-100 text-sky-800 text-[10px] font-bold flex items-center justify-center shrink-0">
                          {getInitials(doc.subidoPor)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">
                            {doc.subidoPor}
                          </p>
                          <span className="text-[10.5px] text-slate-400 block truncate">
                            {doc.rolSubidoPor}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Acciones */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDescargar(doc)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-sky-700 hover:bg-sky-50 transition-colors cursor-pointer"
                          title="Descargar archivo"
                        >
                          <Download className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDocAEliminar(doc)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Eliminar archivo"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
