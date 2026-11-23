import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Copy,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { sileo } from "sileo";
import type { UserSession } from "@/types/auth";
import { ConfirmDeleteDialog } from "@/components/ui/ConfirmDeleteDialog";
import { PautaEditor, type ModoEditor } from "./PautaEditor";
import {
  cambiarActivaPauta,
  eliminarPauta,
  evaluadoresDe,
  getCatalogo,
  getPautaDetalle,
  type CriterioPauta,
  type PautaResumen,
} from "@/services/pautaApi";

interface PautasCatalogoProps {
  user: UserSession;
}

const EVALUADOR_LABEL: Record<string, string> = {
  COLABORADOR: "Colaborador/a",
  TUTOR: "Tutor/a",
  ACADEMICO: "Académico/a",
};
const ESPECIALIDAD_LABEL: Record<string, string> = { ESPECIALIDAD: "Especialidad", ORIENTACION: "Orientación" };
const MOMENTO_LABEL: Record<string, string> = { PRIMERA: "1ª observación", SEGUNDA: "2ª observación", UNICA: "Única" };

type FiltroEstado = "TODAS" | "ACTIVAS" | "INACTIVAS";

const normalizar = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/** Orden de la línea de práctica por semestre; las asignaturas que no calcen van al final, por nombre. */
const ORDEN_LINEA = [
  "aproximacion",
  "ambientes",
  "trabajo colaborativo",
  "investigacion",
  "practica pedagogica",
  "practica profesional",
];
const ordenAsignatura = (nombre: string) => {
  const clave = normalizar(nombre);
  const i = ORDEN_LINEA.findIndex((t) => clave.includes(t));
  return i === -1 ? ORDEN_LINEA.length : i;
};

