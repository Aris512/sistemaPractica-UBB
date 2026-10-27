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

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return filas;
    return filas.filter(
      (f) =>
        (f.estudianteNombre ?? "").toLowerCase().includes(q) ||
        (f.estudianteRut ?? "").toLowerCase().includes(q) ||
        f.pautaTitulo.toLowerCase().includes(q) ||
        (f.evaluadorNombre ?? "").toLowerCase().includes(q)
    );
  }, [filas, busqueda]);

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

      <header className="space-y-1">
        {embebido ? (
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ClipboardList className="size-5 text-sky-600" /> {t.titulo}
          </h2>
        ) : (
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ClipboardList className="size-6 text-sky-600" /> {t.titulo}
          </h1>
        )}
        <p className="text-sm text-slate-600">{t.subtitulo}</p>
      </header>

      {modo !== "estudiante" && (
        <div className="relative">
          <Search className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por estudiante, RUT, pauta o evaluador"
            className="w-full h-11 pl-9 pr-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
          />
        </div>
      )}

      {cargando && (
        <div className="flex items-center gap-2 text-sm text-slate-500 py-6 justify-center">
          <Loader2 className="size-4 animate-spin" /> Cargando evaluaciones…
        </div>
      )}
      {error && <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-4">{error}</p>}
      {!cargando && !error && filtradas.length === 0 && (
        <p className="text-sm text-slate-500 bg-white border border-slate-200 rounded-xl p-6 text-center">
          {busqueda ? "No hay resultados para la búsqueda." : t.vacio}
        </p>
      )}

      <ul className="space-y-3">
        {filtradas.map((f) => (
          <li key={f.aplicacionId}>
            <button
              type="button"
              onClick={() => setAbierta(f)}
              className="w-full text-left bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs hover:border-sky-300 hover:bg-sky-50/40 transition-colors cursor-pointer flex items-center gap-3"
            >
              <div className="flex-1 min-w-0 space-y-1">
                {modo !== "estudiante" && (
                  <p className="text-sm font-bold text-slate-900">
                    {f.estudianteNombre ?? "—"}
                    {f.estudianteRut ? <span className="font-normal text-slate-500"> · {f.estudianteRut}</span> : null}
                  </p>
                )}
                <p className="text-sm font-semibold text-slate-800 leading-snug">{f.pautaTitulo}</p>
                <p className="text-xs text-slate-500">
                  {EVALUADOR_LABEL[f.evaluadorRol] ?? f.evaluadorRol}
                  {f.evaluadorNombre ? `: ${f.evaluadorNombre}` : ""} · {formatearFecha(f.fechaFinalizacion ?? f.fechaActualizacion)}
                  {f.ponderacion ? ` · pondera ${f.ponderacion}` : ""}
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <Estado estado={f.estado} />
                  {f.puntajeObtenido != null && f.puntajeMaximo != null && (
                    <span className="text-xs text-slate-600">
                      {f.puntajeObtenido}/{f.puntajeMaximo} pts
                    </span>
                  )}
                  {f.nota != null && (
                    <span className="text-xs font-bold text-slate-900">
                      {f.modoCalculo === "PROMEDIO" ? "Promedio" : "Nota"} {f.nota.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight className="size-5 text-slate-400 shrink-0" />
            </button>
          </li>
        ))}
      </ul>
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
