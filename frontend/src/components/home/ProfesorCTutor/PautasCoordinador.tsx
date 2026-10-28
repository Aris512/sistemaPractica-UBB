import { useState } from "react";
import { ArrowLeft, ClipboardCheck, ClipboardList, LibraryBig } from "lucide-react";
import type { UserSession } from "@/types/auth";
import { PautasResultados } from "./PautasResultados";
import { PautasCatalogo } from "./PautasCatalogo";

interface PautasCoordinadorProps {
  user: UserSession;
  onBack: () => void;
}

type Pestana = "evaluaciones" | "catalogo";

const PESTANAS: { key: Pestana; label: string; ayuda: string; icon: typeof ClipboardCheck }[] = [
  { key: "evaluaciones", label: "Evaluaciones realizadas", ayuda: "Seguimiento de las pautas aplicadas", icon: ClipboardCheck },
  { key: "catalogo", label: "Catálogo de pautas", ayuda: "Crear, editar y activar pautas", icon: LibraryBig },
];

/** Vista del coordinador: seguimiento de todas las pautas y administración del catálogo. */
export function PautasCoordinador({ user, onBack }: PautasCoordinadorProps) {
  const [pestana, setPestana] = useState<Pestana>("evaluaciones");

  return (
    <div className="max-w-6xl mx-auto space-y-6">
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

      {/* Encabezado */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-sky-50 text-sky-700 border border-sky-100">
              <ClipboardList className="size-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Pautas de evaluación</h1>
          </div>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Revisa las pautas que aplican los profesores colaboradores y tutores, y administra el catálogo oficial de
            cada práctica.
          </p>
        </div>

        <div role="tablist" className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100/80">
          {PESTANAS.map(({ key, label, ayuda, icon: Icon }) => {
            const activa = pestana === key;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={activa}
                onClick={() => setPestana(key)}
                className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-left transition-colors cursor-pointer ${
                  activa ? "bg-white shadow-xs ring-1 ring-slate-200" : "hover:bg-white/60"
                }`}
              >
                <Icon className={`size-4.5 shrink-0 ${activa ? "text-sky-600" : "text-slate-400"}`} />
                <span className="min-w-0">
                  <span className={`block text-sm font-semibold ${activa ? "text-slate-900" : "text-slate-600"}`}>
                    {label}
                  </span>
                  <span className="block text-[11px] text-slate-500 truncate">{ayuda}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {pestana === "evaluaciones" ? (
        <PautasResultados user={user} modo="coordinador" embebido />
      ) : (
        <PautasCatalogo user={user} />
      )}
    </div>
  );
}
