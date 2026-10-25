export type PracticaMenuKey =
  | "inicio"
  | "portafolio"
  | "documentos"
  | "evaluaciones"
  | "equipo"
  | "perfil";

export type SemestrePractica = 8 | 9;

export type EstadoEtapa = "done" | "cur" | "pending";

export interface EtapaPractica {
  id: string;
  titulo: string;
  subtitulo: string;
  estado: EstadoEtapa;
  completada: boolean;
  actual: boolean;
}

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

export interface ActividadRecienteItem {
  id: string | number;
  descripcion: string;
  tiempo: string;
  tipo: "up" | "clip" | "edit" | "trash" | "check";
  usuario?: string;
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
  etapas: EtapaPractica[];
  pendientes: ItemPendiente[];
  equipo: PersonaEquipo[];
  actividades: ActividadRecienteItem[];
  documentos: DocumentoFiltroItem[];
  evaluaciones: EvaluacionItem[];
  observacionesGenerales: ObservacionItem[];
}
