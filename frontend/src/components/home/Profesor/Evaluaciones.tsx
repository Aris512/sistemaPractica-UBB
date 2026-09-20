import { useState, useEffect } from "react";
import { ClipboardCheck, ArrowLeft, AlertCircle, Plus, Edit2, CheckCircle2, Lock } from "lucide-react";
import { getEvaluaciones, getObservacionesByEvaluacion, crearObservacion, actualizarObservacion } from "../../../services/evaluacionApi";
import type { Evaluacion, ObservacionEvaluacion } from "../../../types/evaluacion";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../ui/card";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";

interface EvaluacionesProps {
  onBack?: () => void;
}

export function Evaluaciones({ onBack }: EvaluacionesProps) {
  const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([]);
  const [selectedEvaluacion, setSelectedEvaluacion] = useState<Evaluacion | null>(null);
  const [observaciones, setObservaciones] = useState<ObservacionEvaluacion[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [newObsText, setNewObsText] = useState("");
  const [editingObs, setEditingObs] = useState<ObservacionEvaluacion | null>(null);
  const [editObsText, setEditObsText] = useState("");

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
    setEditingObs(null);
    try {
      const obs = await getObservacionesByEvaluacion(ev.idEvaluacion);
      setObservaciones(obs);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAddObservacion = async () => {
    if (!selectedEvaluacion || !newObsText.trim()) return;
    try {
      setError(null);
      const nueva = await crearObservacion({
        evaluacion: { idEvaluacion: selectedEvaluacion.idEvaluacion },
        texto: newObsText
      });
      setObservaciones([...observaciones, nueva]);
      setNewObsText("");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingObs || !editObsText.trim()) return;
    try {
      setError(null);
      const updated = await actualizarObservacion(editingObs.idObservacion, editObsText);
      setObservaciones(observaciones.map(o => o.idObservacion === updated.idObservacion ? updated : o));
      setEditingObs(null);
    } catch (err: any) {
      setError(err.message); // The API will return 400 Bad Request with the custom message if past deadline
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Cargando evaluaciones...</div>;
  }

  if (!selectedEvaluacion) {
    return (
      <div className="max-w-5xl mx-auto py-6 space-y-6">
        {onBack && (
          <Button variant="outline" onClick={onBack} className="gap-2 text-sky-800 bg-sky-50 border-sky-200 hover:bg-sky-100">
            <ArrowLeft className="size-4" /> Volver al Inicio
          </Button>
        )}
        
        <div className="flex flex-col mb-6">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Evaluaciones</h1>
          <p className="text-slate-500">Seleccione una evaluación para ver detalles y gestionar observaciones.</p>
        </div>

        {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {evaluaciones.length === 0 ? (
            <div className="col-span-full p-12 text-center border-2 border-dashed rounded-xl border-slate-200">
              <ClipboardCheck className="size-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">No hay evaluaciones registradas</p>
            </div>
          ) : (
            evaluaciones.map(ev => (
              <Card key={ev.idEvaluacion} className="hover:border-sky-300 transition-colors cursor-pointer" onClick={() => handleSelectEvaluacion(ev)}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{ev.tipoEvaluacion || "Evaluación"}</CardTitle>
                    <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-1 rounded-md">ID: {ev.idEvaluacion}</span>
                  </div>
                  <CardDescription>
                    {new Date(ev.fecha).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 text-sm text-slate-600">
                    <p><strong>Evaluador:</strong> {ev.tipoEvaluador || "No especificado"} (ID: {ev.idEvaluador || "N/A"})</p>
                    <p><strong>Puntaje Max:</strong> {ev.puntajeMaximo}</p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    );
  }

  // Selected Evaluation View
  const isClosed = selectedEvaluacion.fechaLimite ? new Date() > new Date(selectedEvaluacion.fechaLimite) : false;

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-6">
      <Button variant="outline" onClick={() => setSelectedEvaluacion(null)} className="gap-2">
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
        {/* Detalles de la evaluación */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-xs border-slate-200">
            <CardHeader className="bg-slate-50 rounded-t-xl border-b border-slate-100">
              <CardTitle className="text-xl">Detalle de Evaluación</CardTitle>
              <CardDescription>Información general</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <Label className="text-slate-500 text-xs uppercase tracking-wider">Tipo de Evaluación</Label>
                <p className="font-medium text-slate-900">{selectedEvaluacion.tipoEvaluacion}</p>
              </div>
              
              <div className="p-3 bg-sky-50 rounded-lg border border-sky-100">
                <Label className="text-sky-700 text-xs uppercase tracking-wider mb-1 block">Identidad del Evaluador</Label>
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-full bg-sky-200 flex items-center justify-center text-sky-800 font-bold text-sm">
                    {selectedEvaluacion.tipoEvaluador ? selectedEvaluacion.tipoEvaluador.substring(0,2).toUpperCase() : "?"}
                  </div>
                  <div>
                    <p className="font-semibold text-sky-900 leading-tight">{selectedEvaluacion.tipoEvaluador || "Desconocido"}</p>
                    <p className="text-xs text-sky-700">ID Usuario: {selectedEvaluacion.idEvaluador || "N/A"}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-500 text-xs uppercase tracking-wider">Fecha Emisión</Label>
                  <p className="font-medium text-slate-900">{new Date(selectedEvaluacion.fecha).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-slate-500 text-xs uppercase tracking-wider">Fecha Límite</Label>
                  <p className="font-medium text-slate-900">
                    {selectedEvaluacion.fechaLimite ? new Date(selectedEvaluacion.fechaLimite).toLocaleDateString() : "Sin límite"}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-slate-500 text-xs uppercase tracking-wider">Estado de Edición</Label>
                <div className="mt-1">
                  {isClosed ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                      <Lock className="size-3.5" /> Evaluacion Cerrada (No modificable)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="size-3.5" /> Edición Habilitada
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Observaciones */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-xs border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl">Observaciones Cualitativas</CardTitle>
                <CardDescription>Registro de anotaciones durante la evaluación.</CardDescription>
              </div>
              <div className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm font-medium">
                {observaciones.length} registro(s)
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* List of Observations */}
              <div className="space-y-4">
                {observaciones.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-100">
                    No hay observaciones registradas.
                  </div>
                ) : (
                  observaciones.map(obs => (
                    <div key={obs.idObservacion} className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs group">
                      {editingObs?.idObservacion === obs.idObservacion ? (
                        <div className="space-y-3">
                          <Input 
                            value={editObsText}
                            onChange={(e) => setEditObsText(e.target.value)}
                            className="bg-white"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={handleSaveEdit}>Guardar Cambios</Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingObs(null)}>Cancelar</Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                              {new Date(obs.fecha).toLocaleString()}
                            </span>
                            {!isClosed && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 px-2 text-slate-400 hover:text-sky-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => { setEditingObs(obs); setEditObsText(obs.texto); }}
                              >
                                <Edit2 className="size-3.5 mr-1" /> Editar
                              </Button>
                            )}
                          </div>
                          <p className="text-slate-800">{obs.texto}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Form to Add */}
              {!isClosed && (
                <div className="mt-8 pt-6 border-t border-slate-100">
                  <h4 className="text-sm font-semibold text-slate-900 mb-3">Agregar Nueva Observación</h4>
                  <div className="flex gap-3">
                    <Input 
                      placeholder="Escriba la observación cualitativa..." 
                      value={newObsText}
                      onChange={(e) => setNewObsText(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={handleAddObservacion} className="gap-2" disabled={!newObsText.trim()}>
                      <Plus className="size-4" /> Agregar
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
