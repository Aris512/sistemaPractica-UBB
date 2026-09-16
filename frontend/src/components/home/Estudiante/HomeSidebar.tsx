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
  BookOpen,
  FileText,
  LogOut,
} from "lucide-react";
import { sileo } from "sileo";

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
          Sistema de Práctica
        </span>
        <span className="text-[10px] text-slate-500 font-medium">
          Pedadogía en Educación Matemática 
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
  totalCourses,
}: HomeSidebarProps) {
  return (
    <Sidebar className="border-r border-slate-200/90 bg-white">
      <SidebarHeader className="p-4 border-b border-slate-100">
        {/* Logo Adecca */}
        <AdeccaLogo />
      </SidebarHeader>

      <SidebarContent className="p-2 space-y-4">
        {/* Menú Cursos */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2">
            Académico
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
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

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeMenu === "mis-cursos"}
                  onClick={() => onSelectMenu("mis-cursos")}
                  className={`w-full justify-between cursor-pointer font-medium text-sm transition-colors ${
                    activeMenu === "mis-cursos"
                      ? "bg-sky-50 text-sky-800 font-semibold border-l-4 border-sky-600 pl-2"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <GraduationCap className="size-4.5 text-sky-600 shrink-0" />
                    <span>Mis Cursos</span>
                  </div>
                  {totalCourses !== undefined && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                      {totalCourses}
                    </span>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeMenu === "cursos-publicos"}
                  onClick={() => {
                    onSelectMenu("cursos-publicos");
                    sileo.show({
                      title: "Cursos Públicos",
                      description: "Listado de cursos institucionales abiertos",
                    });
                  }}
                  className={`w-full justify-start cursor-pointer font-medium text-sm transition-colors ${
                    activeMenu === "cursos-publicos"
                      ? "bg-sky-50 text-sky-800 font-semibold border-l-4 border-sky-600 pl-2"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <BookOpen className="size-4.5 text-slate-500 shrink-0" />
                  <span>Todos los Cursos</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeMenu === "resultados-test"}
                  onClick={() => {
                    onSelectMenu("resultados-test");
                    sileo.show({
                      title: "Resultados Test",
                      description: "Diagnósticos de aprendizaje y evaluaciones previas",
                    });
                  }}
                  className={`w-full justify-start cursor-pointer font-medium text-sm transition-colors ${
                    activeMenu === "resultados-test"
                      ? "bg-sky-50 text-sky-800 font-semibold border-l-4 border-sky-600 pl-2"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <FileText className="size-4.5 text-slate-500 shrink-0" />
                  <span>Resultados Test</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-3 border-t border-slate-100 bg-white">
        <button
          onClick={() => {
            if (onLogout) {
              sileo.show({
                title: "Sesión finalizada",
                description: "Hasta pronto " + (user?.nombre || ""),
              });
              onLogout();
            }
          }}
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

