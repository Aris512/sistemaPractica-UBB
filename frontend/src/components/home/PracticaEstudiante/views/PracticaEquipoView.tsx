import type { UserSession } from "@/types/auth";
import type { DatosPracticaEstudiante } from "../types";
import {
  Users,
  Building2,
  Mail,
  MapPin,
  GraduationCap,
  ShieldCheck,
  UserCheck,
  Clock,
  ExternalLink,
} from "lucide-react";

interface PracticaEquipoViewProps {
  user: UserSession;
  datos: DatosPracticaEstudiante;
}

export function PracticaEquipoView({
  datos,
}: PracticaEquipoViewProps) {
  const getInitials = (nombre: string) => {
    return nombre
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0].toUpperCase())
      .join("");
  };

  const hasCentro = Boolean(datos.centroPractica && datos.centroPractica.trim());
  const hasDireccion = Boolean(datos.direccionCentro && datos.direccionCentro.trim());
  const hasEquipoReal = datos.equipo.length > 1;

  // Colores de avatar según el rol
  const avatarColors = [
    "bg-sky-100 text-sky-800 border-sky-200/70",
    "bg-emerald-100 text-emerald-800 border-emerald-200/70",
    "bg-violet-100 text-violet-800 border-violet-200/70",
    "bg-rose-100 text-rose-800 border-rose-200/70",
    "bg-indigo-100 text-indigo-800 border-indigo-200/70",
  ];

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Users className="size-6 text-sky-600" />
          <span>Equipo de Práctica Profesional</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Docentes, tutores y directivos a cargo de la supervisión y acompañamiento de tu proceso de práctica.
        </p>
      </div>

      {/* Centro Educativo — datos de tabla centro_practica */}
      <div className="bg-gradient-to-r from-sky-50 via-white to-indigo-50/50 rounded-2xl border border-sky-200/80 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="size-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-xs">
              <Building2 className="size-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-sky-700 uppercase tracking-wider block">
                Centro de Práctica Asignado
              </span>

              {hasCentro ? (
                <>
                  <h2 className="text-lg font-bold text-slate-900">
                    {datos.centroPractica}
                  </h2>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="size-3 text-slate-400" />
                    <span>{hasDireccion ? datos.direccionCentro : "Dirección no registrada"}</span>
                  </p>
                </>
              ) : (
                <div className="mt-1">
                  <p className="text-sm font-semibold text-slate-500">
                    Pendiente de asignación
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                    <Clock className="size-3 text-slate-300" />
                    <span>Aparecerá aquí una vez registrado en el sistema</span>
                  </p>
                </div>
              )}
            </div>
          </div>

          {hasCentro ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70 shrink-0">
              <ShieldCheck className="size-3.5" />
              <span>Convenio Vigente UBB</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-50 text-slate-500 border border-slate-200/70 shrink-0">
              <Clock className="size-3.5" />
              <span>Sin asignar</span>
            </div>
          )}
        </div>
      </div>

      {/* Tarjetas de Integrantes del Equipo */}
      {hasEquipoReal ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {datos.equipo.map((persona, idx) => {
            let IconoRol = GraduationCap;
            let colorBadge = "bg-sky-50 text-sky-700 border-sky-200/70";
            if (persona.esTutor) {
              IconoRol = UserCheck;
              colorBadge = "bg-emerald-50 text-emerald-700 border-emerald-200/70";
            } else if (persona.esCoordinador) {
              IconoRol = ShieldCheck;
              colorBadge = "bg-indigo-50 text-indigo-700 border-indigo-200/70";
            } else if (persona.esProfesor) {
              IconoRol = GraduationCap;
              colorBadge = "bg-violet-50 text-violet-700 border-violet-200/70";
            }

            const avatarColor = avatarColors[idx % avatarColors.length];

            return (
              <div
                key={persona.nombre + idx}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between hover:border-sky-300 hover:shadow-sm transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${colorBadge}`}>
                      <IconoRol className="size-3" />
                      <span>{persona.rol}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-3.5 mb-3">
                    <div className={`size-11 rounded-full font-extrabold text-sm flex items-center justify-center shrink-0 border ${avatarColor}`}>
                      {getInitials(persona.nombre)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-slate-900 truncate">
                        {persona.nombre}
                      </h3>
                      <p className="text-xs text-slate-500 truncate">
                        {persona.lugar || "Universidad del Bío-Bío"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-2 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-500 truncate flex items-center gap-1.5">
                    <Mail className="size-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">
                      {persona.correo && persona.correo !== "No registrado"
                        ? persona.correo
                        : "Correo no registrado"}
                    </span>
                  </span>

                  {persona.correo && persona.correo !== "No registrado" && (
                    <a
                      href={`mailto:${persona.correo}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-sky-700 hover:text-sky-800 hover:underline shrink-0"
                    >
                      <span>Contactar</span>
                      <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Estado vacío — coherente con la estética sky/slate de la plataforma */
        <div className="space-y-4">
          {/* Tarjeta del estudiante (siempre se muestra) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:border-sky-300 hover:shadow-sm transition-all">
            <div className="flex items-center gap-3.5">
              <div className="size-11 rounded-full bg-sky-100 text-sky-800 font-extrabold text-sm flex items-center justify-center shrink-0 border border-sky-200/70">
                {getInitials(datos.equipo[0]?.nombre || "E")}
              </div>
              <div className="min-w-0 flex-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border bg-sky-50 text-sky-700 border-sky-200/70 mb-1">
                  <GraduationCap className="size-3" />
                  <span>{datos.equipo[0]?.rol || "Estudiante Practicante"}</span>
                </span>
                <h3 className="text-base font-bold text-slate-900 truncate mt-1">
                  {datos.equipo[0]?.nombre || "Estudiante"}
                </h3>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs text-slate-500 flex items-center gap-1.5">
                  <Mail className="size-3.5 text-slate-400" />
                  <span>{datos.equipo[0]?.correo}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Mensaje de equipo pendiente — misma estética que las tarjetas de la plataforma */}
          <div className="bg-gradient-to-r from-sky-50/60 via-white to-slate-50/60 rounded-2xl border border-sky-200/60 p-8 shadow-xs">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="size-14 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center border border-sky-200/60">
                <Users className="size-7" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Equipo de práctica pendiente de conformación
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
                  Cuando se asignen tutores, profesores colaboradores y coordinadores en el sistema,
                  sus datos de contacto aparecerán automáticamente en esta sección.
                </p>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-600 border border-sky-200/60">
                <Clock className="size-3.5" />
                <span>Se actualiza automáticamente</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
