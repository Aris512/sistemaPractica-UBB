import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, ChevronRight, ClipboardList, Loader2, PencilLine, Search } from "lucide-react";
import type { UserSession } from "@/types/auth";
import { getResultados, type ResultadoPauta } from "@/services/pautaApi";
import { PautaFormulario } from "./PautaFormulario";

export type ModoResultados = "estudiante" | "profesor" | "coordinador";

interface PautasResultadosProps {
  user: UserSession;
  modo: ModoResultados;
  onBack?: () => void;
  /** Dentro de otra pantalla (sin título grande ni botón de volver). */
  embebido?: boolean;
}

const EVALUADOR_LABEL: Record<string, string> = {
  COLABORADOR: "Profesor/a colaborador/a",
  TUTOR: "Tutor/a",
  ACADEMICO: "Académico/a",
};

const TEXTOS: Record<ModoResultados, { titulo: string; subtitulo: string; vacio: string }> = {
  estudiante: {
    titulo: "Mis pautas de evaluación",
    subtitulo: "Evaluaciones de tu práctica ya finalizadas por tus evaluadores.",
    vacio: "Aún no tienes pautas finalizadas.",
  },
  profesor: {
    titulo: "Pautas de práctica",
    subtitulo: "Evaluaciones finalizadas de los estudiantes de tu asignatura, sin necesidad de transcribir.",
    vacio: "Todavía no hay pautas finalizadas para tus estudiantes.",
  },
  coordinador: {
    titulo: "Evaluaciones realizadas",
    subtitulo: "Todas las pautas registradas en la plataforma, en borrador y finalizadas.",
    vacio: "Todavía no hay pautas registradas.",
  },
};

type FiltroEstado = "TODAS" | "FINALIZADA" | "BORRADOR";

const FILTROS_ESTADO: { key: FiltroEstado; label: string }[] = [
  { key: "TODAS", label: "Todas" },
  { key: "FINALIZADA", label: "Finalizadas" },
  { key: "BORRADOR", label: "En borrador" },
];

function formatearFecha(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-CL");
}

