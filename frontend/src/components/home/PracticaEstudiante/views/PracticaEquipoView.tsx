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

      {/* Centro Educativo */}
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
              <h2 className="text-lg font-bold text-slate-900">
                {datos.centroPractica}
              </h2>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <MapPin className="size-3 text-slate-400" />
                <span>{datos.direccionCentro}</span>
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70 shrink-0">
            <ShieldCheck className="size-3.5" />
            <span>Convenio Vigente UBB</span>
          </div>
        </div>
      </div>

      {/* Tarjetas de Integrantes del Equipo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {datos.equipo.map((persona) => {
          let IconoRol = GraduationCap;
          let colorBadge = "bg-sky-50 text-sky-700 border-sky-200/70";
          if (persona.esTutor) {
            IconoRol = UserCheck;
            colorBadge = "bg-emerald-50 text-emerald-700 border-emerald-200/70";
          } else if (persona.esCoordinador) {
            IconoRol = ShieldCheck;
            colorBadge = "bg-indigo-50 text-indigo-700 border-indigo-200/70";
          }

          return (
            <div
              key={persona.nombre}
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
                  <div className="size-11 rounded-full bg-sky-100 text-sky-800 font-extrabold text-sm flex items-center justify-center shrink-0 border border-sky-200/70">
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
                  <span className="truncate">{persona.correo}</span>
                </span>

                <a
                  href={`mailto:${persona.correo}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-sky-700 hover:text-sky-800 hover:underline shrink-0"
                >
                  <span>Contactar</span>
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
