import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Users, BookOpen, ShieldCheck, Building2, FolderArchive, ClipboardCheck, LogOut } from "lucide-react";

export type AdminSection = "usuarios" | "asignaturas" | "centros_practica" | "permisos" | "documentos" | "evaluaciones";

interface AdminSidebarProps {
  activeSection?: AdminSection;
  onSelectSection?: (section: AdminSection) => void;
  onLogout?: () => void;
  onGoHome?: () => void;
}

export function AdminSidebar({
  activeSection = "usuarios",
  onSelectSection,
  onLogout,
  onGoHome: _onGoHome,
}: AdminSidebarProps) {

  return (
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
                <SidebarMenuButton
                  isActive={activeSection === "usuarios"}
                  tooltip="Usuarios"
                  onClick={() => onSelectSection?.("usuarios")}
                  className="cursor-pointer"
                >
                  <Users className="size-4" />
                  <span>Usuarios</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeSection === "asignaturas"}
                  tooltip="Asignaturas"
                  onClick={() => onSelectSection?.("asignaturas")}
                  className="cursor-pointer"
                >
                  <BookOpen className="size-4" />
                  <span>Asignaturas</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeSection === "documentos"}
                  tooltip="Documentos"
                  onClick={() => onSelectSection?.("documentos")}
                  className="cursor-pointer"
                >
                  <FolderArchive className="size-4" />
                  <span>Documentos</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeSection === "centros_practica"}
                  tooltip="Centros de Práctica"
                  onClick={() => onSelectSection?.("centros_practica")}
                  className="cursor-pointer"
                >
                  <Building2 className="size-4" />
                  <span>Centros de Práctica</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeSection === "permisos"}
                  tooltip="Permisos por Rol"
                  onClick={() => onSelectSection?.("permisos")}
                  className="cursor-pointer"
                >
                  <ShieldCheck className="size-4" />
                  <span>Permisos Rol</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeSection === "evaluaciones"}
                  tooltip="Evaluaciones"
                  onClick={() => onSelectSection?.("evaluaciones")}
                  className="cursor-pointer"
                >
                  <ClipboardCheck className="size-4" />
                  <span>Evaluaciones</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border mt-auto space-y-2">
        <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
          <div className="size-2 rounded-full bg-emerald-500" />
          <span>Conectado como Admin</span>
        </div>
        {onLogout && (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={onLogout}
                className="w-full justify-start text-rose-600 hover:text-rose-700 hover:bg-rose-50 cursor-pointer font-medium text-sm transition-colors gap-2"
                title="Cerrar sesión e ir al login principal"
              >
                <LogOut className="size-4 text-rose-600" />
                <span>Cerrar sesión</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
