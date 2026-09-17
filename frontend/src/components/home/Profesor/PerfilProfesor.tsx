import { useState, useEffect } from "react";
import { ArrowLeft, GraduationCap, UserCheck } from "lucide-react";
import type { UserSession } from "@/types/auth";

interface PerfilProfesorProps {
  user: UserSession;
  onBack?: () => void;
}

export function PerfilProfesor({ user, onBack }: PerfilProfesorProps) {
  const rolDisplay = (user.roles && user.roles[0]) || user.rol || "Profesor";
  const fullName = `${user.nombre || ""} ${user.apellido || ""}`.trim().toUpperCase() || "DOCENTE";
  const [ramo, setRamo] = useState<string>("Práctica Pedagógica");

  useEffect(() => {
    if (!user?.rut) return;
    fetch(`http://localhost:8080/api/profesores/rut/${encodeURIComponent(user.rut)}`)
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (data?.asignatura?.nombre) {
          setRamo(data.asignatura.nombre);
        } else if (data?.asignaturas && data.asignaturas.length > 0) {
          setRamo(data.asignaturas[0].nombre);
        }
      })
      .catch((err) => console.warn("No se pudo obtener la asignatura del profesor:", err));
  }, [user?.rut]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      {/* Botón Volver */}
      {onBack && (
        <div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-sky-800 bg-sky-50 hover:bg-sky-100/80 border border-sky-200 transition-colors cursor-pointer"
          >
            <ArrowLeft className="size-3.5" />
            <span>Volver al Inicio</span>
          </button>
        </div>
      )}

      {/* Nombre completo en mayúsculas estilo portal institucional */}
      <div className="border-b border-slate-200 pb-3">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-slate-900 uppercase">
          {fullName}
        </h1>
      </div>

      {/* Tarjeta 1: Detalles académicos / docentes */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4 mb-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Detalles académicos y docentes
            </h2>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <UserCheck className="size-3.5" />
              Docente Activo
            </span>
          </div>

          <p className="text-sm sm:text-base font-semibold text-slate-900 mb-6">
            Departamento de Ciencias de la Educación : Campus Concepción
          </p>

          {/* Rejilla de dos columnas con divisores horizontales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 divide-y md:divide-y-0 divide-slate-100">
            {/* Columna Izquierda */}
            <div className="divide-y divide-slate-100">
              <div className="py-3.5 flex items-center justify-between gap-4">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  JERARQUÍA
                </span>
                <span className="text-sm font-medium text-slate-800 text-right">
                  Profesor Guía / Supervisor
                </span>
              </div>

              <div className="py-3.5 flex items-center justify-between gap-4">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  CAMPUS
                </span>
                <span className="text-sm font-medium text-slate-800 text-right">
                  Campus Concepción - Chillán
                </span>
              </div>

              <div className="py-3.5 flex items-center justify-between gap-4">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  CARRERA / ÁREA
                </span>
                <span className="text-sm font-medium text-slate-800 text-right">
                  Pedagogía en Educación Matemática
                </span>
              </div>
            </div>

            {/* Columna Derecha */}
            <div className="divide-y divide-slate-100">
              <div className="py-3.5 flex items-center justify-between gap-4">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  DIVISIÓN
                </span>
                <span className="text-sm font-medium text-slate-800 text-right">
                  Facultad de Educación y Humanidades
                </span>
              </div>

              <div className="py-3.5 flex items-center justify-between gap-4">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  DEPARTAMENTO
                </span>
                <span className="text-sm font-medium text-slate-800 text-right">
                  Ciencias de la Educación
                </span>
              </div>

              <div className="py-3.5 flex items-center justify-between gap-4">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  RAMO / ASIGNATURA
                </span>
                <span className="text-sm font-semibold text-sky-800 text-right">
                  {ramo}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tarjeta 2: Datos de identificación y cuenta institucional */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap className="size-5 text-sky-700" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Identificación y Cuenta Institucional
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 divide-y md:divide-y-0 divide-slate-100">
            {/* Columna Izquierda */}
            <div className="divide-y divide-slate-100">
              <div className="py-3.5 flex items-center justify-between gap-4">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  RUT
                </span>
                <span className="text-sm font-semibold text-slate-800 text-right font-mono">
                  {user.rut || "—"}
                </span>
              </div>

              <div className="py-3.5 flex items-center justify-between gap-4">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  ROL EN SISTEMA
                </span>
                <span className="text-sm font-medium text-sky-800 text-right capitalize">
                  {rolDisplay}
                </span>
              </div>
            </div>

            {/* Columna Derecha */}
            <div className="divide-y divide-slate-100">
              <div className="py-3.5 flex items-center justify-between gap-4">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  CORREO INSTITUCIONAL
                </span>
                <span className="text-sm font-medium text-slate-800 text-right truncate">
                  {user.correo || `${user.rut ? user.rut.replace(/[^0-9kK]/g, "") : "profesor"}@ubiobio.cl`}
                </span>
              </div>

              <div className="py-3.5 flex items-center justify-between gap-4">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  INSTITUCIÓN
                </span>
                <span className="text-sm font-medium text-slate-800 text-right">
                  Universidad del Bío-Bío
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
