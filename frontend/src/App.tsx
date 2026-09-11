import { useState } from "react";
import { LoginForm } from "./components/login/LoginForm";
import { InfoPanel } from "./components/login/InfoPanel";
import { InstitutionalFooter } from "./components/login/InstitutionalFooter";
import { HomePage } from "./components/home/HomePage";
import type { UserSession } from "./types/auth";

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);

  // If user is authenticated, display the full Neumorphic Home Page
  if (currentUser) {
    return <HomePage user={currentUser} onLogout={() => setCurrentUser(null)} />;
  }

  // Otherwise, display the Neumorphic Login Page
  return (
    <div className="blueprint-bg min-h-screen w-full flex flex-col items-center justify-center p-3 sm:p-6 md:p-10 relative select-none">
      {/* Blueprint Mathematical Equations Background Layer */}
      <div className="math-watermark select-none pointer-events-none">
        {/* Left side formulas */}
        <div className="absolute top-10 left-8 text-4xl opacity-70">
          μ = <span className="text-3xl">∑ (x_i · p_i)</span>
        </div>
        <div className="absolute top-36 left-4 text-7xl font-serif font-light opacity-60">
          Π
        </div>
        <div className="absolute bottom-32 left-8 text-3xl font-mono opacity-65">
          k = 1
        </div>
        <div className="absolute bottom-16 left-6 text-xs font-mono opacity-50">
          y = 2x² + 3y'<br />
          lim(x→0) [sin(x)/x] = 1
        </div>

        {/* Right side formulas */}
        <div className="absolute top-12 right-12 text-7xl font-serif font-light opacity-60">
          π
        </div>
        <div className="absolute top-44 right-6 text-5xl font-serif opacity-70">
          ∫ R [p^f (z)]
        </div>
        <div className="absolute bottom-28 right-8 text-4xl font-mono opacity-65">
          H(ω)
        </div>
        <div className="absolute bottom-10 right-14 text-sm font-mono opacity-50">
          ∇²ψ + (2m/ℏ²)(E - V)ψ = 0
        </div>

        {/* Center top & bottom formula snippets */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-sm font-mono opacity-40">
          f(x) = (1 / σ√(2π)) · e^(-(x-μ)² / 2σ²)
        </div>
      </div>

      {/* Quick Demo Preview Action (Top-Right) */}
      <div className="w-full max-w-[980px] flex justify-end mb-3 z-20">
        <button
          type="button"
          onClick={() =>
            setCurrentUser({
              idUsuario: 1,
              nombre: "Estudiante",
              apellido: "Prueba",
              correo: "estudiante@test.com",
              roles: ["ESTUDIANTE"],
            })
          }
          className="neu-pill-btn px-3.5 py-1.5 text-xs text-slate-700 hover:text-slate-900 font-semibold flex items-center gap-1.5 shadow-sm bg-white/70"
          title="Ver cómo luce la página principal de base"
        >
          <span>👁️</span>
          <span>Vista previa Página Principal</span>
        </button>
      </div>

      {/* Main Neumorphic Card Container */}
      <main className="neu-card-main w-full max-w-[980px] p-6 sm:p-8 md:p-10 z-10">
        {/* Top Grid: Form and Information */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          {/* Left Column (5 cols on lg): Login Form */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <LoginForm onLoginSuccess={(user) => setCurrentUser(user)} />
          </div>

          {/* Right Column (7 cols on lg): Institutional Welcome & Bullet points */}
          <div className="lg:col-span-7 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-slate-300/60 pt-6 lg:pt-0 lg:pl-8">
            <InfoPanel />
          </div>
        </div>

        {/* Bottom Bar: Institutional Logos & CNA Accreditation Panels */}
        <div className="mt-8 border-t border-slate-300/70 pt-4">
          <InstitutionalFooter />
        </div>
      </main>
    </div>
  );
}