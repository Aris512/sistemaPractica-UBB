export interface CourseItem {
  id: string | number;
  nombre: string;
  coordinador: string;
  codigo: string;
  participantes: number;
  sede: string;
  periodo: string;
  avisos: number;
  actividades: number;
  proximas: number;
  semestre?: string;
  esAnterior?: boolean;
}

export type ModalType = "avisos" | "actividades" | "proximas" | "detalle";

export type HomeMenuKey =
  | "inicio"
  | "mis-cursos"
  | "malla-curricular"
  | "cursos-publicos"
  | "resultados-test"
  | "calendario"
  | "bodega"
  | "perfil"
  | "portafolio"
  | "cursos-practica"
  | "planificacion"
  | "evaluaciones"
  | "observaciones"
  | "asistentes-ia";

// Cursos iniciales fieles al pantallazo de Adecca UBB
export const INITIAL_COURSES: CourseItem[] = [
  {
    id: "630156-2",
    nombre: "FORMULACIÓN Y EVALUACIÓN DE PROYECTOS",
    coordinador: "Virna Angélica Ortiz Araya",
    codigo: "630156 - 2",
    participantes: 35,
    sede: "Concepción",
    periodo: "2026 - 2",
    avisos: 0,
    actividades: 10,
    proximas: 0,
  },
  {
    id: "630159-1",
    nombre: "LEGISLACIÓN",
    coordinador: "Héctor Rolando Alarcón Delgado",
    codigo: "630159 - 1",
    participantes: 43,
    sede: "Concepción",
    periodo: "2026 - 2",
    avisos: 1,
    actividades: 2,
    proximas: 0,
  },
];

// Cursos anteriores desplegables
export const PREVIOUS_COURSES: CourseItem[] = [
  {
    id: "630140-1",
    nombre: "CURRICULUM EDUCACIONAL Y PEDAGOGÍA",
    coordinador: "Patricia E. Morales Valenzuela",
    codigo: "630140 - 1",
    participantes: 38,
    sede: "Concepción",
    periodo: "2026 - 1",
    avisos: 2,
    actividades: 4,
    proximas: 0,
    esAnterior: true,
  },
  {
    id: "630145-2",
    nombre: "AMBIENTES DE APRENDIZAJE EFECTIVOS",
    coordinador: "Rodrigo A. Carvajal Soto",
    codigo: "630145 - 2",
    participantes: 32,
    sede: "Concepción",
    periodo: "2025 - 2",
    avisos: 0,
    actividades: 1,
    proximas: 0,
    esAnterior: true,
  },
];
