import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, type Plugin } from "vite"
import http from "node:http"

/**
 * Plugin que intercepta la navegación a /admin antes del SPA fallback de Vite
 * y valida la autenticación HTTP Basic directamente con Spring Boot (backend).
 *
 * Flujo:
 * 1. El usuario navega a http://localhost:5173/admin
 * 2. Si no ha proporcionado credenciales o son incorrectas:
 *    -> Spring Boot devuelve 401 + WWW-Authenticate: Basic realm="Admin Area"
 *    -> El plugin retransmite el 401 al navegador -> Salta el POP-UP nativo.
 * 3. Si el usuario ingresa credenciales correctas (configuradas en .env):
 *    -> Spring Boot devuelve 200 OK
 *    -> El plugin invoca next() -> Vite sirve el HTML de la aplicación React
 *    -> React monta App.tsx, detecta la ruta "/admin" y carga AdminPage (page.tsx).
 */
function adminAuthPlugin(): Plugin {
  return {
    name: "admin-auth",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const fullUrl = req.url ?? ""
        const urlWithoutQuery = fullUrl.split("?")[0]

        // Solo interceptar peticiones directas a /admin o /admin/
        // No interceptar peticiones de bundles, módulos o assets de Vite (/@vite, /src, etc.)
        const isAdminRoute = urlWithoutQuery === "/admin" || urlWithoutQuery === "/admin/"

        if (!isAdminRoute) {
          return next()
        }

        // Si se solicita forzar re-autenticación o logout mediante query param (?logout o ?reauth)
        if (fullUrl.includes("logout=1") || fullUrl.includes("reauth=1")) {
          res.statusCode = 401
          res.setHeader("WWW-Authenticate", 'Basic realm="Admin Area"')
          res.setHeader(
            "Set-Cookie",
            "admin_auth=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax"
          )
          res.setHeader("Content-Type", "text/html; charset=utf-8")
          res.end(
            "<!DOCTYPE html><html><head><meta charset='utf-8'><title>Sesión Cerrada</title></head><body style='font-family:sans-serif;padding:40px;text-align:center;'><h2>Sesión administrativa cerrada</h2><p>Has salido del panel de administración.</p><p><a href='/'>Ir a Inicio</a> | <a href='/admin'>Volver a Ingresar</a></p></body></html>"
          )
          return
        }

        const authHeader = req.headers["authorization"]

        // Verificar credenciales con Spring Boot en localhost:8080/admin
        const options: http.RequestOptions = {
          hostname: "127.0.0.1",
          port: 8080,
          path: "/admin",
          method: "GET",
          headers: {
            host: "localhost:8080",
            ...(authHeader ? { authorization: authHeader } : {}),
          },
        }

        const authReq = http.request(options, (authRes) => {
          if (authRes.statusCode === 401) {
            // Reenviar 401 + WWW-Authenticate para que el navegador muestre el popup nativo
            res.statusCode = 401
            res.setHeader(
              "WWW-Authenticate",
              authRes.headers["www-authenticate"] || 'Basic realm="Admin Area"'
            )
            res.setHeader(
              "Set-Cookie",
              "admin_auth=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax"
            )
            res.setHeader("Content-Type", "text/plain; charset=utf-8")
            res.end("401 Unauthorized: Ingrese credenciales de administrador")
            return
          }

          if (authRes.statusCode && authRes.statusCode >= 200 && authRes.statusCode < 300) {
            // Credenciales válidas -> Establecer cookie de sesión para los componentes de React
            if (authHeader) {
              res.setHeader(
                "Set-Cookie",
                `admin_auth=${encodeURIComponent(authHeader)}; Path=/; SameSite=Lax`
              )
            }
            // Vite sirve la SPA normalmente
            return next()
          }

          res.statusCode = authRes.statusCode ?? 500
          res.setHeader("Content-Type", "text/plain; charset=utf-8")
          res.end(`Error de autenticación backend: ${authRes.statusCode}`)
        })

        authReq.on("error", () => {
          res.statusCode = 502
          res.setHeader("Content-Type", "text/html; charset=utf-8")
          res.end(
            "<h1>502 Bad Gateway</h1><p>El backend Spring Boot (<code>localhost:8080</code>) no está respondiendo. Verifica que esté corriendo.</p>"
          )
        })

        authReq.end()
      })
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    adminAuthPlugin(),
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