import prismathLogo from "@/components/login/logo/prismath.png";
import type { UserSession } from "@/types/auth";
import type { ProfesorMenuKey } from "./types";
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
  Briefcase,
  ClipboardCheck,
  ClipboardList,
  CalendarPlus,
  MessageSquareCheck,
  LogOut,
} from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";

interface HomeSidebarProps {
  user?: UserSession;
  activeMenu: ProfesorMenuKey;
  onSelectMenu: (menu: ProfesorMenuKey) => void;
  onLogout?: () => void;
  esProfesorOctavoONoveno?: boolean;
}

function PrismathLogo() {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <img src={prismathLogo} alt="PrisMath" className="size-9 shrink-0 object-contain" />
      <div className="flex flex-col leading-none">
        <span className="text-lg font-bold tracking-tight text-slate-900 font-sans">
          PrisMath
        </span>
        <span className="text-[10px] text-slate-500 font-medium">
          Plataforma de educación en línea
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
  esProfesorOctavoONoveno = false,
}: HomeSidebarProps) {
  const { hasPermission } = usePermissions(user);


  return (
    <Sidebar className="border-r border-slate-200/90 bg-white">
      <SidebarHeader className="p-4 border-b border-slate-100">
        <PrismathLogo />
      </SidebarHeader>

      <SidebarContent className="p-2 space-y-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2">
            Gestión Docente
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

              {/* Actividades del Curso */}
              {hasPermission("ACTIVIDADES_GESTIONAR") && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeMenu === "actividades"}
                  onClick={() => onSelectMenu("actividades")}
                  className={`w-full justify-start cursor-pointer font-medium text-sm transition-colors ${
                    activeMenu === "actividades"
                      ? "bg-slate-100 text-slate-950 font-bold border-l-4 border-slate-900 pl-2"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <CalendarPlus className="size-4.5 text-slate-900 shrink-0" />
                    <span>Actividades</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
              )}

              {/* Revisión y Retroalimentación (Solo para profesores de 8.º y 9.º semestre) */}
              {esProfesorOctavoONoveno && hasPermission("RETROALIMENTACION_REVISAR") && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={activeMenu === "revision-retroalimentacion"}
                    onClick={() => onSelectMenu("revision-retroalimentacion")}
                    className={`w-full justify-start cursor-pointer font-medium text-sm transition-colors ${
                      activeMenu === "revision-retroalimentacion"
                        ? "bg-slate-100 text-slate-950 font-bold border-l-4 border-slate-900 pl-2"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <MessageSquareCheck className="size-4.5 text-slate-900 shrink-0" />
                      <span>Retroalimentación</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}


              {/* Evaluaciones (calificar entregas) */}
              {hasPermission("EVALUACIONES_REALIZAR") && (
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
                    <div className="flex items-center gap-2.5">
                      <ClipboardCheck className="size-4.5 text-slate-900 shrink-0" />
                      <span>Evaluaciones</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {/* Pautas de práctica (evaluaciones digitales finalizadas de la asignatura) */}
              {hasPermission("PAUTAS_CONSULTAR") && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={activeMenu === "pautas-practica"}
                    onClick={() => onSelectMenu("pautas-practica")}
                    className={`w-full justify-start cursor-pointer font-medium text-sm transition-colors ${
                      activeMenu === "pautas-practica"
                        ? "bg-slate-100 text-slate-950 font-bold border-l-4 border-slate-900 pl-2"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <ClipboardList className="size-4.5 text-slate-900 shrink-0" />
                      <span>Pautas de práctica</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {/* Portafolio */}
              {(hasPermission("PORTAFOLIO_CONSULTAR") || hasPermission("PORTAFOLIO_SUBIR")) && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={activeMenu === "portafolio"}
                    onClick={() => onSelectMenu("portafolio")}
                    className={`w-full justify-start cursor-pointer font-medium text-sm transition-colors ${
                      activeMenu === "portafolio"
                        ? "bg-slate-100 text-slate-950 font-bold border-l-4 border-slate-900 pl-2"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Briefcase className="size-4.5 text-slate-900 shrink-0" />
                      <span>Portafolios</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-slate-100 bg-white">
        <button
          onClick={onLogout}
          className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-slate-700 hover:text-rose-700 hover:bg-rose-50 border border-slate-200/80 hover:border-rose-200 text-sm font-medium transition-colors cursor-pointer shadow-2xs group"
          title="Cerrar sesión"
        >
          <LogOut className="size-4 text-slate-900 group-hover:text-rose-600 shrink-0" />
          <span>Cerrar Sesión</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
