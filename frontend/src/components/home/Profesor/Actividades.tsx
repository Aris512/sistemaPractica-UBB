import { useState, useEffect, useCallback } from "react";
import type { UserSession } from "@/types/auth";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  CheckCircle2,
  AlertCircle,
  Users,
  RefreshCw,
  XCircle,
  FileText,
  Pencil,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import { sileo } from "sileo";

interface ActividadItem {
  idActividad: number;
  titulo: string;
  descripcion: string;
  fechaCreacion: string;
  fechaLimite: string;
  estado: "ACTIVA" | "CERRADA";
  asignatura?: {
    idAsignatura: number;
    nombre: string;
    codigo: string;
  } | null;
  profesor?: {
    usuario: {
      nombre: string;
      apellido: string;
      rut: string;
    };
  } | null;
}

interface ActividadesProps {
  user: UserSession;
  onBack?: () => void;
  onNavigateToRevision?: () => void;
}

export function Actividades({ user }: ActividadesProps) {
  const [actividades, setActividades] = useState<ActividadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Estados de creación compacta
  const getDefaultDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d;
  };

  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fechaLimiteDate, setFechaLimiteDate] = useState<Date>(getDefaultDate);
  const [horaLimite, setHoraLimite] = useState("23:59");
  const [errors, setErrors] = useState<{ titulo?: string; descripcion?: string; fecha?: string }>({});

  // Estados para edición
  const [editingActividad, setEditingActividad] = useState<ActividadItem | null>(null);
  const [editTitulo, setEditTitulo] = useState("");
  const [editDescripcion, setEditDescripcion] = useState("");
  const [editFechaDate, setEditFechaDate] = useState<Date>(getDefaultDate);
  const [editHora, setEditHora] = useState("23:59");
  const [editingSubmitting, setEditingSubmitting] = useState(false);
  const [editError, setEditError] = useState("");

  const profesorRut = user?.rut || "11111111-1";

  // Verificar si una fecha + hora es anterior al instante actual
  const isPastDateTime = (date: Date, timeStr: string) => {
    const [hours, minutes] = (timeStr || "23:59").split(":").map(Number);
    const target = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours || 0, minutes || 0, 0);
    return target.getTime() < Date.now();
  };

  const formatToISO = (date: Date, timeStr: string) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const [hours, minutes] = (timeStr || "23:59").split(":");
    return `${year}-${month}-${day}T${hours || "23"}:${minutes || "59"}:00`;
  };

  // Cargar actividades desde el backend
  const fetchActividades = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:8080/api/actividades/profesor/${encodeURIComponent(profesorRut)}`
      );
      if (res.ok) {
        const data = await res.json();
        setActividades(Array.isArray(data) ? data : []);
      } else {
        // Fallback a todas si no hay por profesor
        const resAll = await fetch("http://localhost:8080/api/actividades");
        if (resAll.ok) {
          const allData = await resAll.json();
          setActividades(Array.isArray(allData) ? allData : []);
        }
      }
    } catch (err) {
      console.error("Error al cargar actividades:", err);
    } finally {
      setLoading(false);
    }
  }, [profesorRut]);

  useEffect(() => {
    fetchActividades();
  }, [fetchActividades]);

  // Manejar envío del formulario compacto de creación
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { titulo?: string; descripcion?: string; fecha?: string } = {};

    if (!titulo.trim()) {
      newErrors.titulo = "El título de la tarea es obligatorio.";
    }
    if (!descripcion.trim()) {
      newErrors.descripcion = "La descripción e instrucciones son obligatorias.";
    }
    if (!fechaLimiteDate) {
      newErrors.fecha = "Debes seleccionar una fecha límite con el calendario.";
    } else if (isPastDateTime(fechaLimiteDate, horaLimite)) {
      newErrors.fecha = "No se puede seleccionar una fecha u hora anterior a la actual.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      sileo.error({
        title: "Campos requeridos",
        description: Object.values(newErrors)[0],
      });
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const fechaLimiteIso = formatToISO(fechaLimiteDate, horaLimite);

      const payload = {
        rutProfesor: profesorRut,
        idAsignatura: null,
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        fechaLimite: fechaLimiteIso,
      };

      const res = await fetch("http://localhost:8080/api/actividades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.message || errJson?.error || "No se pudo crear la actividad en el servidor.");
      }

      const nuevaActividad = await res.json();
      setActividades((prev) => [nuevaActividad, ...prev]);

      // Resetear formulario y volver a la lista
      setTitulo("");
      setDescripcion("");
      setFechaLimiteDate(getDefaultDate());
      setHoraLimite("23:59");
      setShowCreateForm(false);

      sileo.success({
        title: "Tarea Creada",
        description: "La tarea ha sido asignada a todos los estudiantes del curso.",
      });
    } catch (err: any) {
      console.error("Error al crear actividad:", err);
      sileo.error({
        title: "Error al crear tarea",
        description: err?.message || "No fue posible registrar la actividad en la base de datos.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Switch para activar o cerrar la tarea de inmediato en la base de datos
  const handleToggleEstado = async (idActividad: number, checked: boolean) => {
    const nuevoEstado = checked ? "ACTIVA" : "CERRADA";

    // Actualización optimista en la interfaz
    setActividades((prev) =>
      prev.map((a) => (a.idActividad === idActividad ? { ...a, estado: nuevoEstado } : a))
    );

    try {
      const res = await fetch(`http://localhost:8080/api/actividades/${idActividad}/estado`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      if (!res.ok) {
        // Revertir si falló
        setActividades((prev) =>
          prev.map((a) =>
            a.idActividad === idActividad ? { ...a, estado: checked ? "CERRADA" : "ACTIVA" } : a
          )
        );
        sileo.error({
          title: "Error al actualizar estado",
          description: "No se pudo guardar el cambio en el servidor.",
        });
        return;
      }

      sileo.success({
        title: checked ? "Tarea Activada" : "Tarea Cerrada",
        description: `La tarea ahora figura como ${checked ? "activa" : "cerrada"}.`,
      });
    } catch (err) {
      // Revertir ante error de red
      setActividades((prev) =>
        prev.map((a) =>
          a.idActividad === idActividad ? { ...a, estado: checked ? "CERRADA" : "ACTIVA" } : a
        )
      );
      sileo.error({
        title: "Error de red",
        description: "No fue posible comunicarse con el servidor.",
      });
    }
  };

  // Eliminar tarea sin confirmación
  const handleEliminarActividad = async (idActividad: number) => {
    try {
      const res = await fetch(`http://localhost:8080/api/actividades/${idActividad}`, {
        method: "DELETE",
      });

      if (res.ok || res.status === 204) {
        setActividades((prev) => prev.filter((a) => a.idActividad !== idActividad));
        sileo.success({
          title: "Tarea Eliminada",
          description: "La tarea ha sido eliminada del sistema.",
        });
      } else {
        throw new Error("No se pudo eliminar la tarea");
      }
    } catch (err) {
      console.error("Error al eliminar actividad:", err);
      sileo.error({
        title: "Error al eliminar",
        description: "No fue posible eliminar la tarea.",
      });
    }
  };

  // Abrir modal de edición
  const handleAbrirEdicion = (act: ActividadItem) => {
    setEditingActividad(act);
    setEditTitulo(act.titulo);
    setEditDescripcion(act.descripcion || "");
    if (act.fechaLimite) {
      const parsed = new Date(act.fechaLimite);
      setEditFechaDate(!isNaN(parsed.getTime()) ? parsed : getDefaultDate());
      setEditHora(act.fechaLimite.length >= 16 ? act.fechaLimite.substring(11, 16) : "23:59");
    } else {
      setEditFechaDate(getDefaultDate());
      setEditHora("23:59");
    }
    setEditError("");
  };

  // Guardar edición
  const handleGuardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingActividad) return;

    if (!editTitulo.trim()) {
      setEditError("El título de la tarea es obligatorio.");
      sileo.error({ title: "Campo requerido", description: "El título no puede estar vacío." });
      return;
    }

    if (!editFechaDate) {
      setEditError("Debes seleccionar una fecha límite con el calendario.");
      sileo.error({ title: "Campo requerido", description: "Debes seleccionar una fecha límite." });
      return;
    }

    if (isPastDateTime(editFechaDate, editHora)) {
      setEditError("La fecha y hora límite no puede ser anterior a la actual.");
      sileo.error({
        title: "Fecha no válida",
        description: "La fecha y hora límite no puede ser anterior a la actual.",
      });
      return;
    }

    setEditingSubmitting(true);
    try {
      const fechaLimiteIso = formatToISO(editFechaDate, editHora);
      const res = await fetch(`http://localhost:8080/api/actividades/${editingActividad.idActividad}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: editTitulo.trim(),
          descripcion: editDescripcion.trim(),
          fechaLimite: fechaLimiteIso,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.message || errJson?.error || "Error al guardar cambios en el servidor");
      }

      const actualizada = await res.json();
      setActividades((prev) =>
        prev.map((a) => (a.idActividad === editingActividad.idActividad ? { ...a, ...actualizada } : a))
      );

      setEditingActividad(null);
      sileo.success({
        title: "Tarea Actualizada",
        description: "Los cambios se han guardado con éxito.",
      });
    } catch (err: any) {
      console.error("Error al actualizar actividad:", err);
      sileo.error({
        title: "Error al actualizar tarea",
        description: err?.message || "No se pudieron guardar los cambios.",
      });
    } finally {
      setEditingSubmitting(false);
    }
  };

  const formatearFecha = (fechaStr?: string | null) => {
    if (!fechaStr) return "Sin fecha";
    try {
      const d = new Date(fechaStr);
      return d.toLocaleDateString("es-CL", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return fechaStr;
    }
  };

  return (
    <div className="space-y-4">

      {/* Vista de Creación Compacta de Tarea (OCULTA la lista de tareas mientras está activa) */}
      {showCreateForm ? (
        <div className="bg-white rounded-xl border border-sky-200 shadow-xs p-4 sm:p-5 space-y-4 animate-in fade-in-50 duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Volver a la lista"
              >
                <ArrowLeft className="size-4" />
              </button>
              <div>
                <h2 className="text-sm font-semibold text-slate-900 leading-none">
                  Crear Nueva Tarea
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Ingresa los datos para asignar la tarea a los estudiantes matriculados.
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowCreateForm(false)}
              className="cursor-pointer text-xs text-slate-500 hover:text-slate-800"
            >
              Cancelar
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Título */}
            <div className="space-y-1">
              <Label htmlFor="actividad-titulo" className="text-xs font-medium text-slate-700">
                Título de la Tarea *
              </Label>
              <Input
                id="actividad-titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ej: Informe de Diagnóstico y Planificación"
                className="h-9 text-sm"
              />
              {errors.titulo && <p className="text-xs text-rose-600">{errors.titulo}</p>}
            </div>

            {/* Descripción */}
            <div className="space-y-1">
              <Label htmlFor="actividad-descripcion" className="text-xs font-medium text-slate-700">
                Instrucciones Pedagógicas y Pauta *
              </Label>
              <textarea
                id="actividad-descripcion"
                rows={3}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Detalla qué deben subir los alumnos, pauta formativa y criterios de evaluación..."
                className="w-full rounded-md border border-slate-300 p-2.5 text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition-all placeholder:text-slate-400"
              />
              {errors.descripcion && <p className="text-xs text-rose-600">{errors.descripcion}</p>}
            </div>

            {/* Calendario compacto integrado con Hora de Cierre */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-start bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80">
              <div className="sm:col-span-6 flex flex-col items-center justify-center bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
                <div className="w-full flex items-center justify-between mb-1 px-1">
                  <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                    <CalendarIcon className="size-3 text-sky-600" />
                    Fecha Límite
                  </span>
                  <span className="text-[10px] font-bold text-sky-800 bg-sky-50 border border-sky-200 px-1.5 py-0.5 rounded">
                    {fechaLimiteDate.toLocaleDateString("es-CL", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </span>
                </div>
                <Calendar
                  mode="single"
                  selected={fechaLimiteDate}
                  onSelect={(d) => d && setFechaLimiteDate(d)}
                  disabled={(d) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return d < today;
                  }}
                  className="rounded-md scale-90 origin-top -my-2.5"
                />
              </div>

              <div className="sm:col-span-6 flex flex-col justify-between space-y-3 h-full pt-1">
                <div className="space-y-1">
                  <Label htmlFor="actividad-hora" className="text-xs font-medium text-slate-700 flex items-center gap-1">
                    <Clock className="size-3.5 text-slate-600" />
                    Hora de Cierre (CLT) *
                  </Label>
                  <Input
                    id="actividad-hora"
                    type="time"
                    value={horaLimite}
                    onChange={(e) => setHoraLimite(e.target.value)}
                    className="h-9 text-sm bg-white font-medium"
                  />
                </div>

                <div className="bg-sky-50/90 border border-sky-200 rounded-lg p-3 text-xs space-y-1">
                  <span className="font-semibold text-sky-800 flex items-center gap-1">
                    <CheckCircle2 className="size-3.5 text-sky-600" />
                    Vencimiento Seleccionado:
                  </span>
                  <p className="text-xs font-bold text-sky-950">
                    {fechaLimiteDate.toLocaleDateString("es-CL", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}{" "}
                    a las {horaLimite} hrs
                  </p>
                </div>
              </div>
            </div>
            {errors.fecha && <p className="text-xs text-rose-600">{errors.fecha}</p>}

            {/* Botones de acción */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCreateForm(false)}
                className="cursor-pointer text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submitting}
                className="cursor-pointer bg-sky-700 hover:bg-sky-800 text-white text-xs font-medium gap-1.5 px-4"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="size-3.5 animate-spin" /> Guardando...
                  </>
                ) : (
                  <>
                    <Plus className="size-3.5" /> Crear Tarea
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      ) : (
        /* Lista de Actividades Registradas (Sólo visible cuando NO se está creando una tarea) */
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50">
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-slate-900 flex items-center gap-2">
                <FileText className="size-4.5 text-sky-700" />
                Actividades Registradas en la Asignatura ({actividades.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Listado histórico de tareas activas y cerradas para el curso Práctica Pedagógica.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchActividades}
                disabled={loading}
                className="cursor-pointer gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-100 bg-white text-xs font-medium"
              >
                <RefreshCw className={`size-3.5 ${loading ? "animate-spin text-sky-600" : ""}`} />
                Actualizar
              </Button>
              <Button
                size="sm"
                onClick={() => setShowCreateForm(true)}
                className="cursor-pointer gap-1.5 bg-sky-700 hover:bg-sky-800 text-white shadow-xs font-medium text-xs"
              >
                <Plus className="size-3.5" /> Nueva Actividad
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 space-y-3">
              <RefreshCw className="size-7 animate-spin mx-auto text-sky-600" />
              <p className="text-sm font-medium">Cargando actividades del curso...</p>
            </div>
          ) : actividades.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="size-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <FileText className="size-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-700">No hay actividades creadas aún</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Crea la primera actividad para que los estudiantes de la asignatura puedan subir sus evidencias al sistema.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => setShowCreateForm(true)}
                className="cursor-pointer bg-sky-700 hover:bg-sky-800 text-white gap-2 font-medium"
              >
                <Plus className="size-4" /> Crear Primera Actividad
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {actividades.map((act) => {
                const isActiva = act.estado === "ACTIVA";
                const isVencida = new Date(act.fechaLimite) < new Date();

                return (
                  <div
                    key={act.idActividad}
                    className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                  >
                    <div className="space-y-2 max-w-2xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            isActiva
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}
                        >
                          {isActiva ? (
                            <>
                              <CheckCircle2 className="size-3" /> Activa
                            </>
                          ) : (
                            <>
                              <XCircle className="size-3" /> Cerrada
                            </>
                          )}
                        </span>

                        {isActiva && isVencida && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            <AlertCircle className="size-3" /> Plazo Vencido
                          </span>
                        )}

                        <span className="text-xs text-slate-400 font-medium">
                          ID #{act.idActividad}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-sm sm:text-base font-semibold text-slate-900 leading-snug">
                          {act.titulo}
                        </h3>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                          {act.descripcion}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                        <span className="flex items-center gap-1">
                          <Users className="size-3.5 text-slate-400" />
                          Asignado a: <strong className="text-slate-700">Todos los estudiantes</strong>
                        </span>
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="size-3.5 text-slate-400" />
                          Límite: <strong className="text-slate-700">{formatearFecha(act.fechaLimite)}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Acciones sobre la tarea */}
                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      {/* Switch Activar / Cerrar guardado directo en base de datos */}
                      <div className="flex items-center gap-1.5 pr-2 border-r border-slate-200">
                        <Switch
                          checked={isActiva}
                          onCheckedChange={(checked) => handleToggleEstado(act.idActividad, checked)}
                          className="cursor-pointer"
                          size="sm"
                        />
                        <span className={`text-xs font-medium ${isActiva ? "text-emerald-700" : "text-slate-500"}`}>
                          {isActiva ? "Activa" : "Cerrada"}
                        </span>
                      </div>

                      {/* Botón Editar Actividad */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAbrirEdicion(act)}
                        className="cursor-pointer text-xs border-slate-300 text-slate-700 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-300 gap-1"
                      >
                        <Pencil className="size-3.5" />
                        Editar
                      </Button>

                      {/* Botón Eliminar Tarea (sin confirmación) */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEliminarActividad(act.idActividad)}
                        className="cursor-pointer text-xs border-slate-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700 gap-1"
                        title="Eliminar tarea"
                      >
                        <Trash2 className="size-3.5" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal de Edición de Actividad */}
      {editingActividad && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-xl rounded-xl border border-slate-200 shadow-xl p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Pencil className="size-4 text-sky-700" />
                <h2 className="text-base font-semibold text-slate-900">Editar Tarea</h2>
              </div>
              <button
                type="button"
                onClick={() => setEditingActividad(null)}
                className="text-slate-400 hover:text-slate-600 rounded-md p-1 hover:bg-slate-100 cursor-pointer"
              >
                <XCircle className="size-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarEdicion} className="space-y-3.5">
              <div className="space-y-1">
                <Label htmlFor="edit-titulo" className="text-xs font-medium text-slate-700">
                  Título de la Tarea *
                </Label>
                <Input
                  id="edit-titulo"
                  value={editTitulo}
                  onChange={(e) => setEditTitulo(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="edit-descripcion" className="text-xs font-medium text-slate-700">
                  Instrucciones Pedagógicas y Pauta *
                </Label>
                <textarea
                  id="edit-descripcion"
                  rows={3}
                  value={editDescripcion}
                  onChange={(e) => setEditDescripcion(e.target.value)}
                  className="w-full rounded-md border border-slate-300 p-2.5 text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Calendario compacto en Edición */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-start bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80">
                <div className="sm:col-span-6 flex flex-col items-center justify-center bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
                  <div className="w-full flex items-center justify-between mb-1 px-1">
                    <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                      <CalendarIcon className="size-3 text-sky-600" />
                      Fecha Límite
                    </span>
                    <span className="text-[10px] font-bold text-sky-800 bg-sky-50 border border-sky-200 px-1.5 py-0.5 rounded">
                      {editFechaDate.toLocaleDateString("es-CL", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </span>
                  </div>
                  <Calendar
                    mode="single"
                    selected={editFechaDate}
                    onSelect={(d) => d && setEditFechaDate(d)}
                    disabled={(d) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return d < today;
                    }}
                    className="rounded-md scale-90 origin-top -my-2.5"
                  />
                </div>

                <div className="sm:col-span-6 flex flex-col justify-between space-y-3 h-full pt-1">
                  <div className="space-y-1">
                    <Label htmlFor="edit-hora" className="text-xs font-medium text-slate-700 flex items-center gap-1">
                      <Clock className="size-3.5 text-slate-600" />
                      Hora de Cierre (CLT) *
                    </Label>
                    <Input
                      id="edit-hora"
                      type="time"
                      value={editHora}
                      onChange={(e) => setEditHora(e.target.value)}
                      className="h-9 text-sm bg-white font-medium"
                    />
                  </div>

                  <div className="bg-sky-50/90 border border-sky-200 rounded-lg p-3 text-xs space-y-1">
                    <span className="font-semibold text-sky-800 flex items-center gap-1">
                      <CheckCircle2 className="size-3.5 text-sky-600" />
                      Vencimiento Seleccionado:
                    </span>
                    <p className="text-xs font-bold text-sky-950">
                      {editFechaDate.toLocaleDateString("es-CL", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}{" "}
                      a las {editHora} hrs
                    </p>
                  </div>
                </div>
              </div>

              {editError && <p className="text-xs text-rose-600">{editError}</p>}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingActividad(null)}
                  className="cursor-pointer text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={editingSubmitting}
                  className="cursor-pointer bg-sky-700 hover:bg-sky-800 text-white text-xs font-medium gap-1.5 px-4"
                >
                  {editingSubmitting ? (
                    <>
                      <RefreshCw className="size-3.5 animate-spin" /> Guardando...
                    </>
                  ) : (
                    "Guardar Cambios"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
