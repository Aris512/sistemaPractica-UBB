import { useState, useEffect } from "react";
import {
  ClipboardCheck,
  ArrowLeft,
  AlertCircle,
  Eye,
  Lock,
  CheckCircle2,
  FileText,
} from "lucide-react";
import {
  getEvaluaciones,
  getObservacionesByEvaluacion,
} from "../../../services/evaluacionApi";
import type { Evaluacion, ObservacionEvaluacion } from "../../../types/evaluacion";
import { Button } from "../../ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../ui/card";
import { Label } from "../../ui/label";

interface EvaluacionesViewProps {
  onBack?: () => void;
}

export function EvaluacionesView({ onBack }: EvaluacionesViewProps) {
  const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([]);
  const [selectedEvaluacion, setSelectedEvaluacion] =
    useState<Evaluacion | null>(null);
  const [observaciones, setObservaciones] = useState<ObservacionEvaluacion[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [loadingObs, setLoadingObs] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEvaluaciones();
  }, []);

  const fetchEvaluaciones = async () => {
    try {
      setLoading(true);
      const data = await getEvaluaciones();
      setEvaluaciones(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEvaluacion = async (ev: Evaluacion) => {
    setSelectedEvaluacion(ev);
    setError(null);
    setLoadingObs(true);
    try {
      const obs = await getObservacionesByEvaluacion(ev.idEvaluacion);
      setObservaciones(obs);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingObs(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500">
        Cargando evaluaciones...
      </div>
    );
  }

  /* ─── Vista de lista ─── */
  if (!selectedEvaluacion) {
    return (
      <div className="max-w-5xl mx-auto py-6 space-y-6">
        {onBack && (
          <Button
            variant="outline"
            onClick={onBack}
            className="gap-2 text-sky-800 bg-sky-50 border-sky-200 hover:bg-sky-100"
          >
            <ArrowLeft className="size-4" /> Volver al Inicio
          </Button>
        )}

        <div className="flex flex-col mb-6">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Evaluaciones
          </h1>
          <p className="text-slate-500">
            Consulta las evaluaciones registradas y sus observaciones.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {evaluaciones.length === 0 ? (
            <div className="col-span-full p-12 text-center border-2 border-dashed rounded-xl border-slate-200">
              <ClipboardCheck className="size-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">No hay evaluaciones registradas</p>
            </div>
          ) : (
            evaluaciones.map((ev) => {
              const closed = ev.fechaLimite
                ? new Date() > new Date(ev.fechaLimite)
                : false;
              return (
                <Card
                  key={ev.idEvaluacion}
                  className="hover:border-sky-300 transition-colors cursor-pointer"
                  onClick={() => handleSelectEvaluacion(ev)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">
                        {ev.tipoEvaluacion || "Evaluación"}
                      </CardTitle>
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          closed
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {closed ? (
                          <span className="flex items-center gap-1">
                            <Lock className="size-3" /> Cerrada
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="size-3" /> Abierta
                          </span>
                        )}
                      </span>
                    </div>
                    <CardDescription>
                      {new Date(ev.fecha).toLocaleDateString("es-CL")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1 text-sm text-slate-600">
                      <p>
                        <strong>Evaluador:</strong>{" "}
                        {ev.tipoEvaluador || "No especificado"}
                      </p>
                      <p>
                        <strong>Puntaje Máx:</strong> {ev.puntajeMaximo}
                      </p>
                      {ev.fechaLimite && (
                        <p>
                          <strong>Límite:</strong>{" "}
                          {new Date(ev.fechaLimite).toLocaleDateString("es-CL")}
                        </p>
                      )}
                    </div>
                    <div className="mt-3 flex items-center gap-1 text-xs text-sky-600 font-medium">
                      <Eye className="size-3.5" /> Ver detalles
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    );
  }

  /* ─── Vista de detalle (solo lectura) ─── */
  const isClosed = selectedEvaluacion.fechaLimite
    ? new Date() > new Date(selectedEvaluacion.fechaLimite)
    : false;

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-6">
      <Button
        variant="outline"
        onClick={() => setSelectedEvaluacion(null)}
        className="gap-2"
      >
        <ArrowLeft className="size-4" /> Volver a Evaluaciones
      </Button>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 flex items-start gap-3 rounded-r-lg">
          <AlertCircle className="size-5 text-red-600 mt-0.5" />
          <div className="text-red-700">
            <p className="font-semibold">Ha ocurrido un error</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Información de la evaluación */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-xs border-slate-200">
            <CardHeader className="bg-slate-50 rounded-t-xl border-b border-slate-100">
              <CardTitle className="text-xl">Detalle de Evaluación</CardTitle>
              <CardDescription>Información general (solo lectura)</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <Label className="text-slate-500 text-xs uppercase tracking-wider">
                  Tipo de Evaluación
                </Label>
                <p className="font-medium text-slate-900">
                  {selectedEvaluacion.tipoEvaluacion}
                </p>
              </div>

              <div className="p-3 bg-sky-50 rounded-lg border border-sky-100">
                <Label className="text-sky-700 text-xs uppercase tracking-wider mb-1 block">
                  Identidad del Evaluador
                </Label>
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-full bg-sky-200 flex items-center justify-center text-sky-800 font-bold text-sm">
                    {selectedEvaluacion.tipoEvaluador
                      ? selectedEvaluacion.tipoEvaluador.substring(0, 2).toUpperCase()
                      : "?"}
                  </div>
                  <div>
                    <p className="font-semibold text-sky-900 leading-tight">
                      {selectedEvaluacion.tipoEvaluador || "Desconocido"}
                    </p>
                    <p className="text-xs text-sky-700">
                      ID: {selectedEvaluacion.idEvaluador || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-500 text-xs uppercase tracking-wider">
                    Fecha Emisión
                  </Label>
                  <p className="font-medium text-slate-900">
                    {new Date(selectedEvaluacion.fecha).toLocaleDateString("es-CL")}
                  </p>
                </div>
                <div>
                  <Label className="text-slate-500 text-xs uppercase tracking-wider">
                    Fecha Límite
                  </Label>
                  <p className="font-medium text-slate-900">
                    {selectedEvaluacion.fechaLimite
                      ? new Date(selectedEvaluacion.fechaLimite).toLocaleDateString("es-CL")
                      : "Sin límite"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-500 text-xs uppercase tracking-wider">
                    Puntaje Mín.
                  </Label>
                  <p className="font-medium text-slate-900">
                    {selectedEvaluacion.puntajeMinimo}
                  </p>
                </div>
                <div>
                  <Label className="text-slate-500 text-xs uppercase tracking-wider">
                    Puntaje Máx.
                  </Label>
                  <p className="font-medium text-slate-900">
                    {selectedEvaluacion.puntajeMaximo}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-slate-500 text-xs uppercase tracking-wider">
                  Estado
                </Label>
                <div className="mt-1">
                  {isClosed ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                      <Lock className="size-3.5" /> Cerrada (No modificable)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="size-3.5" /> Abierta
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Observaciones (solo lectura) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-xs border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl">Observaciones Cualitativas</CardTitle>
                <CardDescription>
                  Registro de anotaciones de esta evaluación.
                </CardDescription>
              </div>
              <div className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm font-medium">
                {loadingObs ? "..." : `${observaciones.length} registro(s)`}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingObs ? (
                <div className="p-8 text-center text-slate-400">
                  Cargando observaciones...
                </div>
              ) : observaciones.length === 0 ? (
                <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-100">
                  <FileText className="size-8 mx-auto text-slate-300 mb-2" />
                  No hay observaciones registradas para esta evaluación.
                </div>
              ) : (
                observaciones.map((obs) => (
                  <div
                    key={obs.idObservacion}
                    className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs"
                  >
                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full mb-2 inline-block">
                      {new Date(obs.fecha).toLocaleString("es-CL")}
                    </span>
                    <p className="text-slate-800 mt-2">{obs.texto}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
