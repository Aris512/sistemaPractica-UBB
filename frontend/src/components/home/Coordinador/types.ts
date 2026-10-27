export type CoordinadorMenuKey =
  | "inicio"
  | "asociar"
  | "centros-practica"
  | "evaluaciones"
  | "pautas"
  | "documentos"
  | "documentos-practica"
  | "portafolio"
  | "perfil";

export interface EstudiantePractica {
  idEstudiante: number;
  nombre: string;
  rut: string;
  idAsignatura: number;
  asignaturaNombre: string;
  tieneAsociacion: boolean;
  idPractica?: number | null;
  tutorNombre?: string;
  centroNombre?: string;
  colaboradorNombre?: string;
}

export interface AsignaturaPractica {
  idAsignatura: number;
  nombre: string;
  descripcion?: string;
  semestre?: string;
  /** INICIAL | INTERMEDIA | PEDAGOGICA | PROFESIONAL */
  nivel?: string;
  requiereColaborador?: boolean;
  requiereTutor?: boolean;
}

export interface TutorPracticaDTO {
  idTutor: number;
  nombre: string;
  rut?: string;
}

export interface ProfesorColaboradorDTO {
  idColaborador: number;
  nombre: string;
  especialidad?: string;
  idCentro?: number | null;
  centroNombre?: string;
}

export interface CentroPracticaDTO {
  idCentro: number;
  nombre: string;
  direccion?: string;
}

export interface AsociacionPractica {
  idPractica: number;
  idEstudiante: number;
  estudianteNombre: string;
  idAsignatura: number;
  asignaturaNombre: string;
  idTutor?: number;
  tutorNombre?: string;
  idColaborador?: number;
  colaboradorNombre?: string;
  idCentro?: number;
  centroNombre?: string;
  estadoAprobacion: string;
  /** La práctica ya tiene pautas de evaluación aplicadas: no se puede reemplazar ni desvincular. */
  tienePautas?: boolean;
}

export interface CandidatosResponse {
  asignatura: {
    idAsignatura: number;
    nombre: string;
    semestre?: string;
  };
  estudiantes: Array<{
    idEstudiante: number;
    nombre: string;
    rut: string;
    idAsignatura: number;
    asignaturaNombre: string;
  }>;
  tutores: Array<{
    idTutor: number;
    nombre: string;
    rut?: string;
  }>;
  profesoresColaboradores: Array<{
    idColaborador: number;
    nombre: string;
    especialidad?: string;
    idCentro?: number | null;
    centroNombre?: string;
  }>;
  centrosPractica: Array<{
    idCentro: number;
    nombre: string;
    direccion?: string;
  }>;
}
