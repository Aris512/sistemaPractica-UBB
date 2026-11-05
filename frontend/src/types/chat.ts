export type ChatRol = "USER" | "ASSISTANT";

export interface ChatConversacion {
  id: number;
  titulo: string;
  fechaCreacion: string;
  fechaActualizacion: string;
  /** Mensajes que el alumno ya escribió (en las de revisión, desde el archivo vigente). */
  preguntasUsadas: number;
  /** Al llegar a este número la conversación queda cerrada. */
  maxPreguntas: number;
}

export interface ChatMensaje {
  id: number;
  rol: ChatRol;
  contenido: string;
  fecha: string;
  orden: number;
  /** Mensaje que la plataforma escribió en nombre del alumno (no cuenta como pregunta). */
  automatico?: boolean;
}

export interface ChatIntercambio {
  conversacion: ChatConversacion;
  mensajeUsuario: ChatMensaje;
  mensajeAsistente: ChatMensaje;
}

/** Cuerpo de error que devuelve /api/chat/** */
export interface ChatErrorBody {
  error?: string;
  codigo?: string;
  reintentarEnSegundos?: number;
}

/** Preguntas por conversación antes de que se cierre (debe coincidir con chat.max-preguntas-por-conversacion). */
export const CHAT_MAX_PREGUNTAS = 5;

/** Límite de caracteres por mensaje (debe coincidir con chat.max-caracteres-mensaje del backend). */
export const CHAT_MAX_CARACTERES = 4000;
