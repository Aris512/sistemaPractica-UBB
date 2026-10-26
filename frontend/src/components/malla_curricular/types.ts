export type AreaTematica =
  | "disciplinar"
  | "didactica"
  | "pedagogica"
  | "practica"
  | "general";

export type EstadoAsignatura = "aprobada" | "cursando" | "pendiente";

export interface AsignaturaMalla {
  id: string;
  nombre: string;
  codigo: string;
  semestre: number; // 1..10
  semestreRomano: string; // "I", "II", ..., "X"
  año: number; // 1..5
  creditos: number; // Créditos SCT
  area: AreaTematica;
  idAsignaturaDb?: number; // Atributo id_asignatura de la base de datos
  prerrequisitos?: string[];
  descripcion?: string;
}

export interface SemestreData {
  numero: number;
  romano: string;
  año: number;
  asignaturas: AsignaturaMalla[];
}

export interface AñoData {
  año: number;
  titulo: string;
  semestres: SemestreData[];
}

export interface AreaInfo {
  id: AreaTematica;
  nombre: string;
  color: string;
  bgLight: string;
  border: string;
  dotColor: string;
}

export const AREAS_TEMATICAS: Record<AreaTematica, AreaInfo> = {
  disciplinar: {
    id: "disciplinar",
    nombre: "Formación Disciplinar (Matemática)",
    color: "text-blue-800",
    bgLight: "bg-blue-50/80",
    border: "border-blue-200",
    dotColor: "bg-blue-600",
  },
  didactica: {
    id: "didactica",
    nombre: "Didáctica de la Matemática",
    color: "text-teal-800",
    bgLight: "bg-teal-50/80",
    border: "border-teal-200",
    dotColor: "bg-teal-600",
  },
  pedagogica: {
    id: "pedagogica",
    nombre: "Formación Pedagógica",
    color: "text-amber-800",
    bgLight: "bg-amber-50/80",
    border: "border-amber-200",
    dotColor: "bg-amber-600",
  },
  practica: {
    id: "practica",
    nombre: "Prácticas y Titulación",
    color: "text-purple-800",
    bgLight: "bg-purple-50/80",
    border: "border-purple-200",
    dotColor: "bg-purple-600",
  },
  general: {
    id: "general",
    nombre: "Formación Integral e Idiomas",
    color: "text-slate-800",
    bgLight: "bg-slate-100",
    border: "border-slate-300",
    dotColor: "bg-slate-500",
  },
};
