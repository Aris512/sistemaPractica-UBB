import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ClipboardPaste, Copy, Loader2, Plus, Trash2 } from "lucide-react";
import { sileo } from "sileo";
import { ConfirmDeleteDialog } from "@/components/ui/ConfirmDeleteDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { UserSession } from "@/types/auth";
import {
  actualizarPauta,
  crearPauta,
  eliminarPauta,
  getPautaDetalle,
  type ModoCalculo,
  type PautaDetalle,
  type PautaPayload,
} from "@/services/pautaApi";

/** Qué se está haciendo en el editor: pauta nueva, edición de una existente o copia como nueva versión. */
export type ModoEditor =
  | { tipo: "crear" }
  | { tipo: "editar"; id: number }
  | { tipo: "duplicar"; id: number };

interface PautaEditorProps {
  user: UserSession;
  modo: ModoEditor | null;
  onCerrar: () => void;
  onGuardada: (pauta: PautaDetalle) => void;
  onEliminada: (id: number) => void;
  onNuevaVersion: (id: number) => void;
}

interface Formulario {
  codigo: string;
  titulo: string;
  asignatura: string;
  tipo: string;
  especialidad: string;
  momento: string;
  evaluador: string;
  modoCalculo: ModoCalculo;
  escalaMin: string;
  escalaMax: string;
  exigencia: string;
  ponderacion: string;
  version: string;
  instrucciones: string;
  activa: boolean;
}

interface FilaCriterio {
  clave: number;
  dimension: string;
  numero: string;
  texto: string;
}

const ASIGNATURAS_BASE = [
  "Aproximación al Sistema Escolar",
  "Ambientes de Aprendizaje",
  "Trabajo Colaborativo en Aula",
  "Investigación en Aula",
  "Práctica Pedagógica",
  "Práctica Profesional",
];

const FORMULARIO_VACIO: Formulario = {
  codigo: "",
  titulo: "",
  asignatura: "",
  tipo: "Observación de aula",
  especialidad: "ESPECIALIDAD",
  momento: "UNICA",
  evaluador: "COLABORADOR",
  modoCalculo: "ESCALA_EXIGENCIA",
  escalaMin: "2",
  escalaMax: "7",
  exigencia: "60",
  ponderacion: "",
  version: "",
  instrucciones: "",
  activa: true,
};

const aEntero = (v: string): number => (v.trim() === "" ? Number.NaN : Number(v));

const entradaClase =
  "w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 disabled:bg-slate-100 disabled:text-slate-500";

