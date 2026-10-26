import { useState, useEffect, useCallback } from "react";
import type { UserSession } from "@/types/auth";
import {
  getActividadesEstudiante,
  type ActividadEstudiante,
} from "@/services/actividadEstudianteApi";
import type {
  AvancePractica,
  DatosPracticaEstudiante,
  EtapaPractica,
  EstadoEtapa,
  SemestrePractica,
  ItemPendiente,
  PersonaEquipo,
  ActividadRecienteItem,
} from "../types";

interface PracticaApi {
  idPractica: number;
  asignatura?: { nombre?: string; semestre?: string } | null;
  centroPractica?: { nombre?: string; direccion?: string } | null;
  tutorPractica?: { nombre?: string; usuario?: { correo?: string } | null } | null;
}

async function obtenerJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

function etapa(id: string, titulo: string, subtitulo: string, estado: EstadoEtapa): EtapaPractica {
  return { id, titulo, subtitulo, estado, completada: estado === "done", actual: estado === "cur" };
}

/**
 * Etapas de la línea de tiempo según los datos reales de la práctica:
 * Inscripción (práctica asignada) → Inicio (centro, tutor y profesor colaborador asignados) →
 * Seguimiento (rúbricas y observaciones en curso) → Evaluación final (las 6 completadas).
 */
export function calcularEtapas(params: {
  tienePractica: boolean;
  faltantesEquipo: string[];
  completadas: number;
  total: number;
  promedio: number | null;
}): EtapaPractica[] {
  const { tienePractica, faltantesEquipo, completadas, total, promedio } = params;
  const equipoCompleto = tienePractica && faltantesEquipo.length === 0;
  const evaluacionesCompletas = total > 0 && completadas === total;

  return [
    etapa("inscripcion", "Inscripción", tienePractica ? "Práctica asignada" : "Sin práctica asignada", tienePractica ? "done" : "cur"),
    etapa(
      "inicio",
      "Inicio",
      !tienePractica ? "Pendiente" : equipoCompleto ? "Centro y equipo asignados" : `Falta ${faltantesEquipo.join(", ")}`,
      !tienePractica ? "pending" : equipoCompleto ? "done" : "cur"
    ),
    etapa(
      "seguimiento",
      "Seguimiento",
      `${completadas} de ${total || 6} evaluaciones`,
      !equipoCompleto ? "pending" : evaluacionesCompletas ? "done" : "cur"
    ),
    etapa(
      "evaluacion-final",
      "Evaluación final",
      evaluacionesCompletas && promedio != null ? `Promedio ${promedio.toFixed(1)}` : "Pendiente",
      equipoCompleto && evaluacionesCompletas ? "done" : "pending"
    ),
  ];
}

function tiempoRelativo(fecha: Date): string {
  const dias = Math.floor((Date.now() - fecha.getTime()) / 86_400_000);
  if (dias <= 0) return "Hoy";
  if (dias === 1) return "Ayer";
  if (dias < 30) return `Hace ${dias} días`;
  return fecha.toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" });
}

