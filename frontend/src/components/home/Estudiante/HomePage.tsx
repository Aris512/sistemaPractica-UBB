import { useState, useEffect } from "react";
import type { UserSession } from "@/types/auth";
import type { HomeMenuKey } from "./types";
import { HomeSidebar } from "./HomeSidebar";
import { HomeHeader } from "./HomeHeader";
import { PerfilUsuario } from "./PerfilUsuario";
import { MallaCurricular } from "@/components/malla_curricular";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

interface HomePageProps {
  user: UserSession;
  onLogout: () => void;
}

export function HomePage({ user, onLogout }: HomePageProps) {
  const [activeMenu, setActiveMenu] = useState<HomeMenuKey>("inicio");
  const [formattedDate, setFormattedDate] = useState("");

  // Formato de fecha en español en tiempo real
  useEffect(() => {
    try {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      };
      const dateStr = new Intl.DateTimeFormat("es-CL", options).format(now);
      setFormattedDate(dateStr.charAt(0).toUpperCase() + dateStr.slice(1));
    } catch {
      setFormattedDate("Martes, 15 de septiembre de 2026");
    }
  }, []);

  return (
    <SidebarProvider defaultOpen>
      {/* Sidebar shadcn modular */}
      <HomeSidebar
        user={user}
        activeMenu={activeMenu}
        onSelectMenu={setActiveMenu}
        onLogout={onLogout}
      />

      {/* Área principal */}
      <SidebarInset className="bg-[#f8fafc] min-h-screen flex flex-col">
        {/* Cabecera institucional con escudo UBB */}
        <HomeHeader
          user={user}
          formattedDate={formattedDate}
          onOpenProfile={() => setActiveMenu("perfil")}
          onLogout={onLogout}
        />

        {/* Contenido principal: Malla Curricular interactiva o Perfil */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto space-y-6">
          {activeMenu === "perfil" ? (
            <PerfilUsuario user={user} onBack={() => setActiveMenu("inicio")} />
          ) : (
            <MallaCurricular userRut={user?.rut} />
          )}
        </main>

        {/* Footer Institucional */}
        <footer className="mt-auto border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500 space-y-2">
          <p className="font-medium">
            <a
              href="https://www.ubiobio.cl"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-700 hover:underline font-semibold"
            >
              Acerca de Sistema de Práctica
            </a>
            , Universidad del Bío-Bío © 2026
          </p>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
