import type { UserSession } from "../../types/auth";
import type { HomeMenuKey } from "./types";
import escudoImg from "../login/logo/escudo.png";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { BookOpen, Calendar, Archive, LogOut, Home } from "lucide-react";
import { sileo } from "sileo";

interface HomeHeaderProps {
  user: UserSession;
  onLogout: () => void;
  onSelectMenu: (menu: HomeMenuKey) => void;
  formattedDate: string;
}

export function HomeHeader({
  user,
  onLogout,
  onSelectMenu,
  formattedDate,
}: HomeHeaderProps) {
  return (
    <>
      {/* Barra Superior Institucional */}
      <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
        {/* Lado Izquierdo: Trigger del sidebar + Escudo UBB */}
        <div className="flex items-center gap-3">
          <SidebarTrigger className="text-slate-600 hover:text-slate-900 cursor-pointer" />

          <div className="h-5 w-px bg-slate-200 hidden sm:block" />

          <div className="flex items-center gap-2.5 select-none">
            <img
              src={escudoImg}
              alt="Escudo Universidad del Bío-Bío"
              className="h-9 w-auto object-contain"
            />
            <div className="hidden md:flex flex-col leading-tight">
              <span className="text-[11px] font-extrabold tracking-wider text-[#002f6c] uppercase">
                Universidad del Bío-Bío
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                Campus Concepción • Chillán
              </span>
            </div>
          </div>
        </div>

        {/* Lado Derecho: Pestañas superiores y Bienvenida */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => onSelectMenu("mis-cursos")}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer shadow-xs"
          >
            <BookOpen className="size-3.5 text-emerald-600" />
            <span>Mis Cursos</span>
          </button>

          <button
            onClick={() => onSelectMenu("calendario")}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-200 hover:bg-sky-100 transition-colors cursor-pointer shadow-xs"
          >
            <Calendar className="size-3.5 text-sky-600" />
            <span>Calendario</span>
          </button>

          <button
            onClick={() => {
              sileo.info({
                title: "Mi Bodega",
                description: "Repositorio personal de recursos y tareas",
              });
            }}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <Archive className="size-3.5 text-slate-500" />
            <span>Mi Bodega</span>
          </button>

          {/* Menú de bienvenida de usuario */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/90 rounded-lg px-2.5 py-1">
              <div className="size-6 rounded-full bg-[#8c1d40] text-white flex items-center justify-center font-bold text-[10px]">
                {user.nombre.charAt(0)}
              </div>
              <span className="text-xs font-semibold text-slate-800 hidden sm:inline">
                Bienvenid@ {user.nombre}
              </span>
              <button
                onClick={onLogout}
                title="Cerrar sesión"
                className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer ml-1"
              >
                <LogOut className="size-3.5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Sub-barra de Migas de Pan y Fecha Actual */}
      <div className="bg-white/80 border-b border-slate-200/70 px-4 sm:px-8 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500">
          <Home className="size-3.5 text-slate-400" />
          <span>Inicio</span>
          <span className="text-slate-300">/</span>
          <span className="text-sky-700 font-semibold">Cursos</span>
        </div>

        <div className="text-slate-500 text-[11px] font-medium sm:text-right">
          {formattedDate}
        </div>
      </div>
    </>
  );
}
