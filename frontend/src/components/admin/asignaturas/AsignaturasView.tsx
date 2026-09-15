import { useState } from "react";
import { DataTable } from "../data-table";
import { asignaturaColumns } from "./columns";
import { useAsignaturasFeatures } from "./useAsignaturasFeatures";
import { AsignaturasToolbar } from "./AsignaturasToolbar";
import { CreateModal } from "./CreateModal";
import { EditModal } from "./EditModal";
import type { Asignatura } from "./types";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2, AlertCircle, BookPlus } from "lucide-react";
import { sileo } from "sileo";

export function AsignaturasView() {
  const {
    paginatedData,
    loading,
    error,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    totalItems,
    searchQuery,
    setSearchQuery,
    semestreFilter,
    setSemestreFilter,
    availableSemestres,
    hasActiveFilters,
    clearFilters,
    sortState,
    handleSort,
    refetch,
    deleteAsignatura,
  } = useAsignaturasFeatures();

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingAsignatura, setEditingAsignatura] = useState<Asignatura | null>(null);

  const handleRowAction = async (action: string, item: Asignatura) => {
    switch (action) {
      case "edit":
        setEditingAsignatura(item);
        setIsEditOpen(true);
        break;
      case "delete": {
        const res = await deleteAsignatura(item.idAsignatura);
        if (res.success) {
          sileo.error({
            title: "Asignatura eliminada",
            description: `Se eliminó "${item.nombre}" de la base de datos`,
          });
        } else {
          sileo.error({
            title: "No se pudo eliminar",
            description: res.error || "Ocurrió un error al intentar eliminar la asignatura",
          });
        }
        break;
      }
      default:
        break;
    }
  };

  const handleCreateSuccess = (newAsignatura: Asignatura) => {
    refetch();
    sileo.success({
      title: "Asignatura registrada",
      description: `Se creó exitosamente "${newAsignatura.nombre}"`,
    });
  };

  const handleEditSuccess = (_id: number, updated: Asignatura) => {
    refetch();
    sileo.success({
      title: "Asignatura actualizada",
      description: `Los cambios para "${updated.nombre}" fueron guardados`,
    });
  };

  const handleColumnSort = (colId: keyof Asignatura) => {
    handleSort(colId);
    const nextDirection =
      sortState.column !== colId
        ? "asc"
        : sortState.direction === "asc"
        ? "desc"
        : "sin orden";

    const dirLabel =
      nextDirection === "asc"
        ? "Ascendente (A-Z)"
        : nextDirection === "desc"
        ? "Descendente (Z-A)"
        : "Orden original";

    sileo.show({
      title: `Ordenado por ${colId}`,
      description: dirLabel,
    });
  };

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6 w-full">
      {/* Header con título y botones de acción */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Asignaturas del Sistema
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Asignaturas académicas registradas en la base de datos disponibles para prácticas.
          </p>
        </div>
        <div className="flex items-center gap-2 sm:self-auto self-start">
          <Button
            variant="outline"
            onClick={() => {
              refetch();
              sileo.show({
                title: "Recargando asignaturas",
                description: "Consultando la base de datos...",
              });
            }}
            className="gap-1.5 cursor-pointer"
          >
            <RefreshCw className="size-4" />
            Recargar
          </Button>
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="gap-1.5 bg-slate-900 hover:bg-slate-800 text-white shadow-xs cursor-pointer"
          >
            <BookPlus className="size-4" />
            Nueva Asignatura
          </Button>
        </div>
      </div>

      {/* Banner de error */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 flex items-center gap-3 text-sm text-rose-800">
          <AlertCircle className="size-5 text-rose-500 shrink-0" />
          <span>{error}. Verifica que el backend esté corriendo en el puerto 8080.</span>
          <Button
            variant="ghost"
            size="xs"
            onClick={refetch}
            className="ml-auto text-rose-600 hover:text-rose-700 hover:bg-rose-100 cursor-pointer"
          >
            Reintentar
          </Button>
        </div>
      )}

      {/* Toolbar con búsqueda y filtros en tiempo real */}
      <AsignaturasToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        semestreFilter={semestreFilter}
        onSemestreFilterChange={setSemestreFilter}
        availableSemestres={availableSemestres}
        totalItems={totalItems}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
      />

      {/* Estado de carga o DataTable */}
      {loading ? (
        <div className="rounded-md border border-slate-200 bg-white shadow-xs flex items-center justify-center min-h-[355px]">
          <div className="flex flex-col items-center gap-3 text-slate-500">
            <Loader2 className="size-8 animate-spin text-slate-400" />
            <span className="text-sm font-medium">Cargando asignaturas...</span>
          </div>
        </div>
      ) : (
        <DataTable
          columns={asignaturaColumns}
          data={paginatedData}
          caption="Asignaturas registradas en el sistema."
          sortColumn={sortState.column}
          sortDirection={sortState.direction}
          onSort={(colId) => handleColumnSort(colId as keyof Asignatura)}
          onAction={handleRowAction}
          pagination={{
            currentPage: page,
            totalPages,
            totalItems,
            pageSize,
            onPageChange: (newPage) => setPage(newPage),
            onPageSizeChange: (newSize) => setPageSize(newSize),
          }}
        />
      )}

      {/* Modal de Creación */}
      <CreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={handleCreateSuccess}
      />

      {/* Modal de Edición */}
      <EditModal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setEditingAsignatura(null);
        }}
        asignatura={editingAsignatura}
        onSave={handleEditSuccess}
      />
    </div>
  );
}
