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
  archivoUrl?: string | null;
  nombreArchivo?: string | null;
  tieneArchivo?: boolean;
  tipoEvaluador?: string | null;
  // Entrega (evidencia) que el alumno subió a la actividad del profesor
  idEvidencia?: number | null;
  nombreArchivoEntrega?: string | null;
  tituloActividad?: string | null;
  fechaEntrega?: string | null;
  tieneArchivoEntrega?: boolean;
}

export interface GuardarEvaluacionRequest {
  idEstudiante: number;
  idEvaluacion?: number | null;
  rutProfesor: string;
  rutEvaluador?: string;
  nombreEvaluador?: string;
  tipoEvaluador?: string;
  idPractica?: number;
  tipoEvaluacion?: string;
  puntajeMinimo?: number;
  puntajeMaximo?: number;
  puntajeObtenido?: number | null;
  observacion?: string | null;
  file?: File | null;
  eliminarArchivo?: boolean;
}

export interface NotaDeVozDTO {
  idAudio: number;
  idEvaluacion: number;
  duracion?: number | null;
  audioUrl?: string | null;
  nombreArchivo?: string | null;
  transcripcion?: string | null;
  fechaGrabacion?: string | null;
  rutGrabador?: string | null;
}

const API_URL = "/api/evaluaciones";
const EVIDENCIAS_URL = "/api/evidencias";

const MIME_POR_EXTENSION: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  txt: "text/plain",
};

/** Obtiene el archivo que el alumno entregó, con el tipo MIME correcto para previsualizarlo. */
export const obtenerArchivoEntregaAlumno = async (
  idEvidencia: number,
  nombreArchivo?: string | null
): Promise<Blob> => {
  const response = await fetch(`${EVIDENCIAS_URL}/${idEvidencia}/archivo-alumno`);
  if (!response.ok) {
    throw new Error(`Error ${response.status}: No se pudo obtener el archivo entregado por el alumno.`);
  }
  const blob = await response.blob();
  const extension = (nombreArchivo || "").split(".").pop()?.toLowerCase() || "";
  const tipo = MIME_POR_EXTENSION[extension] || blob.type || "application/octet-stream";
  return blob.type === tipo ? blob : new Blob([blob], { type: tipo });
};

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

export const getEvaluacionesEstudiante = async (
  rutEstudiante: string
): Promise<EstudianteEvaluacion[]> => {
  const response = await fetch(`${API_URL}/estudiante/rut/${encodeURIComponent(rutEstudiante)}`);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Error al obtener las evaluaciones del estudiante");
  }
  return response.json();
};

export const guardarEvaluacionProfesor = async (
  data: GuardarEvaluacionRequest
): Promise<EstudianteEvaluacion> => {
  // Si incluye archivo o eliminación de archivo, enviar como multipart/form-data
  if (data.file || data.eliminarArchivo) {
    const formData = new FormData();
    formData.append("idEstudiante", String(data.idEstudiante));
    if (data.rutProfesor) formData.append("rutProfesor", data.rutProfesor);
    if (data.rutEvaluador) formData.append("rutEvaluador", data.rutEvaluador);
    if (data.nombreEvaluador) formData.append("nombreEvaluador", data.nombreEvaluador);
    if (data.tipoEvaluador) formData.append("tipoEvaluador", data.tipoEvaluador);
    if (data.idPractica != null) formData.append("idPractica", String(data.idPractica));
    if (data.idEvaluacion != null) formData.append("idEvaluacion", String(data.idEvaluacion));
    if (data.tipoEvaluacion) formData.append("tipoEvaluacion", data.tipoEvaluacion);
    if (data.puntajeObtenido != null) formData.append("puntajeObtenido", String(data.puntajeObtenido));
    if (data.observacion != null) formData.append("observacion", data.observacion);
    if (data.file) formData.append("file", data.file);
    if (data.eliminarArchivo) formData.append("eliminarArchivo", "true");

    const response = await fetch(`${API_URL}/guardar-con-archivo`, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Error al guardar la evaluación con archivo adjunto");
    }
    return response.json();
  }

  // De lo contrario, usar el endpoint JSON estándar
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

export const descargarArchivoEvaluacion = async (
  idEvaluacion?: number | null,
  idEstudiante?: number | null,
  nombreArchivoFallback?: string | null
): Promise<void> => {
  let url = "";
  if (idEvaluacion) {
    url = `${API_URL}/${idEvaluacion}/archivo`;
  } else if (idEstudiante) {
    url = `${API_URL}/estudiante/${idEstudiante}/archivo`;
  } else {
    throw new Error("Se requiere ID de evaluación o ID de estudiante para descargar");
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Error ${response.status}: No se pudo descargar el archivo de evaluación.`);
  }

  const blob = await response.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;

  const disposition = response.headers.get("Content-Disposition");
  let filename = nombreArchivoFallback || "documento_evaluacion.pdf";
  if (disposition && disposition.includes("filename=")) {
    const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
    if (matches != null && matches[1]) {
      filename = matches[1].replace(/['"]/g, "");
    }
  }

  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(blobUrl);
  document.body.removeChild(a);
};

export const eliminarArchivoEvaluacion = async (
  idEvaluacion: number
): Promise<EstudianteEvaluacion> => {
  const response = await fetch(`${API_URL}/${idEvaluacion}/archivo`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Error al eliminar el archivo de la evaluación");
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

export const eliminarEvaluacionCompleta = async (
  idEstudiante: number
): Promise<EstudianteEvaluacion> => {
  const response = await fetch(`${API_URL}/estudiante/${idEstudiante}/completa`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Error al eliminar la entrega, nota y observación del estudiante");
  }
  return response.json();
};

const NOTAS_VOZ_URL = "/api/notas-de-voz";

export const getNotasDeVozPorEvaluacion = async (
  idEvaluacion: number
): Promise<NotaDeVozDTO[]> => {
  const response = await fetch(`${NOTAS_VOZ_URL}/evaluacion/${idEvaluacion}`);
  if (!response.ok) {
    throw new Error(`Error al obtener notas de voz: ${response.statusText}`);
  }
  return response.json();
};

export const getNotasDeVozPorEstudiante = async (
  idEstudiante: number
): Promise<NotaDeVozDTO[]> => {
  const response = await fetch(`${NOTAS_VOZ_URL}/estudiante/${idEstudiante}`);
  if (!response.ok) {
    throw new Error(`Error al obtener notas de voz del estudiante: ${response.statusText}`);
  }
  return response.json();
};

export const subirNotaDeVoz = async (
  formData: FormData
): Promise<NotaDeVozDTO> => {
  const response = await fetch(`${NOTAS_VOZ_URL}/subir`, {
    method: "POST",
    body: formData,
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Error al subir la nota de voz");
  }
  return response.json();
};

export const actualizarTranscripcionNotaVoz = async (
  idAudio: number,
  transcripcion: string
): Promise<NotaDeVozDTO> => {
  const response = await fetch(`${NOTAS_VOZ_URL}/${idAudio}/transcripcion`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ transcripcion }),
  });
  if (!response.ok) {
    throw new Error("Error al actualizar la transcripción");
  }
  return response.json();
};

export const eliminarNotaDeVoz = async (idAudio: number): Promise<void> => {
  const response = await fetch(`${NOTAS_VOZ_URL}/${idAudio}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Error al eliminar la nota de voz");
  }
};

export const getAudioUrl = (idAudio: number): string => {
  return `${NOTAS_VOZ_URL}/${idAudio}/audio`;
};
