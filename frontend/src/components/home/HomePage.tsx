import { useState } from "react";
import { AdeccaLogo } from "../login/AdeccaLogo";
import { InstitutionalFooter } from "../login/InstitutionalFooter";
import type { UserSession } from "../../types/auth";

interface HomePageProps {
  user: UserSession;
  onLogout: () => void;
}

export function HomePage({ user, onLogout }: HomePageProps) {
  const [activeTab, setActiveTab] = useState<"inicio" | "practicas" | "evaluaciones" | "documentos" | "ia">("inicio");
  const [selectedModule, setSelectedModule] = useState<string | null>(null);

  // Quick module definitions representing the practical system architecture
  const modules = [
    {
      id: "practicas",
      title: "Práctica Profesional",
      tag: "En curso",
      tagColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-emerald-600">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
          <path d="M6 12v5c3 3 9 3 12 0v-5" />
        </svg>
      ),
      description: "Registro de horas, asistencia y seguimiento con centro de práctica asignado.",
      detail: "Centro: Colegio Concepción San Pedro • Horas acumuladas: 180 / 360 hrs (50%)",
      progress: 50,
    },
    {
      id: "evaluaciones",
      title: "Evaluaciones y Rúbricas",
      tag: "1 Pendiente",
      tagColor: "bg-amber-100 text-amber-800 border-amber-200",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-amber-600">
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
        </svg>
      ),
      description: "Pautas de evaluación intermedia y final emitidas por el tutor y profesor colaborador.",
      detail: "Próxima pauta: Evaluación Intermedia de Desempeño (Vence: 28 Sep)",
      progress: 40,
    },
    {
      id: "planificaciones",
      title: "Planificaciones y Bitácora",
      tag: "Al día",
      tagColor: "bg-sky-100 text-sky-800 border-sky-200",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-sky-600">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
      description: "Diseño curricular de clases, planificaciones semanales y registro de actividades.",
      detail: "Última entrega: Planificación Unidad 2 - Aprobada por profesor colaborador",
      progress: 75,
    },
    {
      id: "documentos",
      title: "Documentación y Convenios",
      tag: "3 Validados",
      tagColor: "bg-indigo-100 text-indigo-800 border-indigo-200",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-indigo-600">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
      description: "Seguro escolar, carta de presentación oficial y convenios de colaboración.",
      detail: "Seguro escolar vigente • Carta de presentación firmada digitalmente",
      progress: 100,
    },
    {
      id: "ia",
      title: "Retroalimentación IA",
      tag: "Inteligente",
      tagColor: "bg-rose-100 text-[#b8144c] border-rose-200",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-[#b8144c]">
          <path d="M12 2a4 4 0 014 4c0 1.95-1.4 3.58-3.25 3.93L13 14h-2l.25-4.07C9.4 9.58 8 7.95 8 6a4 4 0 014-4z" />
          <path d="M9 18h6" />
          <path d="M10 22h4" />
        </svg>
      ),
      description: "Análisis con Inteligencia Artificial de notas de voz, bitácoras y observaciones pedagógicas.",
      detail: "2 notas de voz procesadas • Sugerencias de manejo de aula disponibles",
      progress: 60,
    },
    {
      id: "encuestas",
      title: "Diagnósticos y Encuestas",
      tag: "Cuestionarios",
      tagColor: "bg-purple-100 text-purple-800 border-purple-200",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-purple-600">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
      description: "Encuesta inicial diagnóstica y evaluación de clima en el centro de práctica.",
      detail: "Diagnóstico inicial respondido • Pendiente: Encuesta final de satisfacción",
      progress: 50,
    },
  ];

  return (
    <div className="blueprint-bg min-h-screen w-full flex flex-col items-center justify-start p-3 sm:p-6 md:p-8 relative select-none">
      {/* Blueprint Watermark Layer */}
      <div className="math-watermark select-none pointer-events-none">
        <div className="absolute top-10 left-8 text-4xl opacity-50">
          μ = ∑ (x_i · p_i)
        </div>
        <div className="absolute top-48 right-10 text-6xl font-serif opacity-50">
          π
        </div>
        <div className="absolute bottom-16 left-12 text-sm font-mono opacity-40">
          y = 2x² + 3y' • lim(x→0) [sin(x)/x] = 1
        </div>
      </div>

      {/* Main Container */}
      <main className="neu-card-main w-full max-w-[1180px] p-5 sm:p-7 md:p-9 z-10 space-y-6">
        {/* Top Navigation Bar */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-300/70">
          <div className="flex items-center gap-4">
            <AdeccaLogo />
            <div className="hidden xl:block h-8 w-[1px] bg-slate-300 mx-1"></div>
            <span className="hidden xl:inline text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Sistema de Prácticas Profesionales
            </span>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex flex-wrap items-center gap-1.5 neu-inset-panel p-1.5">
            <button
              type="button"
              onClick={() => setActiveTab("inicio")}
              className={`neu-tab ${activeTab === "inicio" ? "active" : ""}`}
            >
              Inicio
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("practicas")}
              className={`neu-tab ${activeTab === "practicas" ? "active" : ""}`}
            >
              Mis Prácticas
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("evaluaciones")}
              className={`neu-tab ${activeTab === "evaluaciones" ? "active" : ""}`}
            >
              Evaluaciones
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("documentos")}
              className={`neu-tab ${activeTab === "documentos" ? "active" : ""}`}
            >
              Documentos
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("ia")}
              className={`neu-tab ${activeTab === "ia" ? "active" : ""}`}
            >
              Asistente IA
            </button>
          </nav>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 text-right">
              {/* User Avatar */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-600 to-rose-400 text-white font-bold text-sm flex items-center justify-center shadow-md border-2 border-white/80 shrink-0">
                {user.nombre.charAt(0)}
                {user.apellido.charAt(0)}
              </div>

              <div className="leading-tight text-left">
                <div className="text-xs font-bold text-slate-800">
                  {user.nombre} {user.apellido}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                    {user.roles[0] || "USUARIO"}
                  </span>
                  <span className="text-[10px] text-slate-400">#{user.idUsuario}</span>
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              type="button"
              onClick={onLogout}
              className="neu-pill-btn p-2 text-slate-600 hover:text-rose-700 transition-colors"
              title="Cerrar sesión"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </header>

        {/* Hero Welcome Banner */}
        <section className="neu-inset-panel p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Semestre 2026-1 • Sesión Activa
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
              Bienvenido/a al Sistema de Prácticas, {user.nombre}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              Plataforma institucional de la Universidad del Bío-Bío para el monitoreo, evaluación y retroalimentación pedagógica continua de prácticas profesionales.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="neu-card-sm px-4 py-2.5 text-center bg-white/40">
              <div className="text-2xl font-bold text-slate-800 leading-none">180</div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold mt-1">Horas Realizadas</div>
            </div>
            <div className="neu-card-sm px-4 py-2.5 text-center bg-white/40">
              <div className="text-2xl font-bold text-rose-700 leading-none">94%</div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold mt-1">Asistencia</div>
            </div>
            <div className="neu-card-sm px-4 py-2.5 text-center bg-white/40">
              <div className="text-2xl font-bold text-emerald-700 leading-none">6.4</div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold mt-1">Nota Promedio</div>
            </div>
          </div>
        </section>

        {/* Module Cards Grid */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              Módulos del Sistema
            </h2>
            <span className="text-xs text-slate-500">
              Haga clic en un módulo para gestionar su información
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {modules.map((mod) => (
              <div
                key={mod.id}
                onClick={() => setSelectedModule(selectedModule === mod.id ? null : mod.id)}
                className={`neu-card-sm p-4 flex flex-col justify-between cursor-pointer transition-all ${
                  selectedModule === mod.id ? "ring-2 ring-rose-500/60 bg-white/70" : ""
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="p-2 neu-inset-panel rounded-xl">
                      {mod.icon}
                    </div>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${mod.tagColor}`}>
                      {mod.tag}
                    </span>
                  </div>

                  {/* Card Title & Desc */}
                  <h3 className="text-base font-bold text-slate-800 mb-1">
                    {mod.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-3">
                    {mod.description}
                  </p>
                </div>

                {/* Card Footer: Progress & Detail */}
                <div className="space-y-2 pt-2 border-t border-slate-200/80">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-medium truncate max-w-[190px]">{mod.detail}</span>
                    <span className="font-bold text-slate-700">{mod.progress}%</span>
                  </div>
                  <div className="neu-progress-track">
                    <div
                      className="neu-progress-fill"
                      style={{ width: `${mod.progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Secondary Two-Column Section: Recent Activity & Contacts */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
          {/* Recent Activity & Next Deadlines (7 cols) */}
          <div className="lg:col-span-7 neu-inset-panel p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span>📌</span>
                <span>Próximos Hitos y Actividades</span>
              </h3>
              <span className="text-[11px] text-slate-500 font-medium">Septiembre - Octubre 2026</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-white/60 rounded-xl border border-slate-200/80 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-rose-600 mt-1 shrink-0"></div>
                  <div>
                    <div className="font-bold text-slate-800">Visita de Supervisión en Terreno</div>
                    <div className="text-slate-500 text-[11px]">Tutor UBB visitará el Colegio Concepción San Pedro</div>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded shrink-0">
                  25 Septiembre
                </span>
              </div>

              <div className="p-3 bg-white/60 rounded-xl border border-slate-200/80 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-amber-500 mt-1 shrink-0"></div>
                  <div>
                    <div className="font-bold text-slate-800">Entrega de Informe de Bitácora N° 2</div>
                    <div className="text-slate-500 text-[11px]">Subir archivo PDF con firma del profesor colaborador</div>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded shrink-0">
                  30 Septiembre
                </span>
              </div>

              <div className="p-3 bg-white/60 rounded-xl border border-slate-200/80 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0"></div>
                  <div>
                    <div className="font-bold text-slate-800">Retroalimentación IA de Clase Grabada</div>
                    <div className="text-slate-500 text-[11px]">Análisis fonético y semántico de interacción en aula disponible</div>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded shrink-0">
                  Generado hoy
                </span>
              </div>
            </div>
          </div>

          {/* Contacts & Support (5 cols) */}
          <div className="lg:col-span-5 neu-inset-panel p-5 space-y-3 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3">
                <span>🏛️</span>
                <span>Contactos y Apoyo Institucional</span>
              </h3>

              <div className="space-y-2 text-xs text-slate-700">
                <div className="p-2.5 bg-white/60 rounded-xl border border-slate-200/80">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Tutor de Práctica UBB</div>
                  <div className="font-semibold text-slate-800">Prof. Rodrigo Valenzuela</div>
                  <div className="text-[11px] text-sky-700">rvalenzuela@ubiobio.cl</div>
                </div>

                <div className="p-2.5 bg-white/60 rounded-xl border border-slate-200/80">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Profesor Colaborador (Colegio)</div>
                  <div className="font-semibold text-slate-800">Prof. Andrea Morales</div>
                  <div className="text-[11px] text-slate-500">Colegio Concepción San Pedro</div>
                </div>
              </div>
            </div>

            {/* Help desk quick action */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => alert("Mesa de Ayuda Adecca: Para consultas comuníquese a adecca@ubiobio.cl o al fono (56-42)2463300.")}
                className="neu-btn-primary w-full py-2 text-xs font-semibold"
              >
                <span>💬</span>
                <span>Contactar Mesa de Ayuda</span>
              </button>
            </div>
          </div>
        </section>

        {/* Institutional Footer */}
        <div className="pt-4 border-t border-slate-300/70">
          <InstitutionalFooter />
        </div>
      </main>
    </div>
  );
}
