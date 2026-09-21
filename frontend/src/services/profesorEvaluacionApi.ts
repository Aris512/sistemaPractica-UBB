export interface EstudianteEvaluacion {
  idEstudiante: number;
  nombre: string;
  apellido: string;
  rut: string;
  correo: string;
  asignatura: string;
  idAsignatura: number;
  estadoEntrega: "ENTREGADO" | "NO_ENTREGADO";
  estadoEvaluacion: "EVALUADO" | "NO_EVALUADO" | "SIN_OBSERVACION";
  idPractica?: number;
  centroPractica?: string;
  nota?: number;
  observacion?: string;
  idEvaluacion?: number;
  fechaEvaluacion?: string;
  puntajeMinimo?: number;
  puntajeMaximo?: number;
  tipoEvaluacion?: string;
  evaluadorRut?: string;
  evaluadorNombre?: string;
}

export interface GuardarEvaluacionRequest {
  idEstudiante: number;
  idEvaluacion?: number | null;
  rutProfesor: string;
  tipoEvaluacion?: string;
  puntajeMinimo?: number;
  puntajeMaximo?: number;
  puntajeObtenido?: number | null;
  observacion?: string | null;
}

const API_URL = "http://localhost:8080/api/evaluaciones";

export const getEstudiantesProfesor = async (
  rutProfesor: string
): Promise<EstudianteEvaluacion[]> => {
  const response = await fetch(`${API_URL}/profesor/${encodeURIComponent(rutProfesor)}`);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Error al obtener la lista de estudiantes para evaluar");
  }
  return response.json();
};

export const guardarEvaluacionProfesor = async (
  data: GuardarEvaluacionRequest
): Promise<EstudianteEvaluacion> => {
  const response = await fetch(`${API_URL}/guardar`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Error al guardar la evaluación");
  }
  return response.json();
};

export const eliminarNotaEstudiante = async (
  idEstudiante: number
): Promise<EstudianteEvaluacion> => {
  const response = await fetch(`${API_URL}/estudiante/${idEstudiante}/nota`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Error al eliminar la nota");
  }
  return response.json();
};

export const eliminarObservacionEstudiante = async (
  idEstudiante: number
): Promise<EstudianteEvaluacion> => {
  const response = await fetch(`${API_URL}/estudiante/${idEstudiante}/observacion`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Error al eliminar la observación");
  }
  return response.json();
};