/** Catálogo de pautas por práctica, especialidad y momento (HU-21). Solo muestra las asignaturas con pautas. */
export function PautasCatalogo({ user }: PautasCatalogoProps) {
  const [pautas, setPautas] = useState<PautaResumen[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cambiando, setCambiando] = useState<number | null>(null);
  const [expandida, setExpandida] = useState<number | null>(null);
  const [criterios, setCriterios] = useState<Record<number, CriterioPauta[]>>({});
  const [editor, setEditor] = useState<ModoEditor | null>(null);
  const [aEliminar, setAEliminar] = useState<PautaResumen | null>(null);

  // Filtros
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState<FiltroEstado>("TODAS");
  const [especialidad, setEspecialidad] = useState("");
  const [momento, setMomento] = useState("");
  const [evaluador, setEvaluador] = useState("");
  const [colapsadas, setColapsadas] = useState<Set<string>>(new Set());

  const cargar = async () => {
    try {
      setPautas(await getCatalogo(user.rut));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar el catálogo.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const r = await getCatalogo(user.rut);
        if (!cancelado) setPautas(r);
      } catch (e) {
        if (!cancelado) setError(e instanceof Error ? e.message : "No se pudo cargar el catálogo.");
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [user.rut]);

  /** Tras crear, editar o eliminar: se vuelve a leer el catálogo y se descartan los indicadores en caché. */
  const alTerminarEdicion = async (id?: number) => {
    setEditor(null);
    if (id !== undefined) {
      setCriterios((prev) => {
        const copia = { ...prev };
        delete copia[id];
        return copia;
      });
      setExpandida((actual) => (actual === id ? null : actual));
    }
    await cargar();
  };

  // Opciones de filtro según las pautas que existen
  const opciones = useMemo(() => {
    const esp = new Set<string>();
    const mom = new Set<string>();
    const eva = new Set<string>();
    pautas.forEach((p) => {
      if (p.especialidad) esp.add(p.especialidad);
      if (p.momento) mom.add(p.momento);
      evaluadoresDe(p.evaluador).forEach((e) => eva.add(e));
    });
    return { especialidades: [...esp], momentos: [...mom], evaluadores: [...eva] };
  }, [pautas]);

  const filtradas = useMemo(() => {
    const termino = normalizar(busqueda.trim());
    return pautas.filter((p) => {
      if (estado === "ACTIVAS" && !p.activa) return false;
      if (estado === "INACTIVAS" && p.activa) return false;
      if (especialidad && p.especialidad !== especialidad) return false;
      if (momento && p.momento !== momento) return false;
      if (evaluador && !evaluadoresDe(p.evaluador).some((e) => e === evaluador)) return false;
      if (termino) {
        const texto = normalizar(`${p.titulo} ${p.codigo ?? ""} ${p.asignatura}`);
        if (!texto.includes(termino)) return false;
      }
      return true;
    });
  }, [pautas, busqueda, estado, especialidad, momento, evaluador]);

  // Solo asignaturas que tienen pautas (tras filtrar), en el orden de la línea de práctica
  const porAsignatura = useMemo(() => {
    const mapa = new Map<string, PautaResumen[]>();
    filtradas.forEach((p) => {
      const lista = mapa.get(p.asignatura) ?? [];
      lista.push(p);
      mapa.set(p.asignatura, lista);
    });
    return [...mapa.entries()]
      .sort(([a], [b]) => ordenAsignatura(a) - ordenAsignatura(b) || a.localeCompare(b, "es"))
      .map(([nombre, lista]) => ({ nombre, lista }));
  }, [filtradas]);

  const hayFiltros = !!busqueda.trim() || estado !== "TODAS" || !!especialidad || !!momento || !!evaluador;
  const limpiarFiltros = () => {
    setBusqueda("");
    setEstado("TODAS");
    setEspecialidad("");
    setMomento("");
    setEvaluador("");
  };

  const alternarGrupo = (nombre: string) =>
    setColapsadas((prev) => {
      const copia = new Set(prev);
      if (copia.has(nombre)) copia.delete(nombre);
      else copia.add(nombre);
      return copia;
    });

  const alternar = async (p: PautaResumen) => {
    setCambiando(p.id);
    try {
      await cambiarActivaPauta(user.rut, p.id, !p.activa);
      setPautas((prev) => prev.map((x) => (x.id === p.id ? { ...x, activa: !p.activa } : x)));
    } catch (e) {
      sileo.error({
        title: "No se pudo actualizar",
        description: e instanceof Error ? e.message : "Intente nuevamente.",
      });
    } finally {
      setCambiando(null);
    }
  };

  /** Elimina la pauta desde el listado. El backend la rechaza si tiene evaluaciones registradas. */
  const confirmarEliminar = async () => {
    if (!aEliminar) return;
    try {
      await eliminarPauta(user.rut, aEliminar.id);
      sileo.success({ title: "Pauta eliminada", description: `Se eliminó «${aEliminar.titulo}».` });
      await alTerminarEdicion(aEliminar.id);
    } catch (e) {
      sileo.error({
        title: "No se pudo eliminar",
        description: e instanceof Error ? e.message : "Intente nuevamente.",
      });
    } finally {
      setAEliminar(null);
    }
  };

  const expandir = async (p: PautaResumen) => {
    if (expandida === p.id) {
      setExpandida(null);
      return;
    }
    setExpandida(p.id);
    if (!criterios[p.id]) {
      try {
        const d = await getPautaDetalle(user.rut, p.id);
        setCriterios((prev) => ({ ...prev, [p.id]: d.criterios }));
      } catch (e) {
        sileo.error({
          title: "No se pudo cargar la pauta",
          description: e instanceof Error ? e.message : "Intente nuevamente.",
        });
      }
    }
  };

  if (cargando) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500 py-8 justify-center">
        <Loader2 className="size-4 animate-spin" /> Cargando catálogo…
      </div>
    );
  }
  if (error) {
    return <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-4">{error}</p>;
  }

  const totalActivas = pautas.filter((p) => p.activa).length;

  const editorYDialogos = (
    <>
      <PautaEditor
        user={user}
        modo={editor}
        onCerrar={() => setEditor(null)}
        onGuardada={(pauta) => alTerminarEdicion(pauta.id)}
        onEliminada={(id) => alTerminarEdicion(id)}
        onNuevaVersion={(id) => setEditor({ tipo: "duplicar", id })}
      />
      <ConfirmDeleteDialog
        open={!!aEliminar}
        onOpenChange={(abierto) => !abierto && setAEliminar(null)}
        onConfirm={confirmarEliminar}
        title="Eliminar pauta"
        description={`Se eliminará «${aEliminar?.titulo ?? ""}» del catálogo junto con sus indicadores. Si un tutor o colaborador ya la completó, primero debe limpiarla. Esta acción no se puede deshacer.`}
      />
    </>
  );

  // Catálogo vacío: invitación a crear la primera pauta
  if (pautas.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-slate-300 px-6 py-12 text-center space-y-3">
        <div className="size-12 rounded-xl bg-slate-100 text-slate-500 grid place-items-center mx-auto">
          <ClipboardList className="size-6" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">Aún no hay pautas en el catálogo</p>
          <p className="text-xs text-slate-500 mt-1">Crea la primera pauta de observación para una práctica.</p>
        </div>
        <button
          type="button"
          onClick={() => setEditor({ tipo: "crear" })}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-slate-900 text-sm font-semibold text-white hover:bg-slate-800 cursor-pointer"
        >
          <Plus className="size-4" /> Nueva pauta
        </button>
        {editorYDialogos}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Resumen y acción principal */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <Indicador valor={pautas.length} etiqueta={pautas.length === 1 ? "pauta" : "pautas"} />
            <Indicador valor={totalActivas} etiqueta={totalActivas === 1 ? "activa" : "activas"} />
            <Indicador valor={pautas.length - totalActivas} etiqueta={pautas.length - totalActivas === 1 ? "inactiva" : "inactivas"} />
          </div>
          <button
            type="button"
            onClick={() => setEditor({ tipo: "crear" })}
            className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-slate-900 text-sm font-semibold text-white hover:bg-slate-800 shadow-xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="size-4" /> Nueva pauta
          </button>
        </div>

        {/* Búsqueda y filtros */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por título, código o asignatura…"
              className="w-full h-9 rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5" role="group" aria-label="Estado">
              {(["TODAS", "ACTIVAS", "INACTIVAS"] as FiltroEstado[]).map((op) => (
                <button
                  key={op}
                  type="button"
                  onClick={() => setEstado(op)}
                  aria-pressed={estado === op}
                  className={`h-8 px-3 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                    estado === op ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {op === "TODAS" ? "Todas" : op === "ACTIVAS" ? "Activas" : "Inactivas"}
                </button>
              ))}
            </div>
            {opciones.especialidades.length > 1 && (
              <Selector
                valor={especialidad}
                onCambiar={setEspecialidad}
                vacio="Especialidad"
                opciones={opciones.especialidades.map((v) => [v, ESPECIALIDAD_LABEL[v] ?? v])}
              />
            )}
            {opciones.momentos.length > 1 && (
              <Selector
                valor={momento}
                onCambiar={setMomento}
                vacio="Momento"
                opciones={opciones.momentos.map((v) => [v, MOMENTO_LABEL[v] ?? v])}
              />
            )}
            {opciones.evaluadores.length > 1 && (
              <Selector
                valor={evaluador}
                onCambiar={setEvaluador}
                vacio="Evaluador"
                opciones={opciones.evaluadores.map((v) => [v, EVALUADOR_LABEL[v] ?? v])}
              />
            )}
          </div>
        </div>

        {hayFiltros && (
          <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
            <span>
              {filtradas.length} de {pautas.length} pautas coinciden
            </span>
            <button
              type="button"
              onClick={limpiarFiltros}
              className="inline-flex items-center gap-1 font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              <X className="size-3.5" /> Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {porAsignatura.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 px-6 py-10 text-center">
          <p className="text-sm text-slate-600">Ninguna pauta coincide con los filtros.</p>
          <button
            type="button"
            onClick={limpiarFiltros}
            className="mt-2 text-sm font-medium text-slate-900 underline cursor-pointer"
          >
            Limpiar filtros
          </button>
        </div>
      )}

      {porAsignatura.map(({ nombre: asignatura, lista }) => {
        const colapsada = colapsadas.has(asignatura);
        const activasGrupo = lista.filter((p) => p.activa).length;
        return (
          <section key={asignatura} className="space-y-2.5">
            <button
              type="button"
              onClick={() => alternarGrupo(asignatura)}
              aria-expanded={!colapsada}
              className="w-full flex items-center gap-2 text-left cursor-pointer group"
            >
              <ChevronRight
                className={`size-4 text-slate-400 transition-transform ${colapsada ? "" : "rotate-90"}`}
              />
              <h3 className="text-sm font-bold text-slate-800 group-hover:text-slate-950">{asignatura}</h3>
              <span className="text-[11px] font-medium text-slate-500 bg-slate-100 rounded-full px-2 py-0.5">
                {lista.length} {lista.length === 1 ? "pauta" : "pautas"} · {activasGrupo} {activasGrupo === 1 ? "activa" : "activas"}
              </span>
              <span className="flex-1 h-px bg-slate-200" />
            </button>

            {!colapsada && (
              <ul className="space-y-2">
                {lista.map((p) => (
                  <li
                    key={p.id}
                    className={`bg-white rounded-xl border shadow-2xs transition-colors ${
                      expandida === p.id ? "border-slate-400" : "border-slate-200/90 hover:border-slate-300"
                    } ${p.activa ? "" : "bg-slate-50/70"}`}
                  >
                    <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                      <button
                        type="button"
                        onClick={() => expandir(p)}
                        className="flex-1 min-w-0 text-left cursor-pointer flex items-start gap-2"
                        aria-expanded={expandida === p.id}
                        title={expandida === p.id ? "Ocultar indicadores" : "Ver indicadores"}
                      >
                        <span className="mt-0.5 text-slate-400 shrink-0">
                          <ChevronDown
                            className={`size-4 transition-transform ${expandida === p.id ? "rotate-180" : ""}`}
                          />
                        </span>
                        <span className="min-w-0 space-y-1.5">
                          <span className="flex flex-wrap items-baseline gap-x-2">
                            <span
                              className={`text-sm font-semibold leading-snug ${
                                p.activa ? "text-slate-900" : "text-slate-500"
                              }`}
                            >
                              {p.titulo}
                            </span>
                            {p.codigo && <span className="text-[11px] font-mono text-slate-400">{p.codigo}</span>}
                          </span>
                          <span className="flex flex-wrap gap-1.5">
                            <Etiqueta>{ESPECIALIDAD_LABEL[p.especialidad] ?? p.especialidad}</Etiqueta>
                            <Etiqueta>{MOMENTO_LABEL[p.momento] ?? p.momento}</Etiqueta>
                            {evaluadoresDe(p.evaluador).map((e) => (
                              <Etiqueta key={e}>{EVALUADOR_LABEL[e] ?? e}</Etiqueta>
                            ))}
                            <Etiqueta tenue>
                              {p.criteriosCount} indicadores · {p.puntajeMaximo} pts
                            </Etiqueta>
                            {p.ponderacion && <Etiqueta tenue>pondera {p.ponderacion}</Etiqueta>}
                            {p.version && <Etiqueta tenue>v. {p.version}</Etiqueta>}
                          </span>
                        </span>
                      </button>
                      <div className="flex items-center gap-1 self-end sm:self-auto shrink-0">
                        <BotonIcono titulo="Editar" etiqueta={`Editar ${p.titulo}`} onClick={() => setEditor({ tipo: "editar", id: p.id })}>
                          <Pencil className="size-4" />
                        </BotonIcono>
                        <BotonIcono
                          titulo="Crear nueva versión"
                          etiqueta={`Crear nueva versión de ${p.titulo}`}
                          onClick={() => setEditor({ tipo: "duplicar", id: p.id })}
                        >
                          <Copy className="size-4" />
                        </BotonIcono>
                        <BotonIcono titulo="Eliminar pauta" etiqueta={`Eliminar ${p.titulo}`} onClick={() => setAEliminar(p)} peligro>
                          <Trash2 className="size-4" />
                        </BotonIcono>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={p.activa}
                          disabled={cambiando === p.id}
                          onClick={() => alternar(p)}
                          title={p.activa ? "Desactivar pauta" : "Activar pauta"}
                          className={`ml-1 inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-semibold border transition-colors cursor-pointer disabled:opacity-60 ${
                            p.activa
                              ? "bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100"
                              : "bg-white border-slate-300 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {cambiando === p.id ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : (
                            <span className={`size-1.5 rounded-full ${p.activa ? "bg-emerald-500" : "bg-slate-400"}`} />
                          )}
                          {p.activa ? "Activa" : "Inactiva"}
                        </button>
                      </div>
                    </div>
                    {expandida === p.id && (
                      <ol className="border-t border-slate-100 bg-slate-50/60 px-4 py-3 space-y-2 max-h-96 overflow-y-auto rounded-b-xl">
                        {!criterios[p.id] && (
                          <li className="text-xs text-slate-500 flex items-center gap-2">
                            <Loader2 className="size-3 animate-spin" /> Cargando indicadores…
                          </li>
                        )}
                        {criterios[p.id]?.length === 0 && (
                          <li className="text-xs text-slate-500">Esta pauta aún no tiene indicadores.</li>
                        )}
                        {criterios[p.id]?.map((c, i, todos) => (
                          <li key={c.id} className="text-xs text-slate-700 leading-relaxed">
                            {c.dimension && c.dimension !== todos[i - 1]?.dimension && (
                              <span className="block font-bold text-slate-800 mt-2 mb-1">{c.dimension}</span>
                            )}
                            <span className="font-bold text-slate-900 mr-1.5">{c.numero}</span>
                            {c.texto}
                          </li>
                        ))}
                      </ol>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}

      {editorYDialogos}
    </div>
  );
}

function Indicador({ valor, etiqueta }: { valor: number; etiqueta: string }) {
  return (
    <div className="leading-tight">
      <p className="text-lg font-semibold text-slate-900">{valor}</p>
      <p className="text-[11px] text-slate-500">{etiqueta}</p>
    </div>
  );
}

function Selector({
  valor,
  onCambiar,
  vacio,
  opciones,
}: {
  valor: string;
  onCambiar: (v: string) => void;
  vacio: string;
  opciones: [string, string][];
}) {
  return (
    <select
      value={valor}
      onChange={(e) => onCambiar(e.target.value)}
      aria-label={vacio}
      className={`h-9 rounded-lg border bg-white px-2.5 text-xs font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-300 ${
        valor ? "border-slate-400 text-slate-900" : "border-slate-200 text-slate-500"
      }`}
    >
      <option value="">{vacio}: todos</option>
      {opciones.map(([v, etiqueta]) => (
        <option key={v} value={v}>
          {etiqueta}
        </option>
      ))}
    </select>
  );
}

function BotonIcono({
  children,
  titulo,
  etiqueta,
  onClick,
  peligro = false,
}: {
  children: ReactNode;
  titulo: string;
  etiqueta: string;
  onClick: () => void;
  peligro?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`size-8 grid place-items-center rounded-lg text-slate-500 cursor-pointer ${
        peligro ? "hover:bg-rose-50 hover:text-rose-600" : "hover:bg-slate-100 hover:text-slate-900"
      }`}
      aria-label={etiqueta}
      title={titulo}
    >
      {children}
    </button>
  );
}

function Etiqueta({ children, tenue = false }: { children: ReactNode; tenue?: boolean }) {
  return (
    <span
      className={`inline-flex items-center text-[11px] font-medium rounded-md px-1.5 py-0.5 ${
        tenue ? "text-slate-500" : "text-slate-700 bg-slate-100"
      }`}
    >
      {children}
    </span>
  );
}
