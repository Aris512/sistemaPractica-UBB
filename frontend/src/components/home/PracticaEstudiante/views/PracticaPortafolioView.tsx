import { useState } from "react";
import type { UserSession } from "@/types/auth";
import type { DatosPracticaEstudiante, PracticaMenuKey } from "../types";
import {
  FileText,
  Image as ImageIcon,
  Download,
  Upload,
  FolderOpen,
  ClipboardCheck,
  MessageSquareText,
  RefreshCw,
} from "lucide-react";
import { FileUploadModal } from "@/components/ui/FileUploadModal";
import { sileo } from "sileo";

interface PracticaPortafolioViewProps {
  user: UserSession;
  datos: DatosPracticaEstudiante;
  onNavigate: (menu: PracticaMenuKey) => void;
  onReload?: () => void | Promise<void>;
}

type TabPortafolio = "todos" | "documentos" | "evidencias" | "evaluaciones" | "observaciones";

export function PracticaPortafolioView({
  user,
  datos,
  onNavigate,
  onReload,
}: PracticaPortafolioViewProps) {
  const [modalSubidaAbierto, setModalSubidaAbierto] = useState(false);
  const [tabActiva, setTabActiva] = useState<TabPortafolio>("todos");
  const [recargando, setRecargando] = useState(false);

  const evidencias = datos.documentos.filter((d) => d.categoria === "Evidencias");
  const otrosDocs = datos.documentos.filter((d) => d.categoria !== "Evidencias");

  const getInitials = (nombre: string) => {
    return nombre
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0].toUpperCase())
      .join("");
  };

  const handleDescargar = (doc: { nombre: string; urlDescarga?: string | null }) => {
    if (doc.urlDescarga) {
      window.open(doc.urlDescarga, "_blank");
    } else {
      sileo.info({
        title: "Descarga iniciada",
        description: `Descargando archivo «${doc.nombre}».`,
      });
    }
  };

  const handleRecargar = async () => {
    if (!onReload) return;
    setRecargando(true);
    try {
      await onReload();
      sileo.success({
        title: "Portafolio sincronizado",
        description: "Se han actualizado los archivos y registros de tu práctica.",
      });
    } catch {
      sileo.error({
        title: "Error de sincronización",
        description: "No se pudieron recargar los datos del portafolio.",
      });
    } finally {
      setRecargando(false);
    }
  };

  const tabsConfig: { key: TabPortafolio; label: string; count: number }[] = [
    {
      key: "todos",
      label: "Todos",
      count: datos.documentos.length + datos.evaluaciones.length + datos.observacionesGenerales.length,
    },
    { key: "documentos", label: "Documentos", count: otrosDocs.length },
    { key: "evidencias", label: "Evidencias", count: evidencias.length },
    { key: "evaluaciones", label: "Evaluaciones", count: datos.evaluaciones.length },
    { key: "observaciones", label: "Observaciones", count: datos.observacionesGenerales.length },
  ];

  return (
    <div className="space-y-6">
      {/* Modal de subida de evidencias al portafolio */}
      <FileUploadModal
        isOpen={modalSubidaAbierto}
        onClose={() => setModalSubidaAbierto(false)}
        endpoint="/api/portafolio/subir"
        title="Subir Archivo al Portafolio"
        description="Formatos permitidos: PDF, Word, Excel, PowerPoint, JPG, PNG (máx. 20 MB)."
        showCategorySelect={true}
        categoryOptions={["Documento", "Evidencia", "Informe", "Otro"]}
        defaultCategory="Evidencia"
        additionalData={{
          rutEstudiante: user.rut,
          rutUsuarioSubio: user.rut,
        }}
        onSuccess={() => {
          setModalSubidaAbierto(false);
          sileo.success({
            title: "Evidencia guardada",
            description: "El archivo ha sido agregado exitosamente a tu portafolio.",
          });
          onReload?.();
        }}
      />

      {/* 1. Tarjeta de Perfil y Ficha de Práctica */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="size-16 rounded-2xl bg-sky-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-xs">
              {getInitials(`${user.nombre} ${user.apellido || ""}`)}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {user.nombre} {user.apellido || ""}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                {datos.asignaturaNombre || "Práctica Profesional"} · {datos.semestre}.º Semestre
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRecargar}
              disabled={recargando}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer disabled:opacity-50"
              title="Sincronizar datos del portafolio"
            >
              <RefreshCw className={`size-4 ${recargando ? "animate-spin text-sky-600" : ""}`} />
            </button>
            <button
              type="button"
              onClick={() => setModalSubidaAbierto(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 shadow-xs hover:shadow transition-all cursor-pointer"
            >
              <Upload className="size-3.5" />
              <span>Subir Evidencia</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Barra de Filtros de Contenido con Conteos Dinámicos */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {tabsConfig.map((t) => {
          const isActive = tabActiva === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTabActiva(t.key)}
              className={`px-3.5 py-1.5 rounded-full font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap shadow-2xs ${
                isActive
                  ? "bg-sky-600 text-white border border-sky-600"
                  : "bg-white text-slate-700 border border-slate-200 hover:border-sky-400 hover:text-sky-700"
              }`}
            >
              <span>{t.label}</span>
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Sección: Documentos Oficiales */}
      {(tabActiva === "todos" || tabActiva === "documentos") && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="size-4.5 text-sky-600" />
                <span>Documentos Oficiales del Portafolio</span>
              </h2>
              <p className="text-xs text-slate-500">
                Convenios, cartas de aceptación e informes clave
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("documentos")}
              className="text-xs font-bold text-sky-700 hover:underline cursor-pointer"
            >
              Ver todos los documentos
            </button>
          </div>

          {otrosDocs.length === 0 ? (
            <div className="py-8 border border-dashed border-slate-200 rounded-xl text-center flex flex-col items-center justify-center">
              <FileText className="size-6 text-slate-300 mb-1" />
              <p className="text-xs font-semibold text-slate-600">No hay documentos oficiales registrados</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {otrosDocs.slice(0, 6).map((doc) => (
                <div
                  key={doc.id}
                  className="py-3 flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="size-9 rounded-lg bg-sky-50 text-sky-700 text-[11px] font-extrabold flex items-center justify-center shrink-0 uppercase">
                      {doc.ext}
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-slate-900 truncate">
                        {doc.nombre}
                      </h3>
                      <p className="text-xs text-slate-400 flex items-center gap-1.5 flex-wrap">
                        <span>{doc.tamanio}</span>
                        <span>•</span>
                        <span>{doc.fecha}</span>
                        <span>•</span>
                        <span>Subido por <strong>{doc.subidoPor}</strong></span>
                        {!doc.esPropio && (
                          <span className="text-[10.5px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-semibold border border-amber-200/60">
                            Docente
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDescargar(doc)}
                    className="p-2 rounded-lg text-slate-500 hover:text-sky-700 hover:bg-sky-50 transition-colors cursor-pointer"
                    title="Descargar archivo"
                  >
                    <Download className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. Sección: Mosaico de Evidencias */}
      {(tabActiva === "todos" || tabActiva === "evidencias") && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ImageIcon className="size-4.5 text-indigo-600" />
                <span>Evidencias Pedagógicas</span>
              </h2>
              <p className="text-xs text-slate-500">
                Registros visuales de actividades, talleres y materiales de aula
              </p>
            </div>
            <button
              type="button"
              onClick={() => setModalSubidaAbierto(true)}
              className="text-xs font-bold text-sky-700 hover:underline cursor-pointer"
            >
              + Subir evidencia
            </button>
          </div>

          {evidencias.length === 0 ? (
            <div className="py-12 border border-dashed border-slate-200 rounded-xl text-center flex flex-col items-center justify-center">
              <FolderOpen className="size-8 text-slate-400 mb-2" />
              <p className="text-sm font-semibold text-slate-700">Aún no hay evidencias registradas</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Sube fotografías de clases, planificaciones o material didáctico elaborado durante tu práctica.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {evidencias.map((evi) => (
                <div
                  key={evi.id}
                  className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 hover:border-sky-300 hover:shadow-xs transition-all flex flex-col"
                >
                  <div className="h-28 bg-gradient-to-br from-sky-100 to-indigo-100 flex items-center justify-center text-sky-700">
                    <ImageIcon className="size-8 opacity-80" />
                  </div>
                  <div className="p-3 bg-white flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 truncate" title={evi.nombre}>
                        {evi.nombre}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">{evi.fecha}</p>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 truncate" title={evi.subidoPor}>
                        {evi.subidoPor}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDescargar(evi)}
                        className="text-sky-600 hover:text-sky-800 cursor-pointer"
                        title="Descargar"
                      >
                        <Download className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. Sección: Evaluaciones del Portafolio */}
      {(tabActiva === "todos" || tabActiva === "evaluaciones") && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ClipboardCheck className="size-4.5 text-emerald-600" />
                <span>Evaluaciones de Práctica</span>
              </h2>
              <p className="text-xs text-slate-500">
                Pautas de evaluación, notas e informes de retroalimentación docente
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("evaluaciones")}
              className="text-xs font-bold text-sky-700 hover:underline cursor-pointer"
            >
              Ver todas las evaluaciones
            </button>
          </div>

          {datos.evaluaciones.length === 0 ? (
            <div className="py-8 border border-dashed border-slate-200 rounded-xl text-center flex flex-col items-center justify-center">
              <ClipboardCheck className="size-6 text-slate-300 mb-1" />
              <p className="text-xs font-semibold text-slate-600">Aún no hay evaluaciones registradas</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Las evaluaciones aparecerán cuando el profesor o tutor las registre en la plataforma.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {datos.evaluaciones.map((ev) => (
                <div key={ev.id} className="py-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-slate-900 truncate">
                        {ev.titulo}
                      </h3>
                      <span
                        className={`text-[10.5px] px-2 py-0.5 rounded-full font-bold ${
                          ev.estado === "CALIFICADA"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                            : "bg-amber-50 text-amber-700 border border-amber-200/60"
                        }`}
                      >
                        {ev.estado === "CALIFICADA" ? "Calificada" : "Pendiente"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                      <span>Evaluador: <strong>{ev.evaluador}</strong></span>
                      <span>•</span>
                      <span>{ev.fecha}</span>
                      {ev.observaciones.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-slate-500 font-medium">
                            {ev.observaciones.length} observación{ev.observaciones.length !== 1 ? "es" : ""}
                          </span>
                        </>
                      )}
                    </p>
                  </div>

                  {ev.nota && (
                    <div className="text-right shrink-0">
                      <span className="text-xs text-slate-400 block font-medium">Nota</span>
                      <span className="text-base font-extrabold text-emerald-700">{ev.nota}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6. Sección: Observaciones del Portafolio */}
      {(tabActiva === "todos" || tabActiva === "observaciones") && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MessageSquareText className="size-4.5 text-indigo-600" />
                <span>Observaciones Pedagógicas</span>
              </h2>
              <p className="text-xs text-slate-500">
                Comentarios y reflexiones formativas de profesores y tutores
              </p>
            </div>
          </div>

          {datos.observacionesGenerales.length === 0 ? (
            <div className="py-8 border border-dashed border-slate-200 rounded-xl text-center flex flex-col items-center justify-center">
              <MessageSquareText className="size-6 text-slate-300 mb-1" />
              <p className="text-xs font-semibold text-slate-600">No hay observaciones registradas</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Las observaciones emitidas por tu tutor o profesor se mostrarán aquí.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {datos.observacionesGenerales.map((obs) => (
                <div key={obs.id} className="py-3.5 flex items-start gap-3">
                  <div className="size-8 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0 border border-indigo-100 mt-0.5">
                    {getInitials(obs.autor)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h4 className="text-xs font-bold text-slate-900">{obs.autor}</h4>
                      <span className="text-[11px] text-slate-400">{obs.rol} · {obs.fecha}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                      {obs.texto}
                    </p>
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

