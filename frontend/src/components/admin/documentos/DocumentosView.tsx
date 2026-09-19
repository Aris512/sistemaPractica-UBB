import { useState } from "react";
import { DataTable } from "../data-table";
import { estudianteDocumentoColumns } from "./columns";
import { useDocumentosFeatures } from "./useDocumentosFeatures";
import { DocumentosToolbar } from "./DocumentosToolbar";
import { DocumentosModal } from "./DocumentosModal";
import type { EstudianteDocumentoRow } from "./types";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2, AlertCircle, FolderArchive } from "lucide-react";
import { sileo } from "sileo";

export function DocumentosView() {
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
    asignaturaFilter,
    setAsignaturaFilter,
    estadoFilter,
    setEstadoFilter,
    availableAsignaturas,
    hasActiveFilters,
    clearFilters,
    sortState,
    handleSort,
    refetch,
    selectedStudentDetail,
    setSelectedStudentDetail,
    detailLoading,
    fetchStudentDetail,
    downloadSingleFile,
    downloadStudentZip,
  } = useDocumentosFeatures();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleRowAction = async (action: string, item: EstudianteDocumentoRow) => {
    switch (action) {
      case "view-detail":
        setIsModalOpen(true);
        await fetchStudentDetail(item.rut);
        break;
      case "download-zip":
        await downloadStudentZip(item.rut, item.nombre);
        break;
      default:
        break;
    }
  };

  const handleColumnSort = (colId: keyof EstudianteDocumentoRow) => {
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
      {/* Header con título y botón de recarga */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <FolderArchive className="size-6 text-indigo-600" />
            <span>Documentos de Práctica</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Revisión del estado de entrega de documentos por estudiante y profesores, con descarga individual y expedientes .ZIP.
          </p>
        </div>
        <div className="flex items-center gap-2 sm:self-auto self-start">
          <Button
            variant="outline"
            onClick={() => {
              refetch();
              sileo.show({
                title: "Actualizando estado",
                description: "Consultando registros en el servidor...",
              });
            }}
            className="gap-1.5 cursor-pointer text-xs"
          >
            <RefreshCw className="size-3.5" />
            Recargar
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

      {/* Toolbar con buscador y filtros */}
      <DocumentosToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        asignaturaFilter={asignaturaFilter}
        onAsignaturaFilterChange={setAsignaturaFilter}
        estadoFilter={estadoFilter}
        onEstadoFilterChange={setEstadoFilter}
        availableAsignaturas={availableAsignaturas}
        totalItems={totalItems}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
      />

      {/* Tabla con paginación */}
      {loading ? (
        <div className="rounded-md border border-slate-200 bg-white shadow-xs flex items-center justify-center min-h-[355px]">
          <div className="flex flex-col items-center gap-3 text-slate-500">
            <Loader2 className="size-8 animate-spin text-slate-400" />
            <span className="text-sm font-medium">Cargando estado de documentos...</span>
          </div>
        </div>
      ) : (
        <DataTable
          columns={estudianteDocumentoColumns}
          data={paginatedData}
          caption="Estado de entrega de documentos por estudiante."
          sortColumn={sortState.column}
          sortDirection={sortState.direction}
          onSort={(colId) => handleColumnSort(colId as keyof EstudianteDocumentoRow)}
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

      {/* Modal de Detalle */}
      <DocumentosModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedStudentDetail(null);
        }}
        detalle={selectedStudentDetail}
        loading={detailLoading}
        onDownloadFile={downloadSingleFile}
        onDownloadZip={downloadStudentZip}
      />
    </div>
  );
}
