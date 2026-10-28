import { useCallback, useEffect, useState } from "react";
import {
  MessageSquareCheck,
  Bot,
  Send,
  RotateCcw,
  FileText,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  Bell,
  CalendarDays,
} from "lucide-react";
import { sileo } from "sileo";
import type { UserSession } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { ChatApiError } from "@/services/chatApi";
import {
  enviarAlProfesor,
  iniciarRevisionIa,
  listarRetroalimentacionesEstudiante,
  reiniciarRetroalimentacion,
  urlArchivoPlanificacion,
} from "@/services/retroalimentacionApi";
import {
  ESTADOS_RETRO,
  type EstadoRetroalimentacion,
  type PlanificacionRetro,
  type Retroalimentacion,
} from "@/types/retroalimentacion";

interface PracticaRetroalimentacionViewProps {
  user: UserSession;
  /** Abre «Asistentes de IA» con la conversación de revisión seleccionada. */
  onAbrirChat: (idConversacion: number) => void;
  onIrAPlanificacion: () => void;
}

/** Pasos de la línea de tiempo; el último muestra Aprobado o Rechazado según la respuesta. */
const PASOS: { estado: EstadoRetroalimentacion; titulo: string }[] = [
  { estado: "NO_REVISADO", titulo: "Revisión con IA" },
  { estado: "REVISADO_POR_IA", titulo: "Aprobada por la IA" },
  { estado: "ESPERANDO_PROFESOR", titulo: "En manos del profesor" },
  { estado: "APROBADO", titulo: "Respuesta del profesor" },
];
const ORDEN: Record<EstadoRetroalimentacion, number> = {
  NO_REVISADO: 0,
  REVISADO_POR_IA: 1,
  ESPERANDO_PROFESOR: 2,
  RECHAZADO: 3,
  APROBADO: 3,
};

const formatoFecha = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : null;

/** Respuestas del profesor ya vistas, para avisar solo de las nuevas (preferencia local del navegador). */
function leerVistas(clave: string): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(clave) || "{}");
  } catch {
    return {};
  }
}

