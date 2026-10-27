import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  MessageSquareCheck,
  RefreshCw,
  RotateCcw,
  FileText,
  Download,
  Bot,
  CheckCircle2,
  XCircle,
  X,
  AlertTriangle,
  Inbox,
} from "lucide-react";
import { sileo } from "sileo";
import type { UserSession } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { MarkdownTexto } from "@/components/IA/MarkdownTexto";
import { ChatApiError } from "@/services/chatApi";
import {
  detalleRetroalimentacionProfesor,
  listarRetroalimentacionesProfesor,
  responderRetroalimentacion,
  urlArchivoPlanificacion,
} from "@/services/retroalimentacionApi";
import { ESTADOS_RETRO, type RetroProfesor, type RetroProfesorDetalle } from "@/types/retroalimentacion";

interface RevisionRetroalimentacionProps {
  user?: UserSession;
  onBack?: () => void;
}

type Filtro = "PENDIENTES" | "APROBADO" | "RECHAZADO" | "TODAS";
const FILTROS: { clave: Filtro; etiqueta: string }[] = [
  { clave: "PENDIENTES", etiqueta: "Por revisar" },
  { clave: "APROBADO", etiqueta: "Aprobadas" },
  { clave: "RECHAZADO", etiqueta: "Rechazadas" },
  { clave: "TODAS", etiqueta: "Todas" },
];
const MAX_COMENTARIO = 2000;

const formatoFecha = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "—";

const coincide = (r: RetroProfesor, filtro: Filtro) =>
  filtro === "TODAS" || (filtro === "PENDIENTES" ? r.estado === "ESPERANDO_PROFESOR" : r.estado === filtro);

/**
 * Bandeja del profesor de asignatura: planificaciones que sus estudiantes en práctica enviaron tras la
 * aprobación de la IA. Las aprueba o las rechaza con un comentario que el estudiante ve en su sección.
 */