function Campo({
  etiqueta,
  ayuda,
  children,
  className = "",
}: {
  etiqueta: string;
  ayuda?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block space-y-1 ${className}`}>
      <span className="text-xs font-semibold text-slate-700">{etiqueta}</span>
      {children}
      {ayuda && <span className="block text-[11px] text-slate-500 leading-snug">{ayuda}</span>}
    </label>
  );
}

function aFormulario(d: PautaDetalle, duplicar: boolean): Formulario {
  return {
    codigo: duplicar ? `${d.codigo}-V2` : d.codigo,
    titulo: d.titulo,
    asignatura: d.asignatura,
    tipo: d.tipo ?? "",
    especialidad: d.especialidad,
    momento: d.momento,
    evaluador: d.evaluador,
    modoCalculo: d.modoCalculo,
    escalaMin: String(d.escalaMin ?? 1),
    escalaMax: String(d.escalaMax ?? 7),
    exigencia: String(d.exigencia ?? 60),
    ponderacion: d.ponderacion ?? "",
    // Una copia empieza sin versión y desactivada: se activa cuando esté lista, para no duplicar la pauta ante los evaluadores.
    version: duplicar ? "" : (d.version ?? ""),
    instrucciones: d.instrucciones ?? "",
    activa: duplicar ? false : d.activa,
  };
}

interface ContenidoProps {
  user: UserSession;
  tipo: ModoEditor["tipo"];
  id: number | null;
  onCerrar: () => void;
  onGuardada: (pauta: PautaDetalle) => void;
  onEliminada: (id: number) => void;
  onNuevaVersion: (id: number) => void;
}

function EditorContenido({ user, tipo, id, onCerrar, onGuardada, onEliminada, onNuevaVersion }: ContenidoProps) {
  const [form, setForm] = useState<Formulario>(FORMULARIO_VACIO);
  const [filas, setFilas] = useState<FilaCriterio[]>([]);
  const [detalle, setDetalle] = useState<PautaDetalle | null>(null);
  const [asignaturas, setAsignaturas] = useState<string[]>([]);
  const [cargando, setCargando] = useState(tipo !== "crear");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
  const [mostrarPegar, setMostrarPegar] = useState(false);
  const [textoPegado, setTextoPegado] = useState("");
  const contador = useRef(0);

  const nuevaFila = (dimension = "", numero = "", texto = ""): FilaCriterio => {
    contador.current += 1;
    return { clave: contador.current, dimension, numero, texto };
  };

  // Asignaturas tal como están en la base de datos: el nombre debe coincidir exactamente con el de la práctica.
  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const res = await fetch("/api/coordinador/asignaturas-practica");
        if (!res.ok) return;
        const data = (await res.json()) as { nombre: string }[];
        if (!cancelado) setAsignaturas(data.map((a) => a.nombre));
      } catch {
        /* se usa la lista base */
      }
    })();
    return () => {
      cancelado = true;
    };
  }, []);

  useEffect(() => {
    if (tipo === "crear" || id == null) return;
    let cancelado = false;
    (async () => {
      try {
        const d = await getPautaDetalle(user.rut, id);
        if (cancelado) return;
        setDetalle(d);
        setForm(aFormulario(d, tipo === "duplicar"));
        setFilas(d.criterios.map((c) => nuevaFila(c.dimension ?? "", c.numero, c.texto)));
      } catch (e) {
        if (!cancelado) setError(e instanceof Error ? e.message : "No se pudo cargar la pauta.");
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [tipo, id, user.rut]);

  const bloqueada = tipo === "editar" && detalle?.tieneEvaluaciones === true;

  const opcionesAsignatura = useMemo(() => {
    const base = asignaturas.length > 0 ? asignaturas : ASIGNATURAS_BASE;
    return form.asignatura && !base.includes(form.asignatura) ? [form.asignatura, ...base] : base;
  }, [asignaturas, form.asignatura]);

  const dimensiones = useMemo(() => Array.from(new Set(filas.map((f) => f.dimension.trim()).filter(Boolean))), [filas]);

  const min = aEntero(form.escalaMin);
  const max = aEntero(form.escalaMax);
  const exigencia = aEntero(form.exigencia);
  const puntajeMaximo = filas.length * (Number.isFinite(max) ? max : 0);
  const puntajeAprobacion =
    form.modoCalculo === "ESCALA_EXIGENCIA" && Number.isFinite(exigencia) ? (puntajeMaximo * exigencia) / 100 : null;

  const cambiar = <K extends keyof Formulario>(campo: K, valor: Formulario[K]) =>
    setForm((prev) => ({ ...prev, [campo]: valor }));

  // ---- Indicadores
  const agregarFila = () =>
    setFilas((prev) => {
      const dimension = prev.length > 0 ? prev[prev.length - 1].dimension : "";
      const numero = String(prev.filter((f) => f.dimension === dimension).length + 1);
      return [...prev, nuevaFila(dimension, numero, "")];
    });

  const cambiarFila = (clave: number, campo: "dimension" | "numero" | "texto", valor: string) =>
    setFilas((prev) => prev.map((f) => (f.clave === clave ? { ...f, [campo]: valor } : f)));

  const quitarFila = (clave: number) => setFilas((prev) => prev.filter((f) => f.clave !== clave));

  const moverFila = (indice: number, delta: -1 | 1) =>
    setFilas((prev) => {
      const destino = indice + delta;
      if (destino < 0 || destino >= prev.length) return prev;
      const copia = [...prev];
      [copia[indice], copia[destino]] = [copia[destino], copia[indice]];
      return copia;
    });

  const agregarPegados = () => {
    const lineas = textoPegado
      .split(/\r?\n/)
      .map((l) => l.replace(/^\s*\d+\s*[.)-]\s*/, "").trim())
      .filter(Boolean);
    if (lineas.length === 0) return;
    setFilas((prev) => {
      const dimension = prev.length > 0 ? prev[prev.length - 1].dimension : "";
      let n = prev.filter((f) => f.dimension === dimension).length;
      return [...prev, ...lineas.map((texto) => nuevaFila(dimension, String(++n), texto))];
    });
    setTextoPegado("");
    setMostrarPegar(false);
  };

  // ---- Guardado
  const validar = (): string | null => {
    if (!form.titulo.trim()) return "Escriba el título de la pauta.";
    if (tipo !== "editar" && !form.codigo.trim()) return "Escriba un código único para la pauta.";
    if (!form.asignatura) return "Elija la asignatura de la práctica.";
    if (!bloqueada) {
      if (!Number.isInteger(min) || !Number.isInteger(max) || min < 0 || max > 10 || min >= max) {
        return "La escala de puntaje debe tener un mínimo menor que el máximo, con números enteros entre 0 y 10.";
      }
      if (form.modoCalculo === "ESCALA_EXIGENCIA" && (!Number.isInteger(exigencia) || exigencia < 1 || exigencia > 99)) {
        return "La exigencia debe estar entre 1 y 99 %.";
      }
      if (filas.length === 0) return "Agregue al menos un indicador.";
      if (filas.some((f) => !f.texto.trim())) return "Todos los indicadores necesitan texto.";
    }
    return null;
  };

  const guardar = async () => {
    const problema = validar();
    if (problema) {
      setError(problema);
      return;
    }
    setError(null);
    setGuardando(true);
    try {
      const comunes: PautaPayload = {
        titulo: form.titulo.trim(),
        tipo: form.tipo.trim(),
        ponderacion: form.ponderacion.trim(),
        version: form.version.trim(),
        instrucciones: form.instrucciones.trim(),
        activa: form.activa,
      };
      let resultado: PautaDetalle;
      if (tipo === "editar" && id != null) {
        // Con evaluaciones registradas solo se envían los campos que el backend permite cambiar.
        const payload: PautaPayload = bloqueada
          ? comunes
          : { ...comunes, ...estructura() };
        resultado = await actualizarPauta(user.rut, id, payload);
      } else {
        resultado = await crearPauta(user.rut, { ...comunes, codigo: form.codigo.trim(), ...estructura() });
      }
      sileo.success({
        title: tipo === "editar" ? "Pauta actualizada" : "Pauta creada",
        description: resultado.titulo,
      });
      onGuardada(resultado);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar la pauta.");
    } finally {
      setGuardando(false);
    }
  };

  const estructura = (): PautaPayload => ({
    asignatura: form.asignatura,
    especialidad: form.especialidad,
    momento: form.momento,
    evaluador: form.evaluador,
    modoCalculo: form.modoCalculo,
    escalaMin: min,
    escalaMax: max,
    exigencia: form.modoCalculo === "ESCALA_EXIGENCIA" ? exigencia : null,
    criterios: filas.map((f) => ({
      dimension: f.dimension.trim() || null,
      numero: f.numero.trim() || undefined,
      texto: f.texto.trim(),
    })),
  });

  const eliminar = async () => {
    if (id == null) return;
    try {
      await eliminarPauta(user.rut, id);
      sileo.success({ title: "Pauta eliminada", description: form.titulo });
      onEliminada(id);
    } catch (e) {
      sileo.error({
        title: "No se pudo eliminar",
        description: e instanceof Error ? e.message : "Intente nuevamente.",
      });
    }
  };

  const titulo =
    tipo === "crear" ? "Nueva pauta" : tipo === "duplicar" ? "Nueva versión de la pauta" : "Editar pauta";
  const descripcion =
    tipo === "duplicar"
      ? "Es una copia de la pauta original: cambie lo necesario. Queda desactivada hasta que la active."
      : "Los indicadores se muestran a los evaluadores en este orden, igual que en la pauta en papel.";

  if (cargando) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>Cargando la pauta…</DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 text-sm text-slate-500 py-8 justify-center">
          <Loader2 className="size-4 animate-spin" /> Cargando…
        </div>
        {error && <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3">{error}</p>}
      </>
    );
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-base font-bold text-slate-900">{titulo}</DialogTitle>
        <DialogDescription className="text-slate-500">{descripcion}</DialogDescription>
      </DialogHeader>

      <div className="space-y-5 overflow-y-auto pr-1 -mr-1 max-h-[65vh]">
        {bloqueada && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 space-y-2">
            <p className="leading-relaxed">
              Esta pauta ya tiene evaluaciones registradas. Puede editar el título, el tipo, la ponderación, la versión,
              las instrucciones y el estado. Los indicadores, la escala y el evaluador quedan bloqueados para no alterar
              las notas ya calculadas.
            </p>
            {id != null && (
              <button
                type="button"
                onClick={() => onNuevaVersion(id)}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-amber-400 bg-white font-semibold text-amber-900 hover:bg-amber-100 cursor-pointer"
              >
                <Copy className="size-3.5" /> Crear una nueva versión
              </button>
            )}
          </div>
        )}

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Campo etiqueta="Título" className="sm:col-span-2">
            <input
              className={entradaClase}
              value={form.titulo}
              onChange={(e) => cambiar("titulo", e.target.value)}
              placeholder="Ej.: Pauta 1ª observación – Especialidad (Profesor/a colaborador/a)"
            />
          </Campo>
          <Campo
            etiqueta="Código"
            ayuda={tipo === "editar" ? "El código no se puede cambiar." : "Identificador único, por ejemplo PED-ESP-1-COL."}
          >
            <input
              className={entradaClase}
              value={form.codigo}
              onChange={(e) => cambiar("codigo", e.target.value.toUpperCase().replace(/\s+/g, "-"))}
              disabled={tipo === "editar"}
              placeholder="PED-ESP-1-COL"
            />
          </Campo>
          <Campo etiqueta="Asignatura" ayuda="Debe coincidir con la asignatura de la práctica del estudiante.">
            <select
              className={entradaClase}
              value={form.asignatura}
              onChange={(e) => cambiar("asignatura", e.target.value)}
              disabled={bloqueada}
            >
              <option value="">Seleccione…</option>
              {opcionesAsignatura.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </Campo>
          <Campo etiqueta="Especialidad">
            <select
              className={entradaClase}
              value={form.especialidad}
              onChange={(e) => cambiar("especialidad", e.target.value)}
              disabled={bloqueada}
            >
              <option value="ESPECIALIDAD">Especialidad</option>
              <option value="ORIENTACION">Orientación</option>
            </select>
          </Campo>
          <Campo etiqueta="Momento de evaluación">
            <select
              className={entradaClase}
              value={form.momento}
              onChange={(e) => cambiar("momento", e.target.value)}
              disabled={bloqueada}
            >
              <option value="PRIMERA">1ª observación</option>
              <option value="SEGUNDA">2ª observación</option>
              <option value="UNICA">Única</option>
            </select>
          </Campo>
          <Campo etiqueta="Quién evalúa">
            <select
              className={entradaClase}
              value={form.evaluador}
              onChange={(e) => cambiar("evaluador", e.target.value)}
              disabled={bloqueada}
            >
              <option value="COLABORADOR">Profesor/a colaborador/a</option>
              <option value="TUTOR">Tutor/a</option>
              <option value="ACADEMICO">Académico/a (profesor de la asignatura)</option>
            </select>
          </Campo>
          <Campo etiqueta="Tipo de instrumento">
            <input
              className={entradaClase}
              value={form.tipo}
              onChange={(e) => cambiar("tipo", e.target.value)}
              placeholder="Observación de aula"
            />
          </Campo>
        </section>

        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Campo etiqueta="Cálculo de la nota" className="col-span-2">
            <select
              className={entradaClase}
              value={form.modoCalculo}
              onChange={(e) => cambiar("modoCalculo", e.target.value as ModoCalculo)}
              disabled={bloqueada}
            >
              <option value="ESCALA_EXIGENCIA">Escala con exigencia (2,0 a 7,0)</option>
              <option value="PROMEDIO">Promedio de los puntajes</option>
            </select>
          </Campo>
          <Campo etiqueta="Puntaje mínimo">
            <input
              className={entradaClase}
              inputMode="numeric"
              value={form.escalaMin}
              onChange={(e) => cambiar("escalaMin", e.target.value)}
              disabled={bloqueada}
            />
          </Campo>
          <Campo etiqueta="Puntaje máximo">
            <input
              className={entradaClase}
              inputMode="numeric"
              value={form.escalaMax}
              onChange={(e) => cambiar("escalaMax", e.target.value)}
              disabled={bloqueada}
            />
          </Campo>
          {form.modoCalculo === "ESCALA_EXIGENCIA" && (
            <Campo etiqueta="Exigencia (%)">
              <input
                className={entradaClase}
                inputMode="numeric"
                value={form.exigencia}
                onChange={(e) => cambiar("exigencia", e.target.value)}
                disabled={bloqueada}
              />
            </Campo>
          )}
          <Campo etiqueta="Ponderación">
            <input
              className={entradaClase}
              value={form.ponderacion}
              onChange={(e) => cambiar("ponderacion", e.target.value)}
              placeholder="Ej.: 5%"
            />
          </Campo>
          <Campo etiqueta="Versión">
            <input
              className={entradaClase}
              value={form.version}
              onChange={(e) => cambiar("version", e.target.value)}
              placeholder="Ej.: 2026-2"
            />
          </Campo>
        </section>

        <Campo etiqueta="Instrucciones para el evaluador">
          <textarea
            className="w-full min-h-20 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500"
            value={form.instrucciones}
            onChange={(e) => cambiar("instrucciones", e.target.value)}
            placeholder="Texto que aparece al inicio de la pauta, igual que en el papel."
          />
        </Campo>

        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Indicadores</h3>
              <p className="text-xs text-slate-500">
                {filas.length} {filas.length === 1 ? "indicador" : "indicadores"} · puntaje máximo {puntajeMaximo} pts
                {puntajeAprobacion !== null &&
                  ` · nota 4,0 desde ${puntajeAprobacion.toLocaleString("es-CL", { maximumFractionDigits: 1 })} pts`}
              </p>
            </div>
            {!bloqueada && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMostrarPegar((v) => !v)}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  <ClipboardPaste className="size-3.5" /> Pegar lista
                </button>
                <button
                  type="button"
                  onClick={agregarFila}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-sky-300 bg-sky-50 text-xs font-semibold text-sky-800 hover:bg-sky-100 cursor-pointer"
                >
                  <Plus className="size-3.5" /> Agregar indicador
                </button>
              </div>
            )}
          </div>

          {mostrarPegar && !bloqueada && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
              <p className="text-xs text-slate-600">
                Pegue un indicador por línea. Se agregan al final, con la dimensión del último indicador; los números
                iniciales como “1.” o “2)” se ignoran.
              </p>
              <textarea
                className="w-full min-h-28 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500"
                value={textoPegado}
                onChange={(e) => setTextoPegado(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setMostrarPegar(false)}
                  className="h-8 px-3 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={agregarPegados}
                  disabled={!textoPegado.trim()}
                  className="h-8 px-3 rounded-lg bg-sky-600 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-50 cursor-pointer"
                >
                  Agregar indicadores
                </button>
              </div>
            </div>
          )}

          <datalist id="dimensiones-pauta">
            {dimensiones.map((d) => (
              <option key={d} value={d} />
            ))}
          </datalist>

          {filas.length === 0 && (
            <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
              Todavía no hay indicadores. Agregue uno o pegue la lista completa desde la pauta en papel.
            </p>
          )}

          <ol className="space-y-2">
            {filas.map((f, i) => (
              <li key={f.clave} className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    aria-label={`Número del indicador ${i + 1}`}
                    className={`${entradaClase} w-14 text-center shrink-0 font-semibold`}
                    value={f.numero}
                    onChange={(e) => cambiarFila(f.clave, "numero", e.target.value)}
                    disabled={bloqueada}
                  />
                  <input
                    aria-label={`Dimensión del indicador ${i + 1}`}
                    list="dimensiones-pauta"
                    className={entradaClase}
                    value={f.dimension}
                    onChange={(e) => cambiarFila(f.clave, "dimension", e.target.value)}
                    placeholder="Dimensión o criterio (ej.: Dimensión A – Conocimiento y preparación)"
                    disabled={bloqueada}
                  />
                  {!bloqueada && (
                    <div className="flex shrink-0 items-center">
                      <button
                        type="button"
                        onClick={() => moverFila(i, -1)}
                        disabled={i === 0}
                        aria-label="Subir indicador"
                        className="size-8 grid place-items-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowUp className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moverFila(i, 1)}
                        disabled={i === filas.length - 1}
                        aria-label="Bajar indicador"
                        className="size-8 grid place-items-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowDown className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => quitarFila(f.clave)}
                        aria-label="Quitar indicador"
                        className="size-8 grid place-items-center rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  )}
                </div>
                <textarea
                  aria-label={`Texto del indicador ${i + 1}`}
                  className="w-full min-h-16 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 disabled:bg-slate-100 disabled:text-slate-600"
                  value={f.texto}
                  onChange={(e) => cambiarFila(f.clave, "texto", e.target.value)}
                  placeholder="Texto del indicador, tal como aparece en la pauta"
                  disabled={bloqueada}
                />
              </li>
            ))}
          </ol>
        </section>

        <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-3 cursor-pointer">
          <input
            type="checkbox"
            className="mt-0.5 size-4 accent-sky-600"
            checked={form.activa}
            onChange={(e) => cambiar("activa", e.target.checked)}
          />
          <span className="text-sm text-slate-700">
            <span className="font-semibold text-slate-900">Pauta activa.</span> Los evaluadores solo ven las pautas
            activas.
          </span>
        </label>

        {error && (
          <p role="alert" className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3">
            {error}
          </p>
        )}
      </div>

      <DialogFooter className="gap-2 sm:justify-between">
        <div>
          {tipo === "editar" && !bloqueada && id != null && (
            <button
              type="button"
              onClick={() => setConfirmarEliminar(true)}
              className="h-9 px-3 rounded-lg text-sm font-semibold text-rose-700 hover:bg-rose-50 cursor-pointer"
            >
              Eliminar pauta
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCerrar}
            disabled={guardando}
            className="h-9 px-4 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={guardar}
            disabled={guardando}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-sky-600 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60 cursor-pointer"
          >
            {guardando && <Loader2 className="size-4 animate-spin" />}
            {tipo === "editar" ? "Guardar cambios" : "Crear pauta"}
          </button>
        </div>
      </DialogFooter>

      <ConfirmDeleteDialog
        open={confirmarEliminar}
        onOpenChange={setConfirmarEliminar}
        onConfirm={eliminar}
        title="Eliminar pauta"
        description="Se eliminará la pauta y todos sus indicadores. Esta acción no se puede deshacer."
      />
    </>
  );
}

/** Crear, editar o copiar como nueva versión una pauta del catálogo (HU-21). Solo el coordinador la usa. */
export function PautaEditor({ user, modo, onCerrar, onGuardada, onEliminada, onNuevaVersion }: PautaEditorProps) {
  return (
    <Dialog open={modo !== null} onOpenChange={(abierto) => !abierto && onCerrar()}>
      <DialogContent className="sm:max-w-3xl bg-white border border-slate-200">
        {modo && (
          <EditorContenido
            key={`${modo.tipo}-${modo.tipo === "crear" ? "nueva" : modo.id}`}
            user={user}
            tipo={modo.tipo}
            id={modo.tipo === "crear" ? null : modo.id}
            onCerrar={onCerrar}
            onGuardada={onGuardada}
            onEliminada={onEliminada}
            onNuevaVersion={onNuevaVersion}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
