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
import { Users, BookOpen, ShieldCheck, LogOut } from "lucide-react";
import { sileo } from "sileo";

export type AdminSection = "usuarios" | "asignaturas";

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
  onGoHome,
}: AdminSidebarProps) {
  const handleLogoutAction = onLogout || onGoHome;

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
                  tooltip="Auditoría"
                  onClick={() =>
                    sileo.info({
                      title: "Auditoría",
                      description: "Módulo de auditoría y registros",
                    })
                  }
                  className="cursor-pointer"
                >
                  <ShieldCheck className="size-4" />
                  <span>Auditoría</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Grupo de sesión ubicado al fondo del sidebar */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel>Sesión</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Cerrar sesión"
                  onClick={handleLogoutAction}
                  className="cursor-pointer text-slate-600 hover:text-rose-600 hover:bg-rose-50/70"
                >
                  <LogOut className="size-4" />
                  <span>Cerrar sesión</span>
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
  );
}
