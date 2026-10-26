const API_URL = "/api/pautas";

export type EvaluadorPauta = "COLABORADOR" | "TUTOR" | "ACADEMICO";
export type EstadoAplicacion = "BORRADOR" | "FINALIZADA";

export interface PautaResumen {
  id: number;
  codigo: string;
  titulo: string;
  asignatura: string;
  tipo: string;
  especialidad: string;
  momento: string;
  evaluador: EvaluadorPauta;
  criteriosCount: number;
  puntajeMaximo: number;
  ponderacion?: string | null;
  version?: string | null;
  activa: boolean;
  aplicacionId?: number | null;
  estadoAplicacion?: EstadoAplicacion | null;
  nota?: number | null;
}

export interface CriterioPauta {
  id: number;
  orden: number;
  dimension?: string | null;
  numero: string;
  texto: string;
}

export interface PautaDetalle {
  id: number;
  codigo: string;
  titulo: string;
  asignatura: string;
  tipo: string;
  especialidad: string;
  momento: string;
  evaluador: EvaluadorPauta;
  escalaMin: number;
  escalaMax: number;
  modoCalculo: "ESCALA_EXIGENCIA" | "PROMEDIO";
  exigencia?: number | null;
  puntajeMaximo: number;
  ponderacion?: string | null;
  instrucciones?: string | null;
  version?: string | null;
  activa: boolean;
  criterios: CriterioPauta[];
}

export interface RespuestaPauta {
  criterioId: number;
  puntaje: number | null;
}

export interface AplicacionPauta {
  id: number;
  pautaId: number;
  practicaId: number;
  estado: EstadoAplicacion;
  evaluadorRut?: string | null;
  evaluadorNombre?: string | null;
  observaciones?: string | null;
  respuestas: RespuestaPauta[];
  respondidos: number;
  totalCriterios: number;
  puntajeObtenido?: number | null;
  puntajeMaximo?: number | null;
  nota?: number | null;
  fechaActualizacion?: string | null;
  fechaFinalizacion?: string | null;
}

export interface GuardarAplicacionPayload {
  observaciones?: string;
  respuestas: RespuestaPauta[];
  finalizar?: boolean;
}

export interface ResultadoPauta {
  aplicacionId: number;
  pautaId: number;
  pautaCodigo: string;
  pautaTitulo: string;
  asignatura: string;
  evaluadorRol: EvaluadorPauta;
  evaluadorNombre?: string | null;
  practicaId: number;
  estudianteNombre?: string | null;
  estudianteRut?: string | null;
  estado: EstadoAplicacion;
  puntajeObtenido?: number | null;
  puntajeMaximo?: number | null;
  nota?: number | null;
  modoCalculo: "ESCALA_EXIGENCIA" | "PROMEDIO";
  ponderacion?: string | null;
  fechaActualizacion?: string | null;
  fechaFinalizacion?: string | null;
}

/** El backend identifica a quien consulta por este encabezado y aplica los permisos según su rol. */
function cabeceras(rut: string, json = false): HeadersInit {
  const h: Record<string, string> = { "X-User-Rut": rut };
  if (json) h["Content-Type"] = "application/json";
  return h;
}

async function leerError(response: Response, porDefecto: string): Promise<Error> {
  try {
    const data = await response.json();
    if (typeof data?.message === "string" && data.message.trim()) return new Error(data.message);
  } catch {
    /* sin cuerpo JSON */
  }
  if (response.status === 401) return new Error("Debe iniciar sesión para usar las pautas.");
  if (response.status === 403) return new Error("No tiene permiso para realizar esta acción.");
  return new Error(porDefecto);
}

export const getPautasDePractica = async (rut: string, practicaId: number): Promise<PautaResumen[]> => {
  const response = await fetch(`${API_URL}/practica/${practicaId}`, { headers: cabeceras(rut) });
  if (!response.ok) throw await leerError(response, "No se pudieron cargar las pautas de la práctica");
  return response.json();
};

export const getPautaDetalle = async (rut: string, id: number): Promise<PautaDetalle> => {
  const response = await fetch(`${API_URL}/${id}`, { headers: cabeceras(rut) });
  if (!response.ok) throw await leerError(response, "No se pudo cargar la pauta");
  return response.json();
};

export const getAplicacion = async (
  rut: string,
  pautaId: number,
  practicaId: number
): Promise<AplicacionPauta | null> => {
  const response = await fetch(`${API_URL}/${pautaId}/practica/${practicaId}`, { headers: cabeceras(rut) });
  if (response.status === 204) return null;
  if (!response.ok) throw await leerError(response, "No se pudo cargar la evaluación guardada");
  return response.json();
};

export const guardarAplicacion = async (
  rut: string,
  pautaId: number,
  practicaId: number,
  payload: GuardarAplicacionPayload
): Promise<AplicacionPauta> => {
  const response = await fetch(`${API_URL}/${pautaId}/practica/${practicaId}`, {
    method: "PUT",
    headers: cabeceras(rut, true),
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw await leerError(response, "No se pudo guardar la pauta");
  return response.json();
};

export const reabrirAplicacion = async (
  rut: string,
  pautaId: number,
  practicaId: number
): Promise<AplicacionPauta> => {
  const response = await fetch(`${API_URL}/${pautaId}/practica/${practicaId}/reabrir`, {
    method: "POST",
    headers: cabeceras(rut),
  });
  if (!response.ok) throw await leerError(response, "No se pudo reabrir la pauta");
  return response.json();
};

export const getResultados = async (rut: string): Promise<ResultadoPauta[]> => {
  const response = await fetch(`${API_URL}/resultados`, { headers: cabeceras(rut) });
  if (!response.ok) throw await leerError(response, "No se pudieron cargar las evaluaciones");
  return response.json();
};

export const getCatalogo = async (rut: string): Promise<PautaResumen[]> => {
  const response = await fetch(API_URL, { headers: cabeceras(rut) });
  if (!response.ok) throw await leerError(response, "No se pudo cargar el catálogo de pautas");
  return response.json();
};

export const cambiarActivaPauta = async (rut: string, id: number, valor: boolean): Promise<PautaDetalle> => {
  const response = await fetch(`${API_URL}/${id}/activa?valor=${valor}`, {
    method: "PATCH",
    headers: cabeceras(rut),
  });
  if (!response.ok) throw await leerError(response, "No se pudo cambiar el estado de la pauta");
  return response.json();
};
