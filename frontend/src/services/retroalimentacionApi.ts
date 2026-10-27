import { requestConUsuario } from "@/services/chatApi";
import type {
  InicioRevision,
  PlanificacionRetro,
  Retroalimentacion,
  RetroProfesor,
  RetroProfesorDetalle,
} from "@/types/retroalimentacion";

/** Cliente de la retroalimentación de planificaciones con IA. Los errores llegan como ChatApiError. */
const BASE_URL = "/api/retroalimentaciones-ia";

export function listarRetroalimentacionesEstudiante(rut: string): Promise<PlanificacionRetro[]> {
  return requestConUsuario(rut, `${BASE_URL}/estudiante`);
}

export function iniciarRevisionIa(rut: string, idPlanificacion: number): Promise<InicioRevision> {
  return requestConUsuario(rut, `${BASE_URL}/planificacion/${idPlanificacion}/revision-ia`, { method: "POST" });
}

/**
 * Botón + del chat: reemplaza el archivo «Planificación»; `mensaje` (opcional) es lo que el alumno escribió junto al archivo.
 * Devuelve la conversación de revisión a mostrar (nueva si se reinició el ciclo).
 */
export function reemplazarArchivoPlanificacion(
  rut: string,
  idPlanificacion: number,
  archivo: File,
  mensaje = ""
): Promise<InicioRevision> {
  const datos = new FormData();
  datos.append("archivo", archivo);
  if (mensaje) datos.append("mensaje", mensaje);
  return requestConUsuario(rut, `${BASE_URL}/planificacion/${idPlanificacion}/archivo`, { method: "POST", body: datos });
}

export function enviarAlProfesor(rut: string, id: number): Promise<Retroalimentacion> {
  return requestConUsuario(rut, `${BASE_URL}/${id}/enviar`, { method: "POST" });
}

export function reiniciarRetroalimentacion(rut: string, id: number): Promise<Retroalimentacion> {
  return requestConUsuario(rut, `${BASE_URL}/${id}/reiniciar`, { method: "POST" });
}

export function listarRetroalimentacionesProfesor(rut: string): Promise<RetroProfesor[]> {
  return requestConUsuario(rut, `${BASE_URL}/profesor`);
}

export function detalleRetroalimentacionProfesor(rut: string, id: number): Promise<RetroProfesorDetalle> {
  return requestConUsuario(rut, `${BASE_URL}/profesor/${id}`);
}

export function responderRetroalimentacion(
  rut: string,
  id: number,
  aprobado: boolean,
  comentario: string
): Promise<RetroProfesor> {
  return requestConUsuario(rut, `${BASE_URL}/profesor/${id}/responder`, {
    method: "POST",
    body: JSON.stringify({ aprobado, comentario }),
  });
}

/** URL de descarga del archivo de planificación (endpoint existente de planificaciones). */
export function urlArchivoPlanificacion(idDocumento: number): string {
  return `/api/planificaciones/archivos/${idDocumento}/descargar`;
}
