import { Search, X, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DocumentosToolbarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  asignaturaFilter: string;
  onAsignaturaFilterChange: (val: string) => void;
  estadoFilter: string;
  onEstadoFilterChange: (val: string) => void;
  availableAsignaturas: string[];
  totalItems: number;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  pageSize: number;
  onPageSizeChange: (val: number) => void;
}

export function DocumentosToolbar({
  searchQuery,
  onSearchChange,
  asignaturaFilter,
  onAsignaturaFilterChange,
  estadoFilter,
  onEstadoFilterChange,
  availableAsignaturas,
  totalItems,
  hasActiveFilters,
  onClearFilters,
  pageSize,
  onPageSizeChange,
}: DocumentosToolbarProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por nombre o RUT de estudiante..."
            className="pl-9 pr-8 bg-slate-50 border-slate-200 text-sm focus-visible:bg-white"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              title="Limpiar búsqueda"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Filters and controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Asignatura filter */}
          <div className="flex items-center gap-1.5">
            <select
              value={asignaturaFilter}
              onChange={(e) => onAsignaturaFilterChange(e.target.value)}
              className="h-9 px-3 rounded-md border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 hover:bg-slate-100/80 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
            >
              <option value="ALL">Todas las asignaturas</option>
              {availableAsignaturas.map((asig) => (
                <option key={asig} value={asig}>
                  {asig}
                </option>
              ))}
            </select>
          </div>

          {/* Estado filter */}
          <div className="flex items-center gap-1.5">
            <select
              value={estadoFilter}
              onChange={(e) => onEstadoFilterChange(e.target.value)}
              className="h-9 px-3 rounded-md border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 hover:bg-slate-100/80 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
            >
              <option value="ALL">Todos los estados</option>
              <option value="COMPLETO">Completo (100%)</option>
              <option value="EN_PROGRESO">En proceso (50%)</option>
              <option value="PENDIENTE">Pendiente (0%)</option>
            </select>
          </div>

          {/* Page size */}
          <div className="flex items-center gap-1.5">
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-9 px-2.5 rounded-md border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 hover:bg-slate-100/80 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
              title="Registros por página"
            >
              <option value={5}>5 / pág.</option>
              <option value={10}>10 / pág.</option>
              <option value={20}>20 / pág.</option>
              <option value={50}>50 / pág.</option>
            </select>
          </div>

          {/* Clear filters button */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="xs"
              onClick={onClearFilters}
              className="gap-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
            >
              <X className="size-3.5" />
              <span>Limpiar filtros</span>
            </Button>
          )}
        </div>
      </div>

      {/* Counter summary */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-slate-100">
        <div className="flex items-center gap-1.5">
          <Filter className="size-3 text-slate-400" />
          <span>
            Mostrando <strong>{totalItems}</strong> estudiante{totalItems !== 1 ? "s" : ""}
            {hasActiveFilters && " (filtrados)"}
          </span>
        </div>
        <span className="text-[11px] text-slate-400">
          Requerimiento: 1 documento de estudiante + 1 documento de profesor por práctica
        </span>
      </div>
    </div>
  );
}