export function RevisionRetroalimentacion({ user, onBack }: RevisionRetroalimentacionProps) {
  const rut = user?.rut ?? "";
  const [items, setItems] = useState<RetroProfesor[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<Filtro>("PENDIENTES");
  const [abierta, setAbierta] = useState<number | null>(null);

  const aplicar = (datos: RetroProfesor[]) => {
    setItems(datos);
    setError(null);
    setCargando(false);
  };
  const fallar = (e: unknown) => {
    setError(e instanceof ChatApiError ? e.message : "No se pudieron cargar las retroalimentaciones.");
    setCargando(false);
  };

  useEffect(() => {
    let cancelado = false;
    listarRetroalimentacionesProfesor(rut).then(
      (datos) => {
        if (!cancelado) {
          setItems(datos);
          setCargando(false);
        }
      },
      (e: unknown) => {
        if (!cancelado) {
          setError(e instanceof ChatApiError ? e.message : "No se pudieron cargar las retroalimentaciones.");
          setCargando(false);
        }
      }
    );
    return () => {
      cancelado = true;
    };
  }, [rut]);

  const cargar = () => listarRetroalimentacionesProfesor(rut).then(aplicar, fallar);

  const recargar = () => {
    setCargando(true);
    void cargar();
  };

  const visibles = useMemo(() => items.filter((r) => coincide(r, filtro)), [items, filtro]);
  const contar = (f: Filtro) => items.filter((r) => coincide(r, f)).length;

  return (
    <div className="space-y-6">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-sky-800 bg-sky-50 hover:bg-sky-100/80 border border-sky-200 transition-colors cursor-pointer"
        >
          <ArrowLeft className="size-3.5" />
          <span>Volver al Inicio</span>
        </button>
      )}

      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="size-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-700 shrink-0">
            <MessageSquareCheck className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Revisión y Retroalimentación</h1>
            <p className="text-sm text-slate-500">
              Planificaciones que tus estudiantes en práctica enviaron después de que la IA las marcara como aptas.
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={recargar} disabled={cargando} className="gap-1.5 cursor-pointer">
          <RefreshCw className={`size-3.5 ${cargando ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTROS.map(({ clave, etiqueta }) => (
          <button
            key={clave}
            type="button"
            onClick={() => setFiltro(clave)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer transition-colors ${
              filtro === clave ? "bg-[#0b1329] text-white border-[#0b1329]" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {etiqueta}
            <span className={`px-1.5 rounded-full ${filtro === clave ? "bg-white/20" : "bg-slate-100"}`}>{contar(clave)}</span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {cargando && items.length === 0 ? (
          <div className="p-10 flex items-center justify-center gap-2 text-sm text-slate-500">
            <RefreshCw className="size-4 animate-spin" />
            Cargando retroalimentaciones…
          </div>
        ) : error ? (
          <div className="p-10 text-center space-y-3">
            <p className="text-sm text-rose-700">{error}</p>
            <Button variant="outline" size="sm" onClick={recargar} className="gap-1.5 cursor-pointer">
              <RotateCcw className="size-3.5" />
              Intentar de nuevo
            </Button>
          </div>
        ) : visibles.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <Inbox className="size-8 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">
              {filtro === "PENDIENTES" ? "No tienes planificaciones por revisar" : "No hay planificaciones en esta vista"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/75 text-xs uppercase text-slate-500">
                <tr>
                  <th className="text-left font-semibold px-5 py-3">Estudiante</th>
                  <th className="text-left font-semibold px-5 py-3">Planificación</th>
                  <th className="text-left font-semibold px-5 py-3">Enviada</th>
                  <th className="text-left font-semibold px-5 py-3">Estado</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibles.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-900">{r.nombreEstudiante}</p>
                      <p className="text-xs text-slate-500 font-mono">{r.rutEstudiante}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-slate-700 truncate max-w-56" title={r.nombreArchivo ?? undefined}>
                        {r.nombreArchivo ?? "—"}
                      </p>
                      <p className="text-xs text-slate-500">
                        Ciclo {r.ciclo} · {r.revisionesIa} {r.revisionesIa === 1 ? "revisión" : "revisiones"} de IA
                      </p>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">{formatoFecha(r.fechaEnvioProfesor)}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex whitespace-nowrap px-2.5 py-0.5 rounded-full text-xs font-semibold border ${ESTADOS_RETRO[r.estado].clases}`}>
                        {r.estado === "ESPERANDO_PROFESOR" ? "Por revisar" : ESTADOS_RETRO[r.estado].etiqueta}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Button
                        size="sm"
                        variant={r.estado === "ESPERANDO_PROFESOR" ? "default" : "outline"}
                        onClick={() => setAbierta(r.id)}
                        className={`cursor-pointer ${r.estado === "ESPERANDO_PROFESOR" ? "bg-sky-700 hover:bg-sky-800 text-white" : ""}`}
                      >
                        {r.estado === "ESPERANDO_PROFESOR" ? "Revisar" : "Ver"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {abierta !== null && (
        <ModalRevision
          key={abierta}
          rut={rut}
          id={abierta}
          onClose={() => setAbierta(null)}
          onRespondida={(actualizada) => {
            setItems((prev) => prev.map((r) => (r.id === actualizada.id ? actualizada : r)));
            setAbierta(null);
          }}
        />
      )}
    </div>
  );
}

