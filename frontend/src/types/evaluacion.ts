export interface Evaluacion {
  idEvaluacion: number;
  idEvaluador: number;
  tipoEvaluador: string;
  fecha: string;
  tipoEvaluacion: string;
  puntajeMinimo: number;
  puntajeMaximo: number;
  fechaLimite: string;
  observacion?: string;
  practica?: {
    idPractica: number;
  };
}

export interface ObservacionEvaluacion {
  idObservacion: number;
  texto: string;
  fecha: string;
  evaluacion?: Evaluacion;
}
