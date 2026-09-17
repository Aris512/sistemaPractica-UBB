import type { UserSession } from "@/types/auth";
import type { HomeMenuKey } from "./types";
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
  GraduationCap,
  Briefcase,
  CalendarDays,
  ClipboardCheck,
  MessageSquareText,
  Bot,
  LogOut,
} from "lucide-react";
import { sileo } from "sileo";
import { usePermissions } from "@/hooks/usePermissions";

interface HomeSidebarProps {
  user?: UserSession;
  activeMenu: HomeMenuKey;
  onSelectMenu: (menu: HomeMenuKey) => void;
  onLogout?: () => void;
  totalCourses?: number;
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
  user,
  activeMenu,
  onSelectMenu,
  onLogout,
}: HomeSidebarProps) {
  const { hasPermission } = usePermissions(user);

  const handleSelectMockup = (menu: HomeMenuKey, modulo: string) => {
    onSelectMenu(menu);
    sileo.warning({
      title: "Módulo en desarrollo",
      description: `${modulo} se encuentra actualmente en desarrollo`,
    });
  };

  return (
    <Sidebar className="border-r border-slate-200/90 bg-white">
      <SidebarHeader className="p-4 border-b border-slate-100">
        {/* Logo Adecca */}
        <AdeccaLogo />
      </SidebarHeader>

      <SidebarContent className="p-2 space-y-4">
        {/* Menú Principal */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2">
            Módulos
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Inicio */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeMenu === "inicio" || activeMenu === "malla-curricular"}
                  onClick={() => onSelectMenu("inicio")}
                  className={`w-full justify-start cursor-pointer font-medium text-sm transition-colors ${
                    activeMenu === "inicio" || activeMenu === "malla-curricular"
                      ? "bg-sky-50 text-sky-800 font-semibold border-l-4 border-sky-600 pl-2"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Home className="size-4.5 text-sky-600 shrink-0" />
                    <span>Inicio</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Portafolio */}
              {hasPermission("PORTAFOLIO_SUBIR") && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={activeMenu === "portafolio"}
                    onClick={() => handleSelectMockup("portafolio", "Portafolio")}
                    className={`w-full justify-start cursor-pointer font-medium text-sm transition-colors ${
                      activeMenu === "portafolio"
                        ? "bg-sky-50 text-sky-800 font-semibold border-l-4 border-sky-600 pl-2"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Briefcase className="size-4.5 text-sky-600 shrink-0" />
                      <span>Portafolio</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {/* Cursos / Práctica */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeMenu === "cursos-practica" || activeMenu === "mis-cursos"}
                  onClick={() => handleSelectMockup("cursos-practica", "Cursos / Práctica")}
                  className={`w-full justify-start cursor-pointer font-medium text-sm transition-colors ${
                    activeMenu === "cursos-practica" || activeMenu === "mis-cursos"
                      ? "bg-sky-50 text-sky-800 font-semibold border-l-4 border-sky-600 pl-2"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <GraduationCap className="size-4.5 text-sky-600 shrink-0" />
                    <span>Cursos / Práctica</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Planificación */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeMenu === "planificacion"}
                  onClick={() => handleSelectMockup("planificacion", "Planificación")}
                  className={`w-full justify-start cursor-pointer font-medium text-sm transition-colors ${
                    activeMenu === "planificacion"
                      ? "bg-sky-50 text-sky-800 font-semibold border-l-4 border-sky-600 pl-2"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <CalendarDays className="size-4.5 text-sky-600 shrink-0" />
                    <span>Planificación</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Evaluaciones */}
              {hasPermission("EVALUACIONES_CONSULTAR") && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={activeMenu === "evaluaciones"}
                    onClick={() => handleSelectMockup("evaluaciones", "Evaluaciones")}
                    className={`w-full justify-start cursor-pointer font-medium text-sm transition-colors ${
                      activeMenu === "evaluaciones"
                        ? "bg-sky-50 text-sky-800 font-semibold border-l-4 border-sky-600 pl-2"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <ClipboardCheck className="size-4.5 text-sky-600 shrink-0" />
                      <span>Evaluaciones</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {/* Observaciones */}
              {hasPermission("OBSERVACIONES_CONSULTAR") && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={activeMenu === "observaciones"}
                    onClick={() => handleSelectMockup("observaciones", "Observaciones")}
                    className={`w-full justify-start cursor-pointer font-medium text-sm transition-colors ${
                      activeMenu === "observaciones"
                        ? "bg-sky-50 text-sky-800 font-semibold border-l-4 border-sky-600 pl-2"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <MessageSquareText className="size-4.5 text-sky-600 shrink-0" />
                      <span>Observaciones</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {/* Asistentes de IA */}
              {hasPermission("IA_ACCESO") && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={activeMenu === "asistentes-ia"}
                    onClick={() => handleSelectMockup("asistentes-ia", "Asistentes de IA")}
                    className={`w-full justify-start cursor-pointer font-medium text-sm transition-colors ${
                      activeMenu === "asistentes-ia"
                        ? "bg-sky-50 text-sky-800 font-semibold border-l-4 border-sky-600 pl-2"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Bot className="size-4.5 text-sky-600 shrink-0" />
                      <span>Asistentes de IA</span>
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
          className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-slate-600 hover:text-rose-700 hover:bg-rose-50 border border-slate-200/80 hover:border-rose-200 text-sm font-medium transition-colors cursor-pointer shadow-2xs group"
          title="Cerrar sesión"
        >
          <LogOut className="size-4 text-slate-500 group-hover:text-rose-600 shrink-0" />
          <span>Cerrar Sesión</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}

