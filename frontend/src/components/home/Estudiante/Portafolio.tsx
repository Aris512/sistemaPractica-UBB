import { Briefcase, ArrowLeft, Upload, Lock } from "lucide-react";
import { sileo } from "sileo";
import type { UserSession } from "@/types/auth";
import { usePermissions } from "@/hooks/usePermissions";

interface PortafolioProps {
  user?: UserSession;
  onBack?: () => void;
}

export function Portafolio({ user, onBack }: PortafolioProps) {
  const { hasPermission } = usePermissions(user);
  const puedeSubir = hasPermission("PORTAFOLIO_SUBIR");

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
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

      <div className="bg-white rounded-2xl border border-slate-200/90 p-8 sm:p-12 shadow-xs flex flex-col items-center text-center">
        <div className="size-16 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 mb-5 shadow-2xs">
          <Briefcase className="size-8" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3 tracking-tight">
          Portafolio
        </h1>

        <p className="text-slate-600 max-w-lg text-sm sm:text-base leading-relaxed mb-6">
          Espacio para recopilar, organizar y presentar evidencias de aprendizaje, reflexiones pedagógicas y el registro del proceso formativo durante la práctica docente.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
            <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
            Módulo en desarrollo
          </span>

          {puedeSubir ? (
            <button
              type="button"
              onClick={() =>
                sileo.info({
                  title: "Subir archivos al portafolio",
                  description: "La funcionalidad de carga de archivos se habilitará próximamente.",
                })
              }
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 cursor-pointer transition-colors"
            >
              <Upload className="size-3.5" />
              <span>Subir documento (Permitido)</span>
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
              <Lock className="size-3 text-slate-400" />
              <span>Subida de archivos deshabilitada para tu rol</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
