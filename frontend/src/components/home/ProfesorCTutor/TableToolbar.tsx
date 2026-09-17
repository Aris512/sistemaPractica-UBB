import { Search, RotateCcw, Filter } from "lucide-react";
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
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 bg-white rounded-xl border border-slate-200/90 shadow-2xs">
      {/* Buscador */}
      <div className="relative flex-1 min-w-[240px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
        <Input
          placeholder="Buscar estudiante por nombre, RUT o correo..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-9.5 text-xs bg-slate-50/50 border-slate-200 focus:bg-white"
        />
      </div>

      {/* Filtros y Acciones */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Filtro de Observación */}
        <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
          <Filter className="size-3 text-slate-400" />
          <span className="text-[11px] font-medium text-slate-500">Obs:</span>
          <select
            value={observacionFilter}
            onChange={(e) => onObservacionFilterChange(e.target.value)}
            className="text-xs bg-transparent font-medium text-slate-700 outline-none cursor-pointer"
          >
            <option value="ALL">Todas</option>
            <option value="SIN_OBSERVACION">Sin Observación</option>
            <option value="OBSERVADO">Con Observaciones</option>
            <option value="VISITA_PENDIENTE">Visita Pendiente</option>
          </select>
        </div>

        {/* Filtro de Evaluación */}
        <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
          <Filter className="size-3 text-slate-400" />
          <span className="text-[11px] font-medium text-slate-500">Eval:</span>
          <select
            value={evaluacionFilter}
            onChange={(e) => onEvaluacionFilterChange(e.target.value)}
            className="text-xs bg-transparent font-medium text-slate-700 outline-none cursor-pointer"
          >
            <option value="ALL">Todas</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="EN_EVALUACION">En Evaluación</option>
            <option value="EVALUADO">Evaluado</option>
          </select>
        </div>

        {/* Resetear Filtros */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetFilters}
            className="h-9 px-2.5 text-xs text-slate-500 hover:text-slate-800"
          >
            Limpiar
          </Button>
        )}

        {/* Actualizar */}
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
          className="h-9 gap-1.5 text-xs font-medium border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
        >
          <RotateCcw className={`size-3.5 ${loading ? "animate-spin text-sky-600" : ""}`} />
          Actualizar
        </Button>
      </div>
    </div>
  );
}
