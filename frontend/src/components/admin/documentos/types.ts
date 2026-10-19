export interface ProfesorContacto {
  rut: string;
  nombre: string;
  correo: string;
  rol: string;
  asignatura?: string;
}

export interface EstudianteDocumentoRow {
  rut: string;
  nombre: string;
  correo: string;
  asignatura: string;
  idAsignatura: number | null;
  semestre: string;
  totalDocumentos: number; // entregados
  documentosRequeridos: number; // normalmente 2
  progreso: number; // 0 - 100
  estado: "COMPLETO" | "EN_PROGRESO" | "PENDIENTE";
  profesores: ProfesorContacto[];
}

export interface DocumentoItem {
  id: number | null;
  nombreDocumento: string;
  nombreArchivo: string;
  tipoDocumento: "ESTUDIANTE" | "PROFESOR";
  fechaCarga: string | null;
  estado: "ENTREGADO" | "PENDIENTE";
  tamanio: string;
  subidoPor: string;
  correoSubidoPor: string;
  downloadUrl: string | null;
}

export interface EstudianteDetalleDocumentos {
  rut: string;
  nombre: string;
  correo: string;
  asignatura: string;
  idAsignatura: number | null;
  semestre: string;
  progreso: number;
  totalDocumentos: number;
  documentosRequeridos: number;
  profesores: ProfesorContacto[];
  documentos: DocumentoItem[];
  tareas: TareaSeguimiento[];
}

export interface TareaSeguimiento {
  idEvidencia: number;
  idActividad: number | null;
  tituloActividad: string;
  asignatura: string;
  semestre: string;
  estado: string;
  calificacion: number | null;
  fechaEntrega: string | null;
  nombreArchivoEstudiante: string | null;
  nombreArchivoRevision: string | null;
  tieneArchivoEstudiante: boolean;
  tieneArchivoRevision: boolean;
}

export type SortDirection = "asc" | "desc" | null;

export interface DocumentosSortState {
  column: keyof EstudianteDocumentoRow | null;
  direction: SortDirection;
}
