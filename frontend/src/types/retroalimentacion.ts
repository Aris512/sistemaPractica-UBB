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
}

export interface PlanificacionRetro {
  idPlanificacion: number;
  fechaCreacion: string | null;
  asignatura: string | null;
  idDocumento: number | null;
  nombreArchivo: string | null;
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

export interface RetroProfesorDetalle {
  retroalimentacion: RetroProfesor;
  ultimaRevisionIa: string | null;
}

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
