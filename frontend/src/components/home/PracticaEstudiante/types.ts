import type { EvaluacionPauta } from "@/types/evaluacionPauta";

export type PracticaMenuKey =
  | "inicio"
  | "portafolio"
  | "planificacion"
  | "retroalimentacion"
  | "pautas"
  | "asistentes-ia"
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

/** Evaluación de la práctica (tabla rubrica_practica): rúbrica del profesor colaborador u observación del tutor. */
export interface RubricaPractica {
  idRubrica: number;
  tipoEvaluador: "PROFESOR_COLABORADOR" | "TUTOR_PRACTICA";
  area: "MATEMATICA" | "ORIENTACION" | "OBSERVACION";
  numero: number;
  titulo: string;
  estado: "PENDIENTE" | "COMPLETADA";
  nota: number | null;
  fechaCompletada: string | null;
}

/**
 * Respuesta de GET /api/rubricas-practica/estudiante/{rut}. En las prácticas hasta 8.° semestre, «evaluaciones» trae
 * las pautas con que evalúan al estudiante (una por pauta y evaluador) y es lo que mide el seguimiento; «rubricas»
 * son las 6 evaluaciones anteriores a las pautas, que se muestran solo si no hay pautas.
 */
export interface AvancePractica {
  idPractica: number | null;
  colaboradores: { nombre: string; correo: string | null; centro: string | null }[];
  rubricas: RubricaPractica[];
  evaluaciones?: EvaluacionPauta[];
}

export interface DatosPracticaEstudiante {
  semestre: SemestrePractica;
  asignaturaNombre: string;
  centroPractica: string;
  direccionCentro: string;
  periodo: string;
  etapaActual: string;
  etapas: EtapaPractica[];
  equipo: PersonaEquipo[];
  actividades: ActividadRecienteItem[];
}
