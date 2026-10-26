import type { UserSession } from "@/types/auth";
import type { ProfesorCTutorMenuKey } from "./types";
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
  FileText,
  Eye,
  LogOut,
  Briefcase,
} from "lucide-react";
import { sileo } from "sileo";
import { usePermissions } from "@/hooks/usePermissions";

interface HomeSidebarProps {
  user?: UserSession;
  activeMenu: ProfesorCTutorMenuKey;
  onSelectMenu: (menu: ProfesorCTutorMenuKey) => void;
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
          Tutor & Colaborador UBB
        </span>
      </div>
    </div>
  );
}

export function HomeSidebar({
  user,
  activeMenu,
  onSelectMenu,
  onLogout,
}: HomeSidebarProps) {
  const { hasPermission } = usePermissions(user);
  const handleSelectMockup = (menu: ProfesorCTutorMenuKey, modulo: string) => {
    onSelectMenu(menu);
    sileo.warning({
      title: "Módulo en desarrollo",
      description: `${modulo} se encuentra actualmente en desarrollo`,
    });
  };

  const handleLogout = () => {
    sileo.info({
      title: "Cerrando Sesión",
      description: "Has salido de la plataforma de forma segura.",
    });
    onLogout?.();
  };

  return (
    <Sidebar className="border-r border-slate-200/90 bg-white">
      <SidebarHeader className="p-4 border-b border-slate-100">
        <AdeccaLogo />
      </SidebarHeader>

      <SidebarContent className="p-2 space-y-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2">
            Supervisión y Evaluación
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Inicio */}
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
                  <div className="flex items-center gap-2.5">
                    <Home className="size-4.5 text-slate-900 shrink-0" />
                    <span>Inicio</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Pautas */}
              {(hasPermission("EVALUACIONES_CONSULTAR") || hasPermission("EVALUACIONES_REALIZAR")) && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={activeMenu === "pautas"}
                    onClick={() => handleSelectMockup("pautas", "Pautas y Rúbricas")}
                    className={`w-full justify-start cursor-pointer font-medium text-sm transition-colors ${
                      activeMenu === "pautas"
                        ? "bg-slate-100 text-slate-950 font-bold border-l-4 border-slate-900 pl-2"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <FileText className="size-4.5 text-slate-900 shrink-0" />
                      <span>Pautas</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {/* Observaciones */}
              {(hasPermission("OBSERVACIONES_CONSULTAR") || hasPermission("OBSERVACIONES_REGISTRAR")) && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={activeMenu === "observaciones"}
                    onClick={() => handleSelectMockup("observaciones", "Bitácora de Observaciones")}
                    className={`w-full justify-start cursor-pointer font-medium text-sm transition-colors ${
                      activeMenu === "observaciones"
                        ? "bg-slate-100 text-slate-950 font-bold border-l-4 border-slate-900 pl-2"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Eye className="size-4.5 text-slate-900 shrink-0" />
                      <span>Observaciones</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {/* Portafolio (condicionado al permiso Subir archivos) */}
              {hasPermission("PORTAFOLIO_SUBIR") && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={activeMenu === "portafolio"}
                    onClick={() => handleSelectMockup("portafolio", "Portafolio")}
                    className={`w-full justify-start cursor-pointer font-medium text-sm transition-colors ${
                      activeMenu === "portafolio"
                        ? "bg-slate-100 text-slate-950 font-bold border-l-4 border-slate-900 pl-2"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Briefcase className="size-4.5 text-slate-900 shrink-0" />
                      <span>Portafolio</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer del Sidebar con perfil y logout */}
      <SidebarFooter className="p-3 border-t border-slate-100 space-y-2">
        

        {onLogout && (
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="size-3.5" />
            <span>Cerrar Sesión</span>
          </button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
