import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Loader2,
  PencilLine,
  School,
  Search,
  UserX,
} from "lucide-react";
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

const MOMENTO_LABEL: Record<string, string> = {
  PRIMERA: "1ª observación",
  SEGUNDA: "2ª observación",
  UNICA: "Única",
};

const ESPECIALIDAD_LABEL: Record<string, string> = { ESPECIALIDAD: "Especialidad", ORIENTACION: "Orientación" };

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
    const finalizadas = pautas.filter((p) => p.estadoAplicacion === "FINALIZADA").length;
    const borradores = pautas.filter((p) => p.estadoAplicacion === "BORRADOR").length;
    const sinIniciar = pautas.length - finalizadas - borradores;
    return (
      <div className="max-w-4xl mx-auto space-y-5">
        <div>{volverInicio}</div>

        {/* Estudiante y avance de sus pautas */}
        <header className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-4">
          <div className="flex items-start gap-3">
            <span className="size-11 shrink-0 rounded-full bg-sky-50 border border-sky-100 flex items-center justify-center text-sm font-bold text-sky-800">
              {iniciales(seleccionado.nombre)}
            </span>
            <div className="min-w-0 space-y-1">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">{seleccionado.nombre}</h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                <span className="font-mono">{seleccionado.rut}</span>
                <AsignaturaBadge nombre={seleccionado.asignaturaNombre} />
                {seleccionado.centroPractica && (
                  <span className="inline-flex items-center gap-1">
                    <School className="size-3.5" /> {seleccionado.centroPractica}
                  </span>
                )}
              </div>
            </div>
          </div>

          {!cargandoPautas && !errorPautas && pautas.length > 0 && (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-slate-800">
                  {finalizadas} de {pautas.length} pautas finalizadas
                </span>
                <span className="flex flex-wrap gap-3 text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <span className="size-2 rounded-full bg-emerald-500" /> {finalizadas} finalizadas
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="size-2 rounded-full bg-amber-500" /> {borradores} en borrador
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="size-2 rounded-full bg-slate-300" /> {sinIniciar} sin iniciar
                  </span>
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden flex">
                <div className="h-full bg-emerald-500" style={{ width: `${(finalizadas / pautas.length) * 100}%` }} />
                <div className="h-full bg-amber-400" style={{ width: `${(borradores / pautas.length) * 100}%` }} />
              </div>
            </div>
          )}
        </header>

        {/* Filtros */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3 flex flex-col xl:flex-row xl:items-center gap-3 xl:gap-6">
          <Chips etiqueta="Especialidad" opciones={ESPECIALIDADES} valor={especialidad} onChange={setEspecialidad} />
          <Chips etiqueta="Momento" opciones={MOMENTOS} valor={momento} onChange={setMomento} />
        </div>

        {cargandoPautas && (
          <div className="flex items-center gap-2 text-sm text-slate-500 py-10 justify-center bg-white rounded-2xl border border-slate-200/90">
            <Loader2 className="size-4 animate-spin text-sky-600" /> Cargando pautas…
          </div>
        )}
        {errorPautas && (
          <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-4">{errorPautas}</p>
        )}
        {!cargandoPautas && !errorPautas && pautasFiltradas.length === 0 && (
          <div className="flex flex-col items-center gap-2 text-center bg-white border border-slate-200/90 rounded-2xl p-10">
            <ClipboardList className="size-8 text-slate-300 stroke-[1.5]" />
            <p className="text-sm text-slate-600 max-w-md">
              {pautas.length === 0
                ? "No hay pautas asignadas a su rol en esta práctica. El tutor evalúa solo en Práctica Profesional; en Práctica Pedagógica evalúa el profesor colaborador."
                : "No hay pautas para esta práctica con los filtros seleccionados."}
            </p>
          </div>
        )}

        {!cargandoPautas && pautasFiltradas.length > 0 && (
          <ul className="space-y-2.5">
            {pautasFiltradas.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => setPautaAbierta(p.id)}
                  className="w-full text-left bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs hover:border-sky-300 hover:shadow-sm transition-all cursor-pointer flex items-center gap-3 sm:gap-4 group"
                >
                  <EstadoIcono estado={p.estadoAplicacion} />
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <p className="text-sm font-semibold text-slate-900 leading-snug">{p.titulo}</p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {MOMENTO_LABEL[p.momento] ?? p.momento}
                      </span>
                      <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {ESPECIALIDAD_LABEL[p.especialidad] ?? p.especialidad}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {p.criteriosCount} indicadores · {p.puntajeMaximo} pts
                        {p.ponderacion ? ` · pondera ${p.ponderacion}` : ""}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    <EstadoBadge estado={p.estadoAplicacion} nota={p.nota} />
                    <span className="text-xs font-semibold text-sky-700 group-hover:underline">
                      {p.estadoAplicacion === "FINALIZADA"
                        ? "Ver resultado"
                        : p.estadoAplicacion === "BORRADOR"
                          ? "Continuar"
                          : "Comenzar"}
                    </span>
                  </div>
                  <ChevronRight className="hidden sm:block size-5 text-slate-300 group-hover:text-sky-500 shrink-0" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  // ---- Vista 1: selección de estudiante
  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {onBack && <div>{volverInicio}</div>}

      <header className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-sky-50 text-sky-700 border border-sky-100">
            <ClipboardList className="size-5" />
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Pautas de evaluación</h1>
        </div>
        <p className="text-sm text-slate-600 mt-1">
          Seleccione al estudiante para completar sus pautas desde este dispositivo.
        </p>
      </header>

      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o RUT"
            className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-200 bg-slate-50/70 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-300"
          />
        </div>
        {!cargandoEst && !errorEst && (
          <span className="text-xs text-slate-500 shrink-0">
            {estudiantesFiltrados.length} {estudiantesFiltrados.length === 1 ? "estudiante" : "estudiantes"}
          </span>
        )}
      </div>

      {cargandoEst && (
        <div className="flex items-center gap-2 text-sm text-slate-500 py-10 justify-center bg-white rounded-2xl border border-slate-200/90">
          <Loader2 className="size-4 animate-spin text-sky-600" /> Cargando estudiantes…
        </div>
      )}
      {errorEst && (
        <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-4">{errorEst}</p>
      )}
      {!cargandoEst && !errorEst && estudiantesFiltrados.length === 0 && (
        <div className="flex flex-col items-center gap-2 text-center bg-white border border-slate-200/90 rounded-2xl p-10">
          <UserX className="size-8 text-slate-300 stroke-[1.5]" />
          <p className="text-sm text-slate-600">
            {busqueda ? `No hay resultados para "${busqueda}".` : "No hay estudiantes con práctica asignada para evaluar."}
          </p>
        </div>
      )}

      {!cargandoEst && estudiantesFiltrados.length > 0 && (
        <ul className="bg-white rounded-2xl border border-slate-200/90 shadow-xs divide-y divide-slate-100 overflow-hidden">
          {estudiantesFiltrados.map((e) => (
            <li key={`${e.idEstudiante}-${e.idPractica}`}>
              <button
                type="button"
                disabled={e.idPractica == null}
                onClick={() => abrirEstudiante(e)}
                className="w-full text-left px-4 sm:px-5 py-4 hover:bg-sky-50/50 transition-colors cursor-pointer flex items-center gap-4 group disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-white"
              >
                <span className="size-10 shrink-0 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 group-hover:border-sky-300">
                  {iniciales(e.nombre)}
                </span>
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {e.nombre}
                    <span className="font-normal text-xs text-slate-400 font-mono ml-2">{e.rut}</span>
                  </p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    <AsignaturaBadge nombre={e.asignaturaNombre} />
                    {e.centroPractica && (
                      <span className="inline-flex items-center gap-1">
                        <School className="size-3.5" /> {e.centroPractica}
                      </span>
                    )}
                  </div>
                  {e.idPractica == null && (
                    <p className="text-xs text-amber-700">Sin práctica asignada: aún no se puede evaluar.</p>
                  )}
                </div>
                <span className="hidden sm:inline text-xs font-semibold text-sky-700 group-hover:underline shrink-0">
                  Ver pautas
                </span>
                <ChevronRight className="size-5 text-slate-300 group-hover:text-sky-500 shrink-0" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  return ((partes[0]?.[0] ?? "") + (partes[1]?.[0] ?? "")).toUpperCase() || "—";
}

function AsignaturaBadge({ nombre }: { nombre: string }) {
  const pedagogica = nombre.toLowerCase().includes("pedag");
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
        pedagogica ? "bg-sky-50 text-sky-800 border-sky-200" : "bg-indigo-50 text-indigo-800 border-indigo-200"
      }`}
    >
      {nombre}
    </span>
  );
}

function Chips({
  etiqueta,
  opciones,
  valor,
  onChange,
}: {
  etiqueta: string;
  opciones: { key: string; label: string }[];
  valor: string;
  onChange: (k: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 min-w-0">
      <span className="w-24 text-[11px] font-semibold uppercase tracking-wide text-slate-500 shrink-0">{etiqueta}</span>
      <div className="flex flex-wrap gap-1">
        {opciones.map((o) => (
          <button
            key={o.key}
            type="button"
            onClick={() => onChange(o.key)}
            className={`h-8 px-3 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              valor === o.key ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function EstadoIcono({ estado }: { estado?: string | null }) {
  if (estado === "FINALIZADA") {
    return (
      <span className="hidden sm:grid size-10 shrink-0 rounded-xl bg-emerald-50 border border-emerald-200 place-items-center text-emerald-600">
        <CheckCircle2 className="size-5" />
      </span>
    );
  }
  if (estado === "BORRADOR") {
    return (
      <span className="hidden sm:grid size-10 shrink-0 rounded-xl bg-amber-50 border border-amber-200 place-items-center text-amber-600">
        <PencilLine className="size-5" />
      </span>
    );
  }
  return (
    <span className="hidden sm:grid size-10 shrink-0 rounded-xl bg-slate-50 border border-slate-200 place-items-center text-slate-400">
      <ClipboardList className="size-5" />
    </span>
  );
}

function EstadoBadge({ estado, nota }: { estado?: string | null; nota?: number | null }) {
  if (estado === "FINALIZADA") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5 whitespace-nowrap">
        Finalizada{nota != null ? ` · ${nota.toFixed(1)}` : ""}
      </span>
    );
  }
  if (estado === "BORRADOR") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 whitespace-nowrap">
        En borrador
      </span>
    );
  }
  return (
    <span className="inline-flex items-center text-xs font-semibold text-slate-600 bg-slate-100 rounded-full px-2 py-0.5 whitespace-nowrap">
      Sin iniciar
    </span>
  );
}
