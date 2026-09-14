import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ColumnDef } from "./columns";

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  caption?: string;
  totalFooter?: {
    label: string;
    amount: string;
  };
  sortColumn?: string | null;
  sortDirection?: "asc" | "desc" | null;
  onSort?: (columnId: string) => void;
  onAction?: (action: string, item: T) => void;
}

export function DataTable<T>({
  columns,
  data,
  caption,
  totalFooter,
  sortColumn,
  sortDirection,
  onSort,
  onAction,
}: DataTableProps<T>) {
  return (
    <div className="rounded-md border border-slate-200 bg-white shadow-xs">
      <Table>
        {caption && <TableCaption>{caption}</TableCaption>}
        <TableHeader>
          <TableRow>
            {columns.map((column) => {
              const isSorted = sortColumn === column.id;
              return (
                <TableHead
                  key={column.id}
                  className={column.headerClassName || column.className || ""}
                >
                  {column.sortable && onSort ? (
                    <button
                      type="button"
                      onClick={() => onSort(column.id)}
                      className="inline-flex items-center gap-1 hover:text-foreground cursor-pointer font-medium"
                    >
                      {column.header}
                      <span className="text-xs text-muted-foreground">
                        {isSorted
                          ? sortDirection === "asc"
                            ? "↑"
                            : sortDirection === "desc"
                            ? "↓"
                            : "↕"
                          : "↕"}
                      </span>
                    </button>
                  ) : (
                    column.header
                  )}
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>

        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-muted-foreground"
              >
                No results found.
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    className={column.className || ""}
                  >
                    {column.cell(row, onAction)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>

        {totalFooter && (
          <TableFooter>
            <TableRow>
              <TableCell colSpan={Math.max(1, columns.length - 2)}>
                {totalFooter.label}
              </TableCell>
              <TableCell className="text-right font-semibold">
                {totalFooter.amount}
              </TableCell>
              {columns.length > 2 && <TableCell />}
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </div>
  );
}
