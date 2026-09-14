import React, { useState, useRef, useEffect } from "react";
import { MoreHorizontalIcon } from "lucide-react";
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

interface ActionMenuProps {
  invoice: Invoice;
  onAction?: (action: string, invoice: Invoice) => void;
}

function ActionMenu({ invoice, onAction }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const handleSelect = (action: string) => {
    setOpen(false);
    if (onAction) {
      onAction(action, invoice);
    }
  };

  return (
    <div className="relative inline-block text-right" ref={menuRef}>
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        onClick={() => setOpen((prev) => !prev)}
      >
        <MoreHorizontalIcon className="size-4" />
        <span className="sr-only">Open menu</span>
      </Button>

      {open && (
        <div className="absolute right-0 z-50 mt-1 w-36 origin-top-right rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md outline-none">
          <button
            type="button"
            className="flex w-full cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground text-left"
            onClick={() => handleSelect("edit")}
          >
            Edit
          </button>
          <button
            type="button"
            className="flex w-full cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground text-left"
            onClick={() => handleSelect("duplicate")}
          >
            Duplicate
          </button>
          <div className="-mx-1 my-1 h-px bg-border" />
          <button
            type="button"
            className="flex w-full cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm text-destructive outline-none hover:bg-destructive/10 text-left"
            onClick={() => handleSelect("delete")}
          >
            Delete
          </button>
        </div>
      )}
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
    headerClassName: "text-right",
    className: "text-right",
    sortable: false,
    cell: (item, onAction) => (
      <ActionMenu invoice={item} onAction={onAction} />
    ),
  },
];
