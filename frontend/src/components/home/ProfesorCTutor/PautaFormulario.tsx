import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Cloud,
  CloudOff,
  Eraser,
  Eye,
  Loader2,
  Lock,
  PencilLine,
  RotateCcw,
  Save,
  X,
} from "lucide-react";
import { sileo } from "sileo";
import type { UserSession } from "@/types/auth";
import { VoiceNoteRecorder } from "@/components/ui/VoiceNoteRecorder";
import {
  getAplicacion,
  getPautaDetalle,
  guardarAplicacion,
  reabrirAplicacion,
  type AplicacionPauta,
  type PautaDetalle,
} from "@/services/pautaApi";

interface PautaFormularioProps {
  pautaId: number;
  practicaId: number;
  estudianteNombre: string;
  user: UserSession;
  onBack: () => void;
  /** Muestra la pauta sin permitir cambios (estudiante, profesor de asignatura, coordinador). */
  soloLectura?: boolean;
  /** Solo coordinador: permite devolver una pauta finalizada a borrador. */
  puedeReabrir?: boolean;
  textoVolver?: string;
}

type EstadoGuardado = "idle" | "guardando" | "guardado" | "error";

const NIVELES: Record<number, string> = {
  2: "Insatisfactorio",
  3: "Básico",
  4: "Aceptable",
  5: "Adecuado",
  6: "Competente",
  7: "Destacado",
};

const MOMENTO_LABEL: Record<string, string> = {
  PRIMERA: "Primera observación",
  SEGUNDA: "Segunda observación",
  UNICA: "Observación única",
};

const EVALUADOR_LABEL: Record<string, string> = {
  COLABORADOR: "Profesor/a colaborador/a",
  TUTOR: "Tutor/a",
  ACADEMICO: "Académico/a",
};

/** Puntajes y observaciones de una aplicación tal como quedaron guardados. */
function aEstado(app: AplicacionPauta): { respuestas: Record<number, number>; observaciones: string } {
  const respuestas: Record<number, number> = {};
  app.respuestas.forEach((r) => {
    if (r.puntaje != null) respuestas[r.criterioId] = r.puntaje;
  });
  return { respuestas, observaciones: app.observaciones ?? "" };
}

function formatearFecha(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" });
}

