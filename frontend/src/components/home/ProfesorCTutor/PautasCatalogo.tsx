import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp, Copy, Loader2, Pencil, Plus } from "lucide-react";
import { sileo } from "sileo";
import type { UserSession } from "@/types/auth";
import { PautaEditor, type ModoEditor } from "./PautaEditor";
import {
  cambiarActivaPauta,
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

const normalizar = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

/** Línea de práctica completa, en orden de semestre. Las prácticas iniciales no usan pautas de visita. */
const LINEA_PRACTICA: { nombre: string; nota: string; coincide: (clave: string) => boolean }[] = [
  {
    nombre: "Aproximación al Sistema Escolar",
    nota: "Práctica inicial: se realiza en simulaciones en el aula universitaria, sin pautas de evaluación en establecimiento.",
    coincide: (c) => c.includes("aproximacion"),
  },
  {
    nombre: "Ambientes de Aprendizaje",
    nota: "Práctica inicial: se realiza en simulaciones en el aula universitaria, sin pautas de evaluación en establecimiento.",
    coincide: (c) => c.includes("ambientes"),
  },
  {
    nombre: "Trabajo Colaborativo en el Aula",
    nota: "Aún no hay pautas cargadas para esta práctica.",
    coincide: (c) => c.includes("trabajo colaborativo"),
  },
  {
    nombre: "Investigación en el Aula",
    nota: "Aún no hay pautas cargadas para esta práctica.",
    coincide: (c) => c.includes("investigacion"),
  },
  {
    nombre: "Práctica Pedagógica",
    nota: "Aún no hay pautas cargadas para esta práctica.",
    coincide: (c) => c.includes("practica pedagogica"),
  },
  {
    nombre: "Práctica Profesional",
    nota: "Aún no hay pautas cargadas para esta práctica.",
    coincide: (c) => c.includes("practica profesional"),
  },
];

/** Catálogo de pautas por práctica, especialidad y momento (HU-21). */
export function PautasCatalogo({ user }: PautasCatalogoProps) {
  const [pautas, setPautas] = useState<PautaResumen[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cambiando, setCambiando] = useState<number | null>(null);
  const [expandida, setExpandida] = useState<number | null>(null);
  const [criterios, setCriterios] = useState<Record<number, CriterioPauta[]>>({});
  const [editor, setEditor] = useState<ModoEditor | null>(null);

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

  // Las 6 asignaturas de la línea de práctica se muestran siempre, aunque aún no tengan pautas cargadas.
  const porAsignatura = useMemo(() => {
    const grupos = LINEA_PRACTICA.map((g) => ({ ...g, lista: [] as PautaResumen[] }));
    const otras = new Map<string, PautaResumen[]>();
    pautas.forEach((p) => {
      const clave = normalizar(p.asignatura);
      const grupo = grupos.find((g) => g.coincide(clave));
      if (grupo) {
        grupo.lista.push(p);
      } else {
        const lista = otras.get(p.asignatura) ?? [];
        lista.push(p);
        otras.set(p.asignatura, lista);
      }
    });
    return [
      ...grupos.map((g) => ({ nombre: g.nombre, nota: g.nota, lista: g.lista })),
      ...Array.from(otras.entries()).map(([nombre, lista]) => ({ nombre, nota: "", lista })),
    ];
  }, [pautas]);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900">
            {pautas.length} {pautas.length === 1 ? "pauta" : "pautas"} en el catálogo
            <span className="font-normal text-slate-500"> · {totalActivas} activas</span>
          </p>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Organizadas por práctica, especialidad y momento. Una pauta desactivada deja de aparecer a los evaluadores,
            pero conserva las evaluaciones ya registradas.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditor({ tipo: "crear" })}
          className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-slate-900 text-sm font-semibold text-white hover:bg-slate-800 shadow-xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="size-4" /> Nueva pauta
        </button>
      </div>

      {porAsignatura.map(({ nombre: asignatura, nota, lista }) => (
        <section key={asignatura} className="space-y-2.5">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-800">{asignatura}</h3>
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 rounded-full px-2 py-0.5">
              {lista.length}
            </span>
            <span className="flex-1 h-px bg-slate-200" />
          </div>
          {lista.length === 0 && (
            <p className="text-xs text-slate-500 bg-white border border-dashed border-slate-300 rounded-xl px-4 py-3">
              {nota}
            </p>
          )}
          <ul className="space-y-2">
            {lista.map((p) => (
              <li
                key={p.id}
                className={`bg-white rounded-xl border shadow-2xs transition-colors ${
                  expandida === p.id ? "border-sky-300" : "border-slate-200/90 hover:border-slate-300"
                }`}
              >
                <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <button
                    type="button"
                    onClick={() => expandir(p)}
                    className="flex-1 min-w-0 text-left cursor-pointer flex items-start gap-2"
                    aria-expanded={expandida === p.id}
                  >
                    <span className="mt-0.5 text-slate-400 shrink-0">
                      {expandida === p.id ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                    </span>
                    <span className="min-w-0 space-y-1.5">
                      <span
                        className={`block text-sm font-semibold leading-snug ${p.activa ? "text-slate-900" : "text-slate-500"}`}
                      >
                        {p.titulo}
                      </span>
                      <span className="flex flex-wrap gap-1.5">
                        <Etiqueta>{ESPECIALIDAD_LABEL[p.especialidad] ?? p.especialidad}</Etiqueta>
                        <Etiqueta>{MOMENTO_LABEL[p.momento] ?? p.momento}</Etiqueta>
                        <Etiqueta>{EVALUADOR_LABEL[p.evaluador] ?? p.evaluador}</Etiqueta>
                        <Etiqueta tenue>
                          {p.criteriosCount} indicadores · {p.puntajeMaximo} pts
                        </Etiqueta>
                        {p.ponderacion && <Etiqueta tenue>pondera {p.ponderacion}</Etiqueta>}
                        {p.version && <Etiqueta tenue>v. {p.version}</Etiqueta>}
                      </span>
                    </span>
                  </button>
                  <div className="flex items-center gap-1 self-end sm:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => setEditor({ tipo: "editar", id: p.id })}
                      className="size-8 grid place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-sky-700 cursor-pointer"
                      aria-label={`Editar ${p.titulo}`}
                      title="Editar"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditor({ tipo: "duplicar", id: p.id })}
                      className="size-8 grid place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-sky-700 cursor-pointer"
                      aria-label={`Crear nueva versión de ${p.titulo}`}
                      title="Crear nueva versión"
                    >
                      <Copy className="size-4" />
                    </button>
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
                          : "bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      <span className={`size-1.5 rounded-full ${p.activa ? "bg-emerald-500" : "bg-slate-400"}`} />
                      {cambiando === p.id ? "…" : p.activa ? "Activa" : "Inactiva"}
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
                    {criterios[p.id]?.map((c, i, todos) => (
                      <li key={c.id} className="text-xs text-slate-700 leading-relaxed">
                        {c.dimension && c.dimension !== todos[i - 1]?.dimension && (
                          <span className="block font-bold text-slate-800 mt-2 mb-1">{c.dimension}</span>
                        )}
                        <span className="font-bold text-sky-700 mr-1.5">{c.numero}</span>
                        {c.texto}
                      </li>
                    ))}
                  </ol>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}

      <PautaEditor
        user={user}
        modo={editor}
        onCerrar={() => setEditor(null)}
        onGuardada={(pauta) => alTerminarEdicion(pauta.id)}
        onEliminada={(id) => alTerminarEdicion(id)}
        onNuevaVersion={(id) => setEditor({ tipo: "duplicar", id })}
      />
    </div>
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
