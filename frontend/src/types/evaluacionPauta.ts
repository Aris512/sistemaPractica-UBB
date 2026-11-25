/**
 * Evaluación con pauta que le corresponde a un estudiante (una por pauta y evaluador), en sus asignaturas hasta
 * 8.° semestre. Viene del backend (EvaluacionPautaDTO).
 */
export interface EvaluacionPauta {
  idPauta: number;
  /** null si el evaluador aún no la registra (estado PENDIENTE). */
  idAplicacion: number | null;
  idPractica: number | null;
  codigo: string | null;
  titulo: string | null;
  asignatura: string | null;
  semestre: string | null;
  evaluadorRol: "COLABORADOR" | "TUTOR" | "ACADEMICO" | string;
  evaluadorNombre: string | null;
  estado: "FINALIZADA" | "BORRADOR" | "PENDIENTE";
  nota: number | null;
  fecha: string | null;
}

/** Nombre del evaluador según su rol en la pauta. */
export function nombreRolEvaluador(rol: string | null | undefined): string {
  switch ((rol || "").toUpperCase()) {
    case "COLABORADOR":
      return "Profesor colaborador";
    case "TUTOR":
      return "Tutor";
    case "ACADEMICO":
      return "Profesor de asignatura";
    default:
      return "Evaluador";
  }
}
