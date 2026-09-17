import {
  Briefcase,
  ClipboardCheck,
  MessageSquareText,
  Users,
  Bot,
  Layers,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { SemestreSelector } from "./SemestreSelector";
import type { PermisoItem } from "./types";

interface PermisoCardGroupProps {
  categoria: string;
  permisos: PermisoItem[];
  isEstudiante: boolean;
  onTogglePermiso: (idPermiso: number, activo: boolean) => void;
  onUpdateSemestres: (idPermiso: number, semestres: string) => void;
}

export function PermisoCardGroup({
  categoria,
  permisos,
  isEstudiante,
  onTogglePermiso,
  onUpdateSemestres,
}: PermisoCardGroupProps) {
  const getCategoryMeta = (cat: string) => {
    switch (cat.toUpperCase()) {
      case "PORTAFOLIO":
        return {
          icon: <Briefcase className="size-5 text-sky-600" />,
          title: "Portafolio",
          desc: "Control de consulta y carga de documentos o evidencias de prácticas",
          accentColor: "border-sky-200 bg-sky-50/50",
        };
      case "EVALUACIONES":
        return {
          icon: <ClipboardCheck className="size-5 text-indigo-600" />,
          title: "Evaluaciones",
          desc: "Control de aplicación y visualización de rúbricas e instrumentos de evaluación",
          accentColor: "border-indigo-200 bg-indigo-50/50",
        };
      case "OBSERVACIONES":
        return {
          icon: <MessageSquareText className="size-5 text-emerald-600" />,
          title: "Observaciones",
          desc: "Registro y consulta de bitácoras y observaciones pedagógicas",
          accentColor: "border-emerald-200 bg-emerald-50/50",
        };
      case "ESTUDIANTES":
        return {
          icon: <Users className="size-5 text-amber-600" />,
          title: "Información de Estudiantes",
          desc: "Acceso a la visualización y consulta de datos de otros estudiantes",
          accentColor: "border-amber-200 bg-amber-50/50",
        };
      case "INTELIGENCIA ARTIFICIAL":
      case "IA":
        return {
          icon: <Bot className="size-5 text-purple-600" />,
          title: "Inteligencia Artificial",
          desc: "Acceso a asistentes pedagógicos inteligentes y retroalimentación con IA",
          accentColor: "border-purple-200 bg-purple-50/50",
        };
      default:
        return {
          icon: <Layers className="size-5 text-slate-600" />,
          title: cat,
          desc: `Permisos y funcionalidades para el módulo de ${cat}`,
          accentColor: "border-slate-200 bg-slate-50/50",
        };
    }
  };

  const meta = getCategoryMeta(categoria);

  return (
    <Card className="border border-slate-200/90 shadow-2xs bg-white rounded-xl overflow-hidden">
      <CardHeader className="border-b border-slate-100 bg-slate-50/60 pb-3.5">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg border ${meta.accentColor} shadow-2xs`}>
            {meta.icon}
          </div>
          <div>
            <CardTitle className="text-base font-semibold text-slate-900">
              {meta.title}
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              {meta.desc}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="divide-y divide-slate-100 p-0">
        {permisos.map((permiso) => {
          return (
            <div
              key={permiso.idPermiso}
              className={`p-4 transition-colors ${
                permiso.activo ? "bg-white" : "bg-slate-50/40"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-900">
                      {permiso.nombre}
                    </span>
                    <span
                      className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                        permiso.activo
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-500 border-slate-200"
                      }`}
                    >
                      {permiso.activo ? "Permitido" : "Desactivado"}
                    </span>
                  </div>

                  {permiso.descripcion && (
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {permiso.descripcion}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0 pt-0.5">
                  <Switch
                    checked={permiso.activo}
                    onCheckedChange={(checked) =>
                      onTogglePermiso(permiso.idPermiso, checked)
                    }
                    aria-label={`Permitir ${permiso.nombre}`}
                  />
                </div>
              </div>

              {/* Si el rol es ESTUDIANTE y el permiso está activo, mostrar selector de semestres */}
              {isEstudiante && permiso.activo && (
                <SemestreSelector
                  value={permiso.semestresPermitidos || "ALL"}
                  onChange={(newSemestres) =>
                    onUpdateSemestres(permiso.idPermiso, newSemestres)
                  }
                />
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
