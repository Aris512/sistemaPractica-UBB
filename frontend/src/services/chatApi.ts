import type { ChatConversacion, ChatErrorBody, ChatIntercambio, ChatMensaje } from "@/types/chat";

/**
 * Cliente de la API del chatbot de IA (/api/chat). La clave de Groq vive solo en el backend.
 * El usuario se identifica con la cabecera X-Usuario-Rut (RUT de la sesión), igual que el resto de /api.
 */
const BASE_URL = "/api/chat/conversaciones";

export class ChatApiError extends Error {
  readonly status: number;
  readonly codigo: string;
  readonly reintentarEnSegundos?: number;

  constructor(message: string, status: number, codigo: string, reintentarEnSegundos?: number) {
    super(message);
    this.name = "ChatApiError";
    this.status = status;
    this.codigo = codigo;
    this.reintentarEnSegundos = reintentarEnSegundos;
  }

  get sinConexion(): boolean {
    return this.codigo === "SIN_CONEXION";
  }
}

function request<T>(rut: string, path: string, init: RequestInit = {}): Promise<T> {
  return requestConUsuario<T>(rut, `${BASE_URL}${path}`, init);
}

/** fetch a la API identificando al usuario con X-Usuario-Rut; los errores llegan como ChatApiError con su código. */
export async function requestConUsuario<T>(rut: string, url: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: {
        // Con FormData el navegador fija el Content-Type (con su boundary); solo el JSON lo necesita explícito
        ...(typeof init.body === "string" ? { "Content-Type": "application/json" } : {}),
        "X-Usuario-Rut": rut,
        ...init.headers,
      },
    });
  } catch {
    throw new ChatApiError(
      "No hay conexión con el servidor. Revisa tu conexión a internet e inténtalo de nuevo.",
      0,
      "SIN_CONEXION"
    );
  }

  if (!res.ok) {
    const body: ChatErrorBody = await res.json().catch(() => ({}));
    throw new ChatApiError(
      body.error || `Error del servidor (${res.status}).`,
      res.status,
      body.codigo || "ERROR_HTTP",
      body.reintentarEnSegundos
    );
  }

  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

export function listarConversaciones(rut: string): Promise<ChatConversacion[]> {
  return request(rut, "");
}

export function crearConversacion(rut: string, titulo?: string): Promise<ChatConversacion> {
  return request(rut, "", { method: "POST", body: JSON.stringify({ titulo: titulo ?? null }) });
}

export function renombrarConversacion(rut: string, id: number, titulo: string): Promise<ChatConversacion> {
  return request(rut, `/${id}`, { method: "PATCH", body: JSON.stringify({ titulo }) });
}

export function eliminarConversacion(rut: string, id: number): Promise<void> {
  return request(rut, `/${id}`, { method: "DELETE" });
}

export function obtenerMensajes(rut: string, id: number): Promise<ChatMensaje[]> {
  return request(rut, `/${id}/mensajes`);
}

export function enviarMensaje(rut: string, id: number, contenido: string): Promise<ChatIntercambio> {
  return request(rut, `/${id}/mensajes`, { method: "POST", body: JSON.stringify({ contenido }) });
}
