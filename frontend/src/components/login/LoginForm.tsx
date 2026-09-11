import { useState } from "react";
import { AdeccaLogo } from "./AdeccaLogo";
import { loginUser } from "../../services/authService";
import type { UserSession } from "../../types/auth";

interface LoginFormProps {
  onLoginSuccess: (user: UserSession) => void;
}

export function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage("Por favor ingrese su correo electrónico institucional.");
      return;
    }

    if (!password) {
      setErrorMessage("Por favor ingrese su contraseña.");
      return;
    }

    setLoading(true);

    try {
      const result = await loginUser({ email: email.trim(), password });

      if (result.success && result.idUsuario) {
        onLoginSuccess({
          idUsuario: result.idUsuario,
          nombre: result.nombre || "",
          apellido: result.apellido || "",
          correo: result.correo || email.trim(),
          roles: result.roles || [],
        });
      } else {
        setErrorMessage(result.message || "Credenciales incorrectas.");
      }
    } catch {
      setErrorMessage("Error de conexión con el servidor. Inténtelo más tarde.");
    } finally {
      setLoading(false);
    }
  };

  // Quick fill helper for testing
  const handleQuickFill = (testEmail: string) => {
    setEmail(testEmail);
    setPassword("123456");
    setErrorMessage(null);
  };

  return (
    <div className="flex flex-col justify-between h-full">
      <div>
        {/* Header with Adecca Brand and Multi-node Icon */}
        <div className="mb-3">
          <AdeccaLogo />
        </div>

        {/* Divider matching reference image */}
        <div className="neu-divider font-sans text-xs text-slate-700 tracking-wide font-medium">
          Ingrese sus datos de Intranet
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Email Field (Replaces RUT o alias) */}
          <div className="relative">
            <input
              id="input-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              autoComplete="email"
              disabled={loading}
              className="neu-input w-full px-3.5 py-2.5 pr-10 text-sm font-sans placeholder-slate-400 focus:ring-0"
              required
            />
            {/* User Silhouette Icon */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path
                  fillRule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>

          {/* Password Field */}
          <div className="relative">
            <input
              id="input-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              autoComplete="current-password"
              disabled={loading}
              className="neu-input w-full px-3.5 py-2.5 pr-10 text-sm font-sans placeholder-slate-400 focus:ring-0"
              required
            />
            {/* Toggle Visibility / Lock Icon */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors focus:outline-none"
              title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
            >
              {showPassword ? (
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path
                    fillRule="evenodd"
                    d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-2.5 bg-rose-950/20 border border-rose-400/40 rounded-lg text-rose-700 text-xs font-medium text-center shadow-inner animate-fade-in">
              {errorMessage}
            </div>
          )}

          {/* Forgot Password Link */}
          <div className="text-center pt-0.5">
            <a
              href="#recuperar"
              onClick={(e) => {
                e.preventDefault();
                alert("Para recuperar su contraseña institucional, contacte a Mesa de Ayuda UBB o visite el portal de autoservicio.");
              }}
              className="text-xs text-slate-800 hover:text-slate-950 hover:underline transition-colors font-medium select-none"
            >
              ¿Olvidó su contraseña?
            </a>
          </div>

          {/* Neumorphic Magenta Action Button */}
          <div className="pt-1 flex justify-center">
            <button
              id="btn-login-submit"
              type="submit"
              disabled={loading}
              className="neu-btn-primary px-7 py-2 text-sm tracking-wide shadow-md select-none w-36"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Validando...</span>
                </>
              ) : (
                <>
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Ingresar</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Questions and Manual Help */}
        <div className="text-center pt-3 text-xs text-slate-700 space-y-0.5 select-none">
          <div className="font-medium text-slate-800">¿Tienes alguna duda?</div>
          <div>
            <a
              href="#manual"
              onClick={(e) => {
                e.preventDefault();
                alert("Manual de Adecca: Este sistema de prácticas conecta a estudiantes, profesores colaboradores y tutores de la Universidad del Bío-Bío.");
              }}
              className="hover:text-slate-950 hover:underline inline-flex items-center gap-1 text-slate-800 font-medium"
            >
              <span>📖</span>
              <span>Revisa el Manual de Adecca</span>
            </a>
          </div>
        </div>
      </div>

      {/* Quick Test Accounts Pill (Convenience for testing database accounts) */}
      <div className="mt-4 pt-3 border-t border-slate-300/60">
        <div className="text-[10px] uppercase tracking-wider text-slate-700 font-bold text-center mb-1.5 select-none">
          Cuentas de prueba (Tabla usuario)
        </div>
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          <button
            type="button"
            onClick={() => handleQuickFill("estudiante@test.com")}
            className="neu-pill-btn px-2 py-0.5 text-[11px] text-slate-700 hover:text-slate-900 font-medium"
            title="Rol: ESTUDIANTE (clave: 123456)"
          >
            Estudiante
          </button>
          <button
            type="button"
            onClick={() => handleQuickFill("profesor@test.com")}
            className="neu-pill-btn px-2 py-0.5 text-[11px] text-slate-700 hover:text-slate-900 font-medium"
            title="Rol: PROFESOR_ASIGNATURA (clave: 123456)"
          >
            Profesor
          </button>
          <button
            type="button"
            onClick={() => handleQuickFill("colaborador@test.com")}
            className="neu-pill-btn px-2 py-0.5 text-[11px] text-slate-700 hover:text-slate-900 font-medium"
            title="Rol: PROFESOR_COLABORADOR (clave: 123456)"
          >
            Colaborador
          </button>
          <button
            type="button"
            onClick={() => handleQuickFill("tutor@test.com")}
            className="neu-pill-btn px-2 py-0.5 text-[11px] text-slate-700 hover:text-slate-900 font-medium"
            title="Rol: TUTOR_PRACTICA (clave: 123456)"
          >
            Tutor
          </button>
        </div>
      </div>
    </div>
  );
}
