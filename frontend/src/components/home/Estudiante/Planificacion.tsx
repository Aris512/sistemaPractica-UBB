import { useState, useEffect, useCallback } from "react";
import {
  CalendarDays,
  ArrowLeft,
  Upload,
  FileText,
  Presentation,
  FileSpreadsheet,
  Layers,
  Trash2,
  Download,
  Clock,
  BookOpen,
  RefreshCw,
  FolderOpen,
} from "lucide-react";
import type { UserSession } from "@/types/auth";
import { FileUploadModal } from "@/components/ui/FileUploadModal";
import { sileo } from "sileo";

interface PlanificacionProps {
  user?: UserSession;
  onBack?: () => void;
}

interface PlanificacionItem {
  idPlanificacion: number;
  titulo: string;
  objetivo: string;
  estado: string;
  fechaCreacion: string;
  versionAutoincremental: number;
}

interface ArchivoPlanificacionDTO {
  idDocumento: number;
  nombre: string;
  tipo: "GUIA" | "RECURSO" | "POWERPOINT" | "PAUTA_EVALUACION" | string;
  ubicacion: string;
  fechaCarga: string;
  tamanio: string;
  urlDescarga: string;
}

type CategoriaArchivo = "GUIA" | "RECURSO" | "POWERPOINT" | "PAUTA_EVALUACION";

const CATEGORIAS: {
  key: CategoriaArchivo;
  label: string;
  descripcion: string;
  extensiones: string[];
  icon: any;
  colorBg: string;
  colorText: string;
  badgeBg: string;
}[] = [
    {
      key: "GUIA",
      label: "Guías Didácticas",
      descripcion: "Guías de aprendizaje, actividades prácticas y talleres para la clase.",
      extensiones: [".pdf", ".docx", ".doc", ".odt"],
      icon: FileText,
      colorBg: "bg-sky-50",
      colorText: "text-sky-700",
      badgeBg: "bg-sky-100 text-sky-800 border-sky-200",
    },
    {
      key: "RECURSO",
      label: "Recursos y Materiales",
      descripcion: "Imágenes, lecturas complementarias, audios o paquetes comprimidos.",
      extensiones: [".pdf", ".png", ".jpg", ".jpeg", ".zip", ".rar", ".docx"],
      icon: Layers,
      colorBg: "bg-indigo-50",
      colorText: "text-indigo-700",
      badgeBg: "bg-indigo-100 text-indigo-800 border-indigo-200",
    },
    {
      key: "POWERPOINT",
      label: "Presentaciones PowerPoint",
      descripcion: "Diapositivas y presentaciones estructuradas para el desarrollo de la sesión.",
      extensiones: [".pptx", ".ppt", ".pdf"],
      icon: Presentation,
      colorBg: "bg-amber-50",
      colorText: "text-amber-700",
      badgeBg: "bg-amber-100 text-amber-800 border-amber-200",
    },
    {
      key: "PAUTA_EVALUACION",
      label: "Pautas de Evaluación",
      descripcion: "Rúbricas analíticas, listas de cotejo o escalas de apreciación.",
      extensiones: [".pdf", ".docx", ".xlsx", ".xls"],
      icon: FileSpreadsheet,
      colorBg: "bg-emerald-50",
      colorText: "text-emerald-700",
      badgeBg: "bg-emerald-100 text-emerald-800 border-emerald-200",
    },
  ];

