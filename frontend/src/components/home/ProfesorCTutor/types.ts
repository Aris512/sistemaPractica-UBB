export type ProfesorCTutorMenuKey = "inicio" | "pautas" | "observaciones" | "portafolio" | "perfil";

export interface EstudianteTutorRow {
  idEstudiante: number | string;
  idPractica?: number | null;
  rut: string;
  nombre: string;
  correo: string;
  asignaturaNombre: string;
  centroPractica: string;
  estadoObservacion: "SIN_OBSERVACION" | "OBSERVADO" | "VISITA_PENDIENTE";
  estadoEvaluacion: "PENDIENTE" | "EN_EVALUACION" | "EVALUADO";
  calificacion?: number | null;
  observacionTexto?: string | null;
  fechaActualizacion?: string | null;
  idEvaluacion?: number | null;
  tipoEvaluacion?: string | null;
  evaluadorRut?: string | null;
  evaluadorNombre?: string | null;
  tipoEvaluador?: string | null;
  archivoUrl?: string | null;
  nombreArchivo?: string | null;
  tieneArchivo?: boolean;
}

export type SortDirection = "asc" | "desc" | null;

export interface SortState {
  column: keyof EstudianteTutorRow | null;
  direction: SortDirection;
}
