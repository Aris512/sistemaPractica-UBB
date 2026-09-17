import { useState } from "react";
import { DataTable } from "../data-table";
import { centroPracticaColumns } from "./columns";
import { useCentrosPracticaFeatures } from "./useCentrosPracticaFeatures";
import { CentrosPracticaToolbar } from "./CentrosPracticaToolbar";
import { CreateModal } from "./CreateModal";
import { EditModal } from "./EditModal";
import type { CentroPractica } from "./types";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2, AlertCircle, Building2 } from "lucide-react";
import { sileo } from "sileo";

export function CentrosPracticaView() {
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
    hasActiveFilters,
    clearFilters,
    sortState,
    handleSort,
    refetch,
    deleteCentro,
  } = useCentrosPracticaFeatures();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCentro, setEditingCentro] = useState<CentroPractica | null>(null);

  const handleRowAction = async (action: string, item: CentroPractica) => {
    switch (action) {
      case "edit":
        setEditingCentro(item);
        setIsEditOpen(true);
        break;
      case "delete": {
        const res = await deleteCentro(item.idCentro);
        if (res.success) {
          sileo.success({
            title: "Centro de práctica eliminado",
            description: `Se eliminó "${item.nombre}" de la base de datos`,
          });
        } else {
          sileo.error({
            title: "No se pudo eliminar",
            description: res.error || "Ocurrió un error al intentar eliminar el centro",
          });
        }
        break;
      }
      default:
        break;
    }
  };

  const handleCreateSuccess = (newCentro: CentroPractica) => {
    refetch();
    sileo.success({
      title: "Centro de práctica registrado",
      description: `Se creó exitosamente "${newCentro.nombre}"`,
    });
  };

  const handleEditSuccess = (_id: number, updated: CentroPractica) => {
    refetch();
    sileo.success({
      title: "Centro actualizado",
      description: `Los datos de "${updated.nombre}" fueron guardados`,
    });
  };

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Centros de Práctica
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Instituciones, colegios y centros educativos registrados para asignación de prácticas.
          </p>
        </div>
        <div className="flex items-center gap-2 sm:self-auto self-start">
          <Button
            variant="outline"
            onClick={() => {
              refetch();
              sileo.show({
                title: "Recargando centros",
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
            <Building2 className="size-4" />
            Nuevo Centro
          </Button>
        </div>
      </div>

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

      <CentrosPracticaToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        totalItems={totalItems}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
      />

      {loading ? (
        <div className="rounded-md border border-slate-200 bg-white shadow-xs flex items-center justify-center min-h-[355px]">
          <div className="flex flex-col items-center gap-3 text-slate-500">
            <Loader2 className="size-8 animate-spin text-slate-400" />
            <span className="text-sm font-medium">Cargando centros de práctica...</span>
          </div>
        </div>
      ) : (
        <DataTable
          columns={centroPracticaColumns}
          data={paginatedData}
          caption="Centros de práctica registrados en el sistema."
          sortColumn={sortState.column}
          sortDirection={sortState.direction}
          onSort={(colId) => handleSort(colId as keyof CentroPractica)}
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

      <CreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={handleCreateSuccess}
      />

      <EditModal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setEditingCentro(null);
        }}
        centro={editingCentro}
        onSave={handleEditSuccess}
      />
    </div>
  );
}
