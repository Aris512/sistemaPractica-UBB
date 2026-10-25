import { useState, useEffect } from "react";
import type { UserSession } from "@/types/auth";
import type { PracticaMenuKey } from "./types";
import { PracticaSidebar } from "./PracticaSidebar";
import { HomeHeader } from "@/components/home/Estudiante/HomeHeader";
import { PerfilUsuario } from "@/components/home/Estudiante/PerfilUsuario";
import { PracticaInicioView } from "./views/PracticaInicioView";
import { PracticaPortafolioView } from "./views/PracticaPortafolioView";
import { PracticaDocumentosView } from "./views/PracticaDocumentosView";
import { PracticaEvaluacionesView } from "./views/PracticaEvaluacionesView";
import { PracticaEquipoView } from "./views/PracticaEquipoView";
import { usePracticaEstudiante } from "./hooks/usePracticaEstudiante";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Toaster } from "sileo";
import "sileo/styles.css";
import { RefreshCw } from "lucide-react";

interface PracticaEstudianteHomePageProps {
  user: UserSession;
  onLogout: () => void;
}

export function PracticaEstudianteHomePage({
  user,
  onLogout,
}: PracticaEstudianteHomePageProps) {
  const [activeMenu, setActiveMenu] = useState<PracticaMenuKey>(() => {
    try {
      const saved = sessionStorage.getItem("ubb_active_menu_practica");
      if (saved) return saved as PracticaMenuKey;
    } catch {}
    return "inicio";
  });

  const [formattedDate, setFormattedDate] = useState("");
  const { datos, loading, recargar } = usePracticaEstudiante(user);

  useEffect(() => {
    try {
      sessionStorage.setItem("ubb_active_menu_practica", activeMenu);
    } catch {}
  }, [activeMenu]);

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
      setFormattedDate("Lunes, 21 de septiembre de 2026");
    }
  }, []);

  const renderContent = () => {
    if (loading && !datos) {
      return (
        <div className="py-24 flex flex-col items-center justify-center text-center">
          <RefreshCw className="size-8 text-sky-600 animate-spin mb-3" />
          <p className="text-sm font-semibold text-slate-700">
            Cargando entorno de práctica profesional...
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Sincronizando información académica y expediente
          </p>
        </div>
      );
    }

    if (!datos) {
      return null;
    }

    switch (activeMenu) {
      case "perfil":
        return <PerfilUsuario user={user} onBack={() => setActiveMenu("inicio")} />;
      case "portafolio":
        return (
          <PracticaPortafolioView
            user={user}
            datos={datos}
            onNavigate={setActiveMenu}
            onReload={recargar}
          />
        );
      case "documentos":
        return (
          <PracticaDocumentosView
            user={user}
            datos={datos}
            onReload={recargar}
          />
        );
      case "evaluaciones":
        return (
          <PracticaEvaluacionesView
            user={user}
            datos={datos}
          />
        );
      case "equipo":
        return (
          <PracticaEquipoView
            user={user}
            datos={datos}
          />
        );
      case "inicio":
      default:
        return (
          <PracticaInicioView
            user={user}
            datos={datos}
            onNavigate={setActiveMenu}
          />
        );
    }
  };

  return (
    <SidebarProvider defaultOpen>
      <Toaster position="top-center" theme="light" />

      {/* Sidebar de Práctica */}
      <PracticaSidebar
        user={user}
        activeMenu={activeMenu}
        onSelectMenu={setActiveMenu}
        onLogout={onLogout}
        semestre={datos?.semestre || 8}
        asignaturaNombre={datos?.asignaturaNombre || "Práctica Pedagógica"}
      />

      {/* Área Principal */}
      <SidebarInset className="bg-[#f8fafc] min-h-screen flex flex-col">
        {/* Cabecera institucional con escudo UBB */}
        <HomeHeader
          user={user}
          formattedDate={formattedDate}
          onOpenProfile={() => setActiveMenu("perfil")}
          onLogout={onLogout}
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
              Plataforma de Práctica Profesional
            </a>
            , Universidad del Bío-Bío © 2026
          </p>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
