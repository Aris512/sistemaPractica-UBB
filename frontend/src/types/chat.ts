export type ChatRol = "USER" | "ASSISTANT";

export interface ChatConversacion {
  id: number;
  titulo: string;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface ChatMensaje {
  id: number;
  rol: ChatRol;
  contenido: string;
  fecha: string;
  orden: number;
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

/** Límite de caracteres por mensaje (debe coincidir con chat.max-caracteres-mensaje del backend). */
export const CHAT_MAX_CARACTERES = 4000;
