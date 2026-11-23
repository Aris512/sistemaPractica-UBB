import { Lock } from "lucide-react";

/** Aviso que reemplaza una vista cuando el rol del usuario no tiene el permiso correspondiente. */
export function SinPermiso({ funcion }: { funcion: string }) {
  return (
    <div className="max-w-xl mx-auto mt-6 bg-white rounded-2xl border border-slate-200/90 p-6 flex items-start gap-4">
      <div className="size-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
        <Lock className="size-5" />
      </div>
      <div className="space-y-1">
        <h2 className="text-sm font-semibold text-slate-900">Función no habilitada</h2>
        <p className="text-sm text-slate-600">
          Tu rol no tiene permiso para {funcion}. Si lo necesitas, solicítalo al administrador de la plataforma.
        </p>
      </div>
    </div>
  );
}
