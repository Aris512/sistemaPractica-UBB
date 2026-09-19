import { Eye, Download, BookOpen, Calendar, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ColumnDef } from "../columns";
import type { EstudianteDocumentoRow } from "./types";

interface ActionButtonsProps {
  estudiante: EstudianteDocumentoRow;
  onAction?: (action: string, estudiante: EstudianteDocumentoRow) => void;
}

function ActionButtons({ estudiante, onAction }: ActionButtonsProps) {
  return (
    <div className="flex items-center justify-end gap-1.5">
      <Button
        variant="outline"
        size="xs"
        className="gap-1 text-slate-700 hover:text-slate-900 hover:bg-slate-100 cursor-pointer text-xs"
        title="Ver detalle de documentos y correos"
        onClick={() => onAction?.("view-detail", estudiante)}
      >
        <Eye className="size-3.5 text-slate-500" />
        <span>Detalles</span>
      </Button>

      <Button
        variant="outline"
        size="xs"
        className="gap-1 text-indigo-700 hover:text-indigo-900 hover:bg-indigo-50 border-indigo-200/80 cursor-pointer text-xs"
        title="Descargar todos los documentos en un archivo .ZIP"
        onClick={() => onAction?.("download-zip", estudiante)}
      >
        <Download className="size-3.5 text-indigo-600" />
        <span>ZIP</span>
      </Button>
    </div>
  );
}

function SemestreBadge({ semestre }: { semestre?: string }) {
  if (!semestre || semestre.trim() === "" || semestre === "—") {
    return <span className="text-xs text-slate-400">Sin definir</span>;
  }

  const isNumeric = /^\d+$/.test(semestre.trim());
  const label = isNumeric ? `${semestre.trim()}° Semestre` : semestre;

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
      <Calendar className="size-2.5 text-slate-500" />
      {label}
    </span>
  );
}

function EstadoBadge({ estado }: { estado: EstudianteDocumentoRow["estado"] }) {
  switch (estado) {
    case "COMPLETO":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="size-3 text-emerald-600" />
          Completo
        </span>
      );
    case "EN_PROGRESO":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
          <Clock className="size-3 text-blue-600" />
          En proceso
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
          <AlertCircle className="size-3 text-amber-600" />
          Pendiente
        </span>
      );
  }
}

function ProgressBar({ progreso, total, requeridos }: { progreso: number; total: number; requeridos: number }) {
  const percentage = Math.min(100, Math.max(0, Math.round(progreso)));

  const barColor =
    percentage === 100
      ? "bg-emerald-500"
      : percentage > 0
      ? "bg-blue-500"
      : "bg-slate-300";

  return (
    <div className="w-full max-w-[200px] flex flex-col gap-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-slate-700">
          {total} de {requeridos} doc.
        </span>
        <span className="font-semibold text-slate-900 tabular-nums">
          {percentage}%
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200/80">
        <div
          className={`h-full transition-all duration-300 ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export const estudianteDocumentoColumns: ColumnDef<EstudianteDocumentoRow>[] = [
  {
    id: "rut",
    header: "Estudiante",
    sortable: true,
    cell: (item) => (
      <div className="flex items-center gap-3">
        <div className="flex size-8 items-center justify-center rounded-full bg-slate-900 text-white font-semibold text-xs shrink-0 shadow-xs">
          {item.nombre ? item.nombre.charAt(0).toUpperCase() : "E"}
        </div>
        <div className="flex flex-col">
          <span className="font-medium text-slate-900 leading-snug">{item.nombre}</span>
          <span className="font-mono text-xs text-muted-foreground">{item.rut}</span>
        </div>
      </div>
    ),
  },
  {
    id: "asignatura",
    header: "Asignatura Actual",
    sortable: true,
    cell: (item) => (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5 text-slate-900 font-medium text-sm">
          <BookOpen className="size-3.5 text-slate-500 shrink-0" />
          <span>{item.asignatura}</span>
        </div>
        <div>
          <SemestreBadge semestre={item.semestre} />
        </div>
      </div>
    ),
  },
  {
    id: "progreso",
    header: "Progreso Documentación",
    sortable: true,
    cell: (item) => (
      <ProgressBar
        progreso={item.progreso}
        total={item.totalDocumentos}
        requeridos={item.documentosRequeridos}
      />
    ),
  },
  {
    id: "estado",
    header: "Estado",
    headerClassName: "w-[130px]",
    sortable: true,
    cell: (item) => <EstadoBadge estado={item.estado} />,
  },
  {
    id: "actions",
    header: "Acciones",
    headerClassName: "text-right w-[160px]",
    className: "text-right",
    sortable: false,
    cell: (item, onAction) => (
      <ActionButtons estudiante={item} onAction={onAction} />
    ),
  },
];
