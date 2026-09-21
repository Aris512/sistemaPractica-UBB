export interface PortafolioItem {
  idDocumento: number;
  nombre: string;
  tipo: string;
  ubicacion: string;
  fechaCarga: string;
  tamanio: string;
  tamanioBytes?: number;
  rutEstudiante: string;
  subidoPorRut: string;
  subidoPorNombre: string;
  urlDescarga: string;
}

export interface EstudiantePortafolioSummary {
  rut: string;
  nombre: string;
  correo: string;
  carrera: string;
  totalArchivos: number;
  ultimaActualizacion: string | null;
}

export type CategoriaPortafolio =
  | "TODOS"
  | "EVIDENCIA"
  | "REFLEXION"
  | "RETROALIMENTACION"
  | "OTRO";
