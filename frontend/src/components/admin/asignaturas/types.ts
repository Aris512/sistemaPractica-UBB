export interface Asignatura {
  idAsignatura: number;
  nombre: string;
  descripcion?: string;
  semestre?: string;
}

export interface CreateAsignaturaDTO {
  nombre: string;
  descripcion?: string;
  semestre?: string;
}

export interface EditAsignaturaDTO {
  idAsignatura: number;
  nombre: string;
  descripcion?: string;
  semestre?: string;
}

export type SortDirection = "asc" | "desc" | null;

export interface AsignaturaSortState {
  column: keyof Asignatura | null;
  direction: SortDirection;
}