export function PautasResultados({ user, modo, onBack, embebido = false }: PautasResultadosProps) {
  const [filas, setFilas] = useState<ResultadoPauta[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [abierta, setAbierta] = useState<ResultadoPauta | null>(null);

  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const r = await getResultados(user.rut);
        if (!cancelado) {
          setFilas(r);
          setError(null);
        }
      } catch (e) {
        if (!cancelado) setError(e instanceof Error ? e.message : "No se pudieron cargar las evaluaciones.");
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [user.rut, version]);

  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("TODAS");

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return filas.filter(
      (f) =>
        (filtroEstado === "TODAS" || f.estado === filtroEstado) &&
        (!q ||
          (f.estudianteNombre ?? "").toLowerCase().includes(q) ||
          (f.estudianteRut ?? "").toLowerCase().includes(q) ||
          f.pautaTitulo.toLowerCase().includes(q) ||
          (f.evaluadorNombre ?? "").toLowerCase().includes(q))
    );
  }, [filas, busqueda, filtroEstado]);

  const resumen = useMemo(() => {
    const finalizadas = filas.filter((f) => f.estado === "FINALIZADA");
    const notas = finalizadas.map((f) => f.nota).filter((n): n is number => n != null);
    return {
      total: filas.length,
      finalizadas: finalizadas.length,
      borradores: filas.length - finalizadas.length,
      promedio: notas.length ? notas.reduce((a, b) => a + b, 0) / notas.length : null,
    };
  }, [filas]);

  if (abierta) {
    return (
      <PautaFormulario
        pautaId={abierta.pautaId}
        practicaId={abierta.practicaId}
        estudianteNombre={abierta.estudianteNombre ?? "—"}
        user={user}
        soloLectura
        puedeReabrir={modo === "coordinador"}
        textoVolver="Volver al listado"
        onBack={() => {
          setAbierta(null);
          setCargando(true);
          setVersion((v) => v + 1);
        }}
      />
    );
  }

  const t = TEXTOS[modo];
  const esCoordinador = modo === "coordinador";

  return (
    <div className={embebido ? "space-y-4" : "max-w-4xl mx-auto py-6 space-y-5"}>
      {!embebido && onBack && (
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

      {!embebido && (
        <header className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ClipboardList className="size-6 text-sky-600" /> {t.titulo}
          </h1>
          <p className="text-sm text-slate-600">{t.subtitulo}</p>
        </header>
      )}

      {/* Resumen numérico */}
      {modo !== "estudiante" && !cargando && !error && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Indicador etiqueta="Pautas registradas" valor={String(resumen.total)} />
          <Indicador etiqueta="Finalizadas" valor={String(resumen.finalizadas)} tono="emerald" />
          {esCoordinador && <Indicador etiqueta="En borrador" valor={String(resumen.borradores)} tono="amber" />}
          <Indicador
            etiqueta="Promedio de notas"
            valor={resumen.promedio != null ? resumen.promedio.toFixed(1) : "—"}
            tono="sky"
          />
        </div>
      )}

      {/* Búsqueda y filtro por estado */}
      {modo !== "estudiante" && (
        <div className="flex flex-col md:flex-row md:items-center gap-3 bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="relative flex-1">
            <Search className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por estudiante, RUT, pauta o evaluador"
              className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-200 bg-slate-50/70 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-300"
            />
          </div>
          {esCoordinador && (
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {FILTROS_ESTADO.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFiltroEstado(f.key)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap cursor-pointer transition-colors ${
                    filtroEstado === f.key ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {cargando && (
        <div className="flex items-center gap-2 text-sm text-slate-500 py-10 justify-center bg-white rounded-2xl border border-slate-200/90">
          <Loader2 className="size-4 animate-spin text-sky-600" /> Cargando evaluaciones…
        </div>
      )}
      {error && <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-4">{error}</p>}
      {!cargando && !error && filtradas.length === 0 && (
        <div className="flex flex-col items-center gap-2 text-center bg-white border border-slate-200/90 rounded-2xl p-10">
          <ClipboardList className="size-8 text-slate-300 stroke-[1.5]" />
          <p className="text-sm font-semibold text-slate-700">
            {busqueda || filtroEstado !== "TODAS" ? "No hay resultados con estos filtros." : t.vacio}
          </p>
        </div>
      )}

      {!cargando && filtradas.length > 0 && (
        <ul className="bg-white rounded-2xl border border-slate-200/90 shadow-xs divide-y divide-slate-100 overflow-hidden">
          {filtradas.map((f) => (
            <li key={f.aplicacionId}>
              <button
                type="button"
                onClick={() => setAbierta(f)}
                className="w-full text-left px-4 sm:px-5 py-4 hover:bg-sky-50/50 transition-colors cursor-pointer flex items-center gap-4 group"
              >
                {modo !== "estudiante" && (
                  <span className="hidden sm:flex size-10 shrink-0 rounded-full bg-slate-100 border border-slate-200 items-center justify-center text-xs font-bold text-slate-700 group-hover:border-sky-300">
                    {iniciales(f.estudianteNombre)}
                  </span>
                )}
                <div className="flex-1 min-w-0 space-y-0.5">
                  {modo !== "estudiante" && (
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {f.estudianteNombre ?? "—"}
                      {f.estudianteRut ? (
                        <span className="font-normal text-xs text-slate-400 font-mono ml-2">{f.estudianteRut}</span>
                      ) : null}
                    </p>
                  )}
                  <p className="text-sm text-slate-700 leading-snug line-clamp-2">{f.pautaTitulo}</p>
                  <p className="text-xs text-slate-500">
                    {EVALUADOR_LABEL[f.evaluadorRol] ?? f.evaluadorRol}
                    {f.evaluadorNombre ? `: ${f.evaluadorNombre}` : ""} ·{" "}
                    {formatearFecha(f.fechaFinalizacion ?? f.fechaActualizacion)}
                    {f.ponderacion ? ` · pondera ${f.ponderacion}` : ""}
                  </p>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-1.5">
                  <Estado estado={f.estado} />
                  {f.nota != null ? (
                    <span className="text-right leading-tight">
                      <span className={`block text-lg font-bold ${f.nota >= 4 ? "text-slate-900" : "text-rose-600"}`}>
                        {f.nota.toFixed(1)}
                      </span>
                      <span className="block text-[10px] text-slate-500">
                        {f.modoCalculo === "PROMEDIO" ? "Promedio" : "Nota"}
                        {f.puntajeObtenido != null && f.puntajeMaximo != null
                          ? ` · ${f.puntajeObtenido}/${f.puntajeMaximo} pts`
                          : ""}
                      </span>
                    </span>
                  ) : (
                    f.puntajeObtenido != null &&
                    f.puntajeMaximo != null && (
                      <span className="text-[11px] text-slate-500">
                        {f.puntajeObtenido}/{f.puntajeMaximo} pts
                      </span>
                    )
                  )}
                </div>
                <ChevronRight className="size-5 text-slate-300 group-hover:text-sky-500 shrink-0" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function iniciales(nombre?: string | null): string {
  const partes = (nombre ?? "").trim().split(/\s+/).filter(Boolean);
  return ((partes[0]?.[0] ?? "") + (partes[1]?.[0] ?? "")).toUpperCase() || "—";
}

const TONOS = {
  slate: "text-slate-900",
  emerald: "text-emerald-700",
  amber: "text-amber-700",
  sky: "text-sky-700",
};

function Indicador({ etiqueta, valor, tono = "slate" }: { etiqueta: string; valor: string; tono?: keyof typeof TONOS }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/90 px-4 py-3 shadow-2xs">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{etiqueta}</p>
      <p className={`text-2xl font-bold mt-0.5 ${TONOS[tono]}`}>{valor}</p>
    </div>
  );
}

function Estado({ estado }: { estado: string }) {
  if (estado === "FINALIZADA") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
        <CheckCircle2 className="size-3" /> Finalizada
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
      <PencilLine className="size-3" /> En borrador
    </span>
  );
}
