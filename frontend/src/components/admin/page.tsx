import { DataTable } from "./data-table";
import { invoiceColumns } from "./columns";
import { useDataTableFeatures, type Invoice } from "./data-table-features";
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
  LogOut,
} from "lucide-react";
import { Toaster, sileo } from "sileo";
import "sileo/styles.css";

export default function AdminPage() {
  const {
    filteredAndSortedData,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    sortState,
    handleSort,
    totalAmount,
    deleteInvoice,
    duplicateInvoice,
  } = useDataTableFeatures();

  const handleRowAction = (action: string, item: Invoice) => {
    switch (action) {
      case "edit":
        sileo.info({
          title: `Factura ${item.invoice}`,
          description: `Abierta para edición (${item.paymentMethod} • ${item.totalAmount})`,
        });
        break;
      case "duplicate":
        duplicateInvoice(item.invoice);
        sileo.success({
          title: "Factura duplicada",
          description: `Factura ${item.invoice} duplicada correctamente`,
        });
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

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    const label = status === "ALL" ? "Mostrando todas las facturas" : `Filtrando por: ${status}`;
    sileo.show({
      title: "Filtro aplicado",
      description: label,
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
    // Invalida las credenciales HTTP Basic en la memoria del navegador
    // para que la próxima vez que se ingrese a /admin vuelva a solicitar el popup nativo
    try {
      const xhr = new XMLHttpRequest();
      xhr.open("GET", "/admin", true, "logout", "logout");
      xhr.send();
    } catch (_) {}

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
                      tooltip="Cerrar Sesión"
                      onClick={handleGoHome}
                      className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                    >
                      <LogOut className="size-4" />
                      <span>Cerrar Sesión</span>
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
            <div className="flex items-center justify-between p-2 text-xs text-muted-foreground border-t border-sidebar-border">
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-emerald-500" />
                <span>Conectado como Admin</span>
              </div>
              <button
                type="button"
                onClick={handleGoHome}
                title="Cerrar sesión de administrador"
                className="text-xs text-rose-500 hover:text-rose-700 font-medium hover:underline cursor-pointer"
              >
                Salir
              </button>
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
              <Button variant="outline" size="xs" onClick={handleGoHome}>
                ← Volver al Inicio
              </Button>
            </div>
          </header>

          {/* Main Content Area */}
          <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6 w-full">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Facturas y Registros
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Visualización y control de registros mediante la tabla base con Sidebar.
              </p>
            </div>

            {/* Filters Toolbar */}
            <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Input
                  placeholder="Buscar por código, método, estado..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-xs bg-white"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <span className="text-xs text-muted-foreground font-medium">
                  Estado:
                </span>
                {["ALL", "Paid", "Pending", "Unpaid"].map((status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? "default" : "outline"}
                    size="xs"
                    onClick={() => handleStatusFilterChange(status)}
                  >
                    {status === "ALL" ? "Todos" : status}
                  </Button>
                ))}
              </div>
            </div>

            {/* Data Table */}
            <DataTable
              columns={invoiceColumns}
              data={filteredAndSortedData}
              caption="A list of your recent invoices."
              totalFooter={{
                label: "Total",
                amount: totalAmount,
              }}
              sortColumn={sortState.column}
              sortDirection={sortState.direction}
              onSort={(colId) => handleColumnSort(colId as keyof Invoice)}
              onAction={handleRowAction}
            />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
