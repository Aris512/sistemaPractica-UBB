import type { CourseItem, ModalType } from "./types";
import { GraduationCap, Mail, PenTool, Calendar } from "lucide-react";

interface CourseCardProps {
  course: CourseItem;
  onOpenModal: (course: CourseItem, type: ModalType) => void;
}

export function CourseCard({ course, onOpenModal }: CourseCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs hover:shadow-sm transition-all overflow-hidden p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5 group hover:border-slate-300">
      {/* Lado Izquierdo: Birrete + Título y Metadatos */}
      <div className="flex items-start gap-4 flex-1">
        <div className="size-11 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-emerald-100 transition-colors">
          <GraduationCap className="size-6" />
        </div>

        <div className="space-y-2 flex-1">
          {/* Título del curso */}
          <button
            onClick={() => onOpenModal(course, "detalle")}
            className="text-left font-bold text-base sm:text-lg text-[#0f4c81] hover:text-sky-600 transition-colors leading-snug cursor-pointer"
          >
            {course.nombre}
          </button>

          {/* Metadatos en dos columnas limpias */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-600">
            <div className="space-y-1">
              <p className="flex items-center gap-1.5">
                <span className="text-slate-400 font-bold">&gt;</span>
                <span className="font-semibold text-slate-700">Coordinador:</span>
                <span className="text-slate-600 truncate">{course.coordinador}</span>
              </p>
              <p className="flex items-center gap-1.5">
                <span className="text-slate-400 font-bold">&gt;</span>
                <span className="font-semibold text-slate-700">Código:</span>
                <span className="font-mono text-slate-600">{course.codigo}</span>
              </p>
            </div>

            <div className="space-y-1">
              <p className="flex items-center gap-1.5">
                <span className="text-slate-400 font-bold">&gt;</span>
                <span className="font-semibold text-slate-700">Participantes:</span>
                <span className="text-slate-600">{course.participantes}</span>
              </p>
              <p className="flex items-center gap-1.5">
                <span className="text-slate-400 font-bold">&gt;</span>
                <span className="font-semibold text-slate-700">Sede:</span>
                <span className="text-slate-600">{course.sede}</span>
                <span className="text-slate-300">•</span>
                <span className="font-semibold text-slate-700">Periodo:</span>
                <span className="text-slate-600">{course.periodo}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lado Derecho: Botones de Avisos, Actividades y Próximas */}
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
        {/* Botón: Avisos (Ámbar) */}
        <button
          onClick={() => onOpenModal(course, "avisos")}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg bg-[#e89100] hover:bg-[#d48200] active:scale-98 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer min-w-[125px]"
        >
          <Mail className="size-4 shrink-0" />
          <span>{course.avisos} {course.avisos === 1 ? "aviso" : "avisos"}</span>
        </button>

        {/* Botón: Nuevas Actividades (Celeste) */}
        <button
          onClick={() => onOpenModal(course, "actividades")}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg bg-[#2596be] hover:bg-[#1f83a6] active:scale-98 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer min-w-[145px]"
        >
          <PenTool className="size-4 shrink-0" />
          <span>{course.actividades} actividades</span>
        </button>

        {/* Botón: Actividades Próximas (Teal) */}
        <button
          onClick={() => onOpenModal(course, "proximas")}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg bg-[#008b8b] hover:bg-[#007878] active:scale-98 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer min-w-[125px]"
        >
          <Calendar className="size-4 shrink-0" />
          <span>{course.proximas} próximas</span>
        </button>
      </div>
    </div>
  );
}