export function PracticaRetroalimentacionView({ user, onAbrirChat, onIrAPlanificacion }: PracticaRetroalimentacionViewProps) {
  const rut = user.rut;
  const claveVistas = `ubb_retro_vistas_${rut}`;
  const [items, setItems] = useState<PlanificacionRetro[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nuevas, setNuevas] = useState<Set<number>>(new Set());
  const [accionEnCurso, setAccionEnCurso] = useState<string | null>(null);

  const aplicar = useCallback(
    (datos: PlanificacionRetro[]) => {
      setItems(datos);
      setError(null);
      setCargando(false);

      // Aviso de respuestas nuevas del profesor; se marcan como vistas al mostrarlas
      const vistas = leerVistas(claveVistas);
      const recientes = new Set<number>();
      datos.forEach(({ retroalimentacion: r }) => {
        if (r?.fechaRespuestaProfesor && vistas[r.id] !== r.fechaRespuestaProfesor) {
          recientes.add(r.id);
          vistas[r.id] = r.fechaRespuestaProfesor;
        }
      });
      setNuevas(recientes);
      try {
        localStorage.setItem(claveVistas, JSON.stringify(vistas));
      } catch {
        // sin almacenamiento local el aviso se repetirá en la próxima visita
      }
      if (recientes.size > 0) {
        sileo.info({
          title: "Tu profesor respondió",
          description: `Tienes ${recientes.size} ${recientes.size === 1 ? "respuesta nueva" : "respuestas nuevas"} en tus planificaciones.`,
        });
      }
    },
    [claveVistas]
  );

  const fallar = (e: unknown) => {
    setError(e instanceof ChatApiError ? e.message : "No se pudo cargar la retroalimentación.");
    setCargando(false);
  };

  useEffect(() => {
    let cancelado = false;
    listarRetroalimentacionesEstudiante(rut).then(
      (datos) => !cancelado && aplicar(datos),
      (e: unknown) => {
        if (!cancelado) {
          setError(e instanceof ChatApiError ? e.message : "No se pudo cargar la retroalimentación.");
          setCargando(false);
        }
      }
    );
    return () => {
      cancelado = true;
    };
  }, [rut, aplicar]);

  const cargar = () => listarRetroalimentacionesEstudiante(rut).then(aplicar, fallar);

  const recargar = () => {
    setCargando(true);
    void cargar();
  };

  const ejecutar = async (clave: string, accion: () => Promise<void>) => {
    setAccionEnCurso(clave);
    try {
      await accion();
    } catch (e) {
      sileo.error({
        title: "No se pudo completar la acción",
        description: e instanceof ChatApiError ? e.message : "Inténtalo de nuevo.",
      });
    } finally {
      setAccionEnCurso(null);
    }
  };

  const revisarConIa = (p: PlanificacionRetro) =>
    ejecutar(`ia-${p.idPlanificacion}`, async () => {
      const inicio = await iniciarRevisionIa(rut, p.idPlanificacion);
      if (inicio.aviso) {
        sileo.warning({ title: "Revisión con IA", description: inicio.aviso });
      }
      onAbrirChat(inicio.idConversacion);
    });

  const enviar = (r: Retroalimentacion) =>
    ejecutar(`enviar-${r.id}`, async () => {
      await enviarAlProfesor(rut, r.id);
      sileo.success({ title: "Enviada al profesor", description: "Te avisaremos aquí cuando responda." });
      await cargar();
    });

  const reiniciar = (p: PlanificacionRetro, r: Retroalimentacion) =>
    ejecutar(`reiniciar-${r.id}`, async () => {
      await reiniciarRetroalimentacion(rut, r.id);
      sileo.success({ title: "Revisión reiniciada", description: "Abrimos una conversación nueva con la IA para tu versión corregida." });
      const inicio = await iniciarRevisionIa(rut, p.idPlanificacion);
      onAbrirChat(inicio.idConversacion);
    });

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="size-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-700 shrink-0">
            <MessageSquareCheck className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Retroalimentación</h1>
            <p className="text-sm text-slate-500">
              La IA revisa tu planificación; cuando la aprueba, la envías a tu profesor de asignatura.
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={recargar} disabled={cargando} className="gap-1.5 cursor-pointer">
          <RefreshCw className={`size-3.5 ${cargando ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      {/* Cómo funciona */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        {[
          { icono: Bot, texto: "Revisa tu planificación con la IA (hasta 2 revisiones)." },
          { icono: CheckCircle2, texto: "Cuando la IA la marca como apta, se habilita el envío." },
          { icono: Send, texto: "Envíala a tu profesor de asignatura." },
          { icono: Bell, texto: "Aquí verás si la aprobó o qué debes corregir." },
        ].map(({ icono: Icono, texto }, i) => (
          <div key={i} className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-600">
            <span className="size-6 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 font-bold">{i + 1}</span>
            <span className="flex items-start gap-1.5">
              <Icono className="size-3.5 mt-0.5 text-sky-600 shrink-0" />
              {texto}
            </span>
          </div>
        ))}
      </div>

      {nuevas.size > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
          <Bell className="size-4 text-sky-600 shrink-0" />
          Tu profesor respondió {nuevas.size === 1 ? "una planificación" : `${nuevas.size} planificaciones`}. Las verás marcadas como «Nuevo».
        </div>
      )}

      {cargando && items.length === 0 ? (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-40 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center space-y-3">
          <p className="text-sm text-rose-700">{error}</p>
          <Button variant="outline" size="sm" onClick={recargar} className="gap-1.5 cursor-pointer">
            <RotateCcw className="size-3.5" />
            Intentar de nuevo
          </Button>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center space-y-3">
          <FileText className="size-8 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold text-slate-700">Aún no tienes planificaciones</p>
          <p className="text-xs text-slate-500">Crea una y sube su archivo «Planificación» para pedir retroalimentación.</p>
          <Button size="sm" onClick={onIrAPlanificacion} className="gap-1.5 bg-sky-700 hover:bg-sky-800 text-white cursor-pointer">
            Ir a Planificación
            <ArrowRight className="size-3.5" />
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((p) => (
            <TarjetaPlanificacion
              key={p.idPlanificacion}
              p={p}
              nueva={!!p.retroalimentacion && nuevas.has(p.retroalimentacion.id)}
              accionEnCurso={accionEnCurso}
              onRevisar={() => void revisarConIa(p)}
              onEnviar={(r) => void enviar(r)}
              onReiniciar={(r) => void reiniciar(p, r)}
              onVerConversacion={onAbrirChat}
              onIrAPlanificacion={onIrAPlanificacion}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TarjetaPlanificacion({
  p,
  nueva,
  accionEnCurso,
  onRevisar,
  onEnviar,
  onReiniciar,
  onVerConversacion,
  onIrAPlanificacion,
}: {
  p: PlanificacionRetro;
  nueva: boolean;
  accionEnCurso: string | null;
  onRevisar: () => void;
  onEnviar: (r: Retroalimentacion) => void;
  onReiniciar: (r: Retroalimentacion) => void;
  onVerConversacion: (idConversacion: number) => void;
  onIrAPlanificacion: () => void;
}) {
  const r = p.retroalimentacion;
  const estado: EstadoRetroalimentacion = r?.estado ?? "NO_REVISADO";
  const actual = ORDEN[estado];
  const revisionesAgotadas = !!r && r.estado === "NO_REVISADO" && r.revisionesIa >= r.maxRevisionesIa;
  const ocupado = (clave: string) => accionEnCurso === clave;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Cabecera de la tarjeta */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
            Planificación #{p.idPlanificacion}
            {nueva && (
              <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-sky-600 text-white">Nuevo</span>
            )}
          </p>
          <p className="text-xs text-slate-500 flex flex-wrap items-center gap-x-3">
            {p.asignatura && <span>{p.asignatura}</span>}
            {p.fechaCreacion && (
              <span className="flex items-center gap-1">
                <CalendarDays className="size-3" />
                Creada {formatoFecha(p.fechaCreacion)}
              </span>
            )}
            {r && r.ciclo > 1 && <span>Ciclo {r.ciclo}</span>}
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border self-start sm:self-center text-center ${
            r ? ESTADOS_RETRO[estado].clases : "bg-slate-50 text-slate-500 border-slate-200"
          }`}
        >
          {r ? ESTADOS_RETRO[estado].etiqueta : "Sin revisión"}
        </span>
      </div>

      <div className="p-5 space-y-4">
        {/* Línea de tiempo */}
        <ol className="grid grid-cols-4 gap-2">
          {PASOS.map((paso, i) => {
            const final = i === 3;
            const rechazado = final && estado === "RECHAZADO";
            const hecho = !!r && (i < actual || (final && actual === 3));
            const enCurso = !!r && i === actual && !final;
            const titulo = final && r && actual === 3 ? ESTADOS_RETRO[estado].etiqueta : paso.titulo;
            return (
              <li key={paso.estado} className="space-y-1.5">
                <div
                  className={`h-1.5 rounded-full ${
                    rechazado ? "bg-rose-500" : hecho ? "bg-emerald-500" : enCurso ? "bg-sky-500" : "bg-slate-200"
                  }`}
                />
                <p
                  className={`text-[11px] font-semibold leading-tight ${
                    rechazado ? "text-rose-700" : hecho ? "text-emerald-700" : enCurso ? "text-sky-700" : "text-slate-400"
                  }`}
                >
                  {titulo}
                </p>
              </li>
            );
          })}
        </ol>

        {/* Archivo y revisiones */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-600">
          {p.idDocumento && p.nombreArchivo ? (
            <a
              href={urlArchivoPlanificacion(p.idDocumento)}
              className="inline-flex items-center gap-1.5 font-medium text-sky-800 hover:underline"
            >
              <FileText className="size-3.5" />
              {p.nombreArchivo}
              <Download className="size-3" />
            </a>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-amber-700">
              <AlertTriangle className="size-3.5" />
              Falta subir el archivo «Planificación».
            </span>
          )}
          {r && (
            <span className="inline-flex items-center gap-1.5">
              <Bot className="size-3.5 text-slate-400" />
              Revisiones de IA: <strong>{r.revisionesIa}/{r.maxRevisionesIa}</strong>
            </span>
          )}
          {r?.fechaEnvioProfesor && (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-3.5 text-slate-400" />
              Enviada {formatoFecha(r.fechaEnvioProfesor)}
            </span>
          )}
        </div>

        {/* Respuesta del profesor */}
        {r?.comentarioProfesor && (r.estado === "APROBADO" || r.estado === "RECHAZADO" || r.ciclo > 1) && (
          <div
            className={`rounded-xl border p-3.5 text-sm ${
              r.estado === "APROBADO"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : r.estado === "RECHAZADO"
                  ? "border-rose-200 bg-rose-50 text-rose-900"
                  : "border-slate-200 bg-slate-50 text-slate-700"
            }`}
          >
            <p className="text-xs font-bold mb-1 flex items-center gap-1.5">
              {r.estado === "APROBADO" ? (
                <CheckCircle2 className="size-3.5" />
              ) : r.estado === "RECHAZADO" ? (
                <XCircle className="size-3.5" />
              ) : (
                <MessageSquareCheck className="size-3.5" />
              )}
              {r.estado === "APROBADO" || r.estado === "RECHAZADO" ? "Comentario" : "Comentario anterior"} de{" "}
              {r.profesorRevisor ?? "tu profesor"}
              {r.fechaRespuestaProfesor && <span className="font-normal opacity-80">· {formatoFecha(r.fechaRespuestaProfesor)}</span>}
            </p>
            <p className="whitespace-pre-line">{r.comentarioProfesor}</p>
          </div>
        )}
        {r?.estado === "APROBADO" && !r.comentarioProfesor && (
          <p className="text-sm text-emerald-700 flex items-center gap-1.5">
            <CheckCircle2 className="size-4" />
            Tu profesor aprobó esta planificación.
          </p>
        )}

        {/* Avisos */}
        {revisionesAgotadas && (
          <Aviso>
            Ya usaste las {r?.maxRevisionesIa} revisiones de la IA. Corrige tu planificación, súbela de nuevo en Planificación y
            reinicia la revisión.
          </Aviso>
        )}
        {r?.estado === "RECHAZADO" && !r.puedeReiniciar && (
          <Aviso>Corrige tu planificación según el comentario, súbela de nuevo en Planificación y reinicia la revisión.</Aviso>
        )}
        {r?.estado === "REVISADO_POR_IA" && r.archivoCambiado && (
          <Aviso>Cambiaste el archivo después de la revisión de la IA. Reinicia la revisión para enviar la nueva versión.</Aviso>
        )}

        {/* Acciones */}
        <div className="flex flex-wrap gap-2">
          {!p.idDocumento && (
            <Button size="sm" variant="outline" onClick={onIrAPlanificacion} className="gap-1.5 cursor-pointer">
              Subir archivo en Planificación
              <ArrowRight className="size-3.5" />
            </Button>
          )}
          {p.idDocumento && (!r || r.puedeRevisarIa) && (
            <Button
              size="sm"
              onClick={onRevisar}
              disabled={!!accionEnCurso}
              className="gap-1.5 bg-sky-700 hover:bg-sky-800 text-white cursor-pointer"
            >
              {ocupado(`ia-${p.idPlanificacion}`) ? <RefreshCw className="size-3.5 animate-spin" /> : <Bot className="size-3.5" />}
              {ocupado(`ia-${p.idPlanificacion}`)
                ? "Enviando a la IA…"
                : r?.idConversacion
                  ? "Continuar con la IA"
                  : "Revisar con IA"}
            </Button>
          )}
          {r?.puedeEnviar && (
            <Button
              size="sm"
              onClick={() => onEnviar(r)}
              disabled={!!accionEnCurso}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
            >
              {ocupado(`enviar-${r.id}`) ? <RefreshCw className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
              Enviar al profesor
            </Button>
          )}
          {r?.puedeReiniciar && (
            <Button size="sm" variant="outline" onClick={() => onReiniciar(r)} disabled={!!accionEnCurso} className="gap-1.5 cursor-pointer">
              {ocupado(`reiniciar-${r.id}`) ? <RefreshCw className="size-3.5 animate-spin" /> : <RotateCcw className="size-3.5" />}
              Reiniciar con la versión corregida
            </Button>
          )}
          {r && !r.puedeRevisarIa && r.idConversacion !== null && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onVerConversacion(r.idConversacion as number)}
              className="gap-1.5 cursor-pointer text-slate-600"
            >
              <Bot className="size-3.5" />
              Ver conversación con la IA
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Aviso({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-900">
      <AlertTriangle className="size-3.5 mt-0.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}
