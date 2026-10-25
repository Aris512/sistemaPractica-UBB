import { Search, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TableToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  observacionFilter: string;
  onObservacionFilterChange: (value: string) => void;
  evaluacionFilter: string;
  onEvaluacionFilterChange: (value: string) => void;
  onRefresh: () => void;
  loading: boolean;
}

export function TableToolbar({
  searchQuery,
  onSearchChange,
  observacionFilter,
  onObservacionFilterChange,
  evaluacionFilter,
  onEvaluacionFilterChange,
  onRefresh,
  loading,
}: TableToolbarProps) {
  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    observacionFilter !== "ALL" ||
    evaluacionFilter !== "ALL";

  const handleResetFilters = () => {
    onSearchChange("");
    onObservacionFilterChange("ALL");
    onEvaluacionFilterChange("ALL");
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Buscador */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Buscar estudiante por nombre, RUT o correo..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 text-sm h-10 bg-slate-50/50 border-slate-200 focus-visible:bg-white"
          />
        </div>

        {/* Filtros y Acciones */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Filtro de Observación */}
          <select
            value={observacionFilter}
            onChange={(e) => onObservacionFilterChange(e.target.value)}
            className="h-10 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-3 text-slate-700 cursor-pointer outline-none"
          >
            <option value="ALL">Observación: Todas</option>
            <option value="SIN_OBSERVACION">Sin Observación</option>
            <option value="OBSERVADO">Con Observaciones</option>
            <option value="VISITA_PENDIENTE">Visita Pendiente</option>
          </select>

          {/* Filtro de Evaluación */}
          <select
            value={evaluacionFilter}
            onChange={(e) => onEvaluacionFilterChange(e.target.value)}
            className="h-10 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-3 text-slate-700 cursor-pointer outline-none"
          >
            <option value="ALL">Evaluación: Todas</option>
            <option value="PENDIENTE">Pendientes</option>
            <option value="EN_EVALUACION">En Evaluación</option>
            <option value="EVALUADO">Evaluados</option>
          </select>

          {/* Resetear Filtros */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-10 text-xs text-slate-500 hover:text-slate-800"
            >
              Limpiar
            </Button>
          )}

          {/* Actualizar / Sincronizar */}
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="h-10 px-3.5 gap-2 text-xs font-medium cursor-pointer shrink-0 bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
            title="Sincronizar nómina de estudiantes"
          >
            <RotateCcw className={`size-4 text-slate-600 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Sincronizar</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
