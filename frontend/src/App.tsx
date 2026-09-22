import { useState, useEffect, useCallback } from "react";
import { Toaster } from "sileo";
import { LoginForm } from "./components/login/LoginForm";
import { InfoPanel } from "./components/login/InfoPanel";
import { UbbLogoBadge } from "./components/login/UbbLogoBadge";
import { HomePage as EstudianteHomePage } from "./components/home/Estudiante";
import { ProfesorHomePage } from "./components/home/Profesor";
import { ProfesorCTutorHomePage } from "./components/home/ProfesorCTutor";
import { CoordinadorHomePage } from "./components/home/Coordinador";
import AdminPage from "./components/admin/page";
import type { UserSession } from "./types/auth";
import {
  getStoredUserSession,
  setStoredUserSession,
  clearStoredUserSession,
} from "./lib/authSession";

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(getStoredUserSession);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener("popstate", handleLocationChange);
    return () => window.removeEventListener("popstate", handleLocationChange);
  }, []);

  // Sincronizar estado de sesión entre pestañas del navegador
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "ubb_user_session") {
        if (!e.newValue) {
          setCurrentUser(null);
        } else {
          try {
            const parsed = JSON.parse(e.newValue);
            if (parsed && typeof parsed === "object" && parsed.rut) {
              setCurrentUser(parsed);
            } else {
              setCurrentUser(null);
            }
          } catch {
            setCurrentUser(null);
          }
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleLoginSuccess = useCallback((user: UserSession) => {
    setStoredUserSession(user);
    setCurrentUser(user);
  }, []);

  const handleLogout = useCallback(() => {
    clearStoredUserSession();
    setCurrentUser(null);
  }, []);

  const renderContent = () => {
    // If path is /admin, render AdminPage
    if (currentPath === "/admin" || currentPath.startsWith("/admin/")) {
      return <AdminPage />;
    }

    // If user is authenticated, display the appropriate Home Page based on role
    if (currentUser) {
      const allRoles = [
        ...(currentUser.roles || []),
        currentUser.rol || "",
      ].map((r) => r.toUpperCase());

      // 1. Coordinador de Práctica
      const isCoordinador = allRoles.some((r) => r.includes("COORDINADOR"));
      if (isCoordinador) {
        return <CoordinadorHomePage user={currentUser} onLogout={handleLogout} />;
      }

      // 2. Profesor Colaborador o Tutor de Práctica
      const isColaboradorOTutor = allRoles.some(
        (r) => r.includes("COLABORADOR") || r.includes("TUTOR")
      );

      if (isColaboradorOTutor) {
        return <ProfesorCTutorHomePage user={currentUser} onLogout={handleLogout} />;
      }

      // 2. Profesor Asignatura / Docente Titular
      const isProfesor = allRoles.some(
        (r) => r.includes("PROFESOR") || r.includes("DOCENTE")
      );

      if (isProfesor) {
        return <ProfesorHomePage user={currentUser} onLogout={handleLogout} />;
      }

      // 3. Estudiante (por defecto)
      return <EstudianteHomePage user={currentUser} onLogout={handleLogout} />;
    }

    // Otherwise, display the Login Page with subtle background pattern and neumorphic white container
    return (
      <div className="min-h-screen w-full flex flex-col justify-center items-center bg-[#edf2f7] p-4 sm:p-6 md:p-10 relative overflow-hidden">
        {/* Math doodles background layer with controlled opacity */}
        <div
          className="absolute inset-0 pointer-events-none select-none opacity-25 bg-repeat bg-center"
          style={{
            backgroundImage: "url('/math-doodles.svg')",
            backgroundSize: "680px 680px",
          }}
          aria-hidden="true"
        />

        {/* Main Container: Neumorphic white rectangle enclosing Login, InfoPanel & UBB Logo */}
        <div
          className="w-full max-w-5xl mx-auto bg-white rounded-[28px] p-6 sm:p-10 lg:p-12 relative z-10"
          style={{
            boxShadow:
              "18px 18px 36px rgba(162, 177, 192, 0.42), -16px -16px 36px rgba(255, 255, 255, 0.95), inset 1px 1px 2px rgba(255, 255, 255, 0.85)",
            border: "1px solid rgba(255, 255, 255, 0.8)",
          }}
        >
          {/* Top-Right UBB University Logo with smooth hover expansion to the left */}
          <UbbLogoBadge />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: LoginForm (5 cols) */}
            <div className="lg:col-span-5 w-full flex justify-center">
              <div className="w-full max-w-md">
                <LoginForm onLoginSuccess={handleLoginSuccess} />
              </div>
            </div>

            {/* Right Column: InfoPanel (7 cols) */}
            <div className="lg:col-span-7 w-full pt-4 lg:pt-0">
              <InfoPanel />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Toaster position="top-center" theme="light" />
      {renderContent()}
    </>
  );
}