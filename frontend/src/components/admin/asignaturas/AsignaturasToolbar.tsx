import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  X,
  RotateCcw,
  Calendar,
  SlidersHorizontal,
} from "lucide-react";

interface AsignaturasToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  semestreFilter: string;
  onSemestreFilterChange: (semestre: string) => void;
  availableSemestres: string[];
  totalItems: number;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
}

export function AsignaturasToolbar({
  searchQuery,
  onSearchChange,
  semestreFilter,
  onSemestreFilterChange,
  availableSemestres,
  totalItems,
  hasActiveFilters,
  onClearFilters,
  pageSize = 10,
  onPageSizeChange,
}: AsignaturasToolbarProps) {
  return (
    <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-3.5 transition-all">
      {/* Fila superior: Barra de búsqueda + Filtro Semestre + Selector de registros */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-between">
        {/* Input de Búsqueda */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Buscar por asignatura o descripción..."
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

        {/* Filtros a la derecha */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Filtro por Semestre */}
          <div className="relative flex items-center">
            <Calendar className="absolute left-2.5 size-3.5 text-slate-400 pointer-events-none" />
            <select
              value={semestreFilter}
              onChange={(e) => onSemestreFilterChange(e.target.value)}
              className="h-9 pl-8 pr-7 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-700 shadow-xs hover:bg-slate-50 transition-colors focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
              aria-label="Filtrar por semestre"
            >
              <option value="ALL">Todos los semestres</option>
              {availableSemestres.map((sem) => {
                const isNumeric = /^\d+$/.test(sem);
                const label = isNumeric ? `${sem}° Semestre` : sem;
                return (
                  <option key={sem} value={sem}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Selector de registros por página */}
          {onPageSizeChange && (
            <div className="flex items-center gap-1.5 pl-1 border-l border-slate-200">
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
      </div>

      {/* Fila inferior: Contador de resultados y badge de filtros activos */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">
            Total asignaturas: <strong className="text-slate-800 font-semibold">{totalItems}</strong>
          </span>

          {hasActiveFilters && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-medium text-[11px] border border-amber-200">
              <SlidersHorizontal className="size-3 text-amber-600" />
              Filtros activos
            </span>
          )}
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
