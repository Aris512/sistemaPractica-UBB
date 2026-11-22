import prismathLogo from "@/components/login/logo/prismath.png";
import type { UserSession } from "@/types/auth";
import type { CoordinadorMenuKey } from "./types";
import { usePermissions } from "@/hooks/usePermissions";
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
  ClipboardList,
  FolderArchive,
  Briefcase,
  LogOut,
} from "lucide-react";

interface HomeSidebarProps {
  user?: UserSession;
  activeMenu: CoordinadorMenuKey;
  onSelectMenu: (menu: CoordinadorMenuKey) => void;
  onLogout?: () => void;
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
}: HomeSidebarProps) {
  const { hasPermission } = usePermissions(user);
  const puedeAsociar = hasPermission("PRACTICAS_ASOCIAR");

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
              {puedeAsociar && (
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
              )}

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

              {/* Pautas de evaluación (seguimiento y catálogo) */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeMenu === "pautas"}
                  onClick={() => onSelectMenu("pautas")}
                  className={`w-full justify-start cursor-pointer font-medium text-sm transition-colors ${
                    activeMenu === "pautas"
                      ? "bg-slate-100 text-slate-950 font-bold border-l-4 border-slate-900 pl-2"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <ClipboardList className="size-4 mr-2" />
                  <span>Pautas</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Documentos */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeMenu === "documentos" || activeMenu === "documentos-practica"}
                  onClick={() => onSelectMenu("documentos")}
                  className={`w-full justify-start cursor-pointer font-medium text-sm transition-colors ${
                    activeMenu === "documentos" || activeMenu === "documentos-practica"
                      ? "bg-slate-100 text-slate-950 font-bold border-l-4 border-slate-900 pl-2"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <FolderArchive className="size-4 mr-2" />
                  <span>Documentos</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Portafolios */}
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
                  <Briefcase className="size-4 mr-2" />
                  <span>Portafolios</span>
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
