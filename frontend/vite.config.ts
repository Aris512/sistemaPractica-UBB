import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

/**
 * vite.config.ts — Configuración del servidor de desarrollo.
 *
 * El plugin adminAuthPlugin fue eliminado. Ya no se intercepta /admin a nivel
 * del middleware de Vite ni se reenvía el 401 con WWW-Authenticate: Basic al navegador.
 *
 * El control de acceso a /admin ahora funciona así:
 *
 * 1. Vite sirve la SPA React para cualquier ruta (incluyendo /admin).
 * 2. AdminPage (admin/page.tsx) verifica si hay sesión admin en sessionStorage/cookie.
 *    - Sin sesión → muestra LoginForm con context="admin" (formulario propio, sin popup nativo).
 *    - Con sesión → monta AdminPanel con todos los datos del panel.
 * 3. LoginForm llama a POST /api/auth/admin-login (ruta pública) para validar credenciales.
 * 4. Si son correctas, almacena el header Basic en sessionStorage y monta el panel.
 * 5. Todas las llamadas a /admin/** (datos) pasan por adminFetch que inyecta el header,
 *    y Spring Security valida en cada request sin mostrar popup.
 */
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
})