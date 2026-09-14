import type React from "react";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { UsuarioRow } from "./data-table-features";
import { rolLabel } from "./data-table-features";

export interface ColumnDef<T> {
  id: string;
  header: string;
  cell: (item: T, onAction?: (action: string, item: T) => void) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  sortable?: boolean;
}

interface ActionButtonsProps {
  usuario: UsuarioRow;
  onAction?: (action: string, usuario: UsuarioRow) => void;
}

function ActionButtons({ usuario, onAction }: ActionButtonsProps) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="size-8 text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
        title="Editar usuario"
        onClick={() => onAction?.("edit", usuario)}
      >
        <PencilIcon className="size-4" />
        <span className="sr-only">Editar</span>
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="size-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
        title="Eliminar usuario"
        onClick={() => onAction?.("delete", usuario)}
      >
        <Trash2Icon className="size-4" />
        <span className="sr-only">Eliminar</span>
      </Button>
    </div>
  );
}

// Badge de rol con colores diferenciados por tipo
function RolBadge({ rol }: { rol: string }) {
  let badgeClasses = "bg-slate-100 text-slate-700 border-slate-200";
  let dotClasses = "bg-slate-400";

  switch (rol) {
    case "ESTUDIANTE":
      badgeClasses = "bg-blue-50 text-blue-800 border-blue-200 font-medium";
      dotClasses = "bg-blue-500";
      break;
    case "PROFESOR_ASIGNATURA":
      badgeClasses = "bg-emerald-50 text-emerald-800 border-emerald-200 font-medium";
      dotClasses = "bg-emerald-500";
      break;
    case "PROFESOR_COLABORADOR":
      badgeClasses = "bg-violet-50 text-violet-800 border-violet-200 font-medium";
      dotClasses = "bg-violet-500";
      break;
    case "TUTOR_PRACTICA":
      badgeClasses = "bg-amber-50 text-amber-800 border-amber-200 font-medium";
      dotClasses = "bg-amber-500";
      break;
    case "COORDINADOR":
      badgeClasses = "bg-rose-50 text-rose-800 border-rose-200 font-medium";
      dotClasses = "bg-rose-500";
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs border ${badgeClasses}`}
    >
      <span className={`size-1.5 rounded-full ${dotClasses}`} />
      {rolLabel(rol)}
    </span>
  );
}

export const userColumns: ColumnDef<UsuarioRow>[] = [
  {
    id: "rut",
    header: "RUT",
    headerClassName: "w-[140px]",
    sortable: true,
    cell: (item) => <span className="font-medium font-mono text-sm">{item.rut}</span>,
  },
  {
    id: "nombre",
    header: "Nombre",
    sortable: true,
    cell: (item) => <span>{item.nombre}</span>,
  },
  {
    id: "rol",
    header: "Rol",
    sortable: true,
    cell: (item) => <RolBadge rol={item.rol} />,
  },
  {
    id: "curso",
    header: "Curso",
    sortable: true,
    cell: (item) => (
      <span className="text-slate-500 text-sm">{item.curso}</span>
    ),
  },
  {
    id: "actions",
    header: "Acciones",
    headerClassName: "text-right w-[100px]",
    className: "text-right",
    sortable: false,
    cell: (item, onAction) => (
      <ActionButtons usuario={item} onAction={onAction} />
    ),
  },
];

// Re-exportar alias antiguo para que imports existentes no rompan
export const invoiceColumns = userColumns as unknown as ColumnDef<any>[];