function ModalRevision({
  rut,
  id,
  onClose,
  onRespondida,
}: {
  rut: string;
  id: number;
  onClose: () => void;
  onRespondida: (r: RetroProfesor) => void;
}) {
  const [detalle, setDetalle] = useState<RetroProfesorDetalle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [comentario, setComentario] = useState("");
  const [guardando, setGuardando] = useState<"aprobar" | "rechazar" | null>(null);

  useEffect(() => {
    let cancelado = false;
    detalleRetroalimentacionProfesor(rut, id).then(
      (d) => !cancelado && setDetalle(d),
      (e: unknown) => !cancelado && setError(e instanceof ChatApiError ? e.message : "No se pudo cargar la retroalimentación.")
    );
    return () => {
      cancelado = true;
    };
  }, [rut, id]);

  const responder = async (aprobado: boolean) => {
    if (!aprobado && !comentario.trim()) {
      sileo.warning({ title: "Falta el comentario", description: "Para rechazarla, escribe qué debe corregir el estudiante." });
      return;
    }
    setGuardando(aprobado ? "aprobar" : "rechazar");
    try {
      const actualizada = await responderRetroalimentacion(rut, id, aprobado, comentario.trim());
      sileo.success({
        title: aprobado ? "Planificación aprobada" : "Planificación rechazada",
        description: "El estudiante verá tu respuesta en su sección de Retroalimentación.",
      });
      onRespondida(actualizada);
    } catch (e) {
      sileo.error({ title: "No se pudo guardar", description: e instanceof ChatApiError ? e.message : "Inténtalo de nuevo." });
    } finally {
      setGuardando(null);
    }
  };

  const r = detalle?.retroalimentacion;
  const pendiente = r?.estado === "ESPERANDO_PROFESOR";

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4">
      <div className="bg-white shadow-2xl rounded-none sm:rounded-2xl w-full max-w-3xl h-full sm:h-auto sm:max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-linear-to-r from-sky-50 via-slate-50 to-indigo-50/40 shrink-0">
          <div className="min-w-0">
            <h2 className="font-bold text-slate-900 text-lg truncate">{r?.nombreEstudiante ?? "Retroalimentación"}</h2>
            <p className="text-xs text-slate-500">
              {r ? `${r.asignatura ?? ""} · Ciclo ${r.ciclo} · Enviada ${formatoFecha(r.fechaEnvioProfesor)}` : "Cargando…"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={!!guardando}
            className="size-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white flex items-center justify-center cursor-pointer"
            title="Cerrar"
          >
            <X className="size-4.5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {error ? (
            <p className="text-sm text-rose-700">{error}</p>
          ) : !r ? (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <RefreshCw className="size-4 animate-spin" />
              Cargando…
            </div>
          ) : (
            <>
              {/* Archivo */}
              <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/60">
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className="size-5 text-sky-700 shrink-0" />
                  <span className="text-sm font-semibold text-slate-800 truncate">{r.nombreArchivo ?? "Sin archivo"}</span>
                </div>
                {r.idDocumento && (
                  <a
                    href={urlArchivoPlanificacion(r.idDocumento)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-sky-800 bg-white border border-sky-200 hover:bg-sky-50 shrink-0"
                  >
                    <Download className="size-3.5" />
                    Descargar
                  </a>
                )}
              </div>
              {r.archivoCambiado && (
                <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-900">
                  <AlertTriangle className="size-3.5 mt-0.5 shrink-0" />
                  El estudiante cambió el archivo después de enviarlo: el que descargas no es el que revisó la IA.
                </p>
              )}

              {/* Revisión de la IA */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Bot className="size-3.5 text-sky-600" />
                  Última retroalimentación de la IA
                </h3>
                <div className="rounded-xl border border-slate-200 bg-white p-4 text-slate-800">
                  {detalle?.ultimaRevisionIa ? (
                    <MarkdownTexto texto={detalle.ultimaRevisionIa} />
                  ) : (
                    <p className="text-sm text-slate-500">No hay retroalimentación de la IA registrada.</p>
                  )}
                </div>
              </div>

              {/* Respuesta */}
              {pendiente ? (
                <div className="space-y-1.5">
                  <label htmlFor="comentario-profesor" className="block text-xs font-bold text-slate-800">
                    Comentario para el estudiante <span className="font-normal text-slate-500">(obligatorio si la rechazas)</span>
                  </label>
                  <textarea
                    id="comentario-profesor"
                    rows={4}
                    maxLength={MAX_COMENTARIO}
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                    placeholder="Fortalezas de la planificación y qué debe corregir o mejorar…"
                    className="w-full border border-slate-200 rounded-xl p-3.5 text-sm bg-white resize-none focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  />
                  <p className="text-[11px] text-slate-400 text-right">
                    {comentario.length}/{MAX_COMENTARIO}
                  </p>
                </div>
              ) : (
                <div
                  className={`rounded-xl border p-4 text-sm ${
                    r.estado === "APROBADO" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-rose-200 bg-rose-50 text-rose-900"
                  }`}
                >
                  <p className="text-xs font-bold mb-1 flex items-center gap-1.5">
                    {r.estado === "APROBADO" ? <CheckCircle2 className="size-3.5" /> : <XCircle className="size-3.5" />}
                    {ESTADOS_RETRO[r.estado].etiqueta} el {formatoFecha(r.fechaRespuestaProfesor)}
                  </p>
                  <p className="whitespace-pre-line">{r.comentarioProfesor ?? "Sin comentario."}</p>
                </div>
              )}
            </>
          )}
        </div>

        {pendiente && (
          <div className="flex items-center justify-end gap-2.5 px-6 py-4 bg-slate-50 border-t border-slate-200 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void responder(false)}
              disabled={!!guardando}
              className="gap-1.5 text-rose-700 border-rose-200 hover:bg-rose-50 cursor-pointer"
            >
              {guardando === "rechazar" ? <RefreshCw className="size-3.5 animate-spin" /> : <XCircle className="size-3.5" />}
              Rechazar
            </Button>
            <Button
              size="sm"
              onClick={() => void responder(true)}
              disabled={!!guardando}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
            >
              {guardando === "aprobar" ? <RefreshCw className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
              Aprobar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
