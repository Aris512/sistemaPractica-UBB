import { useState, useEffect } from "react";
import type { UserSession } from "../../types/auth";
import {
  type CourseItem,
  type ModalType,
  type HomeMenuKey,
  INITIAL_COURSES,
  PREVIOUS_COURSES,
} from "./types";
import { HomeSidebar } from "./HomeSidebar";
import { HomeHeader } from "./HomeHeader";
import { CourseCard } from "./CourseCard";
import { CourseDetailModal } from "./CourseDetailModal";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Info, Sparkles, Users, ChevronDown } from "lucide-react";
import { sileo } from "sileo";

interface HomePageProps {
  user: UserSession;
  onLogout: () => void;
}

export function HomePage({ user, onLogout }: HomePageProps) {
  const [activeMenu, setActiveMenu] = useState<HomeMenuKey>("mis-cursos");
  const [showPreviousCourses, setShowPreviousCourses] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CourseItem | null>(null);
  const [activeModalType, setActiveModalType] = useState<ModalType | null>(null);
  const [dbCourses, setDbCourses] = useState<CourseItem[]>([]);
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

  // Carga de asignaturas dinámicas desde backend
  useEffect(() => {
    const fetchAsignaturas = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/asignaturas");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const mapped: CourseItem[] = data.map((asig: any, index: number) => ({
              id: asig.idAsignatura || `db-${index}`,
              nombre: (asig.nombre || "").toUpperCase(),
              coordinador: "Profesor Asignado UBB",
              codigo: `UBB-${String(asig.idAsignatura || index + 1).padStart(4, "0")}`,
              participantes: 30 + ((index * 4) % 15),
              sede: "Concepción",
              periodo: "2026 - 2",
              avisos: index % 2 === 0 ? 1 : 0,
              actividades: 3 + ((index * 2) % 8),
              proximas: index % 3 === 0 ? 1 : 0,
              semestre: asig.semestre,
              esAnterior: false,
            }));
            setDbCourses(
              mapped.filter((m) => !INITIAL_COURSES.some((c) => c.nombre === m.nombre))
            );
          }
        }
      } catch (err) {
        console.warn("No se pudieron cargar asignaturas del backend, usando datos por defecto:", err);
      }
    };

    fetchAsignaturas();
  }, []);

  const openActionModal = (course: CourseItem, type: ModalType) => {
    setSelectedCourse(course);
    setActiveModalType(type);
  };

  const activeCoursesList = [...INITIAL_COURSES, ...dbCourses];
  const displayedCourses = showPreviousCourses
    ? [...activeCoursesList, ...PREVIOUS_COURSES]
    : activeCoursesList;

  return (
    <SidebarProvider defaultOpen>
      {/* Sidebar shadcn modular */}
      <HomeSidebar
        user={user}
        activeMenu={activeMenu}
        onSelectMenu={setActiveMenu}
        onLogout={onLogout}
        totalCourses={displayedCourses.length}
      />

      {/* Área principal */}
      <SidebarInset className="bg-[#f8fafc] min-h-screen flex flex-col">
        {/* Cabecera institucional con escudo UBB y migas de pan */}
        <HomeHeader
          user={user}
          onLogout={onLogout}
          onSelectMenu={setActiveMenu}
          formattedDate={formattedDate}
        />

        {/* Contenido principal */}
        <main className="flex-1 p-4 sm:p-8 max-w-5xl w-full mx-auto space-y-6">
          {/* Título de la página */}
          <div className="border-b border-slate-200 pb-3">
            <h1 className="text-2xl font-bold tracking-tight text-[#0f4c81] flex flex-wrap items-baseline gap-2">
              <span>Mis Cursos</span>
              <span className="text-slate-400 font-light text-xl">»</span>
              <span className="text-sm font-normal text-slate-500">
                Listado de cursos en los que participa
              </span>
            </h1>
          </div>

          {/* Banner de Bienvenida y Métricas de Conexión */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            <div className="lg:col-span-9 bg-sky-50/70 border border-sky-200/80 rounded-xl p-4 flex items-center justify-between gap-3 text-sky-950 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                  <Info className="size-4.5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-sky-900">
                    ¡Amig@s de Adecca!
                  </h2>
                  <p className="text-xs text-sky-800">
                    Bienvenid@s al periodo académico <strong>2026-2</strong>
                  </p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-1 text-[11px] text-sky-700 font-medium bg-sky-100/60 px-2.5 py-1 rounded-md">
                <Sparkles className="size-3 text-sky-600" />
                <span>UBB Virtual</span>
              </div>
            </div>

            <div className="lg:col-span-3 bg-white border border-slate-200/80 rounded-xl p-3.5 px-4 flex items-center gap-3 shadow-xs">
              <div className="size-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Users className="size-5" />
              </div>
              <div className="leading-tight">
                <div className="text-2xl font-black text-slate-800">34</div>
                <div className="text-[11px] font-semibold text-slate-500">
                  Usuarios Conectados
                </div>
              </div>
            </div>
          </div>

          {/* Listado de cursos modulares */}
          <section className="space-y-4">
            {displayedCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onOpenModal={openActionModal}
              />
            ))}
          </section>

          {/* Botón Ver cursos anteriores */}
          <div className="flex justify-center pt-2">
            <Button
              variant="outline"
              onClick={() => setShowPreviousCourses(!showPreviousCourses)}
              className="bg-[#2a77b9] hover:bg-[#20639d] text-white border-transparent hover:text-white shadow-xs px-6 py-2 h-auto text-xs font-semibold cursor-pointer gap-2 transition-all"
            >
              <ChevronDown
                className={`size-4 transition-transform ${showPreviousCourses ? "rotate-180" : ""}`}
              />
              <span>
                {showPreviousCourses
                  ? "Ocultar cursos anteriores"
                  : "Ver cursos anteriores"}
              </span>
            </Button>
          </div>
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
              Acerca de Adecca
            </a>
            , Universidad del Bío-Bío © 2013-2026
          </p>
          <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400">
            <button
              onClick={() => sileo.show({ title: "Mesa de Ayuda", description: "adecca@ubiobio.cl" })}
              className="hover:text-slate-600 cursor-pointer"
            >
              Mesa de Ayuda
            </button>
            <span>•</span>
            <button
              onClick={() => sileo.show({ title: "Soporte Técnico", description: "Atención de lunes a viernes 08:30 a 18:00 hrs." })}
              className="hover:text-slate-600 cursor-pointer"
            >
              Soporte Técnico
            </button>
            <span>•</span>
            <button
              onClick={() => sileo.show({ title: "Términos de Uso", description: "Uso exclusivo para la comunidad universitaria UBB." })}
              className="hover:text-slate-600 cursor-pointer"
            >
              Condiciones de Uso
            </button>
          </div>
        </footer>

        {/* Modal Interactivo de Avisos y Actividades */}
        <CourseDetailModal
          isOpen={Boolean(activeModalType && selectedCourse)}
          onClose={() => {
            setActiveModalType(null);
            setSelectedCourse(null);
          }}
          course={selectedCourse}
          modalType={activeModalType}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
