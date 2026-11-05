import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { UserSession } from "@/types/auth";
import type { ProfesorMenuKey } from "./types";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCheck,
  ClipboardCheck,
  ClipboardList,
  Clock,
  FileText,
  FolderOpen,
  Loader2,
  MessageSquareText,
  Plus,
  RefreshCw,
  Users,
} from "lucide-react";

// Paleta del inicio docente: tinta, gris perla, azul (al día) y rojo (pendiente)
const TINTA = "#10141A";
const AZUL = "#83A2DB";
const ROJO = "#CE6969";

interface SeguimientoDto {
  idEstudiante: number;
  nombre: string;
  rut: string;
  actividadTitulo: string;
  estadoEntrega: string;
  estadoRevision: string;
  fechaSubida: string | null;
  calificacion: number | null;
  aprobado: boolean | null;
  activo?: boolean;
  estado?: string;
}

interface ActividadDto {
  idActividad: number;
  titulo: string;
  fechaCreacion: string;
  fechaLimite: string;
  estado: "ACTIVA" | "CERRADA";
}

interface AsignaturaDto {
  nombre: string;
  semestre?: string | null;
}

type Etapa = "sin-entrega" | "por-revisar" | "revisado";

interface InicioProfesorProps {
  user: UserSession;
  esProfesorOctavoONoveno: boolean;
  puedeEvaluar: boolean;
  onNavigate: (menu: ProfesorMenuKey) => void;
}

const REVISADOS = new Set(["REVISADO", "OBSERVADO", "APROBADO", "REPROBADO"]);

function etapaDe(s: SeguimientoDto): Etapa {
  if (s.estadoEntrega !== "ENTREGADO") return "sin-entrega";
  if (REVISADOS.has(s.estadoRevision) || s.calificacion != null) return "revisado";
  return "por-revisar";
}

function iniciales(nombre: string) {
  const partes = nombre.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? "") + (partes[1]?.[0] ?? "")).toUpperCase() || "E";
}

const TONOS_AVATAR = [
  "bg-[#dfe7f6] text-[#3d5a94]",
  "bg-[#f4dede] text-[#9a3f3f]",
  "bg-[#e4e4e4] text-[#10141A]",
  "bg-[#e3ecef] text-[#36606b]",
  "bg-[#efe6da] text-[#7a5a2e]",
];

function Avatar({ nombre, id, size = "md" }: { nombre: string; id: number; size?: "sm" | "md" }) {
  const dim = size === "sm" ? "size-8 text-[11px]" : "size-10 text-xs";
  return (
    <span
      className={`${dim} ${TONOS_AVATAR[id % TONOS_AVATAR.length]} shrink-0 rounded-full grid place-items-center font-bold ring-2 ring-white`}
    >
      {iniciales(nombre)}
    </span>
  );
}

function fechaCorta(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" });
}

function plazo(act: ActividadDto) {
  if (act.estado === "CERRADA") return { texto: "Cerrada", vencida: true };
  const fin = new Date(act.fechaLimite);
  if (Number.isNaN(fin.getTime())) return { texto: "—", vencida: false };
  if (fin.getTime() < Date.now()) return { texto: "Plazo vencido", vencida: true };
  // Días de calendario hasta la fecha límite (hoy = 0)
  const hoy = new Date();
  const dias = Math.round(
    (new Date(fin.getFullYear(), fin.getMonth(), fin.getDate()).getTime() -
      new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).getTime()) /
      86_400_000
  );
  if (dias === 0) return { texto: "Vence hoy", vencida: false };
  return { texto: `${dias} ${dias === 1 ? "día" : "días"}`, vencida: false };
}

/** Botón circular de acción, como los de las tarjetas de referencia. */
function AccionCircular({
  titulo,
  onClick,
  children,
}: {
  titulo: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={titulo}
      aria-label={titulo}
      onClick={onClick}
      className="size-10 rounded-full border border-slate-300/70 bg-white/70 grid place-items-center text-slate-600 hover:bg-white hover:text-slate-900 transition-colors cursor-pointer"
    >
      {children}
    </button>
  );
}

