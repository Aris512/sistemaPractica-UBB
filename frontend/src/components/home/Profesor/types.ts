export type ProfesorMenuKey =
  | "inicio"
  | "actividades"
  | "revision-retroalimentacion"
  | "documentos-practica"
  | "portafolio"
  | "cursos-practica"
  | "planificacion"
  | "evaluaciones"
  | "observaciones"
  | "asistentes-ia"
  | "perfil";


export interface EstudianteEvidenciaRow {
  idEstudiante: number | string;
  idEvidencia?: number | null;
  idActividad?: number | null;
  rut: string;
  nombre: string;
  correo: string;
  actividadTitulo: string;
  estadoEntrega: "ENTREGADO" | "PENDIENTE" | "NO_ENTREGADO";
  estadoRevision: "REVISADO" | "PENDIENTE_REVISION" | "OBSERVADO" | "SIN_ENTREGA";
  fechaSubida: string | null;
  fechaSubidaRaw?: string | null;
  nombreArchivo?: string | null;
  archivoUrl?: string | null;
  comentarioEstudiante?: string | null;
  calificacion?: number | null;
  retroalimentacion?: string | null;
  fechaRevision?: string | null;
}

export type SortDirection = "asc" | "desc" | null;

export interface SortState {
  column: keyof EstudianteEvidenciaRow | null;
  direction: SortDirection;
}
