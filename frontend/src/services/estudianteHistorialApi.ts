import type { EstadoPractica, HistorialItem } from "@/types/historialEstudiante";

const API_URL = "/api/estudiantes";

export const getEstadoPracticaEstudiante = async (rut: string): Promise<EstadoPractica> => {
  if (!rut) throw new Error("RUT del estudiante requerido");
  const response = await fetch(`${API_URL}/rut/${encodeURIComponent(rut)}/estado-practica`);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Error al obtener estado de práctica");
  }
  return response.json();
};

export const getHistorialEstudiante = async (rut: string): Promise<HistorialItem[]> => {
  if (!rut) return [];
  const response = await fetch(`${API_URL}/rut/${encodeURIComponent(rut)}/historial`);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Error al obtener historial del estudiante");
  }
  return response.json();
};
