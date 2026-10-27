export type PracticaMenuKey =
  | "inicio"
  | "portafolio"
  | "documentos"
  | "evaluaciones"
  | "equipo"
  | "perfil";

export type SemestrePractica = 8 | 9;

export interface ItemPendiente {
  id: string | number;
  titulo: string;
  fechaLimite?: string;
  menuDestino: PracticaMenuKey;
  tipo: "documento" | "evaluacion" | "observacion" | "aviso";
}

export interface PersonaEquipo {
  nombre: string;
  rol: string;
  correo: string;
  telefono?: string;
  lugar?: string;
  esTutor?: boolean;
  esProfesor?: boolean;
  esCoordinador?: boolean;
}

export interface ObservacionItem {
  id: number | string;
  evalId?: number;
  autor: string;
  rol: string;
  fecha: string;
  texto: string;
  editada?: boolean;
}

export interface EvaluacionItem {
  id: number;
  titulo: string;
  evaluador: string;
  fecha: string;
  nota: string | null;
  estado: "CALIFICADA" | "PENDIENTE";
  observaciones: ObservacionItem[];
}

export interface DocumentoFiltroItem {
  id: number | string;
  nombre: string;
  ext: string;
  tamanio: string;
  fecha: string;
  categoria: "Documentos" | "Evidencias" | "Informes" | "Otros";
  subidoPor: string;
  rolSubidoPor: string;
  /** true si el archivo lo subió el propio estudiante (solo esos puede eliminarlos) */
  esPropio: boolean;
  urlDescarga?: string | null;
}

export interface DatosPracticaEstudiante {
  semestre: SemestrePractica;
  asignaturaNombre: string;
  codigoAsignatura: string;
  centroPractica: string;
  direccionCentro: string;
  periodo: string;
  horasRealizadas: number;
  horasTotales: number;
  estadoAprobacion: string;
  tutorNombre: string;
  tutorCorreo: string;
  profesorAsignatura: string;
  profesorAsignaturaCorreo: string;
  profesorColaborador: string;
  profesorColaboradorCorreo: string;
  coordinador: string;
  coordinadorCorreo: string;
  pendientes: ItemPendiente[];
  equipo: PersonaEquipo[];
  documentos: DocumentoFiltroItem[];
  evaluaciones: EvaluacionItem[];
  observacionesGenerales: ObservacionItem[];
}
