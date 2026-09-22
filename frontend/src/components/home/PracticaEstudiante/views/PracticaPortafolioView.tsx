import { useState } from "react";
import type { UserSession } from "@/types/auth";
import type { DatosPracticaEstudiante, PracticaMenuKey } from "../types";
import {
  Briefcase,
  FileText,
  Image as ImageIcon,
  Download,
  Upload,
  Clock,
  FolderOpen,
} from "lucide-react";
import { FileUploadModal } from "@/components/ui/FileUploadModal";
import { sileo } from "sileo";

interface PracticaPortafolioViewProps {
  user: UserSession;
  datos: DatosPracticaEstudiante;
  onNavigate: (menu: PracticaMenuKey) => void;
  onReload?: () => void;
}

export function PracticaPortafolioView({
  user,
  datos,
  onNavigate,
  onReload,
}: PracticaPortafolioViewProps) {
  const [modalSubidaAbierto, setModalSubidaAbierto] = useState(false);

  const horasPct = Math.min(
    100,
    Math.round((datos.horasRealizadas / datos.horasTotales) * 100)
  );

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
        title: "Descarga simulada",
        description: `Descargando archivo «${doc.nombre}».`,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Modal de subida de evidencias al portafolio */}
      <FileUploadModal
        isOpen={modalSubidaAbierto}
        onClose={() => setModalSubidaAbierto(false)}
        endpoint="/api/portafolio/subir"
        title="Subir Evidencia al Portafolio"
        description="Formatos permitidos: PDF, Word, Excel, PowerPoint, JPG, PNG (máx. 20 MB)."
        additionalData={{
          rutEstudiante: user.rut,
          tipo: "EVIDENCIA",
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
                Pedagogía en Educación Matemática · {datos.semestre}.º Semestre
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
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

        {/* Ficha de datos clave (Facts) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
          <div className="border-l-3 border-sky-400 pl-3 py-0.5">
            <dt className="text-xs text-slate-400 font-medium">RUT / Identificador</dt>
            <dd className="text-sm font-bold text-slate-800 m-0">{user.rut}</dd>
          </div>
          <div className="border-l-3 border-sky-400 pl-3 py-0.5">
            <dt className="text-xs text-slate-400 font-medium">Correo Institucional</dt>
            <dd className="text-sm font-bold text-slate-800 m-0 truncate">{user.correo}</dd>
          </div>
          <div className="border-l-3 border-sky-400 pl-3 py-0.5">
            <dt className="text-xs text-slate-400 font-medium">Centro de Práctica</dt>
            <dd className="text-sm font-bold text-slate-800 m-0">{datos.centroPractica}</dd>
          </div>
          <div className="border-l-3 border-indigo-400 pl-3 py-0.5">
            <dt className="text-xs text-slate-400 font-medium">Tutora de Práctica</dt>
            <dd className="text-sm font-bold text-slate-800 m-0">{datos.tutorNombre}</dd>
          </div>
          <div className="border-l-3 border-indigo-400 pl-3 py-0.5">
            <dt className="text-xs text-slate-400 font-medium">Profesor de Asignatura</dt>
            <dd className="text-sm font-bold text-slate-800 m-0">{datos.profesorAsignatura}</dd>
          </div>
          <div className="border-l-3 border-indigo-400 pl-3 py-0.5">
            <dt className="text-xs text-slate-400 font-medium">Profesor Colaborador</dt>
            <dd className="text-sm font-bold text-slate-800 m-0">{datos.profesorColaborador}</dd>
          </div>
        </div>

        {/* Barra de Horas de Práctica */}
        <div className="pt-2">
          <div className="flex items-center justify-between text-xs font-semibold mb-2">
            <span className="text-slate-600 flex items-center gap-1.5">
              <Clock className="size-3.5 text-sky-600" />
              <span>Horas de Práctica Acumuladas</span>
            </span>
            <span className="text-slate-900 font-bold">
              {datos.horasRealizadas} de {datos.horasTotales} horas ({horasPct}%)
            </span>
          </div>
          <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sky-600 to-indigo-600 rounded-full transition-all duration-500"
              style={{ width: `${horasPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Barra de Anclas Rápidas */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <a
          href="#p-doc"
          className="px-3.5 py-1.5 rounded-full border border-slate-200 bg-white font-semibold text-slate-700 hover:border-sky-500 hover:text-sky-700 transition-colors shadow-2xs"
        >
          Documentos ({otrosDocs.length})
        </a>
        <a
          href="#p-evi"
          className="px-3.5 py-1.5 rounded-full border border-slate-200 bg-white font-semibold text-slate-700 hover:border-sky-500 hover:text-sky-700 transition-colors shadow-2xs"
        >
          Evidencias ({evidencias.length})
        </a>
        <a
          href="#p-eva"
          className="px-3.5 py-1.5 rounded-full border border-slate-200 bg-white font-semibold text-slate-700 hover:border-sky-500 hover:text-sky-700 transition-colors shadow-2xs"
        >
          Evaluaciones ({datos.evaluaciones.length})
        </a>
        <a
          href="#p-obs"
          className="px-3.5 py-1.5 rounded-full border border-slate-200 bg-white font-semibold text-slate-700 hover:border-sky-500 hover:text-sky-700 transition-colors shadow-2xs"
        >
          Observaciones ({datos.observacionesGenerales.length})
        </a>
      </div>

      {/* 3. Sección: Documentos Recientes (#p-doc) */}
      <div id="p-doc" className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
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

        <div className="divide-y divide-slate-100">
          {otrosDocs.slice(0, 4).map((doc) => (
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
                  <p className="text-xs text-slate-400 flex items-center gap-1.5">
                    <span>{doc.tamanio}</span>
                    <span>•</span>
                    <span>{doc.fecha}</span>
                    <span>•</span>
                    <span>Subido por <strong>{doc.subidoPor}</strong></span>
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
      </div>

      {/* 4. Sección: Mosaico de Evidencias (#p-evi) */}
      <div id="p-evi" className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
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
                    <span className="text-[10px] text-slate-500 truncate">
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

      {/* 5. Sección: Evaluaciones y Calificaciones (#p-eva) */}
      <div id="p-eva" className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="size-4.5 text-emerald-600" />
              <span>Resumen de Evaluaciones</span>
            </h2>
            <p className="text-xs text-slate-500">
              Calificaciones otorgadas por profesores y tutores de práctica
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("evaluaciones")}
            className="text-xs font-bold text-sky-700 hover:underline cursor-pointer"
          >
            Ver detalle completo
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {datos.evaluaciones.map((ev) => (
            <div key={ev.id} className="py-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  {ev.titulo}
                </h3>
                <p className="text-xs text-slate-400">
                  {ev.evaluador} · {ev.fecha}
                </p>
              </div>

              {ev.nota ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                  Nota: {ev.nota}
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/70">
                  Pendiente
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 6. Sección: Observaciones Recientes (#p-obs) */}
      <div id="p-obs" className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Observaciones Recientes de Visita
            </h2>
            <p className="text-xs text-slate-500">
              Retroalimentaciones pedagógicas y notas de campo
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("evaluaciones")}
            className="text-xs font-bold text-sky-700 hover:underline cursor-pointer"
          >
            Ver todas
          </button>
        </div>

        <div className="space-y-3">
          {datos.observacionesGenerales.slice(0, 2).map((obs) => (
            <div key={obs.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-slate-900">{obs.autor}</span>
                <span className="text-slate-400">{obs.rol} · {obs.fecha}</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {obs.texto}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