export function Planificacion({ user, onBack }: PlanificacionProps) {
  const [planificaciones, setPlanificaciones] = useState<PlanificacionItem[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<PlanificacionItem | null>(null);
  const [archivos, setArchivos] = useState<ArchivoPlanificacionDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingArchivos, setLoadingArchivos] = useState<boolean>(false);

  // Categoría seleccionada para el filtro o subida
  const [selectedCategoryForUpload, setSelectedCategoryForUpload] = useState<CategoriaArchivo>("GUIA");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);

  // Cargar las planificaciones del estudiante
  const fetchPlanificaciones = useCallback(async () => {
    if (!user?.rut) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/planificaciones/estudiante/${encodeURIComponent(user.rut)}`);
      if (res.ok) {
        const data: PlanificacionItem[] = await res.json();
        setPlanificaciones(data);
        if (data.length > 0) {
          const first = data[0];
          setSelectedPlan(first);
          fetchArchivos(first.idPlanificacion);
        }
      }
    } catch (err) {
      console.warn("Error al cargar planificaciones:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.rut]);

  // Cargar los archivos adjuntos a la planificación seleccionada
  const fetchArchivos = async (idPlanificacion: number) => {
    setLoadingArchivos(true);
    try {
      const res = await fetch(`/api/planificaciones/${idPlanificacion}/archivos`);
      if (res.ok) {
        const data: ArchivoPlanificacionDTO[] = await res.json();
        setArchivos(data);
      }
    } catch (err) {
      console.warn("Error al obtener archivos de planificación:", err);
    } finally {
      setLoadingArchivos(false);
    }
  };

  useEffect(() => {
    fetchPlanificaciones();
  }, [fetchPlanificaciones]);

  const handleSelectPlan = (plan: PlanificacionItem) => {
    setSelectedPlan(plan);
    fetchArchivos(plan.idPlanificacion);
  };

  const handleOpenUploadForCategory = (cat: CategoriaArchivo) => {
    setSelectedCategoryForUpload(cat);
    setIsUploadModalOpen(true);
  };

  const handleDeleteArchivo = async (idDocumento: number, nombre: string) => {
    if (!selectedPlan) return;
    if (!window.confirm(`¿Estás seguro de que deseas eliminar el archivo "${nombre}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/planificaciones/${selectedPlan.idPlanificacion}/archivos/${idDocumento}`, {
        method: "DELETE",
      });
      if (res.ok) {
        sileo.success({
          title: "Archivo eliminado",
          description: `Se eliminó "${nombre}" de la planificación.`,
        });
        fetchArchivos(selectedPlan.idPlanificacion);
      } else {
        sileo.error({
          title: "Error",
          description: "No se pudo eliminar el archivo adjunto.",
        });
      }
    } catch (err) {
      sileo.error({
        title: "Error de red",
        description: "No se pudo conectar con el servidor.",
      });
    }
  };

  const activeCategoryMeta = CATEGORIAS.find((c) => c.key === selectedCategoryForUpload) || CATEGORIAS[0];

  return (
    <div className="max-w-6xl mx-auto py-2 space-y-6">
      {/* Botón Volver */}
      {onBack && (
        <div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-sky-800 bg-sky-50 hover:bg-sky-100/80 border border-sky-200 transition-colors cursor-pointer"
          >
            <ArrowLeft className="size-3.5" />
            <span>Volver al Inicio</span>
          </button>
        </div>
      )}

      {/* Encabezado Principal */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shadow-2xs shrink-0">
              <CalendarDays className="size-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Planificación Didáctica Multi-Archivo
                </h1>
              </div>
              <p className="text-slate-600 text-xs sm:text-sm mt-1">
                Adjunta en conjunto todos los recursos pedagógicos de tu planificación: guías didácticas, presentaciones PowerPoint, pautas y materiales complementarios.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchPlanificaciones}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer self-start sm:self-auto"
            title="Actualizar datos"
          >
            <RefreshCw className={`size-3.5 ${loading || loadingArchivos ? "animate-spin" : ""}`} />
            <span>Actualizar</span>
          </button>

        </div>
      </div>

      {/* Selector de Planificaciones */}
      {planificaciones.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {planificaciones.map((plan) => {
            const isSelected = selectedPlan?.idPlanificacion === plan.idPlanificacion;
            return (
              <button
                key={plan.idPlanificacion}
                onClick={() => handleSelectPlan(plan)}
                className={`px-4 py-2.5 rounded-xl text-left border transition-all shrink-0 cursor-pointer ${isSelected
                  ? "bg-sky-600 border-sky-600 text-white font-bold shadow-xs"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
              >
                <p className="text-xs truncate max-w-[200px]">{plan.titulo}</p>
                <p className={`text-[10px] ${isSelected ? "text-sky-100" : "text-slate-400"}`}>
                  Versión {plan.versionAutoincremental} • {plan.estado}
                </p>
              </button>
            );
          })}
        </div>
      )}

      {/* Tarjeta de Detalle de la Planificación Actual */}
      {selectedPlan && (
        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="size-4.5 text-sky-400" />
              <h2 className="text-base sm:text-lg font-bold text-white">{selectedPlan.titulo}</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                Versión {selectedPlan.versionAutoincremental}
              </span>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                {selectedPlan.estado}
              </span>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {selectedPlan.objetivo || "Diseño y estructura de la sesión de práctica pedagógica."}
          </p>
          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <span>{archivos.length} archivos adjuntos en total</span>
          </div>
        </div>
      )}

      {/* Secciones por Categoría de Archivos (Guías, Recursos, PPT, Pautas) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {CATEGORIAS.map((cat) => {
          const IconComponent = cat.icon;
          const archivosDeCategoria = archivos.filter((a) => a.tipo === cat.key);

          return (
            <div
              key={cat.key}
              className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between"
            >
              <div>
                {/* Cabecera de la Categoría */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`size-10 rounded-xl ${cat.colorBg} ${cat.colorText} flex items-center justify-center font-bold`}>
                      <IconComponent className="size-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{cat.label}</h3>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{cat.descripcion}</p>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {archivosDeCategoria.length} {archivosDeCategoria.length === 1 ? "archivo" : "archivos"}
                  </span>
                </div>

                {/* Lista de Archivos Adjuntos en esta Categoría */}
                <div className="space-y-2 my-4 min-h-[90px]">
                  {archivosDeCategoria.length === 0 ? (
                    <div className="h-full py-4 border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-center p-3 bg-slate-50/50">
                      <FolderOpen className="size-6 text-slate-300 mb-1" />
                      <p className="text-xs text-slate-400 font-medium">Aún no hay {cat.label.toLowerCase()} adjuntas.</p>
                      <p className="text-[10px] text-slate-400">Formatos permitidos: {cat.extensiones.join(", ")}</p>
                    </div>
                  ) : (
                    archivosDeCategoria.map((arch) => (
                      <div
                        key={arch.idDocumento}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100/70 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <IconComponent className={`size-4 ${cat.colorText} shrink-0`} />
                          <div className="overflow-hidden">
                            <p className="text-xs font-semibold text-slate-800 truncate max-w-[180px] sm:max-w-[240px]" title={arch.nombre}>
                              {arch.nombre}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {arch.tamanio || "—"} • {arch.fechaCarga ? new Date(arch.fechaCarga).toLocaleDateString("es-CL") : ""}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {/* Botón Descargar */}
                          <a
                            href={arch.urlDescarga}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                            title="Descargar archivo"
                          >
                            <Download className="size-3.5" />
                          </a>

                          {/* Botón Eliminar */}
                          <button
                            type="button"
                            onClick={() => handleDeleteArchivo(arch.idDocumento, arch.nombre)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Eliminar de la planificación"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Botón con Icono para Adjuntar Archivo a esta Categoría */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium">
                  Límite máximo: <strong>20 MB</strong>
                </span>

                <button
                  type="button"
                  onClick={() => handleOpenUploadForCategory(cat.key)}
                  disabled={!selectedPlan}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Upload className="size-3" />
                  <span>Adjuntar {cat.label.split(" ")[0]}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Reutilizable de Carga (DRY) */}
      {selectedPlan && (
        <FileUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          title={`Adjuntar ${activeCategoryMeta.label}`}
          description={`Adjuntando a "${selectedPlan.titulo}". Límite: 20 MB • Formatos: ${activeCategoryMeta.extensiones.join(", ")}`}
          endpoint={`/api/planificaciones/${selectedPlan.idPlanificacion}/archivos`}
          additionalData={{
            tipo: selectedCategoryForUpload,
            rutUsuario: user?.rut,
          }}
          maxSizeMB={20}
          allowedExtensions={activeCategoryMeta.extensiones}
          onSuccess={() => {
            fetchArchivos(selectedPlan.idPlanificacion);
          }}
        />
      )}
    </div>
  );
}
