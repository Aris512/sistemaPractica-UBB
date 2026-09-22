import type { UserSession } from "@/types/auth";
import type { DatosPracticaEstudiante, PracticaMenuKey } from "../types";
import {
  FileText,
  Image as ImageIcon,
  ClipboardCheck,
  MessageSquareText,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Building2,
  Upload,
  Calendar,
} from "lucide-react";

interface PracticaInicioViewProps {
  user: UserSession;
  datos: DatosPracticaEstudiante;
  onNavigate: (menu: PracticaMenuKey) => void;
}

export function PracticaInicioView({
  user,
  datos,
  onNavigate,
}: PracticaInicioViewProps) {
  const docsCount = datos.documentos.filter((d) => d.categoria === "Documentos").length;
  const evidCount = datos.documentos.filter((d) => d.categoria === "Evidencias").length;
  const evalsCalificadas = datos.evaluaciones.filter((e) => e.nota !== null).length;
  const evalsTotal = datos.evaluaciones.length;
  const obsCount = datos.observacionesGenerales.length;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0].toUpperCase())
      .join("");
  };

  return (
    <div className="space-y-6">
      {/* 1. Hero Card: Estado de la Práctica y Ruta de Etapas */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-200/60 mb-2.5">
              <span className="size-2 rounded-full bg-sky-600 animate-pulse" />
              <span>Proceso de {datos.asignaturaNombre} ({datos.semestre}.º Semestre)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Hola, {user.nombre}. Vas en la etapa de seguimiento.
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1.5 flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-800">{datos.asignaturaNombre} ({datos.codigoAsignatura})</span>
              <span className="text-slate-300">•</span>
              <span className="inline-flex items-center gap-1">
                <Building2 className="size-3.5 text-slate-400" />
                {datos.centroPractica}
              </span>
              <span className="text-slate-300">•</span>
              <span className="inline-flex items-center gap-1">
                <Calendar className="size-3.5 text-slate-400" />
                {datos.periodo}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-3 self-start lg:self-center shrink-0">
            <button
              type="button"
              onClick={() => onNavigate("portafolio")}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 shadow-xs hover:shadow transition-all cursor-pointer"
            >
              <span>Ver mi Portafolio</span>
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Stepper / Ruta de Etapas de la Práctica */}
        <div className="pt-6">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
            Ruta de la Práctica Profesional
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {datos.etapas.map((etapa, idx) => {
              const isDone = etapa.estado === "done";
              const isCur = etapa.estado === "cur";

              return (
                <div
                  key={etapa.id}
                  className={`relative p-4 rounded-xl border transition-all ${
                    isCur
                      ? "bg-sky-50/70 border-sky-300 ring-2 ring-sky-500/20 shadow-xs"
                      : isDone
                      ? "bg-slate-50/80 border-slate-200"
                      : "bg-white border-dashed border-slate-200 opacity-75"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-bold text-slate-400">
                      Paso 0{idx + 1}
                    </span>
                    {isDone && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                        <CheckCircle2 className="size-3" />
                        Completada
                      </span>
                    )}
                    {isCur && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full">
                        <Clock className="size-3 animate-spin" />
                        En curso
                      </span>
                    )}
                    {etapa.estado === "pending" && (
                      <span className="text-[11px] font-semibold text-slate-400">
                        Pendiente
                      </span>
                    )}
                  </div>

                  <h3 className={`text-sm font-bold leading-tight ${isCur ? "text-sky-900" : "text-slate-900"}`}>
                    {etapa.titulo}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {etapa.subtitulo}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Estadísticas / Cards interactivas rápidas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Documentos */}
        <button
          type="button"
          onClick={() => onNavigate("documentos")}
          className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-sky-300 hover:shadow-sm transition-all text-left group cursor-pointer"
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="size-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:bg-sky-600 group-hover:text-white transition-colors">
              <FileText className="size-5" />
            </span>
            <span className="text-[11px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full">
              Ver todos
            </span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {docsCount}
          </div>
          <div className="text-xs font-medium text-slate-500 mt-0.5 flex items-center gap-1">
            <span>Documentos del Proceso</span>
          </div>
        </button>

        {/* Evidencias */}
        <button
          type="button"
          onClick={() => onNavigate("portafolio")}
          className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-sky-300 hover:shadow-sm transition-all text-left group cursor-pointer"
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="size-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <ImageIcon className="size-5" />
            </span>
            <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
              Portafolio
            </span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {evidCount}
          </div>
          <div className="text-xs font-medium text-slate-500 mt-0.5 flex items-center gap-1">
            <span>Evidencias Subidas</span>
          </div>
        </button>

        {/* Evaluaciones */}
        <button
          type="button"
          onClick={() => onNavigate("evaluaciones")}
          className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-sky-300 hover:shadow-sm transition-all text-left group cursor-pointer"
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="size-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <ClipboardCheck className="size-5" />
            </span>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              Notas
            </span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {evalsCalificadas} / {evalsTotal}
          </div>
          <div className="text-xs font-medium text-slate-500 mt-0.5 flex items-center gap-1">
            <span>Evaluaciones Calificadas</span>
          </div>
        </button>

        {/* Observaciones */}
        <button
          type="button"
          onClick={() => onNavigate("evaluaciones")}
          className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-sky-300 hover:shadow-sm transition-all text-left group cursor-pointer"
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="size-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <MessageSquareText className="size-5" />
            </span>
            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
              Docentes
            </span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {obsCount}
          </div>
          <div className="text-xs font-medium text-slate-500 mt-0.5 flex items-center gap-1">
            <span>Observaciones y Visitas</span>
          </div>
        </button>
      </div>

      {/* 3. Grid de 2 Columnas: Pendientes + Equipo de Práctica */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda: Pendientes para ti (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <AlertCircle className="size-4.5 text-amber-500" />
                  <span>Pendientes para ti</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Tareas y entregas prioritarias para tu avance en práctica
                </p>
              </div>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/70">
                {datos.pendientes.length} pendientes
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {datos.pendientes.map((p) => (
                <div key={p.id} className="py-3.5 flex items-center justify-between gap-3 group">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 group-hover:text-sky-700 transition-colors">
                      {p.titulo}
                    </p>
                    {p.fechaLimite && (
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Clock className="size-3 text-slate-400" />
                        <span>{p.fechaLimite}</span>
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate(p.menuDestino)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200/60 transition-colors cursor-pointer shrink-0"
                  >
                    <span>Abrir</span>
                    <ArrowRight className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Equipo de Práctica (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Equipo de Práctica
                </h2>
                <p className="text-xs text-slate-500">
                  Acompañamiento docente y en centro
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate("equipo")}
                className="text-xs font-bold text-sky-700 hover:underline cursor-pointer"
              >
                Ver contactos
              </button>
            </div>

            <div className="space-y-3">
              {datos.equipo.slice(1, 4).map((p) => (
                <div key={p.nombre} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="size-9 rounded-full bg-sky-100 text-sky-800 font-bold text-xs flex items-center justify-center shrink-0 border border-sky-200/80">
                    {getInitials(p.nombre)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xs font-bold text-slate-900 truncate">
                      {p.nombre}
                    </h3>
                    <p className="text-[11px] text-slate-500 truncate">
                      {p.rol}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Centro: <strong>{datos.centroPractica}</strong></span>
          </div>
        </div>
      </div>

      {/* 4. Actividad Reciente */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 mb-4">
          Actividad Reciente
        </h2>
        <div className="divide-y divide-slate-100">
          {datos.actividades.map((act) => (
            <div key={act.id} className="py-3 flex items-start gap-3">
              <div className="size-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 mt-0.5">
                {act.tipo === "up" ? (
                  <Upload className="size-4" />
                ) : (
                  <FileText className="size-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800">
                  {act.descripcion}
                </p>
                <span className="text-xs text-slate-400 mt-0.5 block">
                  {act.tiempo}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
