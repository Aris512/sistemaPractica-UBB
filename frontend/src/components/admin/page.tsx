import { useState } from "react";
import { DataTable } from "./data-table";
import { userColumns } from "./columns";
import {
  useDataTableFeatures,
  type UsuarioRow,
} from "./data-table-features";
import { AdminSidebar, type AdminSection } from "./AdminSidebar";
import { AdminToolbar } from "./AdminToolbar";
import { EditModal, CreateModal } from "./usuarios";
import { AsignaturasView } from "./asignaturas";
import { DocumentosView } from "./documentos";
import { CentrosPracticaView } from "./centros_practica";
import { PermisosConfigView } from "./config";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { RefreshCw, Loader2, AlertCircle, UserPlus, LogOut } from "lucide-react";
import { Toaster, sileo } from "sileo";
import "sileo/styles.css";

export default function AdminPage() {
  const [activeSection, setActiveSection] = useState<AdminSection>("usuarios");

  const {
    data,
    paginatedData,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    totalItems,
    searchQuery,
    setSearchQuery,
    roleFilter,
    setRoleFilter,
    asignaturaFilter,
    setAsignaturaFilter,
    estadoFilter,
    setEstadoFilter,
    availableAsignaturas,
    hasActiveFilters,
    clearFilters,
    sortState,
    handleSort,
    loading,
    error,
    refetch,
    deleteUsuario,
    toggleUsuarioEstado,
  } = useDataTableFeatures();

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const nextInvoiceId = `INV${String(data.length + 1).padStart(3, "0")}`;

  const handleRowAction = async (action: string, item: UsuarioRow) => {
    switch (action) {
      case "edit":
        setEditingInvoice(item);
        setIsEditModalOpen(true);
        break;
      case "delete": {
        const res = await deleteUsuario(item.rut);
        if (res.success) {
          sileo.success({
            title: "Usuario eliminado",
            description: `${item.nombre} (${item.rut}) fue eliminado correctamente de la base de datos.`,
          });
        } else {
          sileo.error({
            title: "Error al eliminar usuario",
            description: res.error || "No se pudo eliminar el usuario del servidor.",
          });
        }
        break;
      }
      case "toggle-estado": {
        const nuevoEstado = !item.estado;
        const res = await toggleUsuarioEstado(item.rut, nuevoEstado);
        if (res.success) {
          sileo.success({
            title: "Estado actualizado",
            description: `${item.nombre} ahora está ${
              nuevoEstado ? "Activo" : "Inactivo"
            }`,
          });
        } else {
          sileo.error({
            title: "Error al cambiar estado",
            description:
              res.error || "No se pudo actualizar el estado en el servidor",
          });
        }
        break;
      }
      default:
        break;
    }
  };

  const handleSaveEdit = (_originalInvoiceId: string, _updatedInvoice: any) => {
    refetch();
    sileo.success({
      title: "Usuario actualizado",
      description: "Los cambios se guardaron correctamente en la base de datos",
    });
  };

  const handleCreateUser = (newUser: any) => {
    refetch();
    if (newUser && newUser.nombre) {
      sileo.success({
        title: "Usuario guardado en base de datos",
        description: `Se registró a ${newUser.nombre} ${newUser.apellido} (${newUser.rol}) en la base de datos`,
      });
    } else {
      sileo.success({
        title: "Usuario guardado",
        description: "El nuevo usuario fue registrado y persistido con éxito en la base de datos.",
      });
    }
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

  const handleLogout = () => {
    window.history.pushState({}, "", "/");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen>
        <AdminSidebar
          activeSection={activeSection}
          onSelectSection={(sec) => setActiveSection(sec)}
          onLogout={handleLogout}
          onGoHome={handleLogout}
        />

        <SidebarInset className="bg-slate-50 min-h-screen">
          <Toaster position="top-center" theme="light" />

          {/* Top Bar with Sidebar Trigger */}
          <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-white px-4 sm:px-6">
            <SidebarTrigger className="-ml-1 text-slate-700 hover:text-slate-900 cursor-pointer" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="flex flex-1 items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-slate-900">
                  Panel de Administración
                </span>
                <span className="hidden sm:inline text-xs text-muted-foreground ml-2">
                  {activeSection === "usuarios"
                    ? "/ Gestión de Usuarios"
                    : activeSection === "asignaturas"
                    ? "/ Gestión de Asignaturas"
                    : activeSection === "documentos"
                    ? "/ Expedientes de Documentos"
                    : activeSection === "centros_practica"
                    ? "/ Gestión de Centros de Práctica"
                    : "/ Configuración de Permisos por Rol"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="xs"
                  onClick={handleLogout}
                  className="gap-1.5 cursor-pointer text-slate-600 hover:text-rose-600 hover:bg-rose-50"
                  title="Cerrar sesión administrativa"
                >
                  <LogOut className="size-3.5" />
                  <span>Cerrar sesión</span>
                </Button>
              </div>
            </div>
          </header>

          {/* Renderizado condicional según la sección activa */}
          {activeSection === "asignaturas" ? (
            <AsignaturasView />
          ) : activeSection === "documentos" ? (
            <DocumentosView />
          ) : activeSection === "centros_practica" ? (
            <CentrosPracticaView />
          ) : activeSection === "permisos" ? (
            <PermisosConfigView />
          ) : (
            /* Main Content Area - Usuarios */
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
                <div className="flex items-center gap-2 sm:self-auto self-start">
                  <Button
                    variant="outline"
                    onClick={() => {
                      refetch();
                      sileo.show({
                        title: "Recargando usuarios",
                        description: "Consultando la base de datos...",
                      });
                    }}
                    className="gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="size-4" />
                    Recargar
                  </Button>
                  <Button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="gap-1.5 bg-slate-900 hover:bg-slate-800 text-white shadow-xs cursor-pointer"
                  >
                    <UserPlus className="size-4" />
                    Nuevo Usuario
                  </Button>
                </div>
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
                    className="ml-auto text-rose-600 hover:text-rose-700 hover:bg-rose-100 cursor-pointer"
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
                    onPageSizeChange: (newSize) => setPageSize(newSize),
                  }}
                />
              )}

              {/* Edit Modal */}
              <EditModal
                isOpen={isEditModalOpen}
                onClose={() => {
                  setIsEditModalOpen(false);
                  setEditingInvoice(null);
                }}
                user={editingInvoice}
                onSave={handleSaveEdit}
              />

              {/* Create Modal */}
              <CreateModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                suggestedId={nextInvoiceId}
                onCreate={handleCreateUser}
              />
            </div>
          )}
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
