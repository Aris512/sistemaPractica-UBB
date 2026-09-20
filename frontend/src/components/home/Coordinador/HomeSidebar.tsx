import type { UserSession } from "@/types/auth";
import type { CoordinadorMenuKey } from "./types";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import {
  Home,
  UserPlus,
  Building2,
  ClipboardCheck,
  LogOut,
} from "lucide-react";

interface HomeSidebarProps {
  user?: UserSession;
  activeMenu: CoordinadorMenuKey;
  onSelectMenu: (menu: CoordinadorMenuKey) => void;
  onLogout?: () => void;
}

function AdeccaLogo() {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <svg className="size-8 shrink-0" viewBox="0 0 48 48" fill="none">
        <line x1="24" y1="24" x2="10" y2="12" stroke="#cbd5e1" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="24" y1="24" x2="38" y2="12" stroke="#cbd5e1" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="24" y1="24" x2="40" y2="28" stroke="#cbd5e1" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="24" y1="24" x2="28" y2="38" stroke="#cbd5e1" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="24" y1="24" x2="10" y2="32" stroke="#cbd5e1" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="24" cy="24" r="5" fill="#334155" />
        <circle cx="10" cy="12" r="4.5" fill="#0284c7" />
        <circle cx="38" cy="12" r="4.5" fill="#e11d48" />
        <circle cx="40" cy="28" r="4" fill="#f59e0b" />
        <circle cx="28" cy="38" r="4.5" fill="#10b981" />
        <circle cx="10" cy="32" r="4" fill="#8b5cf6" />
      </svg>
      <div className="flex flex-col leading-none">
        <span className="text-lg font-bold tracking-tight text-slate-900 font-sans">
          Plataforma de Práctica
        </span>
        <span className="text-[10px] text-slate-500 font-medium">
          Plataforma de educación en línea
        </span>
      </div>
    </div>
  );
}

export function HomeSidebar({
  user: _user,
  activeMenu,
  onSelectMenu,
  onLogout,
}: HomeSidebarProps) {
  return (
    <Sidebar className="border-r border-slate-200/90 bg-white">
      <SidebarHeader className="p-4 border-b border-slate-100">
        <AdeccaLogo />
      </SidebarHeader>

      <SidebarContent className="p-2 space-y-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2">
            Gestión Docente
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Inicio (Estudiantes de Práctica) */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeMenu === "inicio"}
                  onClick={() => onSelectMenu("inicio")}
                  className={`w-full justify-start cursor-pointer font-medium text-sm transition-colors ${
                    activeMenu === "inicio"
                      ? "bg-slate-100 text-slate-950 font-bold border-l-4 border-slate-900 pl-2"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <Home className="size-4 mr-2" />
                  <span>Inicio</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Asociar Docentes y Tutores */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeMenu === "asociar"}
                  onClick={() => onSelectMenu("asociar")}
                  className={`w-full justify-start cursor-pointer font-medium text-sm transition-colors ${
                    activeMenu === "asociar"
                      ? "bg-slate-100 text-slate-950 font-bold border-l-4 border-slate-900 pl-2"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <UserPlus className="size-4 mr-2" />
                  <span>Asociar</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Centros de Práctica (Reutilización de admin/centros_practica) */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeMenu === "centros-practica"}
                  onClick={() => onSelectMenu("centros-practica")}
                  className={`w-full justify-start cursor-pointer font-medium text-sm transition-colors ${
                    activeMenu === "centros-practica"
                      ? "bg-slate-100 text-slate-950 font-bold border-l-4 border-slate-900 pl-2"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <Building2 className="size-4 mr-2" />
                  <span>Centros de Práctica</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Evaluaciones (Basado en Profesor/Evaluaciones.tsx) */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeMenu === "evaluaciones"}
                  onClick={() => onSelectMenu("evaluaciones")}
                  className={`w-full justify-start cursor-pointer font-medium text-sm transition-colors ${
                    activeMenu === "evaluaciones"
                      ? "bg-slate-100 text-slate-950 font-bold border-l-4 border-slate-900 pl-2"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <ClipboardCheck className="size-4 mr-2" />
                  <span>Evaluaciones</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-slate-100 mt-auto">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={onLogout}
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer font-medium text-sm transition-colors"
            >
              <LogOut className="size-4 mr-2" />
              <span>Cerrar Sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
