import { useState } from "react";
import { DataTable } from "./data-table";
import { userColumns } from "./columns";
import {
  useDataTableFeatures,
  type UsuarioRow,
} from "./data-table-features";
import { AdminSidebar } from "./AdminSidebar";
import { AdminToolbar } from "./AdminToolbar";
import { EditModal } from "./EditModal";
import { CreateModal } from "./CreateModal";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { RefreshCw, Loader2, AlertCircle } from "lucide-react";
import { Toaster, sileo } from "sileo";
import "sileo/styles.css";

export default function AdminPage() {
  const {
    data,
    paginatedData,
    page,
    setPage,
    pageSize,
    totalPages,
    totalItems,
    searchQuery,
    setSearchQuery,
    roleFilter,
    setRoleFilter,
    hasActiveFilters,
    clearFilters,
    sortState,
    handleSort,
    loading,
    error,
    refetch,
    deleteUsuario,
  } = useDataTableFeatures();

  // Modals state (se mantienen sin cambios)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const nextInvoiceId = `INV${String(data.length + 1).padStart(3, "0")}`;

  const handleRowAction = (action: string, item: UsuarioRow) => {
    switch (action) {
      case "edit":
        setEditingInvoice(item);
        setIsEditModalOpen(true);
        break;
      case "delete":
        deleteUsuario(item.rut);
        sileo.error({
          title: "Usuario eliminado",
          description: `${item.nombre} (${item.rut}) fue eliminado de la tabla`,
        });
        break;
      default:
        break;
    }
  };

  const handleSaveEdit = (originalInvoiceId: string, updatedInvoice: any) => {
    sileo.success({
      title: "Usuario actualizado",
      description: `Los cambios se guardaron correctamente`,
    });
  };

  const handleCreateInvoice = (newInvoice: any) => {
    sileo.success({
      title: "Registro creado",
      description: `Nuevo registro agregado`,
    });
  };

  const handleColumnSort = (colId: keyof UsuarioRow) => {
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

  const handleGoHome = () => {
    window.history.pushState({}, "", "/");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen>
        <AdminSidebar onGoHome={handleGoHome} />

        <SidebarInset className="bg-slate-50 min-h-screen">
          <Toaster position="top-center" theme="light" />

          {/* Top Bar with Sidebar Trigger */}
          <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-white px-4 sm:px-6">
            <SidebarTrigger className="-ml-1 text-slate-700 hover:text-slate-900" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="flex flex-1 items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-slate-900">
                  Panel de Administración
                </span>
                <span className="hidden sm:inline text-xs text-muted-foreground ml-2">
                  / Gestión de Usuarios
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="xs" onClick={handleGoHome}>
                  ← Inicio
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Usuarios del Sistema
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Usuarios registrados en la base de datos con sus roles asignados.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  refetch();
                  sileo.show({
                    title: "Recargando usuarios",
                    description: "Consultando la base de datos...",
                  });
                }}
                className="gap-1.5 sm:self-auto self-start"
              >
                <RefreshCw className="size-4" />
                Recargar
              </Button>
            </div>

            {/* Error banner */}
            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 flex items-center gap-3 text-sm text-rose-800">
                <AlertCircle className="size-5 text-rose-500 shrink-0" />
                <span>{error}. Verifica que el backend esté corriendo en el puerto 8080.</span>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={refetch}
                  className="ml-auto text-rose-600 hover:text-rose-700 hover:bg-rose-100"
                >
                  Reintentar
                </Button>
              </div>
            )}

            {/* Real-time Filters Toolbar */}
            <AdminToolbar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              roleFilter={roleFilter}
              onRoleFilterChange={setRoleFilter}
              totalItems={totalItems}
              hasActiveFilters={hasActiveFilters}
              onClearFilters={clearFilters}
            />

            {/* Loading state */}
            {loading ? (
              <div className="rounded-md border border-slate-200 bg-white shadow-xs flex items-center justify-center min-h-[355px]">
                <div className="flex flex-col items-center gap-3 text-slate-500">
                  <Loader2 className="size-8 animate-spin text-slate-400" />
                  <span className="text-sm">Cargando usuarios...</span>
                </div>
              </div>
            ) : (
              /* Data Table with Real-time Pagination */
              <DataTable
                columns={userColumns}
                data={paginatedData}
                caption="Usuarios registrados en el sistema."
                sortColumn={sortState.column}
                sortDirection={sortState.direction}
                onSort={(colId) => handleColumnSort(colId as keyof UsuarioRow)}
                onAction={handleRowAction}
                pagination={{
                  currentPage: page,
                  totalPages,
                  totalItems,
                  pageSize,
                  onPageChange: (newPage) => setPage(newPage),
                }}
              />
            )}
          </div>

          {/* Edit Modal (sin modificar) */}
          <EditModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setEditingInvoice(null);
            }}
            invoice={editingInvoice}
            onSave={handleSaveEdit}
          />

          {/* Create Modal (sin modificar) */}
          <CreateModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            suggestedId={nextInvoiceId}
            onCreate={handleCreateInvoice}
          />
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
