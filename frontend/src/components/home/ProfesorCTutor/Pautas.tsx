import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, ChevronRight, ClipboardList, Loader2, Search, PencilLine } from "lucide-react";
import type { UserSession } from "@/types/auth";
import type { EstudianteTutorRow } from "./types";
import { getPautasDePractica, type PautaResumen } from "@/services/pautaApi";
import { PautaFormulario } from "./PautaFormulario";

interface PautasProps {
  user: UserSession;
  onBack?: () => void;
}

const MOMENTOS = [
  { key: "TODOS", label: "Todos" },
  { key: "PRIMERA", label: "1ª observación" },
  { key: "SEGUNDA", label: "2ª observación" },
  { key: "UNICA", label: "Única" },
];

const ESPECIALIDADES = [
  { key: "TODAS", label: "Todas" },
  { key: "ESPECIALIDAD", label: "Especialidad" },
  { key: "ORIENTACION", label: "Orientación" },
];

const EVALUADOR_LABEL: Record<string, string> = {
  COLABORADOR: "Profesor/a colaborador/a",
  TUTOR: "Tutor/a",
  ACADEMICO: "Académico/a",
};

export function Pautas({ user, onBack }: PautasProps) {
  const [estudiantes, setEstudiantes] = useState<EstudianteTutorRow[]>([]);
  const [cargandoEst, setCargandoEst] = useState(true);
  const [errorEst, setErrorEst] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [seleccionado, setSeleccionado] = useState<EstudianteTutorRow | null>(null);

  const [pautas, setPautas] = useState<PautaResumen[]>([]);
  const [cargandoPautas, setCargandoPautas] = useState(false);
  const [errorPautas, setErrorPautas] = useState<string | null>(null);
  const [momento, setMomento] = useState("TODOS");
  const [especialidad, setEspecialidad] = useState("TODAS");
  const [pautaAbierta, setPautaAbierta] = useState<number | null>(null);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const res = await fetch(`/api/practicas/seguimiento/${encodeURIComponent(user.rut)}`);
        if (!res.ok) {
          if (!cancelado) setErrorEst("No se pudo cargar la lista de estudiantes.");
          return;
        }
        const json = await res.json();
        if (!cancelado && Array.isArray(json)) setEstudiantes(json as EstudianteTutorRow[]);
      } catch (e) {
        console.error("Error al cargar estudiantes:", e);
        if (!cancelado) setErrorEst("No se pudo conectar con el servidor.");
      } finally {
        if (!cancelado) setCargandoEst(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [user.rut]);

  const cargarPautas = useCallback(
    async (est: EstudianteTutorRow) => {
      if (!est.idPractica) return;
      try {
        setPautas(await getPautasDePractica(user.rut, est.idPractica));
        setErrorPautas(null);
      } catch (e) {
        setErrorPautas(e instanceof Error ? e.message : "Error al cargar las pautas");
      } finally {
        setCargandoPautas(false);
      }
    },
    [user.rut]
  );

  const abrirEstudiante = (est: EstudianteTutorRow) => {
    setPautas([]);
    setErrorPautas(null);
    setMomento("TODOS");
    setEspecialidad("TODAS");
    setCargandoPautas(true);
    setSeleccionado(est);
    cargarPautas(est);
  };

  const estudiantesFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return estudiantes;
    return estudiantes.filter((e) => e.nombre.toLowerCase().includes(q) || e.rut.toLowerCase().includes(q));
  }, [estudiantes, busqueda]);

  const pautasFiltradas = useMemo(
    () =>
      pautas.filter(
        (p) =>
          (momento === "TODOS" || p.momento === momento) &&
          (especialidad === "TODAS" || p.especialidad === especialidad)
      ),
    [pautas, momento, especialidad]
  );

  // ---- Vista 3: formulario de la pauta
  if (seleccionado && pautaAbierta != null && seleccionado.idPractica != null) {
    return (
      <PautaFormulario
        pautaId={pautaAbierta}
        practicaId={seleccionado.idPractica}
        estudianteNombre={seleccionado.nombre}
        user={user}
        onBack={() => {
          setPautaAbierta(null);
          cargarPautas(seleccionado);
        }}
      />
    );
  }

  const volverInicio = (
    <button
      type="button"
      onClick={() => (seleccionado ? setSeleccionado(null) : onBack?.())}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-sky-800 bg-sky-50 hover:bg-sky-100/80 border border-sky-200 transition-colors cursor-pointer"
    >
      <ArrowLeft className="size-3.5" />
      <span>{seleccionado ? "Volver a estudiantes" : "Volver al Inicio"}</span>
    </button>
  );

  // ---- Vista 2: pautas del estudiante seleccionado
  if (seleccionado) {
    return (
      <div className="max-w-3xl mx-auto py-6 space-y-5">
        <div>{volverInicio}</div>

        <header className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{seleccionado.nombre}</h1>
          <p className="text-sm text-slate-600">
            {seleccionado.asignaturaNombre} · {seleccionado.centroPractica}
          </p>
        </header>

        <div className="space-y-2">
          <Chips opciones={ESPECIALIDADES} valor={especialidad} onChange={setEspecialidad} />
          <Chips opciones={MOMENTOS} valor={momento} onChange={setMomento} />
        </div>

        {cargandoPautas && (
          <div className="flex items-center gap-2 text-sm text-slate-500 py-6 justify-center">
            <Loader2 className="size-4 animate-spin" /> Cargando pautas…
          </div>
        )}
        {errorPautas && (
          <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-4">{errorPautas}</p>
        )}
        {!cargandoPautas && !errorPautas && pautasFiltradas.length === 0 && (
          <p className="text-sm text-slate-500 bg-white border border-slate-200 rounded-xl p-6 text-center">
            No hay pautas para esta práctica con los filtros seleccionados.
          </p>
        )}

        <ul className="space-y-3">
          {pautasFiltradas.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => setPautaAbierta(p.id)}
                className="w-full text-left bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs hover:border-sky-300 hover:bg-sky-50/40 transition-colors cursor-pointer flex items-center gap-3"
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-sm font-semibold text-slate-900 leading-snug">{p.titulo}</p>
                  <p className="text-xs text-slate-500">
                    {EVALUADOR_LABEL[p.evaluador] ?? p.evaluador} · {p.criteriosCount} indicadores ·{" "}
                    {p.puntajeMaximo} pts
                    {p.ponderacion ? ` · pondera ${p.ponderacion}` : ""}
                  </p>
                  <EstadoBadge estado={p.estadoAplicacion} nota={p.nota} />
                </div>
                <ChevronRight className="size-5 text-slate-400 shrink-0" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // ---- Vista 1: selección de estudiante
  return (
    <div className="max-w-3xl mx-auto py-6 space-y-5">
      {onBack && <div>{volverInicio}</div>}

      <header className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <ClipboardList className="size-6 text-sky-600" /> Pautas de evaluación
        </h1>
        <p className="text-sm text-slate-600">
          Seleccione al estudiante para completar sus pautas desde este dispositivo.
        </p>
      </header>

      <div className="relative">
        <Search className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o RUT"
          className="w-full h-11 pl-9 pr-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
        />
      </div>

      {cargandoEst && (
        <div className="flex items-center gap-2 text-sm text-slate-500 py-6 justify-center">
          <Loader2 className="size-4 animate-spin" /> Cargando estudiantes…
        </div>
      )}
      {errorEst && (
        <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-4">{errorEst}</p>
      )}
      {!cargandoEst && !errorEst && estudiantesFiltrados.length === 0 && (
        <p className="text-sm text-slate-500 bg-white border border-slate-200 rounded-xl p-6 text-center">
          No hay estudiantes con práctica asignada para evaluar.
        </p>
      )}

      <ul className="space-y-3">
        {estudiantesFiltrados.map((e) => (
          <li key={`${e.idEstudiante}-${e.idPractica}`}>
            <button
              type="button"
              disabled={e.idPractica == null}
              onClick={() => abrirEstudiante(e)}
              className="w-full text-left bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs hover:border-sky-300 hover:bg-sky-50/40 transition-colors cursor-pointer flex items-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:border-slate-200/90 disabled:hover:bg-white"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900">{e.nombre}</p>
                <p className="text-xs text-slate-500">
                  {e.rut} · {e.asignaturaNombre} · {e.centroPractica}
                </p>
                {e.idPractica == null && (
                  <p className="text-xs text-amber-700 mt-1">Sin práctica asignada: aún no se puede evaluar.</p>
                )}
              </div>
              <ChevronRight className="size-5 text-slate-400 shrink-0" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Chips({
  opciones,
  valor,
  onChange,
}: {
  opciones: { key: string; label: string }[];
  valor: string;
  onChange: (k: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {opciones.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          className={`h-9 px-3 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
            valor === o.key
              ? "bg-sky-600 border-sky-600 text-white"
              : "bg-white border-slate-200 text-slate-600 hover:bg-sky-50"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function EstadoBadge({ estado, nota }: { estado?: string | null; nota?: number | null }) {
  if (estado === "FINALIZADA") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
        <CheckCircle2 className="size-3" /> Finalizada{nota != null ? ` · ${nota.toFixed(1)}` : ""}
      </span>
    );
  }
  if (estado === "BORRADOR") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
        <PencilLine className="size-3" /> En borrador
      </span>
    );
  }
  return (
    <span className="inline-flex items-center text-xs font-semibold text-slate-600 bg-slate-100 rounded-full px-2 py-0.5">
      Sin iniciar
    </span>
  );
}
