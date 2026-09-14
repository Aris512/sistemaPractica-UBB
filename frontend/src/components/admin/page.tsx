import { useState } from "react";
import { DataTable } from "./data-table";
import { invoiceColumns } from "./columns";
import {
  useDataTableFeatures,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  type Invoice,
} from "./data-table-features";
import { EditModal } from "./EditModal";
import { CreateModal } from "./CreateModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  FileText,
  Users,
  Settings,
  Home,
  ShieldCheck,
  Plus,
  Search,
  X,
  RotateCcw,
} from "lucide-react";
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
    statusFilter,
    setStatusFilter,
    methodFilter,
    setMethodFilter,
    hasActiveFilters,
    clearFilters,
    sortState,
    handleSort,
    createInvoice,
    updateInvoice,
    deleteInvoice,
  } = useDataTableFeatures();

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Suggest next ID based on existing count
  const nextInvoiceId = `INV${String(data.length + 1).padStart(3, "0")}`;

  const handleRowAction = (action: string, item: Invoice) => {
    switch (action) {
      case "edit":
        setEditingInvoice(item);
        setIsEditModalOpen(true);
        break;
      case "delete":
        deleteInvoice(item.invoice);
        sileo.error({
          title: "Factura eliminada",
          description: `Factura ${item.invoice} eliminada del registro`,
        });
        break;
      default:
        break;
    }
  };

  const handleSaveEdit = (originalInvoiceId: string, updatedInvoice: Invoice) => {
    updateInvoice(originalInvoiceId, updatedInvoice);
    sileo.success({
      title: "Factura actualizada",
      description: `Los cambios en ${updatedInvoice.invoice} se guardaron en tiempo real`,
    });
  };

  const handleCreateInvoice = (newInvoice: Invoice) => {
    createInvoice(newInvoice);
    sileo.success({
      title: "Factura creada",
      description: `Factura ${newInvoice.invoice} agregada a la tabla`,
    });
  };

  const handleColumnSort = (colId: keyof Invoice) => {
    handleSort(colId);
    const nextDirection =
      sortState.column !== colId
        ? "asc"
        : sortState.direction === "asc"
        ? "desc"
        : "sin orden";

    const dirLabel =
      nextDirection === "asc"
        ? "Ascendente (A-Z / Menor a Mayor)"
        : nextDirection === "desc"
        ? "Descendente (Z-A / Mayor a Menor)"
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
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2 px-3 py-3 font-semibold text-base">
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold">
                U
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold text-sm">UBB Admin</span>
                <span className="text-[11px] text-muted-foreground">
                  Sistema de Práctica
                </span>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Administración</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive tooltip="Facturas">
                      <FileText className="size-4" />
                      <span>Facturas</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      tooltip="Usuarios"
                      onClick={() =>
                        sileo.info({
                          title: "Módulo de Usuarios",
                          description: "Disponible próximamente",
                        })
                      }
                    >
                      <Users className="size-4" />
                      <span>Usuarios</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      tooltip="Auditoría"
                      onClick={() =>
                        sileo.info({
                          title: "Auditoría",
                          description: "Módulo de auditoría y registros",
                        })
                      }
                    >
                      <ShieldCheck className="size-4" />
                      <span>Auditoría</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Navegación</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Volver al Inicio" onClick={handleGoHome}>
                      <Home className="size-4" />
                      <span>Volver al Inicio</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      tooltip="Configuración"
                      onClick={() =>
                        sileo.info({
                          title: "Configuración",
                          description: "Ajustes del sistema",
                        })
                      }
                    >
                      <Settings className="size-4" />
                      <span>Configuración</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter>
            <div className="flex items-center gap-2 p-2 text-xs text-muted-foreground border-t border-sidebar-border">
              <div className="size-2 rounded-full bg-emerald-500" />
              <span>Conectado como Admin</span>
            </div>
          </SidebarFooter>
        </Sidebar>

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
                  / Facturación y Registros
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
                  Facturas y Registros
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Gestión en tiempo real con filtros instantáneos, paginación y modales de edición.
                </p>
              </div>
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="gap-1.5 sm:self-auto self-start"
              >
                <Plus className="size-4" />
                Registrar Factura
              </Button>
            </div>

            {/* Real-time Filters Toolbar */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 justify-between">
                {/* Search Input with Real-time Clear */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
                  <Input
                    placeholder="Buscar por código, método, estado, monto..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8.5 pr-8 bg-slate-50/50 border-slate-200"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      title="Limpiar búsqueda"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>

                {/* Method Filter Dropdown */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
                    Método:
                  </span>
                  <select
                    value={methodFilter}
                    onChange={(e) => setMethodFilter(e.target.value)}
                    className="h-8 rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1 text-xs font-medium text-slate-700 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-slate-400"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>
                        {m === "ALL" ? "Todos los métodos" : m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status Filter Pills & Quick Controls */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-slate-500 font-medium mr-1">
                    Estado:
                  </span>
                  {PAYMENT_STATUSES.map((status) => {
                    const isActive = statusFilter === status;
                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setStatusFilter(status)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer border ${
                          isActive
                            ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100/70"
                        }`}
                      >
                        {status === "Paid" && (
                          <span className="size-1.5 rounded-full bg-emerald-500" />
                        )}
                        {status === "Pending" && (
                          <span className="size-1.5 rounded-full bg-amber-500" />
                        )}
                        {status === "Unpaid" && (
                          <span className="size-1.5 rounded-full bg-rose-500" />
                        )}
                        {status === "ALL" ? "Todos" : status}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">
                    <strong className="text-slate-800">{totalItems}</strong> resultado
                    {totalItems === 1 ? "" : "s"}
                  </span>
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={clearFilters}
                      className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-7 px-2"
                    >
                      <RotateCcw className="size-3 mr-1" />
                      Limpiar filtros
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Data Table with Real-time Pagination */}
            <DataTable
              columns={invoiceColumns}
              data={paginatedData}
              caption="A list of your recent invoices."
              sortColumn={sortState.column}
              sortDirection={sortState.direction}
              onSort={(colId) => handleColumnSort(colId as keyof Invoice)}
              onAction={handleRowAction}
              pagination={{
                currentPage: page,
                totalPages,
                totalItems,
                pageSize,
                onPageChange: (newPage) => setPage(newPage),
              }}
            />
          </div>

          {/* Edit Modal */}
          <EditModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setEditingInvoice(null);
            }}
            invoice={editingInvoice}
            onSave={handleSaveEdit}
          />

          {/* Create Modal */}
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
