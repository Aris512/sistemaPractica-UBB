import { useEffect, useMemo, useState } from "react";
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="text-sm text-slate-600 flex-1 min-w-64">
          Pautas oficiales organizadas por práctica, especialidad y momento de evaluación. Una pauta desactivada deja de
          aparecer a los evaluadores, pero conserva las evaluaciones ya registradas.
        </p>
        <button
          type="button"
          onClick={() => setEditor({ tipo: "crear" })}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-sky-600 text-sm font-semibold text-white hover:bg-sky-700 transition-colors cursor-pointer"
        >
          <Plus className="size-4" /> Nueva pauta
        </button>
      </div>
      {porAsignatura.map(({ nombre: asignatura, nota, lista }) => (
        <section key={asignatura} className="space-y-2">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">{asignatura}</h3>
          {lista.length === 0 && (
            <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-3">{nota}</p>
          )}
          <ul className="space-y-2">
            {lista.map((p) => (
              <li key={p.id} className="bg-white rounded-2xl border border-slate-200/90 shadow-xs">
                <div className="p-4 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => expandir(p)}
                    className="flex-1 min-w-0 text-left cursor-pointer"
                    aria-expanded={expandida === p.id}
                  >
                    <p className="text-sm font-semibold text-slate-900 leading-snug">{p.titulo}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {ESPECIALIDAD_LABEL[p.especialidad] ?? p.especialidad} · {MOMENTO_LABEL[p.momento] ?? p.momento}{" "}
                      · {EVALUADOR_LABEL[p.evaluador] ?? p.evaluador} · {p.criteriosCount} indicadores ·{" "}
                      {p.puntajeMaximo} pts
                      {p.ponderacion ? ` · pondera ${p.ponderacion}` : ""}
                      {p.version ? ` · v. ${p.version}` : ""}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => expandir(p)}
                    className="text-slate-400 cursor-pointer"
                    aria-label="Ver indicadores"
                  >
                    {expandida === p.id ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditor({ tipo: "editar", id: p.id })}
                    className="shrink-0 size-8 grid place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-sky-700 cursor-pointer"
                    aria-label={`Editar ${p.titulo}`}
                    title="Editar"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditor({ tipo: "duplicar", id: p.id })}
                    className="shrink-0 size-8 grid place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-sky-700 cursor-pointer"
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
                    className={`shrink-0 h-8 px-3 rounded-full text-xs font-semibold border transition-colors cursor-pointer disabled:opacity-60 ${
                      p.activa
                        ? "bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100"
                        : "bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {cambiando === p.id ? "…" : p.activa ? "Activa" : "Inactiva"}
                  </button>
                </div>
                {expandida === p.id && (
                  <ol className="border-t border-slate-100 px-4 py-3 space-y-2 max-h-96 overflow-y-auto">
                    {!criterios[p.id] && (
                      <li className="text-xs text-slate-500 flex items-center gap-2">
                        <Loader2 className="size-3 animate-spin" /> Cargando indicadores…
                      </li>
                    )}
                    {criterios[p.id]?.map((c) => (
                      <li key={c.id} className="text-xs text-slate-700 leading-relaxed">
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
