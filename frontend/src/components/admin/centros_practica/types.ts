export interface CentroPractica {
  idCentro: number;
  nombre: string;
  direccion: string;
}

export interface CreateCentroPracticaDTO {
  nombre: string;
  direccion: string;
}

export interface EditCentroPracticaDTO {
  idCentro: number;
  nombre: string;
  direccion: string;
}

export type SortDirection = "asc" | "desc" | null;

export interface CentroPracticaSortState {
  column: keyof CentroPractica | null;
  direction: SortDirection;
}
