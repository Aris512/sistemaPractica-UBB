import { ClipboardCheck, ArrowLeft } from "lucide-react";

interface EvaluacionesProps {
  onBack?: () => void;
}

export function Evaluaciones({ onBack }: EvaluacionesProps) {
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
          <ClipboardCheck className="size-8" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3 tracking-tight">
          Evaluaciones
        </h1>

        <p className="text-slate-600 max-w-lg text-sm sm:text-base leading-relaxed mb-6">
          Espacio destinado a recibir, consultar y leer las evaluaciones, pautas de cotejo y rúbricas aplicadas por tus profesores guías y supervisores de práctica.
        </p>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
          <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
          Módulo en desarrollo
        </span>
      </div>
    </div>
  );
}