export function PautaFormulario({
  pautaId,
  practicaId,
  estudianteNombre,
  user,
  onBack,
  soloLectura = false,
  puedeReabrir = false,
  textoVolver = "Volver a las pautas",
}: PautaFormularioProps) {
  const [pauta, setPauta] = useState<PautaDetalle | null>(null);
  const [aplicacion, setAplicacion] = useState<AplicacionPauta | null>(null);
  const [respuestas, setRespuestas] = useState<Record<number, number>>({});
  const [observaciones, setObservaciones] = useState("");
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [guardado, setGuardado] = useState<EstadoGuardado>("idle");
  const [finalizando, setFinalizando] = useState(false);
  const [reabriendo, setReabriendo] = useState(false);
  // Lo último guardado en el servidor: "Cancelar" vuelve a esto y sirve para saber si hay cambios sin guardar.
  const [base, setBase] = useState<{ respuestas: Record<number, number>; observaciones: string }>({
    respuestas: {},
    observaciones: "",
  });

  const finalizada = aplicacion?.estado === "FINALIZADA";
  const bloqueada = finalizada || soloLectura;
  const hayCambios = useMemo(
    () =>
      !bloqueada &&
      (observaciones !== base.observaciones ||
        JSON.stringify(respuestas) !== JSON.stringify(base.respuestas)),
    [bloqueada, respuestas, observaciones, base]
  );

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const [detalle, guardada] = await Promise.all([
          getPautaDetalle(user.rut, pautaId),
          getAplicacion(user.rut, pautaId, practicaId),
        ]);
        if (cancelado) return;
        setPauta(detalle);
        setAplicacion(guardada);
        if (guardada) {
          const inicial = aEstado(guardada);
          setRespuestas(inicial.respuestas);
          setObservaciones(inicial.observaciones);
          setBase(inicial);
        }
      } catch (e) {
        if (!cancelado) setErrorCarga(e instanceof Error ? e.message : "Error al cargar la pauta");
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [pautaId, practicaId, user.rut]);

  // Solo se guarda con "Guardar" o "Finalizar". Se envían todos los indicadores: los vacíos (null) se borran,
  // así "Limpiar respuestas" también queda guardado.
  const guardar = useCallback(
    async (finalizar = false) => {
      if (!pauta) throw new Error("La pauta no está cargada.");
      setGuardado("guardando");
      try {
        const res = await guardarAplicacion(user.rut, pautaId, practicaId, {
          observaciones,
          respuestas: pauta.criterios.map((c) => ({ criterioId: c.id, puntaje: respuestas[c.id] ?? null })),
          finalizar,
        });
        setAplicacion(res);
        setBase(aEstado(res));
        setGuardado("guardado");
        return res;
      } catch (e) {
        setGuardado("error");
        throw e;
      }
    },
    [pauta, respuestas, observaciones, pautaId, practicaId, user.rut]
  );

  // Aviso del navegador si se cierra o recarga la pestaña con cambios sin guardar.
  useEffect(() => {
    if (!hayCambios) return;
    const avisar = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", avisar);
    return () => window.removeEventListener("beforeunload", avisar);
  }, [hayCambios]);

  const seleccionar = (criterioId: number, puntaje: number) => {
    if (bloqueada) return;
    setRespuestas((prev) => ({ ...prev, [criterioId]: puntaje }));
  };

  const guardarManual = async () => {
    try {
      await guardar();
      sileo.success({ title: "Pauta guardada", description: "Puede continuarla más tarde." });
    } catch (e) {
      sileo.error({
        title: "No se pudo guardar",
        description: e instanceof Error ? e.message : "Intente nuevamente.",
      });
    }
  };

  /** Sale descartando lo que no se haya guardado. */
  const cancelar = () => {
    if (hayCambios && !window.confirm("Se descartarán los cambios que no ha guardado. ¿Desea salir de la pauta?")) {
      return;
    }
    onBack();
  };

  const limpiar = () => {
    if (Object.keys(respuestas).length === 0 && !observaciones) return;
    const ok = window.confirm(
      "Se borrarán todos los puntajes y las observaciones de esta pauta. El cambio se aplica al presionar «Guardar». ¿Desea continuar?"
    );
    if (!ok) return;
    setRespuestas({});
    setObservaciones("");
  };

  const finalizar = async () => {
    if (!pauta) return;
    const ok = window.confirm(
      "Al finalizar la pauta ya no podrá modificarse. ¿Desea finalizar y registrar la evaluación?"
    );
    if (!ok) return;
    setFinalizando(true);
    try {
      const res = await guardar(true);
      sileo.success({
        title: "Pauta finalizada",
        description: res.nota != null ? `Nota obtenida: ${res.nota.toFixed(1)}` : "Evaluación registrada.",
      });
    } catch (e) {
      sileo.error({
        title: "No se pudo finalizar",
        description: e instanceof Error ? e.message : "Intente nuevamente.",
      });
    } finally {
      setFinalizando(false);
    }
  };

  const reabrir = async () => {
    const ok = window.confirm(
      "La pauta volverá a borrador y el evaluador podrá corregirla. La nota se recalculará al finalizar de nuevo. ¿Desea continuar?"
    );
    if (!ok) return;
    setReabriendo(true);
    try {
      const res = await reabrirAplicacion(user.rut, pautaId, practicaId);
      setAplicacion(res);
      sileo.success({ title: "Pauta reabierta", description: "El evaluador puede corregirla." });
    } catch (e) {
      sileo.error({
        title: "No se pudo reabrir",
        description: e instanceof Error ? e.message : "Intente nuevamente.",
      });
    } finally {
      setReabriendo(false);
    }
  };

  const respondidos = Object.keys(respuestas).length;
  const total = pauta?.criterios.length ?? 0;
  const completa = total > 0 && respondidos === total;
  const puntajeActual = useMemo(() => Object.values(respuestas).reduce((a, b) => a + b, 0), [respuestas]);

  // Agrupa los criterios por dimensión respetando el orden del papel.
  const grupos = useMemo(() => {
    const out: { titulo: string; items: PautaDetalle["criterios"] }[] = [];
    pauta?.criterios.forEach((c) => {
      const titulo = c.dimension ?? "";
      const ultimo = out[out.length - 1];
      if (ultimo && ultimo.titulo === titulo) ultimo.items.push(c);
      else out.push({ titulo, items: [c] });
    });
    return out;
  }, [pauta]);

  if (cargando) {
    return (
      <div className="max-w-3xl mx-auto py-16 flex items-center justify-center gap-2 text-slate-500 text-sm">
        <Loader2 className="size-4 animate-spin" /> Cargando pauta…
      </div>
    );
  }
  if (errorCarga || !pauta) {
    return (
      <div className="max-w-3xl mx-auto py-10 space-y-4">
        <BotonVolver onClick={onBack} texto={textoVolver} />
        <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-4">
          {errorCarga ?? "No se encontró la pauta."}
        </p>
      </div>
    );
  }

  const niveles: number[] = [];
  for (let n = pauta.escalaMin; n <= pauta.escalaMax; n++) niveles.push(n);
  const usaNiveles = pauta.escalaMin === 2 && pauta.escalaMax === 7;

  return (
    <div className="max-w-3xl mx-auto pb-40 sm:pb-28 space-y-5">
      <div className="pt-4">
        <BotonVolver onClick={cancelar} texto={textoVolver} />
      </div>

      <header className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
          {pauta.asignatura} · {MOMENTO_LABEL[pauta.momento] ?? pauta.momento}
        </p>
        <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">{pauta.titulo}</h1>
        <p className="text-sm text-slate-600">
          Estudiante: <span className="font-semibold text-slate-800">{estudianteNombre}</span>
        </p>
        {aplicacion?.evaluadorNombre && (
          <p className="text-xs text-slate-500">
            Evaluador/a ({EVALUADOR_LABEL[pauta.evaluador] ?? pauta.evaluador}):{" "}
            <span className="font-semibold text-slate-700">{aplicacion.evaluadorNombre}</span>
            {finalizada && aplicacion.fechaFinalizacion
              ? ` · finalizada el ${formatearFecha(aplicacion.fechaFinalizacion)}`
              : aplicacion.fechaActualizacion
                ? ` · última modificación ${formatearFecha(aplicacion.fechaActualizacion)}`
                : ""}
          </p>
        )}
        {pauta.instrucciones && (
          <p className="text-xs text-slate-500 leading-relaxed pt-1">{pauta.instrucciones}</p>
        )}
        {usaNiveles && (
          <div className="flex flex-wrap gap-1.5 pt-2">
            {niveles.map((n) => (
              <span key={n} className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                <b>{n}</b> {NIVELES[n]}
              </span>
            ))}
          </div>
        )}
        {!usaNiveles && (
          <p className="text-[11px] text-slate-500 pt-1">
            Escala {pauta.escalaMin} (muy bajo) a {pauta.escalaMax} (muy alto).
          </p>
        )}
      </header>

      {finalizada && (
        <div className="flex items-center gap-2 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          <Lock className="size-4 shrink-0" />
          <span className="flex-1">Pauta finalizada. Ya no puede modificarse.</span>
          {puedeReabrir && (
            <button
              type="button"
              onClick={reabrir}
              disabled={reabriendo}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-white border border-emerald-300 text-emerald-800 text-xs font-semibold hover:bg-emerald-100 transition-colors cursor-pointer disabled:opacity-60"
            >
              {reabriendo ? <Loader2 className="size-3.5 animate-spin" /> : <RotateCcw className="size-3.5" />}
              Reabrir
            </button>
          )}
        </div>
      )}
      {soloLectura && !finalizada && (
        <div className="flex items-center gap-2 text-sm text-slate-700 bg-slate-100 border border-slate-200 rounded-xl px-4 py-3">
          <Eye className="size-4 shrink-0" />
          Vista de solo lectura: la pauta aún no está finalizada.
        </div>
      )}

      {grupos.map((g, gi) => (
        <section key={`${g.titulo}-${gi}`} className="space-y-3">
          {g.titulo && (
            <h2 className="text-sm font-bold text-slate-800 bg-slate-100 rounded-lg px-3 py-2 sticky top-0 z-10">
              {g.titulo}
            </h2>
          )}
          {g.items.map((c) => {
            const valor = respuestas[c.id];
            return (
              <article key={c.id} className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs">
                <p className="text-sm text-slate-800 leading-relaxed mb-3">
                  <span className="font-bold text-sky-700 mr-1.5">{c.numero}</span>
                  {c.texto}
                </p>
                <div
                  className="grid gap-1.5"
                  style={{ gridTemplateColumns: `repeat(${niveles.length}, minmax(0, 1fr))` }}
                  role="radiogroup"
                  aria-label={`Puntaje criterio ${c.numero}`}
                >
                  {niveles.map((n) => {
                    const activo = valor === n;
                    return (
                      <button
                        key={n}
                        type="button"
                        role="radio"
                        aria-checked={activo}
                        disabled={bloqueada}
                        onClick={() => seleccionar(c.id, n)}
                        className={`h-12 rounded-xl text-base font-bold border transition-colors cursor-pointer disabled:cursor-not-allowed ${
                          activo
                            ? "bg-sky-600 border-sky-600 text-white shadow-sm disabled:opacity-90"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-sky-50 hover:border-sky-300 disabled:hover:bg-white disabled:hover:border-slate-200 disabled:text-slate-400"
                        }`}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
                {usaNiveles && valor != null && (
                  <p className="text-[11px] text-slate-500 mt-1.5 text-right">{NIVELES[valor]}</p>
                )}
              </article>
            );
          })}
        </section>
      ))}

      <section className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-2">
        <label htmlFor="obs-pauta" className="text-sm font-bold text-slate-800">
          Observaciones
        </label>
        <textarea
          id="obs-pauta"
          rows={5}
          value={observaciones}
          disabled={bloqueada}
          onChange={(e) => setObservaciones(e.target.value)}
          placeholder={bloqueada ? "Sin observaciones registradas." : "Fortalezas y aspectos a mejorar…"}
          className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-300 disabled:bg-slate-50"
        />
        {!bloqueada && (
          <VoiceNoteRecorder
            soloDictado
            defaultCollapsed
            onInsertTranscription={(texto) => {
              setObservaciones((prev) => (prev ? `${prev}\n${texto}` : texto));
              sileo.info({
                title: "Transcripción agregada",
                description: "El texto dictado se copió a las observaciones. Recuerde guardar la pauta.",
              });
            }}
          />
        )}
      </section>

      {/* Barra fija inferior: progreso, puntaje y acciones */}
      <div className="fixed bottom-0 inset-x-0 z-20 bg-white/95 backdrop-blur border-t border-slate-200 px-4 py-3">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 text-xs text-slate-600 mb-1">
              <span>
                {respondidos}/{total} criterios · {puntajeActual}/{pauta.puntajeMaximo} pts
                {aplicacion?.nota != null && (
                  <b className="ml-2 text-slate-900">
                    {pauta.modoCalculo === "PROMEDIO" ? "Promedio" : "Nota"} {aplicacion.nota.toFixed(1)}
                  </b>
                )}
              </span>
              {!soloLectura && <IndicadorGuardado estado={guardado} hayCambios={hayCambios} />}
            </div>
            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-sky-500 transition-all"
                style={{ width: `${total ? (respondidos / total) * 100 : 0}%` }}
              />
            </div>
          </div>
          {!bloqueada && (
            <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto shrink-0">
              <button
                type="button"
                onClick={limpiar}
                disabled={respondidos === 0 && !observaciones}
                title="Borrar todos los puntajes y observaciones"
                className="inline-flex items-center gap-1.5 h-11 px-2 sm:px-3 shrink-0 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-rose-700 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-600"
              >
                <Eraser className="size-4" />
                <span className="hidden sm:inline">Limpiar</span>
              </button>
              <button
                type="button"
                onClick={cancelar}
                className="flex-1 sm:flex-none min-w-0 inline-flex items-center justify-center gap-1.5 h-11 px-2 sm:px-4 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <X className="size-4 hidden sm:block" />
                Cancelar
              </button>
              <button
                type="button"
                onClick={guardarManual}
                disabled={!hayCambios || guardado === "guardando" || finalizando}
                className="flex-1 sm:flex-none min-w-0 inline-flex items-center justify-center gap-1.5 h-11 px-2 sm:px-4 rounded-xl bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 transition-colors cursor-pointer disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                {guardado === "guardando" && !finalizando ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                Guardar
              </button>
              <button
                type="button"
                disabled={!completa || finalizando || guardado === "guardando"}
                onClick={finalizar}
                title={completa ? undefined : "Complete todos los indicadores para finalizar"}
                className="flex-1 sm:flex-none min-w-0 inline-flex items-center justify-center gap-1.5 h-11 px-2 sm:px-4 rounded-xl bg-emerald-600 text-white text-sm font-semibold disabled:bg-slate-200 disabled:text-slate-400 hover:bg-emerald-700 transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                {finalizando ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                Finalizar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BotonVolver({ onClick, texto }: { onClick: () => void; texto: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-sky-800 bg-sky-50 hover:bg-sky-100/80 border border-sky-200 transition-colors cursor-pointer"
    >
      <ArrowLeft className="size-3.5" />
      <span>{texto}</span>
    </button>
  );
}

function IndicadorGuardado({ estado, hayCambios }: { estado: EstadoGuardado; hayCambios: boolean }) {
  if (estado === "guardando")
    return (
      <span className="inline-flex items-center gap-1 text-slate-500">
        <Loader2 className="size-3 animate-spin" /> Guardando…
      </span>
    );
  if (hayCambios)
    return (
      <span className="inline-flex items-center gap-1 text-amber-700 whitespace-nowrap">
        <PencilLine className="size-3" /> Cambios sin guardar
      </span>
    );
  if (estado === "guardado")
    return (
      <span className="inline-flex items-center gap-1 text-emerald-700">
        <Cloud className="size-3" /> Guardado
      </span>
    );
  if (estado === "error")
    return (
      <span className="inline-flex items-center gap-1 text-rose-700">
        <CloudOff className="size-3" /> Sin guardar
      </span>
    );
  return null;
}
