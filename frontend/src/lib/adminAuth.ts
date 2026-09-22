/**
 * Utilidades para la autenticación del panel de administración.
 * Lee las credenciales de la cookie de sesión o sessionStorage establecida por el proxy de Vite / backend.
 * Nunca almacena contraseñas en texto plano ni quemadas en el código fuente.
 */

export function getAdminAuthHeader(): Record<string, string> {
  // 1. Intentar leer desde la cookie de sesión establecida al autenticarse en /admin
  if (typeof document !== "undefined") {
    const match = document.cookie.match(/(?:^|; )admin_auth=([^;]*)/);
    if (match && match[1]) {
      const decoded = decodeURIComponent(match[1]);
      if (decoded) {
        return { Authorization: decoded };
      }
    }
  }

  // 2. Intentar leer desde sessionStorage (respaldo)
  if (typeof window !== "undefined" && window.sessionStorage) {
    const stored = window.sessionStorage.getItem("admin_auth_header");
    if (stored) {
      return { Authorization: stored };
    }
  }

  return {};
}

export function setAdminAuthHeader(header: string): void {
  if (typeof document !== "undefined") {
    document.cookie = `admin_auth=${encodeURIComponent(header)}; Path=/; SameSite=Lax`;
  }
  if (typeof window !== "undefined" && window.sessionStorage) {
    window.sessionStorage.setItem("admin_auth_header", header);
  }
}

export function clearAdminAuth(): void {
  if (typeof document !== "undefined") {
    document.cookie = "admin_auth=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
  }
  if (typeof window !== "undefined" && window.sessionStorage) {
    window.sessionStorage.removeItem("admin_auth_header");
  }
}

/**
 * Envoltorio de fetch para endpoints del área administrativa (/admin/...).
 * Inyecta automáticamente el encabezado de autorización dinámico y detecta
 * si el backend devuelve 401 (por cambio de clave en .env) para limpiar la sesión
 * y solicitar la reautenticación inmediata al usuario.
 */
export async function adminFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const authHeaders = getAdminAuthHeader();
  const headers = new Headers(init?.headers);

  if (authHeaders.Authorization && !headers.has("Authorization")) {
    headers.set("Authorization", authHeaders.Authorization);
  }

  const response = await fetch(input, {
    ...init,
    headers,
  });

  if (response.status === 401) {
    // Si el backend responde 401, significa que las credenciales en .env cambiaron o expiraron
    clearAdminAuth();
    if (typeof window !== "undefined") {
      window.location.href = "/admin?reauth=1";
    }
  }

  return response;
}
