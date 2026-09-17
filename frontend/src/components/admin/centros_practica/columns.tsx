import { PencilIcon, Trash2Icon, Building2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ColumnDef } from "../columns";
import type { CentroPractica } from "./types";

interface ActionButtonsProps {
  centro: CentroPractica;
  onAction?: (action: string, centro: CentroPractica) => void;
}

function ActionButtons({ centro, onAction }: ActionButtonsProps) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="size-8 text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
        title="Editar centro de práctica"
        onClick={() => onAction?.("edit", centro)}
      >
        <PencilIcon className="size-4" />
        <span className="sr-only">Editar</span>
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="size-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
        title="Eliminar centro de práctica"
        onClick={() => onAction?.("delete", centro)}
      >
        <Trash2Icon className="size-4" />
        <span className="sr-only">Eliminar</span>
      </Button>
    </div>
  );
}

export const centroPracticaColumns: ColumnDef<CentroPractica>[] = [
  {
    id: "idCentro",
    header: "ID",
    headerClassName: "w-[80px]",
    sortable: true,
    cell: (item) => (
      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
        #{item.idCentro}
      </span>
    ),
  },
  {
    id: "nombre",
    header: "Centro de Práctica",
    sortable: true,
    cell: (item) => (
      <div className="flex items-center gap-2.5">
        <div className="flex size-7 items-center justify-center rounded-lg bg-blue-50 text-blue-700 shrink-0">
          <Building2 className="size-3.5" />
        </div>
        <div className="flex flex-col">
          <span className="font-medium text-slate-900">{item.nombre}</span>
        </div>
      </div>
    ),
  },
  {
    id: "direccion",
    header: "Dirección",
    sortable: true,
    cell: (item) => (
      <div className="flex items-center gap-2 text-sm text-slate-600" title={item.direccion || ""}>
        <MapPin className="size-3.5 text-slate-400 shrink-0" />
        <span className="line-clamp-1 max-w-[420px]">
          {item.direccion && item.direccion.trim() !== "" ? item.direccion : "—"}
        </span>
      </div>
    ),
  },
  {
    id: "actions",
    header: "Acciones",
    headerClassName: "text-right w-[100px]",
    className: "text-right",
    sortable: false,
    cell: (item, onAction) => (
      <ActionButtons centro={item} onAction={onAction} />
    ),
  },
];
