import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, RotateCcw } from "lucide-react";

interface CentrosPracticaToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  totalItems: number;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
}

export function CentrosPracticaToolbar({
  searchQuery,
  onSearchChange,
  totalItems,
  hasActiveFilters,
  onClearFilters,
  pageSize = 10,
  onPageSizeChange,
}: CentrosPracticaToolbarProps) {
  return (
    <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-3.5 transition-all">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Buscar por nombre o dirección..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 pr-8 h-9 text-sm bg-slate-50/60 border-slate-200 focus:bg-white transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              title="Limpiar búsqueda"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 hidden sm:inline">Mostrar:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-9 px-2.5 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-700 shadow-xs hover:bg-slate-50 transition-colors focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
              aria-label="Registros por página"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">
            Total centros de práctica: <strong className="text-slate-800 font-semibold">{totalItems}</strong>
          </span>
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="xs"
            onClick={onClearFilters}
            className="text-xs text-slate-500 hover:text-slate-900 hover:bg-slate-100 gap-1 h-7 cursor-pointer"
          >
            <RotateCcw className="size-3" />
            Limpiar filtros
          </Button>
        )}
      </div>
    </div>
  );
}