/** Anillo de progreso (proporción sobre el total de estudiantes). */
function Anillo({ valor, total, color, etiqueta }: { valor: number; total: number; color: string; etiqueta: string }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const p = total > 0 ? valor / total : 0;
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative size-36">
        <svg viewBox="0 0 128 128" className="size-full -rotate-90">
          <circle cx="64" cy="64" r={r} fill="none" stroke="#e4e4e4" strokeWidth="14" />
          <circle
            cx="64"
            cy="64"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${c * p} ${c}`}
            className="transition-[stroke-dasharray] duration-700"
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <div className="text-3xl font-semibold tracking-tight" style={{ color: TINTA }}>
              {valor}
            </div>
            <div className="text-[11px] text-slate-500">de {total}</div>
          </div>
        </div>
      </div>
      <span className="text-xs font-medium text-slate-600">{etiqueta}</span>
    </div>
  );
}

export function InicioProfesor({ user, esProfesorOctavoONoveno, puedeEvaluar, onNavigate }: InicioProfesorProps) {
  const [seguimiento, setSeguimiento] = useState<SeguimientoDto[]>([]);
  const [actividades, setActividades] = useState<ActividadDto[]>([]);
  const [asignatura, setAsignatura] = useState<AsignaturaDto | null>(null);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    if (!user?.rut) {
      setCargando(false);
      return;
    }
    setCargando(true);
    const rut = encodeURIComponent(user.rut);
    const json = async (url: string) => {
      try {
        const res = await fetch(url);
        return res.ok ? await res.json() : null;
      } catch {
        return null;
      }
    };
    const [seg, acts, prof] = await Promise.all([
      json(`/api/evidencias/seguimiento/profesor/${rut}`),
      json(`/api/actividades/profesor/${rut}`),
      json(`/api/profesores/rut/${rut}`),
    ]);
    setSeguimiento(
      Array.isArray(seg)
        ? seg.filter(
            (s: SeguimientoDto) =>
              s.activo !== false && s.estado?.toLowerCase() !== "inactivo" && s.estadoEntrega !== "INACTIVO"
          )
        : []
    );
    setActividades(Array.isArray(acts) ? acts : []);
    setAsignatura(prof?.asignatura ?? null);
    setCargando(false);
  }, [user?.rut]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const etapas = useMemo(() => {
    const grupos: Record<Etapa, SeguimientoDto[]> = { "sin-entrega": [], "por-revisar": [], revisado: [] };
    seguimiento.forEach((s) => grupos[etapaDe(s)].push(s));
    return grupos;
  }, [seguimiento]);

  const actividadesOrdenadas = useMemo(
    () =>
      [...actividades].sort((a, b) => {
        if (a.estado !== b.estado) return a.estado === "ACTIVA" ? -1 : 1;
        return new Date(a.fechaLimite).getTime() - new Date(b.fechaLimite).getTime();
      }),
    [actividades]
  );

  const total = seguimiento.length;
  const entregados = total - etapas["sin-entrega"].length;
  const aprobados = seguimiento.filter((s) => s.aprobado === true).length;
  const reprobados = seguimiento.filter((s) => s.aprobado === false).length;
  const activas = actividades.filter((a) => a.estado === "ACTIVA").length;
  const irAEvaluar = () => onNavigate(puedeEvaluar ? "evaluaciones" : "actividades");

  const columnas: { etapa: Etapa; titulo: string; vacio: string }[] = [
    { etapa: "sin-entrega", titulo: "Sin entrega", vacio: "Todos tus estudiantes entregaron." },
    { etapa: "por-revisar", titulo: "Por revisar", vacio: "No hay entregas esperando revisión." },
    { etapa: "revisado", titulo: "Revisados", vacio: "Aún no hay entregas revisadas." },
  ];

  const siguientesPasos: { menu: ProfesorMenuKey; titulo: string; icono: ReactNode; visible: boolean }[] = [
    { menu: "actividades", titulo: "Crear actividad", icono: <Plus className="size-4" />, visible: true },
    {
      menu: "revision-retroalimentacion",
      titulo: "Retroalimentación",
      icono: <MessageSquareText className="size-4" />,
      visible: esProfesorOctavoONoveno,
    },
    { menu: "planificacion", titulo: "Planificación", icono: <BookOpen className="size-4" />, visible: esProfesorOctavoONoveno },
    {
      menu: "documentos-practica",
      titulo: "Documentos de práctica",
      icono: <FolderOpen className="size-4" />,
      visible: esProfesorOctavoONoveno,
    },
    { menu: "pautas-practica", titulo: "Pautas de práctica", icono: <ClipboardList className="size-4" />, visible: puedeEvaluar },
  ];

  if (cargando) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-slate-500">
        <Loader2 className="size-4 animate-spin" />
        Cargando tu panel docente...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Encabezado ── */}
      <section
        className="rounded-[28px] p-6 sm:p-8 text-white relative overflow-hidden"
        style={{ background: `radial-gradient(120% 140% at 85% 0%, #3a3f47 0%, ${TINTA} 55%)` }}
      >
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 relative">
          <div className="space-y-3">
            <span className="text-xs text-white/60">Panel del profesor de asignatura</span>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
              Hola, {user.nombre || "profesor"}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 border border-white/15">
                <BookOpen className="size-3.5" />
                {asignatura?.nombre ?? "Sin asignatura asignada"}
              </span>
              {asignatura?.semestre && (
                <span className="rounded-full bg-white/10 px-3 py-1.5 border border-white/15">
                  Semestre {asignatura.semestre}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {[
              { valor: total, etiqueta: "Estudiantes", icono: <Users className="size-4" /> },
              { valor: activas, etiqueta: "Actividades activas", icono: <CalendarDays className="size-4" /> },
              { valor: etapas["por-revisar"].length, etiqueta: "Por revisar", icono: <ClipboardCheck className="size-4" /> },
            ].map((m) => (
              <div key={m.etiqueta} className="rounded-2xl bg-white/[0.07] border border-white/10 px-3 sm:px-4 py-3 min-w-0 break-words">
                <div className="flex items-start gap-1.5 text-white/60 text-[11px] leading-tight">
                  <span className="shrink-0">{m.icono}</span>
                  <span>{m.etiqueta}</span>
                </div>
                <div className="text-2xl font-semibold mt-1">{m.valor}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Seguimiento de entregas ── */}
      <section className="rounded-[28px] bg-[#eceef1] border border-white p-4 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight" style={{ color: TINTA }}>
              Seguimiento de entregas
            </h2>
            <p className="text-xs text-slate-500">Última entrega de cada estudiante de tu asignatura.</p>
          </div>

          {total > 0 && (
            <div className="hidden md:flex items-center rounded-full bg-white/70 border border-white px-3 py-2 -space-x-2">
              {seguimiento.slice(0, 8).map((s) => {
                const etapa = etapaDe(s);
                return (
                  <span key={s.idEstudiante} className="relative" title={s.nombre}>
                    <Avatar nombre={s.nombre} id={s.idEstudiante} />
                    <span
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 size-3 rounded-full ring-2 ring-white"
                      style={{ background: etapa === "sin-entrega" ? ROJO : etapa === "por-revisar" ? "#d9b26a" : AZUL }}
                    />
                  </span>
                );
              })}
              {total > 8 && (
                <span className="size-10 rounded-full bg-white ring-2 ring-white grid place-items-center text-xs font-semibold text-slate-600">
                  +{total - 8}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center gap-2">
            <AccionCircular titulo="Nueva actividad" onClick={() => onNavigate("actividades")}>
              <Plus className="size-4" />
            </AccionCircular>
            <AccionCircular titulo="Ir a evaluar" onClick={irAEvaluar}>
              <ClipboardCheck className="size-4" />
            </AccionCircular>
            <AccionCircular titulo="Actualizar" onClick={cargar}>
              <RefreshCw className="size-4" />
            </AccionCircular>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,1.3fr)] gap-4">
          {columnas.map(({ etapa, titulo, vacio }) => {
            const lista = etapas[etapa];
            return (
              <div key={etapa} className="flex flex-col gap-3">
                <div className="rounded-3xl bg-white p-4 shadow-[0_1px_2px_rgba(16,20,26,0.04)] flex-1 min-h-[220px]">
                  {lista.length === 0 ? (
                    <p className="h-full grid place-items-center text-center text-xs text-slate-400 px-4">{vacio}</p>
                  ) : (
                    <ul className="space-y-1">
                      {lista.slice(0, 5).map((s) => (
                        <li key={s.idEstudiante}>
                          <button
                            type="button"
                            onClick={irAEvaluar}
                            className="w-full flex items-center gap-3 rounded-2xl p-2 text-left hover:bg-slate-50 transition-colors cursor-pointer"
                          >
                            <Avatar nombre={s.nombre} id={s.idEstudiante} />
                            <span className="min-w-0 flex-1">
                              <span className="block text-[13px] font-semibold truncate" style={{ color: TINTA }}>
                                {s.nombre}
                              </span>
                              <span className="block text-[11px] text-slate-500 truncate">
                                {etapa === "sin-entrega"
                                  ? s.rut
                                  : etapa === "revisado" && s.calificacion != null
                                    ? `Nota ${s.calificacion.toFixed(1)} · ${s.actividadTitulo}`
                                    : `${s.actividadTitulo} · ${fechaCorta(s.fechaSubida)}`}
                              </span>
                            </span>
                            {etapa === "revisado" ? (
                              <CheckCheck className="size-4 shrink-0" style={{ color: s.aprobado === false ? ROJO : AZUL }} />
                            ) : etapa === "por-revisar" ? (
                              <FileText className="size-4 shrink-0 text-slate-400" />
                            ) : (
                              <Clock className="size-4 shrink-0" style={{ color: ROJO }} />
                            )}
                          </button>
                        </li>
                      ))}
                      {lista.length > 5 && (
                        <li className="pt-1 pl-2 text-[11px] font-medium text-slate-500">+{lista.length - 5} más</li>
                      )}
                    </ul>
                  )}
                </div>
                <div className="text-center text-xs font-medium text-slate-600">
                  {titulo} <span className="text-slate-400">· {lista.length}</span>
                </div>
              </div>
            );
          })}

          {/* Siguientes pasos */}
          <div className="flex flex-col gap-3">
            <div className="rounded-3xl border border-dashed border-slate-300 p-3 grid grid-cols-2 gap-3 flex-1 content-start">
              <button
                type="button"
                onClick={irAEvaluar}
                className="col-span-2 rounded-2xl p-4 text-left text-white flex items-center justify-between gap-2 cursor-pointer hover:opacity-90 transition-opacity"
                style={{ background: TINTA }}
              >
                <span>
                  <span className="block text-sm font-semibold">Revisar entregas</span>
                  <span className="block text-[11px] text-white/60">
                    {etapas["por-revisar"].length} esperando tu revisión
                  </span>
                </span>
                <ArrowRight className="size-4" />
              </button>
              {siguientesPasos
                .filter((p) => p.visible)
                .map((p) => (
                  <button
                    key={p.menu}
                    type="button"
                    onClick={() => onNavigate(p.menu)}
                    lang="es"
                    className="min-w-0 rounded-2xl bg-white p-3 text-left text-xs font-medium text-slate-700 flex flex-col gap-2 hover:bg-slate-50 transition-colors cursor-pointer min-h-[76px] break-words hyphens-auto"
                  >
                    <span className="text-slate-500">{p.icono}</span>
                    {p.titulo}
                  </button>
                ))}
            </div>
            <div className="text-center text-xs font-medium text-slate-600">Siguientes pasos</div>
          </div>
        </div>
      </section>

      {/* ── Actividades y estado general ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <section className="lg:col-span-3 rounded-[28px] bg-white border border-slate-200/70 p-4 sm:p-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight" style={{ color: TINTA }}>
                Mis actividades
              </h2>
              <p className="text-xs text-slate-500">Plazos de entrega de tu asignatura.</p>
            </div>
            <AccionCircular titulo="Ver todas las actividades" onClick={() => onNavigate("actividades")}>
              <ArrowRight className="size-4" />
            </AccionCircular>
          </div>

          {actividadesOrdenadas.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 py-10 text-center text-xs text-slate-500">
              Aún no creas actividades.{" "}
              <button
                type="button"
                onClick={() => onNavigate("actividades")}
                className="font-semibold text-slate-800 underline underline-offset-2 cursor-pointer"
              >
                Crear la primera
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="text-[11px] text-slate-400">
                    <th className="font-medium px-2 pb-2">Actividad</th>
                    <th className="font-medium px-2 pb-2">Estado</th>
                    <th className="font-medium px-2 pb-2 hidden sm:table-cell">Creación</th>
                    <th className="font-medium px-2 pb-2">Fecha límite</th>
                    <th className="font-medium px-2 pb-2 text-right">Plazo</th>
                  </tr>
                </thead>
                <tbody>
                  {actividadesOrdenadas.slice(0, 6).map((a) => {
                    const p = plazo(a);
                    return (
                      <tr key={a.idActividad} className="border-t border-slate-100">
                        <td className="px-2 py-3 font-medium max-w-[220px] truncate" style={{ color: TINTA }}>
                          {a.titulo}
                        </td>
                        <td className="px-2 py-3">
                          <span
                            className="inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white"
                            style={{ background: a.estado === "ACTIVA" ? AZUL : ROJO }}
                          >
                            {a.estado === "ACTIVA" ? "Activa" : "Cerrada"}
                          </span>
                        </td>
                        <td className="px-2 py-3 text-slate-500 hidden sm:table-cell">{fechaCorta(a.fechaCreacion)}</td>
                        <td className="px-2 py-3 text-slate-500">{fechaCorta(a.fechaLimite)}</td>
                        <td
                          className="px-2 py-3 text-right font-medium whitespace-nowrap"
                          style={{ color: p.vencida ? ROJO : TINTA }}
                        >
                          {p.texto}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="lg:col-span-2 rounded-[28px] bg-white border border-slate-200/70 p-4 sm:p-6 flex flex-col">
          <h2 className="text-lg font-semibold tracking-tight" style={{ color: TINTA }}>
            Estado de entregas
          </h2>
          <p className="text-xs text-slate-500">Sobre el total de estudiantes activos.</p>

          <div className="flex-1 flex items-center justify-around gap-4 py-6">
            <Anillo valor={entregados} total={total} color={AZUL} etiqueta="Entregaron" />
            <Anillo valor={etapas["sin-entrega"].length} total={total} color={ROJO} etiqueta="Sin entrega" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-[#f3f5f9] px-4 py-3">
              <div className="text-[11px] text-slate-500">Aprobados</div>
              <div className="text-xl font-semibold" style={{ color: TINTA }}>
                {aprobados}
              </div>
            </div>
            <div className="rounded-2xl bg-[#f8f0f0] px-4 py-3">
              <div className="text-[11px] text-slate-500">Reprobados</div>
              <div className="text-xl font-semibold" style={{ color: TINTA }}>
                {reprobados}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
