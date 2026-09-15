import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  X,
  RotateCcw,
  Filter,
  BookOpen,
  Users,
  SlidersHorizontal,
} from "lucide-react";
import { USER_ROLES, rolLabel } from "./data-table-features";

interface AdminToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  roleFilter: string;
  onRoleFilterChange: (role: string) => void;
  asignaturaFilter?: string;
  onAsignaturaFilterChange?: (asignatura: string) => void;
  availableAsignaturas?: string[];
  totalItems: number;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
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
  asignaturaFilter = "ALL",
  onAsignaturaFilterChange,
  availableAsignaturas = [],
  totalItems,
  hasActiveFilters,
  onClearFilters,
  pageSize = 10,
  onPageSizeChange,
}: AdminToolbarProps) {
  return (
    <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm space-y-3.5 transition-all">
      {/* Fila superior: Barra de búsqueda principal + Filtros Select + Selector de registros */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 justify-between">
        {/* Input de Búsqueda inteligente */}
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Buscar por RUT, nombre, correo, rol o asignatura..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 pr-9 bg-slate-50/60 border-slate-200 focus:bg-white transition-all text-sm h-9.5 rounded-lg"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5 rounded-full hover:bg-slate-200/60 transition-colors"
              title="Limpiar búsqueda"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Filtros desplegables profesionales */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Filtro por Asignatura */}
          {onAsignaturaFilterChange && (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
              <BookOpen className="size-3.5 text-blue-600 shrink-0" />
              <span className="text-xs font-medium text-slate-600 hidden sm:inline">
                Asignatura:
              </span>
              <select
                value={asignaturaFilter}
                onChange={(e) => onAsignaturaFilterChange(e.target.value)}
                className="bg-transparent text-xs font-medium text-slate-800 outline-none cursor-pointer pr-1"
              >
                <option value="ALL">Todas las asignaturas</option>
                <option value="NONE">Sin asignatura (—)</option>
                {availableAsignaturas.map((asig) => (
                  <option key={asig} value={asig}>
                    {asig}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Selector de registros por página */}
          {onPageSizeChange && (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
              <SlidersHorizontal className="size-3.5 text-slate-500 shrink-0" />
              <span className="text-xs font-medium text-slate-600 hidden sm:inline">
                Mostrar:
              </span>
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="bg-transparent text-xs font-medium text-slate-800 outline-none cursor-pointer pr-1"
              >
                <option value={5}>5 filas</option>
                <option value={10}>10 filas</option>
                <option value={20}>20 filas</option>
                <option value={50}>50 filas</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Fila intermedia: Selector de Roles estilo Pills modernos */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-100">
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex items-center gap-1 text-xs text-slate-500 font-semibold mr-1">
            <Filter className="size-3 text-slate-400" />
            <span>Rol:</span>
          </div>
          {USER_ROLES.map((role) => {
            const isActive = roleFilter === role;
            return (
              <button
                key={role}
                type="button"
                onClick={() => onRoleFilterChange(role)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                  isActive
                    ? "bg-slate-900 text-white border-slate-900 shadow-xs ring-1 ring-slate-900"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900"
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

        {/* Resumen de resultados & Limpiar filtros */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
            <Users className="size-3.5 text-slate-400" />
            <span>
              <strong className="text-slate-900 font-semibold">{totalItems}</strong>{" "}
              {totalItems === 1 ? "usuario encontrado" : "usuarios encontrados"}
            </span>
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="xs"
              onClick={onClearFilters}
              className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-7 px-2 font-medium"
            >
              <RotateCcw className="size-3 mr-1" />
              Limpiar filtros
            </Button>
          )}
        </div>
      </div>

      {/* Fila inferior condicional: Chips con los filtros activos para remover individualmente */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100/80">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
            Filtros activos:
          </span>

          {searchQuery && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 text-xs">
              Texto: &quot;{searchQuery}&quot;
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="hover:text-blue-950 cursor-pointer"
              >
                <X className="size-3" />
              </button>
            </span>
          )}

          {roleFilter !== "ALL" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-300 text-xs">
              Rol: {rolLabel(roleFilter)}
              <button
                type="button"
                onClick={() => onRoleFilterChange("ALL")}
                className="hover:text-slate-950 cursor-pointer"
              >
                <X className="size-3" />
              </button>
            </span>
          )}

          {asignaturaFilter !== "ALL" && onAsignaturaFilterChange && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs">
              Asignatura: {asignaturaFilter === "NONE" ? "Sin asignatura" : asignaturaFilter}
              <button
                type="button"
                onClick={() => onAsignaturaFilterChange("ALL")}
                className="hover:text-emerald-950 cursor-pointer"
              >
                <X className="size-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

