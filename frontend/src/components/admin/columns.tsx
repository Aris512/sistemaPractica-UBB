import type React from "react";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Invoice } from "./data-table-features";

export interface ColumnDef<T> {
  id: string;
  header: string;
  cell: (item: T, onAction?: (action: string, item: T) => void) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  sortable?: boolean;
}

interface ActionButtonsProps {
  invoice: Invoice;
  onAction?: (action: string, invoice: Invoice) => void;
}

function ActionButtons({ invoice, onAction }: ActionButtonsProps) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="size-8 text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
        title="Editar factura"
        onClick={() => onAction?.("edit", invoice)}
      >
        <PencilIcon className="size-4" />
        <span className="sr-only">Editar</span>
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="size-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
        title="Eliminar factura"
        onClick={() => onAction?.("delete", invoice)}
      >
        <Trash2Icon className="size-4" />
        <span className="sr-only">Eliminar</span>
      </Button>
    </div>
  );
}

export const invoiceColumns: ColumnDef<Invoice>[] = [
  {
    id: "invoice",
    header: "Invoice",
    headerClassName: "w-[100px]",
    sortable: true,
    cell: (item) => <span className="font-medium">{item.invoice}</span>,
  },
  {
    id: "paymentStatus",
    header: "Status",
    sortable: true,
    cell: (item) => {
      const isPaid = item.paymentStatus === "Paid";
      const isPending = item.paymentStatus === "Pending";
      const isUnpaid = item.paymentStatus === "Unpaid";

      let badgeClasses = "bg-slate-100 text-slate-700 border-slate-200";
      let dotClasses = "bg-slate-400";

      if (isPaid) {
        badgeClasses = "bg-emerald-50 text-emerald-800 border-emerald-200 font-medium";
        dotClasses = "bg-emerald-500";
      } else if (isPending) {
        badgeClasses = "bg-amber-50 text-amber-800 border-amber-200 font-medium";
        dotClasses = "bg-amber-500 animate-pulse";
      } else if (isUnpaid) {
        badgeClasses = "bg-rose-50 text-rose-800 border-rose-200 font-medium";
        dotClasses = "bg-rose-500";
      }

      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs border ${badgeClasses}`}
        >
          <span className={`size-1.5 rounded-full ${dotClasses}`} />
          {item.paymentStatus}
        </span>
      );
    },
  },
  {
    id: "paymentMethod",
    header: "Method",
    sortable: true,
    cell: (item) => <span>{item.paymentMethod}</span>,
  },
  {
    id: "totalAmount",
    header: "Amount",
    headerClassName: "text-right",
    className: "text-right",
    sortable: true,
    cell: (item) => <span className="font-medium">{item.totalAmount}</span>,
  },
  {
    id: "actions",
    header: "Actions",
    headerClassName: "text-right w-[100px]",
    className: "text-right",
    sortable: false,
    cell: (item, onAction) => (
      <ActionButtons invoice={item} onAction={onAction} />
    ),
  },
];
