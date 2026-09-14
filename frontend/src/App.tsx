import { useState, useEffect } from "react";
import { LoginForm } from "./components/login/LoginForm";
import { InfoPanel } from "./components/login/InfoPanel";
import { UbbLogoBadge } from "./components/login/UbbLogoBadge";
import { HomePage } from "./components/home/HomePage";
import AdminPage from "./components/admin/page";
import type { UserSession } from "./types/auth";

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener("popstate", handleLocationChange);
    return () => window.removeEventListener("popstate", handleLocationChange);
  }, []);

  // If path is /admin, render AdminPage
  if (currentPath === "/admin" || currentPath.startsWith("/admin/")) {
    return <AdminPage />;
  }

  // If user is authenticated, display the Home Page
  if (currentUser) {
    return <HomePage user={currentUser} onLogout={() => setCurrentUser(null)} />;
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
              <LoginForm onLoginSuccess={(user) => setCurrentUser(user)} />
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
}