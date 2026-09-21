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
  User,
  Search,
  ChevronRight,
  FolderOpen,
} from "lucide-react";
import { sileo } from "sileo";
import type { UserSession } from "@/types/auth";
import { usePermissions } from "@/hooks/usePermissions";
import type { PortafolioItem, EstudiantePortafolioSummary } from "@/types/portafolio";
import {
  obtenerDocumentosPortafolio,
  obtenerEstudiantesPortafolio,
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

export function Portafolio({ user, onBack }: PortafolioProps) {
  const { hasPermission } = usePermissions(user);
  const puedeSubir = hasPermission("PORTAFOLIO_SUBIR");

  const [estudiantes, setEstudiantes] = useState<EstudiantePortafolioSummary[]>([]);
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState<EstudiantePortafolioSummary | null>(null);
  const [documentos, setDocumentos] = useState<PortafolioItem[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [busqueda, setBusqueda] = useState<string>("");
  const [modalAbierto, setModalAbierto] = useState<boolean>(false);

  // Cargar lista de estudiantes con portafolio
  const cargarEstudiantes = useCallback(async () => {
    setCargando(true);
    try {
      const data = await obtenerEstudiantesPortafolio();
      setEstudiantes(data);
    } catch (err: any) {
      console.warn("No se pudieron cargar estudiantes para portafolio:", err);
    } finally {
      setCargando(false);
    }
  }, []);

  // Cargar documentos del estudiante seleccionado
  const cargarDocumentosEstudiante = useCallback(async (rut: string) => {
    setCargando(true);
    try {
      const docs = await obtenerDocumentosPortafolio(rut);
      setDocumentos(docs);
    } catch (err: any) {
      console.warn("Error al cargar documentos del estudiante:", err);
      setDocumentos([]);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarEstudiantes();
  }, [cargarEstudiantes]);

  useEffect(() => {
    if (estudianteSeleccionado) {
      cargarDocumentosEstudiante(estudianteSeleccionado.rut);
    }
  }, [estudianteSeleccionado, cargarDocumentosEstudiante]);

  const handleEliminar = async (idDocumento: number, nombre: string) => {
    try {
      await eliminarDocumentoPortafolio(idDocumento);
      sileo.success({
        title: "Archivo eliminado",
        description: `Se eliminó "${nombre}" exitosamente.`,
      });
      if (estudianteSeleccionado) {
        cargarDocumentosEstudiante(estudianteSeleccionado.rut);
      }
      cargarEstudiantes();
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

  const formatearFecha = (fechaStr: string | null) => {
    if (!fechaStr) return "Sin registros";
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

  const estudiantesFiltrados = estudiantes.filter((est) => {
    const term = busqueda.toLowerCase();
    return (
      est.nombre.toLowerCase().includes(term) ||
      est.rut.toLowerCase().includes(term) ||
      est.carrera.toLowerCase().includes(term)
    );
  });

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          {estudianteSeleccionado ? (
            <button
              type="button"
              onClick={() => setEstudianteSeleccionado(null)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <ArrowLeft className="size-3.5" />
              <span>Ver todos los estudiantes</span>
            </button>
          ) : (
            onBack && (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-sky-800 bg-sky-50 hover:bg-sky-100/80 border border-sky-200 transition-colors cursor-pointer"
              >
                <ArrowLeft className="size-3.5" />
                <span>Volver</span>
              </button>
            )
          )}

          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Briefcase className="size-6 text-sky-600" />
              <span>
                {estudianteSeleccionado
                  ? `Portafolio: ${estudianteSeleccionado.nombre}`
                  : "Supervisión de Portafolios de Estudiantes"}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {estudianteSeleccionado
                ? `RUT: ${estudianteSeleccionado.rut} • Carrera: ${estudianteSeleccionado.carrera}`
                : "Revisión de evidencias de aprendizaje, pautas de retroalimentación y supervisión pedagógica."}
            </p>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (estudianteSeleccionado) {
                cargarDocumentosEstudiante(estudianteSeleccionado.rut);
              } else {
                cargarEstudiantes();
              }
            }}
            disabled={cargando}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer disabled:opacity-50"
            title="Recargar"
          >
            <RefreshCw className={`size-4 ${cargando ? "animate-spin text-sky-600" : ""}`} />
          </button>

          {estudianteSeleccionado && puedeSubir && (
            <button
              type="button"
              onClick={() => setModalAbierto(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 shadow-xs hover:shadow transition-all cursor-pointer"
            >
              <Upload className="size-3.5" />
              <span>Adjuntar Retroalimentación / Pauta</span>
            </button>
          )}
        </div>
      </div>

      {/* Vista 1: Detalle del Estudiante Seleccionado con Attachment */}
      {estudianteSeleccionado ? (
        <div className="space-y-4">
          <div className="bg-slate-50 rounded-2xl border border-slate-200/90 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                <User className="size-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">{estudianteSeleccionado.nombre}</h3>
                <p className="text-xs text-slate-500">
                  {estudianteSeleccionado.correo} • {estudianteSeleccionado.carrera}
                </p>
              </div>
            </div>

            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-sky-50 text-sky-800 border border-sky-200/70 w-fit">
              {documentos.length} {documentos.length === 1 ? "archivo registrado" : "archivos registrados"}
            </span>
          </div>

          {cargando ? (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <RefreshCw className="size-7 text-sky-600 animate-spin mb-2" />
              <p className="text-sm font-medium text-slate-500">Cargando evidencias del estudiante...</p>
            </div>
          ) : documentos.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center flex flex-col items-center justify-center">
              <FolderOpen className="size-10 text-slate-300 mb-2" />
              <h4 className="text-base font-bold text-slate-800 mb-1">
                El estudiante aún no ha subido evidencias
              </h4>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mb-4">
                Cuando el estudiante cargue sus reflexiones o informes pedagógicos, aparecerán aquí para tu supervisión.
              </p>
              {puedeSubir && (
                <button
                  type="button"
                  onClick={() => setModalAbierto(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 cursor-pointer"
                >
                  <Upload className="size-3.5" />
                  <span>Subir pauta o documento docente</span>
                </button>
              )}
            </div>
          ) : (
            <AttachmentGroup className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {documentos.map((doc) => (
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
                        <span className="text-slate-600 truncate max-w-[120px]">
                          Por: {doc.subidoPorNombre}
                        </span>
                      </AttachmentDescription>
                    </AttachmentContent>
                  </div>

                  <AttachmentActions className="gap-1 shrink-0 ml-2">
                    <AttachmentAction
                      onClick={() => window.open(doc.urlDescarga, "_blank")}
                      title="Descargar evidencia"
                      className="hover:bg-sky-50 hover:text-sky-700 text-slate-600 rounded-lg"
                    >
                      <Download className="size-3.5" />
                    </AttachmentAction>

                    {puedeSubir && (
                      <AttachmentAction
                        onClick={() => handleEliminar(doc.idDocumento, doc.nombre)}
                        title="Eliminar archivo"
                        className="hover:bg-rose-50 hover:text-rose-600 text-slate-400 rounded-lg"
                      >
                        <Trash2 className="size-3.5" />
                      </AttachmentAction>
                    )}
                  </AttachmentActions>
                </Attachment>
              ))}
            </AttachmentGroup>
          )}

          {/* Modal para adjuntar al estudiante seleccionado */}
          <FileUploadModal
            isOpen={modalAbierto}
            onClose={() => setModalAbierto(false)}
            title={`Adjuntar archivo a portafolio de ${estudianteSeleccionado.nombre}`}
            description="Puedes subir pautas de evaluación, observaciones o material complementario (Límite: 20 MB)."
            endpoint="/api/portafolio/subir"
            additionalData={{
              rutEstudiante: estudianteSeleccionado.rut,
              tipo: "RETROALIMENTACION",
              rutUsuarioSubio: user?.rut,
            }}
            allowedExtensions={[".pdf", ".docx", ".doc", ".pptx", ".ppt", ".xlsx", ".xls", ".zip", ".png", ".jpg", ".jpeg"]}
            maxSizeMB={20}
            onSuccess={() => {
              cargarDocumentosEstudiante(estudianteSeleccionado.rut);
              cargarEstudiantes();
            }}
          />
        </div>
      ) : (
        /* Vista 2: Lista de Estudiantes para Selección */
        <div className="space-y-4">
          {/* Barra de Búsqueda */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="size-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nombre, RUT o carrera..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all"
              />
            </div>
            <div className="text-xs font-semibold text-slate-500 shrink-0">
              Total: <strong className="text-slate-800">{estudiantesFiltrados.length}</strong> estudiantes
            </div>
          </div>

          {/* Tarjetas de Estudiantes */}
          {cargando ? (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <RefreshCw className="size-7 text-sky-600 animate-spin mb-2" />
              <p className="text-sm font-medium text-slate-500">Cargando lista de estudiantes...</p>
            </div>
          ) : estudiantesFiltrados.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
              No se encontraron estudiantes para los criterios ingresados.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {estudiantesFiltrados.map((est) => (
                <div
                  key={est.rut}
                  onClick={() => setEstudianteSeleccionado(est)}
                  className="bg-white rounded-xl border border-slate-200 hover:border-sky-300 hover:shadow-xs p-4 transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="size-9 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center font-bold">
                          <User className="size-4" />
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-sky-700 transition-colors line-clamp-1">
                            {est.nombre}
                          </h4>
                          <p className="text-[11px] text-slate-500">{est.rut}</p>
                        </div>
                      </div>

                      <ChevronRight className="size-4 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-0.5 transition-all" />
                    </div>

                    <p className="text-xs text-slate-600 mb-3">{est.carrera}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-700">
                      {est.totalArchivos} {est.totalArchivos === 1 ? "archivo" : "archivos"}
                    </span>
                    <span>{formatearFecha(est.ultimaActualizacion)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
