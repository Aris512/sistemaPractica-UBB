
import { PencilIcon, Trash2Icon, BookOpen, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ColumnDef } from "../columns";
import type { Asignatura } from "./types";

interface ActionButtonsProps {
  asignatura: Asignatura;
  onAction?: (action: string, asignatura: Asignatura) => void;
}

function ActionButtons({ asignatura, onAction }: ActionButtonsProps) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="size-8 text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
        title="Editar asignatura"
        onClick={() => onAction?.("edit", asignatura)}
      >
        <PencilIcon className="size-4" />
        <span className="sr-only">Editar</span>
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="size-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
        title="Eliminar asignatura"
        onClick={() => onAction?.("delete", asignatura)}
      >
        <Trash2Icon className="size-4" />
        <span className="sr-only">Eliminar</span>
      </Button>
    </div>
  );
}

function SemestreBadge({ semestre }: { semestre?: string }) {
  if (!semestre || semestre.trim() === "") {
    return <span className="text-xs text-slate-400">Sin definir</span>;
  }

  const isNumeric = /^\d+$/.test(semestre.trim());
  const label = isNumeric ? `${semestre.trim()}° Semestre` : semestre;

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-xs">
      <Calendar className="size-3 text-indigo-500" />
      {label}
    </span>
  );
}

export const asignaturaColumns: ColumnDef<Asignatura>[] = [
  {
    id: "idAsignatura",
    header: "ID",
    headerClassName: "w-[80px]",
    sortable: true,
    cell: (item) => (
      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
        #{item.idAsignatura}
      </span>
    ),
  },
  {
    id: "nombre",
    header: "Asignatura",
    sortable: true,
    cell: (item) => (
      <div className="flex items-center gap-2.5">
        <div className="flex size-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700 shrink-0">
          <BookOpen className="size-3.5" />
        </div>
        <div className="flex flex-col">
          <span className="font-medium text-slate-900">{item.nombre}</span>
        </div>
      </div>
    ),
  },
  {
    id: "descripcion",
    header: "Descripción",
    sortable: true,
    cell: (item) => (
      <span className="text-sm text-slate-600 line-clamp-1 max-w-[340px]" title={item.descripcion || ""}>
        {item.descripcion && item.descripcion.trim() !== "" ? item.descripcion : "—"}
      </span>
    ),
  },
  {
    id: "semestre",
    header: "Semestre",
    headerClassName: "w-[160px]",
    sortable: true,
    cell: (item) => <SemestreBadge semestre={item.semestre} />,
  },
  {
    id: "actions",
    header: "Acciones",
    headerClassName: "text-right w-[100px]",
    className: "text-right",
    sortable: false,
    cell: (item, onAction) => (
      <ActionButtons asignatura={item} onAction={onAction} />
    ),
  },
];
