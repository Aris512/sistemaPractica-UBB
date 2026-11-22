import {
  BookOpen,
  Briefcase,
  ClipboardCheck,
  ClipboardList,
  FolderOpen,
  GraduationCap,
  School,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface RolMeta {
  nombre: string;
  descripcion: string;
  icono: LucideIcon;
}

const ROLES: Record<string, RolMeta> = {
  ESTUDIANTE: {
    nombre: "Estudiante",
    descripcion: "Alumnos de la carrera, incluidos los que están en práctica (8.º y 9.º semestre).",
    icono: GraduationCap,
  },
  PROFESOR_ASIGNATURA: {
    nombre: "Profesor de Asignatura",
    descripcion: "Publica actividades, califica entregas y revisa planificaciones de su asignatura.",
    icono: BookOpen,
  },
  PROFESOR_COLABORADOR: {
    nombre: "Profesor Colaborador",
    descripcion: "Docente del centro de práctica que observa y evalúa con pautas a sus estudiantes.",
    icono: School,
  },
  TUTOR_PRACTICA: {
    nombre: "Tutor de Práctica",
    descripcion: "Acompaña al estudiante en práctica y lo evalúa con las pautas de observación.",
    icono: UserCheck,
  },
  COORDINADOR: {
    nombre: "Coordinador de Práctica",
    descripcion: "Organiza las prácticas: asociaciones, centros, pautas y documentos.",
    icono: ShieldCheck,
  },
};

export function rolMeta(nombre?: string): RolMeta {
  const clave = (nombre ?? "").toUpperCase();
  return (
    ROLES[clave] ?? {
      nombre: nombre || "Rol",
      descripcion: "",
      icono: Users,
    }
  );
}

export interface CategoriaMeta {
  titulo: string;
  icono: LucideIcon;
}

const CATEGORIAS: Record<string, CategoriaMeta> = {
  PORTAFOLIO: { titulo: "Portafolio", icono: FolderOpen },
  EVALUACIONES: { titulo: "Actividades y evaluaciones", icono: ClipboardCheck },
  PAUTAS: { titulo: "Pautas de práctica", icono: ClipboardList },
  PRACTICAS: { titulo: "Prácticas y estudiantes", icono: Briefcase },
  "INTELIGENCIA ARTIFICIAL": { titulo: "Inteligencia artificial", icono: Sparkles },
};

export function categoriaMeta(categoria?: string): CategoriaMeta {
  const clave = (categoria ?? "").toUpperCase();
  return CATEGORIAS[clave] ?? { titulo: categoria || "General", icono: Briefcase };
}
