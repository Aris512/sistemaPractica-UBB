const API_URL = "http://localhost:8080/api";

/** Actividad enriquecida con el estado de la evidencia del estudiante */
export interface ActividadEstudiante {
  // Actividad
  idActividad: number;
  titulo: string;
  descripcion?: string;
  estado: "ACTIVA" | "CERRADA";
  fechaCreacion?: string;
  fechaLimite?: string;

  // Asignatura
  idAsignatura?: number;
  nombreAsignatura?: string;

  // Profesor
  idProfesor?: number;
  nombreProfesor?: string;
  apellidoProfesor?: string;
  rutProfesor?: string;

  // Evidencia del estudiante (null si no ha entregado)
  idEvidencia?: number;
  estadoEvidencia?: "PENDIENTE" | "REVISADO" | "OBSERVADO";
  fechaEntrega?: string;
  nombreArchivo?: string;
  archivoUrl?: string;
  comentarioEstudiante?: string;
  calificacion?: number;
  retroalimentacion?: string;
  fechaRevision?: string;
}

/** Obtiene las actividades de la asignatura del estudiante con estado de entrega */
export const getActividadesEstudiante = async (
  rut: string
): Promise<ActividadEstudiante[]> => {
  const response = await fetch(
    `${API_URL}/actividades/estudiante/${encodeURIComponent(rut)}/enriquecido`
  );
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      errorText || "Error al obtener las actividades del estudiante"
    );
  }
  return response.json();
};

/** Sube un archivo como evidencia de una actividad */
export const subirEvidenciaArchivo = async (params: {
  idActividad: number;
  rutEstudiante: string;
  file: File;
  comentario?: string;
}): Promise<unknown> => {
  const formData = new FormData();
  formData.append("file", params.file);
  formData.append("idActividad", String(params.idActividad));
  formData.append("rutEstudiante", params.rutEstudiante);
  if (params.comentario?.trim()) {
    formData.append("comentario", params.comentario.trim());
  }

  const response = await fetch(`${API_URL}/evidencias/subir-archivo`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    let errorMsg = "Error al subir el archivo";
    try {
      const err = await response.json();
      errorMsg = err?.error || errorMsg;
    } catch {
      errorMsg = (await response.text()) || errorMsg;
    }
    throw new Error(errorMsg);
  }
  return response.json();
};

/** Construye la URL de descarga de un archivo almacenado en el servidor */
export const getArchivoDownloadUrl = (relativePath: string): string => {
  if (!relativePath) return "";
  if (relativePath.startsWith("http")) return relativePath;
  const clean = relativePath.replace(/^uploads\//, "");
  return `http://localhost:8080/uploads/${clean}`;
};

/** Elimina la evidencia entregada por el estudiante para una actividad */
export const eliminarEvidencia = async (idEvidencia: number): Promise<void> => {
  const response = await fetch(
    `http://localhost:8080/api/evidencias/${idEvidencia}`,
    { method: "DELETE" }
  );
  if (!response.ok) {
    let errorMsg = "Error al eliminar la entrega";
    try {
      const err = await response.json();
      errorMsg = err?.error || errorMsg;
    } catch {
      errorMsg = (await response.text()) || errorMsg;
    }
    throw new Error(errorMsg);
  }
};
