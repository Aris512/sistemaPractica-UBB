import { useState, useEffect } from "react";
import type { UserSession } from "@/types/auth";
import type { ProfesorCTutorMenuKey } from "./types";
import { HomeSidebar } from "./HomeSidebar";
import { HomeHeader } from "./HomeHeader";
import { TableEstudiantes } from "./table";
import { Pautas } from "./Pautas";
import { Observaciones } from "./Observaciones";
import { PerfilProfesor } from "./PerfilProfesor";
import { Portafolio } from "../Profesor/Portafolio";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Toaster } from "sileo";
import { usePermissions } from "@/hooks/usePermissions";

interface HomePageProps {
  user: UserSession;
  onLogout: () => void;
}

export function HomePage({ user, onLogout }: HomePageProps) {
  const [activeMenu, setActiveMenu] = useState<ProfesorCTutorMenuKey>("inicio");
  const [formattedDate, setFormattedDate] = useState("");
  const { hasPermission } = usePermissions(user);

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
      setFormattedDate("Miércoles, 16 de septiembre de 2026");
    }
  }, []);

  const renderContent = () => {
    switch (activeMenu) {
      case "pautas":
        if (!hasPermission("EVALUACIONES_CONSULTAR") && !hasPermission("EVALUACIONES_REALIZAR")) {
          return <TableEstudiantes user={user} />;
        }
        return <Pautas onBack={() => setActiveMenu("inicio")} />;
      case "observaciones":
        if (!hasPermission("OBSERVACIONES_CONSULTAR") && !hasPermission("OBSERVACIONES_REGISTRAR")) {
          return <TableEstudiantes user={user} />;
        }
        return <Observaciones onBack={() => setActiveMenu("inicio")} />;
      case "portafolio":
        if (!hasPermission("PORTAFOLIO_SUBIR")) {
          return <TableEstudiantes user={user} />;
        }
        return <Portafolio onBack={() => setActiveMenu("inicio")} />;
      case "perfil":
        return <PerfilProfesor user={user} onBack={() => setActiveMenu("inicio")} />;
      case "inicio":
      default:
        return <TableEstudiantes user={user} />;
    }
  };

  return (
    <>
      <Toaster position="top-center" theme="light" />

      <SidebarProvider defaultOpen>
        {/* Sidebar para Tutor y Profesor Colaborador */}
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
          />

          {/* Contenido principal según menú activo */}
          <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto space-y-6">
            {renderContent()}
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
                Universidad del Bío-Bío
              </a>{" "}
              — Sistema Integrado de Prácticas Pedagógicas y Profesionales
            </p>
            <p className="text-slate-400 text-[11px]">
              Facultad de Educación y Humanidades • Plataforma Docente
            </p>
          </footer>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}
