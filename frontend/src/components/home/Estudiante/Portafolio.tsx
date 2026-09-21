import { useState, useEffect, useCallback } from "react";
import {
  Briefcase,
  ArrowLeft,
  Upload,
  Download,
  Trash2,
  FileText,
  FileSpreadsheet,
  Presentation,
  FileArchive,
  Image as ImageIcon,
  FileQuestion,
  RefreshCw,
  FolderOpen,
} from "lucide-react";
import { sileo } from "sileo";
import type { UserSession } from "@/types/auth";
import { usePermissions } from "@/hooks/usePermissions";
import type { PortafolioItem, CategoriaPortafolio } from "@/types/portafolio";
import {
  obtenerDocumentosPortafolio,
  eliminarDocumentoPortafolio,
} from "@/services/portafolioApi";
import {
  Attachment,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentContent,
  AttachmentTitle,
  AttachmentDescription,
  AttachmentActions,
  AttachmentAction,
} from "@/components/ui/attachment";
import { FileUploadModal } from "@/components/ui/FileUploadModal";

interface PortafolioProps {
  user?: UserSession;
  onBack?: () => void;
}

const CATEGORIAS_CONFIG: { key: CategoriaPortafolio; label: string }[] = [
  { key: "TODOS", label: "Todos los archivos" },
  { key: "EVIDENCIA", label: "Evidencias pedagógicas" },
  { key: "REFLEXION", label: "Reflexiones y diarios" },
  { key: "RETROALIMENTACION", label: "Retroalimentaciones" },
  { key: "OTRO", label: "Otros documentos" },
];

