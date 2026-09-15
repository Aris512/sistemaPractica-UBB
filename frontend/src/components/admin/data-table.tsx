import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import type { ColumnDef } from "./columns";

export interface DataTablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  caption?: string;
  sortColumn?: string | null;
  sortDirection?: "asc" | "desc" | null;
  onSort?: (columnId: string) => void;
  onAction?: (action: string, item: T) => void;
  pagination?: DataTablePaginationProps;
}

export function DataTable<T>({
  columns,
  data,
  caption,
  sortColumn,
  sortDirection,
  onSort,
  onAction,
  pagination,
}: DataTableProps<T>) {
  return (
    <div className="rounded-md border border-slate-200 bg-white shadow-xs overflow-hidden flex flex-col justify-between min-h-[355px]">
      <div className="flex-1 overflow-x-auto">
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
                  className="h-44 text-center text-muted-foreground text-sm"
                >
                  No se encontraron registros que coincidan con los filtros.
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, rowIndex) => (
                <TableRow key={rowIndex} className="h-12">
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
        </Table>
      </div>

      {/* Fixed bottom pagination bar - always stays anchored in this position */}
      {pagination && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-slate-200 bg-slate-50/70 mt-auto shrink-0">
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <div>
              Mostrando{" "}
              <span className="font-semibold text-slate-800">
                {pagination.totalItems === 0
                  ? 0
                  : (pagination.currentPage - 1) * pagination.pageSize + 1}
              </span>{" "}
              a{" "}
              <span className="font-semibold text-slate-800">
                {Math.min(
                  pagination.currentPage * pagination.pageSize,
                  pagination.totalItems
                )}
              </span>{" "}
              de{" "}
              <span className="font-semibold text-slate-800">
                {pagination.totalItems}
              </span>{" "}
              registros
            </div>

            {pagination.onPageSizeChange && (
              <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
                <span>Por página:</span>
                <select
                  value={pagination.pageSize}
                  onChange={(e) => pagination.onPageSizeChange?.(Number(e.target.value))}
                  className="h-6 rounded border border-slate-300 bg-white px-1.5 text-xs font-medium text-slate-700 outline-none cursor-pointer"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            )}
          </div>

          <Pagination className="w-auto mx-0 justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (pagination.currentPage > 1) {
                      pagination.onPageChange(pagination.currentPage - 1);
                    }
                  }}
                  className={
                    pagination.currentPage <= 1
                      ? "pointer-events-none opacity-30 cursor-not-allowed"
                      : "cursor-pointer hover:bg-slate-200/70"
                  }
                  text="Anterior"
                />
              </PaginationItem>

              {Array.from({ length: Math.max(1, pagination.totalPages) }, (_, i) => i + 1).map((p) => (
                <PaginationItem key={p}>
                  <PaginationLink
                    href="#"
                    isActive={pagination.currentPage === p}
                    onClick={(e) => {
                      e.preventDefault();
                      pagination.onPageChange(p);
                    }}
                    className={
                      pagination.currentPage === p
                        ? "bg-slate-900 text-white font-medium hover:bg-slate-800 cursor-default"
                        : "cursor-pointer hover:bg-slate-200/70 text-slate-700"
                    }
                  >
                    {p}
                  </PaginationLink>
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (pagination.currentPage < pagination.totalPages) {
                      pagination.onPageChange(pagination.currentPage + 1);
                    }
                  }}
                  className={
                    pagination.currentPage >= pagination.totalPages
                      ? "pointer-events-none opacity-30 cursor-not-allowed"
                      : "cursor-pointer hover:bg-slate-200/70"
                  }
                  text="Siguiente"
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
