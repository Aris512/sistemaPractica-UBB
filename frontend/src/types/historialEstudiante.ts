export interface HistorialItem {
  id: number;
  titulo: string;
  tipo: "ACTIVIDAD" | "EVALUACION";
  fecha?: string;
  fechaFormateada: string;
  estado: string;
  completado: boolean;
  calificacion?: number | null;
  evaluadorNombre?: string;
  evaluadorRol?: string;
  observacion?: string;
  nombreArchivo?: string;
  archivoUrl?: string;
}

export interface EstadoPractica {
  esPractica: boolean;
  etapaActual: "INSCRIPCION" | "INICIO" | "SEGUIMIENTO" | "EVALUACION_FINAL" | "REGULAR";
  etapaIndex: number;
  progresoPorcentaje: number;
  asignaturaNombre: string;
  codigoAsignatura: string;
  semestre: string;
  centroPractica?: string;
  tutorNombre?: string;
  profesorNombre?: string;
  horasRealizadas?: number;
  horasTotales?: number;
  historial?: HistorialItem[];
}
