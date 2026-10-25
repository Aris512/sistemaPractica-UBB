export interface PermisoItem {
  idPermiso: number;
  codigo: string;
  nombre: string;
  categoria: string;
  descripcion: string;
  activo: boolean;
  semestresPermitidos: string;
}

export interface RolOption {
  idRol: number;
  nombre: string;
  descripcion?: string;
}

export interface GuardarPermisosPayload {
  permisos: {
    idPermiso: number;
    codigo: string;
    activo: boolean;
    semestresPermitidos: string;
  }[];
}

export type CategoriaPermiso =
  | "PORTAFOLIO"
  | "EVALUACIONES"
  | "OBSERVACIONES"
  | "ESTUDIANTES"
  | "INTELIGENCIA ARTIFICIAL"
  | string;
