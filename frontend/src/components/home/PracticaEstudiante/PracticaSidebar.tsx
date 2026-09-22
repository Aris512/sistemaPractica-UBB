import type { UserSession } from "@/types/auth";
import type { PracticaMenuKey, SemestrePractica } from "./types";
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
  FileText,
  ClipboardCheck,
  Users,
  LogOut,
} from "lucide-react";

interface PracticaSidebarProps {
  user: UserSession;
  activeMenu: PracticaMenuKey;
  onSelectMenu: (menu: PracticaMenuKey) => void;
  onLogout?: () => void;
  semestre?: SemestrePractica;
  asignaturaNombre?: string;
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
        <circle cx="10" cy="32" r="4.5" fill="#8b5cf6" />
      </svg>
      <div className="flex flex-col leading-none">
        <span className="text-lg font-bold tracking-tight text-slate-900 font-sans">
          Plataforma de Práctica
        </span>
        <span className="text-[10px] text-slate-500 font-medium">
          Universidad del Bío-Bío
        </span>
      </div>
    </div>
  );
}

export function PracticaSidebar({
  activeMenu,
  onSelectMenu,
  onLogout,
}: PracticaSidebarProps) {
  const menuItems: {
    key: PracticaMenuKey;
    label: string;
    icon: typeof Home;
  }[] = [
    { key: "inicio", label: "Inicio", icon: Home },
    { key: "portafolio", label: "Portafolio", icon: Briefcase },
    { key: "documentos", label: "Documentos", icon: FileText },
    { key: "evaluaciones", label: "Evaluaciones", icon: ClipboardCheck },
    { key: "equipo", label: "Equipo de Práctica", icon: Users },
  ];

  return (
    <Sidebar className="border-r border-slate-200/90 bg-white">
      <SidebarHeader className="p-4 border-b border-slate-100">
        <AdeccaLogo />
      </SidebarHeader>

      <SidebarContent className="p-2 space-y-3">
        

        {/* Menú de Navegación */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2">
            Módulos de Práctica
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeMenu === item.key;
                return (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => onSelectMenu(item.key)}
                      className={`w-full justify-start cursor-pointer font-medium text-sm transition-colors ${
                        isActive
                          ? "bg-sky-50 text-sky-800 font-semibold border-l-4 border-sky-600 pl-2 shadow-2xs"
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="size-4.5 text-sky-600 shrink-0" />
                        <span>{item.label}</span>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-slate-100 bg-white">
        <button
          onClick={onLogout}
          type="button"
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
