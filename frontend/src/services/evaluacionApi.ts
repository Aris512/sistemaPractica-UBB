import type { Evaluacion, ObservacionEvaluacion } from "../types/evaluacion";

const API_URL = "http://localhost:8080/api";

export const getEvaluaciones = async (): Promise<Evaluacion[]> => {
  const response = await fetch(`${API_URL}/evaluaciones`);
  if (!response.ok) throw new Error("Error al obtener las evaluaciones");
  return response.json();
};

export const getEvaluacionById = async (id: number): Promise<Evaluacion> => {
  const response = await fetch(`${API_URL}/evaluaciones/${id}`);
  if (!response.ok) throw new Error("Error al obtener la evaluación");
  return response.json();
};

export const getObservacionesByEvaluacion = async (idEvaluacion: number): Promise<ObservacionEvaluacion[]> => {
  const response = await fetch(`${API_URL}/observaciones-evaluacion/evaluacion/${idEvaluacion}`);
  if (!response.ok) throw new Error("Error al obtener las observaciones");
  return response.json();
};

export const crearObservacion = async (observacion: { evaluacion: { idEvaluacion: number }, texto: string }): Promise<ObservacionEvaluacion> => {
  const response = await fetch(`${API_URL}/observaciones-evaluacion`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(observacion),
  });
  if (!response.ok) throw new Error("Error al crear la observación");
  return response.json();
};

export const actualizarObservacion = async (id: number, texto: string): Promise<ObservacionEvaluacion> => {
  const response = await fetch(`${API_URL}/observaciones-evaluacion/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ texto }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Error al actualizar la observación");
  }
  return response.json();
};
