import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import type { UserSession } from "@/types/auth";
import { PautasResultados } from "./PautasResultados";
import { PautasCatalogo } from "./PautasCatalogo";

interface PautasCoordinadorProps {
  user: UserSession;
  onBack: () => void;
}

type Pestana = "evaluaciones" | "catalogo";

/** Vista del coordinador: seguimiento de todas las pautas y administración del catálogo. */
export function PautasCoordinador({ user, onBack }: PautasCoordinadorProps) {
  const [pestana, setPestana] = useState<Pestana>("evaluaciones");

  const tab = (key: Pestana, label: string) => (
    <button
      type="button"
      onClick={() => setPestana(key)}
      className={`h-10 px-4 rounded-full text-sm font-semibold border transition-colors cursor-pointer ${
        pestana === key
          ? "bg-sky-600 border-sky-600 text-white"
          : "bg-white border-slate-200 text-slate-600 hover:bg-sky-50"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-5">
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

      <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Pautas de evaluación</h1>

      <div className="flex flex-wrap gap-2">
        {tab("evaluaciones", "Evaluaciones realizadas")}
        {tab("catalogo", "Catálogo de pautas")}
      </div>

      {pestana === "evaluaciones" ? (
        <PautasResultados user={user} modo="coordinador" embebido />
      ) : (
        <PautasCatalogo user={user} />
      )}
    </div>
  );
}