export function usePracticaEstudiante(user: UserSession) {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [datos, setDatos] = useState<DatosPracticaEstudiante | null>(null);

  const rut = user.rut || "";

  const cargarDatos = useCallback(async () => {
    if (!rut) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const rutUrl = encodeURIComponent(rut);
      const [estudianteDb, avance, practicas, actividadesAlumno] = await Promise.all([
        obtenerJson<{ asignatura?: { nombre?: string; semestre?: string } }>(`/api/estudiantes/rut/${rutUrl}`),
        obtenerJson<AvancePractica>(`/api/rubricas-practica/estudiante/${rutUrl}`),
        obtenerJson<PracticaApi[]>("/api/practicas"),
        getActividadesEstudiante(rut).catch((): ActividadEstudiante[] => []),
      ]);

      // La práctica es la misma que el backend usa para las rúbricas (la de la asignatura actual).
      const practica = practicas?.find((p) => p.idPractica === avance?.idPractica) ?? null;
      const rubricas = avance?.rubricas ?? [];
      const colaboradores = avance?.colaboradores ?? [];

      const asignatura = practica?.asignatura ?? estudianteDb?.asignatura;
      const esNoveno =
        String(asignatura?.semestre || "").includes("9") ||
        (asignatura?.nombre || "").toLowerCase().includes("profesional");
      const semestre: SemestrePractica = esNoveno ? 9 : 8;

      const centroNombre = practica?.centroPractica?.nombre || "";
      const tutorNombre = practica?.tutorPractica?.nombre || "";
      const tutorCorreo = practica?.tutorPractica?.usuario?.correo || "";

      // Etapas
      const faltantesEquipo = [
        !centroNombre && "centro",
        !tutorNombre && "tutor",
        colaboradores.length === 0 && "profesor colaborador",
      ].filter((f): f is string => !!f);
      const completadas = rubricas.filter((r) => r.estado === "COMPLETADA");
      const notas = completadas.map((r) => r.nota).filter((n): n is number => n != null);
      const promedio = notas.length ? notas.reduce((a, b) => a + b, 0) / notas.length : null;
      const etapas = calcularEtapas({
        tienePractica: !!practica,
        faltantesEquipo,
        completadas: completadas.length,
        total: rubricas.length,
        promedio,
      });
      const etapaActual = etapas.find((e) => e.estado === "cur")?.titulo ?? "Evaluación final";

      // Pendientes del propio alumno: actividades activas, sin entregar y dentro de plazo
      const ahora = Date.now();
      const pendientes: ItemPendiente[] = actividadesAlumno
        .filter((a) => a.estado === "ACTIVA" && !a.idEvidencia)
        .filter((a) => !a.fechaLimite || new Date(a.fechaLimite).getTime() >= ahora)
        .map((a) => ({
          id: `act-${a.idActividad}`,
          titulo: `Entregar «${a.titulo}»`,
          fechaLimite: a.fechaLimite
            ? `Vence el ${new Date(a.fechaLimite).toLocaleDateString("es-CL", { day: "numeric", month: "long" })}`
            : undefined,
          menuDestino: "evaluaciones",
          tipo: "evaluacion",
        }));

      // Actividad reciente: evaluaciones completadas, entregas y revisiones, de la más nueva a la más antigua
      const eventos: (ActividadRecienteItem & { fecha: Date })[] = [];
      completadas.forEach((r) => {
        if (!r.fechaCompletada) return;
        const evaluador = r.tipoEvaluador === "TUTOR_PRACTICA" ? "El tutor" : "El profesor colaborador";
        eventos.push({
          id: `rub-${r.idRubrica}`,
          descripcion: `${evaluador} completó «${r.titulo}»${r.nota != null ? ` (nota ${r.nota.toFixed(1)})` : ""}`,
          tiempo: "",
          tipo: "check",
          fecha: new Date(r.fechaCompletada),
        });
      });
      actividadesAlumno.forEach((a) => {
        if (a.fechaEntrega) {
          eventos.push({ id: `ent-${a.idActividad}`, descripcion: `Entregaste «${a.titulo}»`, tiempo: "", tipo: "up", fecha: new Date(a.fechaEntrega) });
        }
        if (a.fechaRevision) {
          eventos.push({ id: `rev-${a.idActividad}`, descripcion: `Tu entrega de «${a.titulo}» fue revisada`, tiempo: "", tipo: "edit", fecha: new Date(a.fechaRevision) });
        }
      });
      const actividades: ActividadRecienteItem[] = eventos
        .filter((e) => !isNaN(e.fecha.getTime()))
        .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
        .slice(0, 5)
        .map(({ fecha, ...item }) => ({ ...item, tiempo: tiempoRelativo(fecha) }));

      // Equipo: el alumno, su tutor y los profesores colaboradores de su práctica
      const equipo: PersonaEquipo[] = [
        {
          nombre: `${user.nombre} ${user.apellido || ""}`.trim(),
          rol: `Estudiante Practicante (${semestre}.º Semestre)`,
          correo: user.correo,
          lugar: "Campus Concepción - Chillán",
        },
      ];
      if (tutorNombre) {
        equipo.push({
          nombre: tutorNombre,
          rol: "Tutora de Práctica en Centro Educativo",
          correo: tutorCorreo || "No registrado",
          lugar: centroNombre || "Centro de práctica",
          esTutor: true,
        });
      }
      colaboradores.forEach((c) => {
        equipo.push({
          nombre: c.nombre || "Profesor Colaborador",
          rol: "Profesor Colaborador de Campo",
          correo: c.correo || "No registrado",
          lugar: c.centro || "Facultad de Educación UBB",
          esProfesor: true,
        });
      });

      const hoy = new Date();
      setDatos({
        semestre,
        asignaturaNombre: asignatura?.nombre || (esNoveno ? "Práctica Profesional" : "Práctica Pedagógica"),
        centroPractica: centroNombre,
        direccionCentro: practica?.centroPractica?.direccion || "",
        periodo: `${hoy.getFullYear()} - ${hoy.getMonth() >= 6 ? "2 (Segundo Semestre)" : "1 (Primer Semestre)"}`,
        etapaActual,
        etapas,
        pendientes,
        equipo,
        actividades,
      });
    } catch (err: unknown) {
      console.error("Error al cargar datos de práctica:", err);
      setError(err instanceof Error ? err.message : "No se pudieron cargar los datos de la práctica.");
    } finally {
      setLoading(false);
    }
  }, [rut, user.nombre, user.apellido, user.correo]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  return {
    datos,
    loading,
    error,
    recargar: cargarDatos,
  };
}
