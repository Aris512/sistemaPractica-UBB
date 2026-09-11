import type { UserSession } from "../../types/auth";
import { AdeccaLogo } from "./AdeccaLogo";

interface UserSessionCardProps {
  user: UserSession;
  onLogout: () => void;
}

export function UserSessionCard({ user, onLogout }: UserSessionCardProps) {
  return (
    <div className="flex flex-col items-center justify-between h-full py-4 text-center">
      <div className="w-full flex flex-col items-center">
        <AdeccaLogo />

        <div className="my-6 p-6 neu-inset-panel w-full max-w-sm flex flex-col items-center">
          {/* Avatar with initials */}
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-pink-600 to-rose-400 text-white font-bold text-xl flex items-center justify-center shadow-lg border-2 border-white/60 mb-3">
            {user.nombre.charAt(0)}
            {user.apellido.charAt(0)}
          </div>

          <span className="text-xs uppercase tracking-wider font-semibold text-emerald-600 mb-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Autenticado en Base de Datos
          </span>

          <h3 className="text-xl font-bold text-slate-800">
            {user.nombre} {user.apellido}
          </h3>

          <p className="text-sm text-slate-500 font-sans mb-3">
            {user.correo}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-1.5 mb-2">
            {user.roles.map((rol) => (
              <span
                key={rol}
                className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200"
              >
                {rol}
              </span>
            ))}
          </div>

          <div className="text-[11px] text-slate-400">
            ID Usuario: <span className="font-mono text-slate-600 font-bold">#{user.idUsuario}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onLogout}
          className="neu-pill-btn px-6 py-2 text-sm text-slate-700 hover:text-rose-700 font-medium transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
