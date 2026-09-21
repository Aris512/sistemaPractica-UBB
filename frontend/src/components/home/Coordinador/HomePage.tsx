import { useState, useEffect } from "react";
import type { UserSession } from "@/types/auth";
import type { CoordinadorMenuKey, EstudiantePractica } from "./types";
import { HomeSidebar } from "./HomeSidebar";
import { HomeHeader } from "./HomeHeader";
import { EstudiantesPracticaList } from "./EstudiantesPracticaList";
import { AsociarPracticaView } from "./AsociarPracticaView";
import { CentrosPracticaView } from "@/components/admin/centros_practica";
import { EvaluacionesView } from "@/components/admin/Evaluaciones";
import { PerfilProfesor } from "@/components/home/Profesor/PerfilProfesor";
import { Portafolio } from "@/components/home/Profesor/Portafolio";
import { DocumentosPracticaView } from "@/components/home/DocumentosPractica/DocumentosPracticaView";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Toaster } from "sileo";
import "sileo/styles.css";

interface CoordinadorHomePageProps {
  user: UserSession;
  onLogout: () => void;
}

export function CoordinadorHomePage({ user, onLogout }: CoordinadorHomePageProps) {
  const [activeMenu, setActiveMenu] = useState<CoordinadorMenuKey>("inicio");
  const [formattedDate, setFormattedDate] = useState("");
  const [preselectedEstudiante, setPreselectedEstudiante] = useState<EstudiantePractica | null>(null);

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
      setFormattedDate("Sábado, 19 de septiembre de 2026");
    }
  }, []);

  const handleGoToAsociar = (estudiante?: EstudiantePractica) => {
    if (estudiante) {
      setPreselectedEstudiante(estudiante);
    }
    setActiveMenu("asociar");
  };

  const renderContent = () => {
    switch (activeMenu) {
      case "perfil":
        return <PerfilProfesor user={user} onBack={() => setActiveMenu("inicio")} />;
      case "asociar":
        return (
          <AsociarPracticaView
            initialEstudiante={preselectedEstudiante}
            onClearInitialEstudiante={() => setPreselectedEstudiante(null)}
          />
        );
      case "centros-practica":
        return <CentrosPracticaView />;
      case "evaluaciones":
        return <EvaluacionesView onBack={() => setActiveMenu("inicio")} />;
      case "documentos-practica":
        return <DocumentosPracticaView user={user} onBack={() => setActiveMenu("inicio")} />;
      case "portafolio":
        return <Portafolio user={user} onBack={() => setActiveMenu("inicio")} />;
      case "inicio":
      default:
        return <EstudiantesPracticaList onGoToAsociar={handleGoToAsociar} />;
    }
  };

  return (
    <SidebarProvider defaultOpen>
      <Toaster position="top-center" theme="light" />

      {/* Sidebar Coordinador */}
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

        {/* Footer Institucional UBB */}
        <footer className="mt-auto border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500 space-y-2">
          <p className="font-medium">
            <a
              href="https://www.ubiobio.cl"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-700 hover:underline font-semibold"
            >
              Acerca de Sistema de Práctica - Portal Docente
            </a>
            , Universidad del Bío-Bío © 2026
          </p>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
