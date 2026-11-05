/** Tipos de la API de retroalimentación de planificaciones (/api/retroalimentaciones-ia). */

export type EstadoRetroalimentacion =
  | "NO_REVISADO"
  | "REVISADO_POR_IA"
  | "ESPERANDO_PROFESOR"
  | "RECHAZADO"
  | "APROBADO";

export interface Retroalimentacion {
  id: number;
  estado: EstadoRetroalimentacion;
  revisionesIa: number;
  maxRevisionesIa: number;
  ciclo: number;
  idConversacion: number | null;
  nombreArchivoRevisado: string | null;
  /** La planificación actual no es la que revisó la IA en este ciclo. */
  archivoCambiado: boolean;
  comentarioProfesor: string | null;
  profesorRevisor: string | null;
  fechaEnvioProfesor: string | null;
  fechaRespuestaProfesor: string | null;
  fechaActualizacion: string | null;
  puedeRevisarIa: boolean;
  puedeEnviar: boolean;
  puedeReiniciar: boolean;
  /** Lo que escribió el profesor, del más antiguo al más reciente. */
  observaciones: Observacion[];
}

export type TipoObservacion = "OBSERVACION" | "APROBACION" | "RECHAZO";

export interface Observacion {
  id: number;
  tipo: TipoObservacion;
  texto: string | null;
  profesor: string | null;
  ciclo: number;
  fecha: string;
}

export interface PlanificacionRetro {
  idPlanificacion: number;
  fechaCreacion: string | null;
  asignatura: string | null;
  idDocumento: number | null;
  nombreArchivo: string | null;
  /** Tiene sus 5 archivos. */
  completa: boolean;
  /** Se puede enviar al profesor sin pasar por la IA. */
  puedeEnviarDirecto: boolean;
  retroalimentacion: Retroalimentacion | null;
}

export interface InicioRevision {
  idConversacion: number;
  conversacionNueva: boolean;
  aviso: string | null;
}

export interface RetroProfesor {
  id: number;
  estado: EstadoRetroalimentacion;
  rutEstudiante: string | null;
  nombreEstudiante: string | null;
  asignatura: string | null;
  ciclo: number;
  revisionesIa: number;
  idDocumento: number | null;
  nombreArchivo: string | null;
  archivoCambiado: boolean;
  comentarioProfesor: string | null;
  fechaEnvioProfesor: string | null;
  fechaRespuestaProfesor: string | null;
}

export interface ArchivoRevision {
  categoria: string;
  etiqueta: string;
  idDocumento: number | null;
  nombre: string | null;
  tamanioBytes: number | null;
  fechaCarga: string | null;
  urlDescarga: string | null;
}

export interface MensajeChatRevision {
  rol: "USER" | "ASSISTANT";
  contenido: string;
  fecha: string | null;
}

export interface RetroProfesorDetalle {
  retroalimentacion: RetroProfesor;
  ultimaRevisionIa: string | null;
  /** Las 5 categorías de la planificación, con su archivo o pendientes. */
  archivos: ArchivoRevision[];
  /** Conversación del alumno con la IA en este ciclo (vacía si la envió sin revisarla con la IA). */
  conversacion: MensajeChatRevision[];
  observaciones: Observacion[];
  puedeObservar: boolean;
}

/** Etiqueta y colores de cada entrada del historial de observaciones. */
export const TIPOS_OBSERVACION: Record<TipoObservacion, { etiqueta: string; clases: string }> = {
  OBSERVACION: { etiqueta: "Observación", clases: "border-sky-200 bg-sky-50/60 text-sky-950" },
  APROBACION: { etiqueta: "Aprobada", clases: "border-emerald-200 bg-emerald-50 text-emerald-900" },
  RECHAZO: { etiqueta: "Rechazada", clases: "border-rose-200 bg-rose-50 text-rose-900" },
};

/** Texto y colores de cada estado, compartidos por la vista del alumno y la del profesor. */
export const ESTADOS_RETRO: Record<EstadoRetroalimentacion, { etiqueta: string; clases: string }> = {
  NO_REVISADO: { etiqueta: "No revisado", clases: "bg-slate-100 text-slate-700 border-slate-200" },
  REVISADO_POR_IA: { etiqueta: "Revisado por IA", clases: "bg-sky-50 text-sky-800 border-sky-200" },
  ESPERANDO_PROFESOR: {
    etiqueta: "Esperando retroalimentación del profesor",
    clases: "bg-amber-50 text-amber-800 border-amber-200",
  },
  RECHAZADO: { etiqueta: "Rechazado", clases: "bg-rose-50 text-rose-700 border-rose-200" },
  APROBADO: { etiqueta: "Aprobado", clases: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};