export function Portafolio({ user, onBack }: PortafolioProps) {
  const { hasPermission } = usePermissions(user);
  const puedeSubir = hasPermission("PORTAFOLIO_SUBIR");

  const [documentos, setDocumentos] = useState<PortafolioItem[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [filtroCategoria, setFiltroCategoria] = useState<CategoriaPortafolio>("TODOS");
  const [modalAbierto, setModalAbierto] = useState<boolean>(false);
  const [tipoParaSubir, setTipoParaSubir] = useState<string>("EVIDENCIA");

  const rutEstudiante = user?.rut || "";

  const cargarDocumentos = useCallback(async () => {
    if (!rutEstudiante) return;
    setCargando(true);
    try {
      const docs = await obtenerDocumentosPortafolio(rutEstudiante);
      setDocumentos(docs);
    } catch (err: any) {
      console.warn("No se pudieron cargar evidencias del portafolio:", err);
    } finally {
      setCargando(false);
    }
  }, [rutEstudiante]);

  useEffect(() => {
    cargarDocumentos();
  }, [cargarDocumentos]);

  const handleEliminar = async (idDocumento: number, nombre: string) => {
    try {
      await eliminarDocumentoPortafolio(idDocumento);
      sileo.success({
        title: "Archivo eliminado",
        description: `Se eliminó "${nombre}" exitosamente.`,
      });
      cargarDocumentos();
    } catch (err: any) {
      sileo.error({
        title: "Error al eliminar",
        description: err.message || "No se pudo eliminar el archivo.",
      });
    }
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.toLowerCase().split(".").pop();
    switch (ext) {
      case "pdf":
        return <FileText className="size-4 text-rose-500" />;
      case "doc":
      case "docx":
        return <FileText className="size-4 text-sky-600" />;
      case "xls":
      case "xlsx":
        return <FileSpreadsheet className="size-4 text-emerald-600" />;
      case "ppt":
      case "pptx":
        return <Presentation className="size-4 text-amber-600" />;
      case "zip":
      case "rar":
        return <FileArchive className="size-4 text-purple-600" />;
      case "png":
      case "jpg":
      case "jpeg":
        return <ImageIcon className="size-4 text-indigo-500" />;
      default:
        return <FileQuestion className="size-4 text-slate-500" />;
    }
  };

  const formatearTipo = (tipo: string) => {
    if (tipo.includes("REFLEXION")) return "Reflexión";
    if (tipo.includes("RETROALIMENTACION")) return "Retroalimentación";
    if (tipo.includes("PAUTA")) return "Pauta de evaluación";
    return "Evidencia pedagógica";
  };

  const formatearFecha = (fechaStr: string) => {
    if (!fechaStr) return "";
    try {
      return new Date(fechaStr).toLocaleDateString("es-CL", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return fechaStr;
    }
  };

  const docsFiltrados = documentos.filter((doc) => {
    if (filtroCategoria === "TODOS") return true;
    if (filtroCategoria === "EVIDENCIA") return doc.tipo.includes("EVIDENCIA");
    if (filtroCategoria === "REFLEXION") return doc.tipo.includes("REFLEXION");
    if (filtroCategoria === "RETROALIMENTACION") return doc.tipo.includes("RETROALIMENTACION");
    return !doc.tipo.includes("EVIDENCIA") && !doc.tipo.includes("REFLEXION") && !doc.tipo.includes("RETROALIMENTACION");
  });

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">
      {/* Botón Volver y Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-sky-800 bg-sky-50 hover:bg-sky-100/80 border border-sky-200 transition-colors cursor-pointer"
            >
              <ArrowLeft className="size-3.5" />
              <span>Volver</span>
            </button>
          )}

          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Briefcase className="size-6 text-sky-600" />
              <span>Portafolio de Práctica</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Recopilación de evidencias de aprendizaje, reflexiones pedagógicas y documentación formativa.
            </p>
          </div>
        </div>

        {/* Acciones principales */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={cargarDocumentos}
            disabled={cargando}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer disabled:opacity-50"
            title="Recargar archivos"
          >
            <RefreshCw className={`size-4 ${cargando ? "animate-spin text-sky-600" : ""}`} />
          </button>

          {puedeSubir && (
            <button
              type="button"
              onClick={() => {
                setTipoParaSubir("EVIDENCIA");
                setModalAbierto(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 shadow-xs hover:shadow transition-all cursor-pointer"
            >
              <Upload className="size-3.5" />
              <span>Subir Archivo al Portafolio</span>
            </button>
          )}
        </div>
      </div>

      {/* Barra de Resumen y Filtros */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Filtros de Categoría */}
        <div className="flex flex-wrap items-center gap-1.5">
          {CATEGORIAS_CONFIG.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setFiltroCategoria(cat.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filtroCategoria === cat.key
                  ? "bg-sky-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Contador */}
        <div className="text-xs font-semibold text-slate-500 shrink-0">
          Mostrando <strong className="text-slate-800">{docsFiltrados.length}</strong> de{" "}
          <strong className="text-slate-800">{documentos.length}</strong> archivos
        </div>
      </div>

      {/* Contenido de Archivos con Attachment Component */}
      {cargando ? (
        <div className="py-16 flex flex-col items-center justify-center text-center">
          <RefreshCw className="size-7 text-sky-600 animate-spin mb-2" />
          <p className="text-sm font-medium text-slate-500">Cargando evidencias del portafolio...</p>
        </div>
      ) : docsFiltrados.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center flex flex-col items-center justify-center">
          <div className="size-14 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 mb-3 shadow-2xs">
            <FolderOpen className="size-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">
            {filtroCategoria === "TODOS"
              ? "Aún no tienes archivos en tu portafolio"
              : "No se encontraron archivos en esta categoría"}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mb-6 leading-relaxed">
            Puedes subir informes pedagógicos, diarios reflexivos, planificaciones de clase, fotos de materiales o evaluaciones (hasta 20 MB).
          </p>
          {puedeSubir && (
            <button
              type="button"
              onClick={() => {
                setTipoParaSubir("EVIDENCIA");
                setModalAbierto(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Upload className="size-3.5" />
              <span>Subir tu primera evidencia</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <AttachmentGroup className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {docsFiltrados.map((doc) => (
              <Attachment
                key={doc.idDocumento}
                state="done"
                size="default"
                className="w-full justify-between bg-white border border-slate-200/90 hover:border-sky-300 hover:bg-sky-50/20 transition-all rounded-xl p-3 shadow-2xs"
              >
                <div className="flex items-center gap-3 overflow-hidden min-w-0">
                  <AttachmentMedia variant="icon" className="bg-slate-50 border border-slate-200/80 rounded-lg size-10">
                    {getFileIcon(doc.nombre)}
                  </AttachmentMedia>
                  <AttachmentContent className="overflow-hidden">
                    <AttachmentTitle
                      className="text-xs sm:text-sm font-semibold text-slate-900 truncate"
                      title={doc.nombre}
                    >
                      {doc.nombre}
                    </AttachmentTitle>
                    <AttachmentDescription className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <span>{doc.tamanio || "—"}</span>
                      <span>•</span>
                      <span>{formatearFecha(doc.fechaCarga)}</span>
                      <span>•</span>
                      <span className="font-medium text-sky-700">{formatearTipo(doc.tipo)}</span>
                    </AttachmentDescription>
                  </AttachmentContent>
                </div>

                <AttachmentActions className="gap-1 shrink-0 ml-2">
                  {/* Descargar */}
                  <AttachmentAction
                    onClick={() => window.open(doc.urlDescarga, "_blank")}
                    title="Descargar archivo"
                    className="hover:bg-sky-50 hover:text-sky-700 text-slate-600 rounded-lg"
                  >
                    <Download className="size-3.5" />
                  </AttachmentAction>

                  {/* Eliminar (si tiene permiso) */}
                  {puedeSubir && (
                    <AttachmentAction
                      onClick={() => handleEliminar(doc.idDocumento, doc.nombre)}
                      title="Eliminar de portafolio"
                      className="hover:bg-rose-50 hover:text-rose-600 text-slate-400 rounded-lg"
                    >
                      <Trash2 className="size-3.5" />
                    </AttachmentAction>
                  )}
                </AttachmentActions>
              </Attachment>
            ))}
          </AttachmentGroup>
        </div>
      )}

      {/* Modal de Carga Integrado (con soporte de 20MB y progreso animado) */}
      <FileUploadModal
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        title="Subir Archivo al Portafolio"
        description="Selecciona o arrastra tu evidencia o documento pedagógico (Límite: 20 MB • PDF, Word, PowerPoint, Excel, ZIP o Imágenes)."
        endpoint="/api/portafolio/subir"
        additionalData={{
          rutEstudiante: rutEstudiante,
          tipo: tipoParaSubir,
          rutUsuarioSubio: user?.rut,
        }}
        allowedExtensions={[".pdf", ".docx", ".doc", ".pptx", ".ppt", ".xlsx", ".xls", ".zip", ".rar", ".png", ".jpg", ".jpeg"]}
        maxSizeMB={20}
        onSuccess={() => {
          cargarDocumentos();
        }}
      />
    </div>
  );
}
