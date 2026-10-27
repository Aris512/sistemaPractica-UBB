import { useState, useEffect, useMemo, useCallback } from "react";
import type {
  AsignaturaPractica,
  EstudiantePractica,
  AsociacionPractica,
  CandidatosResponse,
} from "./types";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/ui/ConfirmDeleteDialog";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  UnifiedTableContainer,
  UnifiedTable,
  UnifiedTableHeader,
  UnifiedTableHead,
  UnifiedTableBody,
  UnifiedTableRow,
  UnifiedTableCell,
} from "@/components/ui/unified-table";
import {
  UserCheck,
  UserPlus,
  AlertCircle,
  Building2,
  GraduationCap,
  Briefcase,
  CheckCircle2,
  Trash2,
  RefreshCw,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { sileo } from "sileo";
import type { UserSession } from "@/types/auth";

interface AsociarPracticaViewProps {
  user?: UserSession;
  initialEstudiante?: EstudiantePractica | null;
  onClearInitialEstudiante?: () => void;
}

export function AsociarPracticaView({
  user,
  initialEstudiante,
  onClearInitialEstudiante,
}: AsociarPracticaViewProps) {
  const [deleteAction, setDeleteAction] = useState<(() => Promise<void>) | null>(null);
  // Asignaturas de práctica oficiales
  const [asignaturas, setAsignaturas] = useState<AsignaturaPractica[]>([]);
  const [selectedAsignaturaId, setSelectedAsignaturaId] = useState<string>("");

  // Candidatos de la asignatura elegida
  const [candidatos, setCandidatos] = useState<CandidatosResponse | null>(null);
  const [loadingCandidatos, setLoadingCandidatos] = useState(false);

  // Selecciones del formulario
  const [selectedEstudianteId, setSelectedEstudianteId] = useState<string>("");
  const [selectedColaboradorId, setSelectedColaboradorId] = useState<string>("");
  const [selectedTutorId, setSelectedTutorId] = useState<string>("");
  const [selectedCentroId, setSelectedCentroId] = useState<string>("");

  // Asociaciones existentes para listado inferior
  const [asociaciones, setAsociaciones] = useState<AsociacionPractica[]>([]);
  const [loadingAsociaciones, setLoadingAsociaciones] = useState(false);

  // Estado de envío
  const [submitting, setSubmitting] = useState(false);

  // El coordinador debe confirmar de forma explícita que reemplaza una asociación existente
  const [confirmarReemplazo, setConfirmarReemplazo] = useState(false);

  // ── 1. Cargar asignaturas de práctica oficiales ──
  const fetchAsignaturas = useCallback(async () => {
    try {
      const res = await fetch("/api/coordinador/asignaturas-practica");
      if (res.ok) {
        const data = await res.json();
        setAsignaturas(data);
        if (data.length > 0 && !selectedAsignaturaId) {
          if (initialEstudiante && initialEstudiante.idAsignatura) {
            setSelectedAsignaturaId(String(initialEstudiante.idAsignatura));
          } else {
            setSelectedAsignaturaId(String(data[0].idAsignatura));
          }
        }
      }
    } catch (err) {
      console.error("Error al cargar asignaturas de práctica", err);
    }
  }, [initialEstudiante, selectedAsignaturaId]);

  // ── 2. Cargar candidatos cuando cambia la asignatura seleccionada ──
  const fetchCandidatos = useCallback(async (asigId: string) => {
    if (!asigId) return;
    setLoadingCandidatos(true);
    try {
      const res = await fetch(`/api/coordinador/candidatos?asignaturaId=${asigId}`);
      if (res.ok) {
        const data: CandidatosResponse = await res.json();
        setCandidatos(data);
      } else {
        const err = await res.json().catch(() => null);
        sileo.error({
          title: "Error al cargar candidatos",
          description: err?.error || "No se pudieron obtener los datos para la asignatura.",
        });
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingCandidatos(false);
    }
  }, []);

  // ── 3. Cargar asociaciones vigentes ──
  const fetchAsociaciones = useCallback(async () => {
    setLoadingAsociaciones(true);
    try {
      const res = await fetch("/api/coordinador/asociaciones");
      if (res.ok) {
        const data = await res.json();
        setAsociaciones(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error al cargar asociaciones", err);
    } finally {
      setLoadingAsociaciones(false);
    }
  }, []);

  useEffect(() => {
    fetchAsignaturas();
    fetchAsociaciones();
  }, [fetchAsignaturas, fetchAsociaciones]);

  // Al cambiar asignatura, recargar candidatos y resetear selecciones dependientes
  useEffect(() => {
    if (selectedAsignaturaId) {
      fetchCandidatos(selectedAsignaturaId);
      if (initialEstudiante && String(initialEstudiante.idAsignatura) === selectedAsignaturaId) {
        setSelectedEstudianteId(String(initialEstudiante.idEstudiante));
      } else {
        setSelectedEstudianteId("");
      }
      setSelectedColaboradorId("");
      setSelectedTutorId("");
      setSelectedCentroId("");
    }
  }, [selectedAsignaturaId, fetchCandidatos, initialEstudiante]);

  // Al elegir un colaborador se propone su centro de práctica (editable); si no tiene uno, el campo queda vacío
  // y el coordinador debe elegirlo: no se arrastra el centro del colaborador anterior.
  const handleColaboradorChange = (idColaborador: string) => {
    setSelectedColaboradorId(idColaborador);
    const colab = candidatos?.profesoresColaboradores.find(
      (c) => String(c.idColaborador) === idColaborador
    );
    setSelectedCentroId(colab?.idCentro ? String(colab.idCentro) : "");
  };

  // Participantes que exige la asignatura elegida: las prácticas iniciales no llevan colaborador ni tutor,
  // y el tutor universitario solo interviene en la Práctica Profesional.
  const asignaturaSel = asignaturas.find((a) => String(a.idAsignatura) === selectedAsignaturaId);
  const requiereColaborador = asignaturaSel?.requiereColaborador ?? true;
  const requiereTutor = asignaturaSel?.requiereTutor ?? true;
  const headersAsociar: Record<string, string> = user?.rut ? { "X-User-Rut": user.rut } : {};

  // Asociación vigente del estudiante elegido y qué cambiaría con lo seleccionado en el formulario
  const asociacionActual = asociaciones.find((a) => String(a.idEstudiante) === selectedEstudianteId);
  const teniaAsociacion = !!(asociacionActual && (asociacionActual.idColaborador || asociacionActual.idTutor));
  // Mismo criterio que el backend: una asignatura que no usa colaborador/tutor deja esos campos vacíos,
  // así que si la práctica los tenía, asociar equivale a reemplazarlos.
  const colaboradorActual = String(asociacionActual?.idColaborador ?? "");
  const tutorActual = String(asociacionActual?.idTutor ?? "");
  const colaboradorNuevo = requiereColaborador ? selectedColaboradorId : "";
  const tutorNuevo = requiereTutor ? selectedTutorId : "";
  const cambiaEvaluadores =
    teniaAsociacion && (colaboradorActual !== colaboradorNuevo || tutorActual !== tutorNuevo);
  const bloqueadoPorPautas = cambiaEvaluadores && !!asociacionActual?.tienePautas;
  const requiereConfirmacion = cambiaEvaluadores && !asociacionActual?.tienePautas;

  // Cualquier cambio en el formulario invalida una confirmación dada antes
  useEffect(() => {
    setConfirmarReemplazo(false);
  }, [selectedAsignaturaId, selectedEstudianteId, selectedColaboradorId, selectedTutorId]);

  // ── Regla principal de validación ──
  const validationStatus = useMemo(() => {
    if (!selectedAsignaturaId) {
      return {
        isValid: false,
        message: "Selecciona una asignatura de práctica para comenzar.",
      };
    }

    if (!selectedEstudianteId) {
      return {
        isValid: false,
        message: "Selecciona un estudiante matriculado en esta asignatura.",
      };
    }

    if (requiereColaborador && !selectedColaboradorId) {
      return {
        isValid: false,
        message: "Selecciona el profesor colaborador para la práctica.",
      };
    }

    if (requiereTutor && !selectedTutorId) {
      return {
        isValid: false,
        message: "Selecciona el tutor de práctica responsable.",
      };
    }

    if (requiereColaborador && !selectedCentroId) {
      return {
        isValid: false,
        message: "Selecciona el centro de práctica donde se realizará la práctica.",
      };
    }

    if (bloqueadoPorPautas) {
      return {
        isValid: false,
        message:
          "No se puede reemplazar: la práctica ya tiene pautas aplicadas. Cambiar a sus evaluadores dejaría esas evaluaciones sin respaldo.",
      };
    }

    if (requiereConfirmacion && !confirmarReemplazo) {
      return {
        isValid: false,
        message: "Este estudiante ya tiene una asociación. Confirma el reemplazo para continuar.",
      };
    }

    // Verificar que el estudiante realmente pertenezca a la asignatura seleccionada
    const est = candidatos?.estudiantes.find(
      (e) => String(e.idEstudiante) === selectedEstudianteId
    );
    if (est && String(est.idAsignatura) !== selectedAsignaturaId) {
      return {
        isValid: false,
        message:
          "No se puede realizar la asociación. Los participantes deben pertenecer a la misma asignatura.",
      };
    }

    return {
      isValid: true,
      message: "Todo listo para confirmar la asociación.",
    };
  }, [
    selectedAsignaturaId,
    selectedEstudianteId,
    selectedColaboradorId,
    selectedTutorId,
    selectedCentroId,
    requiereColaborador,
    requiereTutor,
    bloqueadoPorPautas,
    requiereConfirmacion,
    confirmarReemplazo,
    candidatos,
  ]);

  // ── Guardar Asociación ──
  const handleConfirmarAsociacion = async () => {
    if (!validationStatus.isValid) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/coordinador/asociar", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headersAsociar },
        body: JSON.stringify({
          idAsignatura: Number(selectedAsignaturaId),
          idEstudiante: Number(selectedEstudianteId),
          idProfesorColaborador: requiereColaborador && selectedColaboradorId ? Number(selectedColaboradorId) : null,
          idTutor: requiereTutor && selectedTutorId ? Number(selectedTutorId) : null,
          idCentroPractica: requiereColaborador && selectedCentroId ? Number(selectedCentroId) : null,
          reemplazar: requiereConfirmacion && confirmarReemplazo,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        // 409: otra persona cambió la asociación mientras tanto, o ya hay pautas aplicadas.
        // Se recarga la información para mostrar el estado real antes de reintentar.
        if (res.status === 409) {
          setConfirmarReemplazo(false);
          fetchAsociaciones();
        }
        throw new Error(json.error || "Ocurrió un error al procesar la asociación.");
      }

      sileo.success({
        title: json.sinCambios ? "Sin cambios" : "Asociación Confirmada",
        description: json.sinCambios
          ? `La asociación de ${json.estudiante} ya estaba registrada con esos datos.`
          : `Se asoció a ${json.estudiante} en ${json.asignatura}.`,
      });

      setConfirmarReemplazo(false);
      setSelectedEstudianteId("");
      onClearInitialEstudiante?.();
      fetchAsociaciones();
      fetchCandidatos(selectedAsignaturaId);
    } catch (err: any) {
      sileo.error({
        title: "Error al asociar",
        description: err.message || "No se pudo completar la asociación.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Eliminar Asociación ──
  const handleEliminarAsociacion = async (idPractica: number, nombreEstudiante: string) => {
    try {
      const res = await fetch(`/api/coordinador/asociaciones/${idPractica}`, {
        method: "DELETE",
        headers: headersAsociar,
      });
      if (res.ok) {
        sileo.success({
          title: "Asociación desvinculada",
          description: `Se eliminó la asociación de práctica para ${nombreEstudiante}.`,
        });
        fetchAsociaciones();
        if (selectedAsignaturaId) {
          fetchCandidatos(selectedAsignaturaId);
        }
      } else {
        const json = await res.json().catch(() => null);
        if (res.status === 409) fetchAsociaciones();
        throw new Error(json?.error || "Error al desvincular.");
      }
    } catch (err: any) {
      sileo.error({
        title: "Error al desvincular",
        description: err.message,
      });
    }
  };

  const currentEstudiante = candidatos?.estudiantes.find(
    (e) => String(e.idEstudiante) === selectedEstudianteId
  );
  const currentAsignatura = asignaturas.find(
    (a) => String(a.idAsignatura) === selectedAsignaturaId
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* ── Encabezado Principal ── */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100">
              <UserPlus className="size-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Asociar Prácticas
            </h1>
          </div>
          <p className="text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
            Asocia a cada estudiante con su asignatura de la línea de práctica. Según el ciclo se asigna además su profesor
            colaborador y centro educativo, y en <strong>Práctica Profesional</strong> también su tutor institucional de supervisión.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200">
            <ShieldCheck className="size-3.5 text-sky-600" />
            Validación de Misma Asignatura Activa
          </span>
        </div>
      </div>

      {/* ── Selector de Asignatura de Práctica (Paso 1) ── */}
      <Card className="border-slate-200/90 shadow-xs bg-white">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="flex items-center justify-center size-6 rounded-full bg-slate-900 text-white text-xs font-bold">
              1
            </span>
            Seleccionar Asignatura de Práctica
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Las 6 asignaturas de práctica: Aproximación al Sistema Escolar, Ambientes de Aprendizaje, Trabajo Colaborativo en el Aula, Investigación en el Aula, Práctica Pedagógica y Práctica Profesional.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
            {asignaturas.map((asig) => {
              const isSelected = selectedAsignaturaId === String(asig.idAsignatura);
              const isPedagogica = asig.nombre?.toLowerCase().includes("pedag");
              return (
                <button
                  key={asig.idAsignatura}
                  type="button"
                  onClick={() => setSelectedAsignaturaId(String(asig.idAsignatura))}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all flex items-start justify-between gap-3 ${
                    isSelected
                      ? isPedagogica
                        ? "bg-sky-50/70 border-sky-400 ring-2 ring-sky-400/20 text-sky-950 font-bold"
                        : "bg-indigo-50/70 border-indigo-400 ring-2 ring-indigo-400/20 text-indigo-950 font-bold"
                      : "bg-slate-50/60 border-slate-200 hover:bg-slate-100/70 text-slate-700"
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-bold flex items-center gap-2">
                      <GraduationCap
                        className={`size-4 ${
                          isSelected
                            ? isPedagogica
                              ? "text-sky-700"
                              : "text-indigo-700"
                            : "text-slate-400"
                        }`}
                      />
                      {asig.nombre}
                    </span>
                    <span className="text-[11px] text-slate-500 font-normal mt-0.5">
                      Semestre {asig.semestre || "Formativo"}
                    </span>
                  </div>
                  {isSelected && (
                    <CheckCircle2
                      className={`size-5 shrink-0 ${
                        isPedagogica ? "text-sky-600" : "text-indigo-600"
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── Panel Conceptual: Dos Tarjetas Armónicas ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Tarjeta Izquierda: Centro de Práctica + Profesor Colaborador + Tutor */}
        <Card className="lg:col-span-6 border-slate-200/90 shadow-xs bg-white h-full flex flex-col">
          <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="flex items-center justify-center size-5 rounded-full bg-slate-900 text-white text-[11px] font-bold">
                2
              </span>
              Equipo Docente y Centro Educativo
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              {requiereColaborador
                ? requiereTutor
                  ? "Profesor colaborador del centro y tutor UBB"
                  : "Profesor colaborador y centro educativo"
                : "Esta asignatura se realiza en simulaciones en el aula universitaria"}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-5 space-y-5 flex-1">
            {/* Profesor Colaborador */}
            {requiereColaborador && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Briefcase className="size-3.5 text-slate-500" />
                  Profesor Colaborador:
                </label>
                {selectedColaboradorId && (
                  <CheckCircle2 className="size-4 text-emerald-600" />
                )}
              </div>
              <select
                value={selectedColaboradorId}
                onChange={(e) => handleColaboradorChange(e.target.value)}
                disabled={loadingCandidatos}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/30 cursor-pointer disabled:bg-slate-100"
              >
                <option value="">-- Seleccionar profesor colaborador --</option>
                {candidatos?.profesoresColaboradores && candidatos.profesoresColaboradores.length > 0 ? (
                  candidatos.profesoresColaboradores.map((colab) => (
                    <option key={colab.idColaborador} value={String(colab.idColaborador)}>
                      {colab.nombre} ({colab.especialidad || "Pedagogía"} • {colab.centroNombre || "Sin centro"})
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    No hay colaboradores registrados
                  </option>
                )}
              </select>
            </div>
            )}

            {/* Tutor de Práctica */}
            {requiereTutor && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <UserCheck className="size-3.5 text-slate-500" />
                  Tutor de Práctica:
                </label>
                {selectedTutorId && (
                  <CheckCircle2 className="size-4 text-emerald-600" />
                )}
              </div>
              <select
                value={selectedTutorId}
                onChange={(e) => setSelectedTutorId(e.target.value)}
                disabled={loadingCandidatos}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/30 cursor-pointer disabled:bg-slate-100"
              >
                <option value="">-- Seleccionar tutor de práctica --</option>
                {candidatos?.tutores && candidatos.tutores.length > 0 ? (
                  candidatos.tutores.map((tut) => (
                    <option key={tut.idTutor} value={String(tut.idTutor)}>
                      {tut.nombre} {tut.rut ? `(${tut.rut})` : ""}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    No hay tutores registrados
                  </option>
                )}
              </select>
            </div>
            )}

            {/* Centro de Práctica */}
            {requiereColaborador && (
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Building2 className="size-3.5 text-slate-500" />
                  Centro de Práctica:
                </label>
                {selectedCentroId && (
                  <CheckCircle2 className="size-4 text-emerald-600" />
                )}
              </div>
              <select
                value={selectedCentroId}
                onChange={(e) => setSelectedCentroId(e.target.value)}
                disabled={loadingCandidatos}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/30 cursor-pointer disabled:bg-slate-100"
              >
                <option value="">-- Seleccionar centro de práctica --</option>
                {candidatos?.centrosPractica && candidatos.centrosPractica.length > 0 ? (
                  candidatos.centrosPractica.map((centro) => (
                    <option key={centro.idCentro} value={String(centro.idCentro)}>
                      {centro.nombre} {centro.direccion ? `• ${centro.direccion}` : ""}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    No hay centros disponibles
                  </option>
                )}
              </select>
            </div>
            )}

            {!requiereColaborador && (
              <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-3 leading-relaxed">
                Las prácticas iniciales no incluyen visitas a establecimientos: no requieren profesor colaborador,
                tutor ni centro de práctica. Selecciona el estudiante y confirma la asociación.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Tarjeta Derecha: Alumno / Estudiante */}
        <Card className="lg:col-span-6 border-slate-200/90 shadow-xs bg-white h-full flex flex-col">
          <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="flex items-center justify-center size-5 rounded-full bg-slate-900 text-white text-[11px] font-bold">
                3
              </span>
              Estudiante Practicante
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Solo estudiantes matriculados en{" "}
              <strong>{currentAsignatura?.nombre || "la práctica seleccionada"}</strong>
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-5 space-y-5 flex-1">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <GraduationCap className="size-3.5 text-slate-500" />
                  Alumno / Estudiante:
                </label>
                {selectedEstudianteId && (
                  <CheckCircle2 className="size-4 text-emerald-600" />
                )}
              </div>

              <select
                value={selectedEstudianteId}
                onChange={(e) => setSelectedEstudianteId(e.target.value)}
                disabled={loadingCandidatos}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/30 cursor-pointer disabled:bg-slate-100"
              >
                <option value="">-- Seleccionar estudiante --</option>
                {candidatos?.estudiantes && candidatos.estudiantes.length > 0 ? (
                  candidatos.estudiantes.map((est) => (
                    <option key={est.idEstudiante} value={String(est.idEstudiante)}>
                      {est.nombre} {est.rut ? `(${est.rut})` : ""} • {est.asignaturaNombre}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    No hay estudiantes disponibles en esta asignatura
                  </option>
                )}
              </select>
            </div>

            {/* Ficha resumen del Estudiante seleccionado */}
            {currentEstudiante ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 mt-4">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Detalle del practicante:
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Nombre:</span>
                    <span className="font-semibold text-slate-800">{currentEstudiante.nombre}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Asignatura:</span>
                    <span className="font-semibold text-sky-700">
                      {currentEstudiante.asignaturaNombre}
                    </span>
                  </div>
                  {currentEstudiante.rut && (
                    <div>
                      <span className="text-slate-400 block text-[11px]">RUT:</span>
                      <span className="font-mono text-slate-600">{currentEstudiante.rut}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-xl border border-dashed border-slate-200 text-center text-slate-400 text-xs">
                Selecciona un estudiante para asociarlo con el equipo docente.
              </div>
            )}

            {/* Asociación vigente del estudiante: aviso de reemplazo / bloqueo por pautas */}
            {currentEstudiante && teniaAsociacion && asociacionActual && (
              <div
                className={`p-4 rounded-xl border space-y-2 text-xs ${
                  bloqueadoPorPautas
                    ? "bg-red-50/70 border-red-200 text-red-900"
                    : cambiaEvaluadores
                      ? "bg-amber-50/70 border-amber-200 text-amber-900"
                      : "bg-slate-50 border-slate-200 text-slate-700"
                }`}
              >
                <div className="flex items-center gap-2 font-bold uppercase tracking-wider">
                  <AlertCircle className="size-4 shrink-0" />
                  {cambiaEvaluadores ? "Este estudiante ya tiene una asociación" : "Asociación vigente"}
                </div>
                <div className="grid grid-cols-1 gap-1 leading-snug">
                  {asociacionActual.idColaborador && (
                    <div>
                      <span className="font-semibold">Colaborador:</span> {asociacionActual.colaboradorNombre || "—"}
                    </div>
                  )}
                  {asociacionActual.idTutor && (
                    <div>
                      <span className="font-semibold">Tutor:</span> {asociacionActual.tutorNombre || "—"}
                    </div>
                  )}
                  {asociacionActual.idCentro && (
                    <div>
                      <span className="font-semibold">Centro:</span> {asociacionActual.centroNombre || "—"}
                    </div>
                  )}
                  <div>
                    <span className="font-semibold">Estado:</span> {asociacionActual.estadoAprobacion}
                  </div>
                </div>

                {bloqueadoPorPautas && (
                  <p className="leading-relaxed">
                    Esta práctica ya tiene <strong>pautas de evaluación aplicadas</strong>, por lo que no se puede
                    reemplazar su colaborador ni su tutor. El estado de la práctica se conserva.
                  </p>
                )}

                {requiereConfirmacion && (
                  <label className="flex items-start gap-2 cursor-pointer pt-1 leading-relaxed">
                    <input
                      type="checkbox"
                      checked={confirmarReemplazo}
                      onChange={(e) => setConfirmarReemplazo(e.target.checked)}
                      className="mt-0.5 size-4 cursor-pointer accent-amber-600"
                    />
                    <span>
                      Entiendo que se <strong>reemplazará</strong> la asociación actual de este estudiante por la que
                      estoy seleccionando. El estado de la práctica se conserva.
                    </span>
                  </label>
                )}

                {!cambiaEvaluadores && (
                  <p className="leading-relaxed">
                    Los participantes seleccionados coinciden con la asociación actual.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Banner de Validación & Botón de Confirmación ── */}
      <Card className="border-slate-200/90 shadow-xs bg-white">
        <CardContent className="p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {validationStatus.isValid ? (
              <div className="p-2.5 rounded-full bg-emerald-50 text-emerald-600 shrink-0 border border-emerald-100">
                <CheckCircle2 className="size-5" />
              </div>
            ) : (
              <div className="p-2.5 rounded-full bg-amber-50 text-amber-600 shrink-0 border border-amber-100">
                <AlertCircle className="size-5" />
              </div>
            )}
            <div className="flex flex-col">
              <span
                className={`text-xs font-bold ${
                  validationStatus.isValid ? "text-emerald-800" : "text-amber-800"
                }`}
              >
                {validationStatus.isValid ? "Asociación Lista" : "Validación Requerida"}
              </span>
              <p className="text-xs text-slate-600 leading-snug">
                {validationStatus.message}
              </p>
            </div>
          </div>

          <Button
            size="lg"
            onClick={handleConfirmarAsociacion}
            disabled={!validationStatus.isValid || submitting}
            className={`w-full sm:w-auto px-8 cursor-pointer font-bold shadow-xs transition-all ${
              validationStatus.isValid
                ? "bg-slate-900 hover:bg-slate-800 text-white"
                : "bg-slate-200 text-slate-400 cursor-not-allowed border-slate-300"
            }`}
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                <span>Confirmando...</span>
              </>
            ) : (
              <>
                <UserCheck className="size-4 mr-2" />
                <span>Confirmar Asociación</span>
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* ── Tabla de Asociaciones Vigentes ── */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Asociaciones Confirmadas
            </h2>
            <p className="text-xs text-slate-500">
              Prácticas activas formalizadas con estudiante, tutor institucional, colaborador y centro.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAsociaciones}
            disabled={loadingAsociaciones}
            className="cursor-pointer gap-1.5 text-xs text-slate-700"
          >
            <RefreshCw className={`size-3.5 ${loadingAsociaciones ? "animate-spin" : ""}`} />
            <span>Actualizar</span>
          </Button>
        </div>

        <UnifiedTableContainer className="min-h-[220px]">
          <UnifiedTable>
            <UnifiedTableHeader>
              <UnifiedTableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                <UnifiedTableHead className="font-semibold text-slate-700 text-xs py-3 pl-6">
                  Estudiante
                </UnifiedTableHead>
                <UnifiedTableHead className="font-semibold text-slate-700 text-xs py-3">
                  Asignatura
                </UnifiedTableHead>
                <UnifiedTableHead className="font-semibold text-slate-700 text-xs py-3">
                  Profesor Colaborador
                </UnifiedTableHead>
                <UnifiedTableHead className="font-semibold text-slate-700 text-xs py-3">
                  Tutor de Práctica
                </UnifiedTableHead>
                <UnifiedTableHead className="font-semibold text-slate-700 text-xs py-3">
                  Centro de Práctica
                </UnifiedTableHead>
                <UnifiedTableHead className="font-semibold text-slate-700 text-xs py-3 text-right pr-6">
                  Acción
                </UnifiedTableHead>
              </UnifiedTableRow>
            </UnifiedTableHeader>

            <UnifiedTableBody>
              {loadingAsociaciones ? (
                <UnifiedTableRow>
                  <UnifiedTableCell colSpan={6} className="h-32 text-center">
                    <div className="flex items-center justify-center gap-2 text-slate-500 text-xs">
                      <Loader2 className="size-4 animate-spin text-sky-600" />
                      <span>Cargando asociaciones...</span>
                    </div>
                  </UnifiedTableCell>
                </UnifiedTableRow>
              ) : asociaciones.length === 0 ? (
                <UnifiedTableRow>
                  <UnifiedTableCell colSpan={6} className="h-32 text-center text-slate-500 text-xs">
                    No se registran asociaciones confirmadas actualmente.
                  </UnifiedTableCell>
                </UnifiedTableRow>
              ) : (
                asociaciones.map((asoc) => (
                  <UnifiedTableRow key={asoc.idPractica} className="hover:bg-slate-50/70">
                    <UnifiedTableCell className="py-3.5 pl-6 font-bold text-slate-900 text-sm">
                      {asoc.estudianteNombre}
                      {asoc.tienePautas && (
                        <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 align-middle">
                          Con pautas
                        </span>
                      )}
                    </UnifiedTableCell>
                    <UnifiedTableCell className="py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                          asoc.asignaturaNombre?.toLowerCase().includes("pedag")
                            ? "bg-sky-50 text-sky-800 border-sky-200"
                            : "bg-indigo-50 text-indigo-800 border-indigo-200"
                        }`}
                      >
                        {asoc.asignaturaNombre}
                      </span>
                    </UnifiedTableCell>
                    <UnifiedTableCell className="py-3.5 text-xs text-slate-700 font-medium">
                      {asoc.colaboradorNombre || "—"}
                    </UnifiedTableCell>
                    <UnifiedTableCell className="py-3.5 text-xs text-slate-700 font-medium">
                      {asoc.tutorNombre || "—"}
                    </UnifiedTableCell>
                    <UnifiedTableCell className="py-3.5 text-xs text-slate-600">
                      {asoc.centroNombre || "—"}
                    </UnifiedTableCell>
                    <UnifiedTableCell className="py-3.5 text-right pr-6">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setDeleteAction(() => () =>
                            handleEliminarAsociacion(asoc.idPractica, asoc.estudianteNombre)
                          )
                        }
                        disabled={!!asoc.tienePautas}
                        className="cursor-pointer text-xs text-red-600 hover:text-red-700 hover:bg-red-50 p-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                        title={
                          asoc.tienePautas
                            ? "No se puede desvincular: la práctica tiene pautas aplicadas"
                            : "Desvincular práctica"
                        }
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </UnifiedTableCell>
                  </UnifiedTableRow>
                ))
              )}
            </UnifiedTableBody>
          </UnifiedTable>
        </UnifiedTableContainer>
      </div>
      <ConfirmDeleteDialog
        open={!!deleteAction}
        onOpenChange={(open) => !open && setDeleteAction(null)}
        onConfirm={async () => deleteAction?.()}
        title="Desvincular práctica"
        description="Se eliminará la práctica de este estudiante junto con las evaluaciones y notas registradas en ella. Esta acción no se puede deshacer."
      />
    </div>
  );
}
