import type { UserSession } from "@/types/auth";
import escudoImg from "@/components/login/logo/escudo.png";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { LogOut } from "lucide-react";
import { sileo } from "sileo";

interface HomeHeaderProps {
  user: UserSession;
  onLogout: () => void;
  formattedDate: string;
}

export function HomeHeader({
  user,
  onLogout,
  formattedDate,
}: HomeHeaderProps) {
  return (
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
              Campus Concepción - Chillán
            </span>
          </div>
        </div>
      </div>

      {/* Lado Derecho: Fecha en tiempo real + Botón Salir */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="text-right hidden sm:block">
          <div className="text-xs font-semibold text-slate-800">
            {formattedDate}
          </div>
          <div className="text-[11px] text-slate-400">
            Bienvenido, <span className="font-medium text-slate-600">{user.nombre}</span>
          </div>
        </div>

        <button
          onClick={() => {
            sileo.show({
              title: "Sesión finalizada",
              description: "Hasta pronto " + user.nombre,
            });
            onLogout();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-slate-600 hover:text-rose-700 text-xs font-medium transition-colors cursor-pointer"
          title="Cerrar sesión"
        >
          <LogOut className="size-3.5" />
          <span className="hidden sm:inline">Cerrar Sesión</span>
        </button>
      </div>
    </header>
  );
}

