import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, RotateCcw } from "lucide-react";
import { USER_ROLES, rolLabel } from "./data-table-features";

interface AdminToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  roleFilter: string;
  onRoleFilterChange: (role: string) => void;
  totalItems: number;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

const rolDotColor: Record<string, string> = {
  ESTUDIANTE: "bg-blue-500",
  PROFESOR_ASIGNATURA: "bg-emerald-500",
  PROFESOR_COLABORADOR: "bg-violet-500",
  TUTOR_PRACTICA: "bg-amber-500",
  COORDINADOR: "bg-rose-500",
};

export function AdminToolbar({
  searchQuery,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  totalItems,
  hasActiveFilters,
  onClearFilters,
}: AdminToolbarProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 justify-between">
        {/* Search Input with Real-time Clear */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Buscar por RUT, nombre, rol..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8.5 pr-8 bg-slate-50/50 border-slate-200"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              title="Limpiar búsqueda"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Role Filter Pills & Quick Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-slate-500 font-medium mr-1">Rol:</span>
          {USER_ROLES.map((role) => {
            const isActive = roleFilter === role;
            return (
              <button
                key={role}
                type="button"
                onClick={() => onRoleFilterChange(role)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer border ${
                  isActive
                    ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100/70"
                }`}
              >
                {role !== "ALL" && (
                  <span
                    className={`size-1.5 rounded-full ${
                      rolDotColor[role] || "bg-slate-400"
                    }`}
                  />
                )}
                {role === "ALL" ? "Todos" : rolLabel(role)}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">
            <strong className="text-slate-800">{totalItems}</strong> usuario
            {totalItems === 1 ? "" : "s"}
          </span>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="xs"
              onClick={onClearFilters}
              className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-7 px-2"
            >
              <RotateCcw className="size-3 mr-1" />
              Limpiar filtros
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
