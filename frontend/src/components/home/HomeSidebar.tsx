import type { UserSession } from "../../types/auth";
import type { HomeMenuKey } from "./types";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  GraduationCap,
  BookOpen,
  Calendar,
  Archive,
  User,
  Mail,
  CheckSquare,
  Globe,
  CalendarDays,
  HelpCircle,
  FileText,
  LogOut,
} from "lucide-react";
import { sileo } from "sileo";

interface HomeSidebarProps {
  user: UserSession;
  activeMenu: HomeMenuKey;
  onSelectMenu: (menu: HomeMenuKey) => void;
  onLogout: () => void;
  totalCourses: number;
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
          Adecca
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
  totalCourses,
}: HomeSidebarProps) {
  return (
    <Sidebar className="border-r border-slate-200/90 bg-white">
      <SidebarHeader className="p-4 border-b border-slate-100">
        {/* Accesos directos circulares */}
        <div className="flex items-center justify-between gap-1.5 p-1.5 bg-slate-100/70 rounded-xl mb-3">
          <button
            onClick={() => onSelectMenu("mis-cursos")}
            title="Mis Cursos"
            className={`flex-1 flex items-center justify-center h-8 rounded-lg text-white transition-transform active:scale-95 shadow-xs cursor-pointer ${
              activeMenu === "mis-cursos" ? "ring-2 ring-emerald-600 bg-emerald-600" : "bg-emerald-500 hover:bg-emerald-600"
            }`}
          >
            <GraduationCap className="size-4" />
          </button>
          <button
            onClick={() => onSelectMenu("calendario")}
            title="Calendario"
            className={`flex-1 flex items-center justify-center h-8 rounded-lg text-white transition-transform active:scale-95 shadow-xs cursor-pointer ${
              activeMenu === "calendario" ? "ring-2 ring-sky-600 bg-sky-600" : "bg-sky-500 hover:bg-sky-600"
            }`}
          >
            <Calendar className="size-4" />
          </button>
          <button
            onClick={() => {
              sileo.info({
                title: "Mensajería",
                description: "No tienes nuevos avisos o mensajes pendientes.",
              });
            }}
            title="Avisos y Mensajes"
            className="flex-1 flex items-center justify-center h-8 rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-transform active:scale-95 shadow-xs cursor-pointer"
          >
            <Mail className="size-4" />
          </button>
          <button
            onClick={() => {
              sileo.show({
                title: `${user.nombre} ${user.apellido}`,
                description: `Rol: ${user.roles[0] || "Estudiante"} • RUT: ${user.rut}`,
              });
            }}
            title="Perfil de Usuario"
            className="flex-1 flex items-center justify-center h-8 rounded-lg text-white bg-rose-500 hover:bg-rose-600 transition-transform active:scale-95 shadow-xs cursor-pointer"
          >
            <User className="size-4" />
          </button>
        </div>

        <AdeccaLogo />
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        {/* Grupo: Navegación Principal */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2">
            Navegación
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeMenu === "mis-cursos"}
                  onClick={() => onSelectMenu("mis-cursos")}
                  className="cursor-pointer gap-2.5 font-medium"
                >
                  <BookOpen className="size-4 text-emerald-600" />
                  <span>Mis Cursos</span>
                  <span className="ml-auto text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {totalCourses}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeMenu === "cursos-publicos"}
                  onClick={() => {
                    onSelectMenu("cursos-publicos");
                    sileo.info({
                      title: "Cursos Públicos",
                      description: "Catálogo de asignaturas y cursos abiertos UBB.",
                    });
                  }}
                  className="cursor-pointer gap-2.5 font-medium text-slate-600"
                >
                  <Globe className="size-4 text-sky-600" />
                  <span>Cursos Públicos</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeMenu === "resultados-test"}
                  onClick={() => {
                    onSelectMenu("resultados-test");
                    sileo.info({
                      title: "Resultados Test",
                      description: "Historial de pruebas y evaluaciones rendidas.",
                    });
                  }}
                  className="cursor-pointer gap-2.5 font-medium text-slate-600"
                >
                  <CheckSquare className="size-4 text-indigo-600" />
                  <span>Resultados Test</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeMenu === "calendario"}
                  onClick={() => onSelectMenu("calendario")}
                  className="cursor-pointer gap-2.5 font-medium text-slate-600"
                >
                  <CalendarDays className="size-4 text-amber-600" />
                  <span>Calendario Académico</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeMenu === "bodega"}
                  onClick={() => {
                    onSelectMenu("bodega");
                    sileo.info({
                      title: "Mi Bodega",
                      description: "Archivos, documentos y recursos personales de estudio.",
                    });
                  }}
                  className="cursor-pointer gap-2.5 font-medium text-slate-600"
                >
                  <Archive className="size-4 text-purple-600" />
                  <span>Mi Bodega</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="my-2" />

        {/* Grupo: Institucional */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2">
            Institucional
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => {
                    sileo.show({
                      title: "Mesa de Ayuda Adecca",
                      description: "Contacto: adecca@ubiobio.cl • Teléfono: (56-42) 2463300",
                    });
                  }}
                  className="cursor-pointer gap-2.5 text-xs text-slate-600"
                >
                  <HelpCircle className="size-4 text-slate-400" />
                  <span>Mesa de Ayuda</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => {
                    sileo.info({
                      title: "Reglamento Académico",
                      description: "Reglamento general del estudiante UBB periodo 2026.",
                    });
                  }}
                  className="cursor-pointer gap-2.5 text-xs text-slate-600"
                >
                  <FileText className="size-4 text-slate-400" />
                  <span>Reglamento y Normas</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer del Sidebar con usuario y botón Cerrar sesión */}
      <SidebarFooter className="p-3 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="size-8 rounded-full bg-slate-900 text-white font-semibold text-xs flex items-center justify-center shrink-0">
              {user.nombre.charAt(0)}
              {user.apellido.charAt(0)}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-slate-800 truncate">
                {user.nombre} {user.apellido}
              </span>
              <span className="text-[10px] text-slate-500 truncate">
                {user.roles[0] || "Estudiante"}
              </span>
            </div>
          </div>

          <button
            onClick={onLogout}
            title="Cerrar sesión"
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
