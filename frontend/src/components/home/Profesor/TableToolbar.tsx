import { Search, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TableToolbarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  entregaFilter: string;
  onEntregaFilterChange: (val: string) => void;
  revisionFilter: string;
  onRevisionFilterChange: (val: string) => void;
  onClearFilters: () => void;
  onSync: () => void;
  loading: boolean;
}

export function TableToolbar({
  searchQuery,
  onSearchChange,
  entregaFilter,
  onEntregaFilterChange,
  revisionFilter,
  onRevisionFilterChange,
  onClearFilters,
  onSync,
  loading,
}: TableToolbarProps) {
  const hasActiveFilters = Boolean(
    searchQuery || entregaFilter !== "ALL" || revisionFilter !== "ALL"
  );

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
      <div className="flex flex-col sm:flex-row items-center gap-3">
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

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={entregaFilter}
            onChange={(e) => onEntregaFilterChange(e.target.value)}
            className="h-10 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-3 text-slate-700 cursor-pointer"
          >
            <option value="ALL">Entrega: Todos</option>
            <option value="ENTREGADO">Entregados</option>
            <option value="PENDIENTE">Pendientes</option>
            <option value="NO_ENTREGADO">No entregados</option>
          </select>

          <select
            value={revisionFilter}
            onChange={(e) => onRevisionFilterChange(e.target.value)}
            className="h-10 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-3 text-slate-700 cursor-pointer"
          >
            <option value="ALL">Revisión: Todos</option>
            <option value="REVISADO">Revisados</option>
            <option value="PENDIENTE_REVISION">Por revisar</option>
            <option value="OBSERVADO">Con observaciones</option>
            <option value="SIN_ENTREGA">Sin entrega</option>
          </select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="h-10 text-xs text-slate-500 hover:text-slate-800"
            >
              Limpiar
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={onSync}
            disabled={loading}
            className="h-10 px-3.5 gap-2 text-xs font-medium cursor-pointer shrink-0 bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
            title="Sincronizar con la base de datos"
          >
            <RefreshCw className={`size-4 text-slate-600 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Sincronizar</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
