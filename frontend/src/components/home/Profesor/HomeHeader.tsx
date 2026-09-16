import type { UserSession } from "@/types/auth";
import escudoImg from "@/components/login/logo/escudo.png";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarBadge } from "@/components/ui/avatar";

interface HomeHeaderProps {
  user: UserSession;
  formattedDate: string;
  onOpenProfile?: () => void;
}

export function HomeHeader({
  user,
  formattedDate,
  onOpenProfile,
}: HomeHeaderProps) {
  const rolDisplay = (user.roles && user.roles[0]) || user.rol || "Profesor";

  const getInitials = () => {
    if (user.nombre && user.apellido) {
      return `${user.nombre.charAt(0)}${user.apellido.charAt(0)}`.toUpperCase();
    }
    if (user.nombre) {
      return user.nombre.slice(0, 2).toUpperCase();
    }
    return "P";
  };

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

      {/* Lado Derecho: Fecha en tiempo real + Identificación de Docente (Avatar interactivo) */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Fecha en tiempo real */}
        <div className="text-right hidden sm:block">
          <div className="text-xs font-semibold text-slate-700">
            {formattedDate}
          </div>
        </div>

        <div className="h-6 w-px bg-slate-200 hidden sm:block" />

        {/* Identificación del Docente con Avatar interactivo */}
        <button
          type="button"
          onClick={onOpenProfile}
          className="flex items-center gap-2.5 p-1.5 -mr-1 rounded-xl hover:bg-slate-100/80 active:bg-slate-200/70 transition-all cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-sky-500/40 group"
          title="Ver mi perfil docente"
        >
          <Avatar size="default" className="border border-sky-200/80 bg-sky-50 text-sky-800 transition-transform group-hover:scale-105">
            <AvatarFallback className="bg-sky-100 text-sky-900 font-bold text-xs">
              {getInitials()}
            </AvatarFallback>
            <AvatarBadge className="bg-emerald-500 ring-white" />
          </Avatar>
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold text-slate-800 leading-tight group-hover:text-sky-700 transition-colors">
              {user.nombre} {user.apellido || ""}
            </span>
            <span className="text-[10.5px] font-medium text-sky-700 leading-tight">
              {rolDisplay}
            </span>
          </div>
        </button>
      </div>
    </header>
  );
}
