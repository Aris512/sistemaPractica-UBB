import type { UserSession } from "@/types/auth";

const USER_SESSION_KEY = "ubb_user_session";

const ROLE_MENU_KEYS = [
  "ubb_active_menu_estudiante",
  "ubb_active_menu_profesor",
  "ubb_active_menu_profesor_ctutor",
  "ubb_active_menu_coordinador",
] as const;

/**
 * Obtiene la sesión del usuario persistida en localStorage.
 * Retorna null si no hay sesión o si el formato es inválido.
 */
export function getStoredUserSession(): UserSession | null {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(USER_SESSION_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && typeof parsed.rut === "string" && parsed.rut.trim() !== "") {
      return parsed as UserSession;
    }
  } catch (error) {
    console.warn("No se pudo leer la sesión del usuario en almacenamiento local:", error);
    try {
      window.localStorage.removeItem(USER_SESSION_KEY);
    } catch {
      // Ignorar errores al limpiar datos corruptos
    }
  }

  return null;
}

/**
 * Guarda la sesión del usuario en localStorage para persistir tras refrescar la página.
 */
export function setStoredUserSession(user: UserSession): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  try {
    window.localStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
  } catch (error) {
    console.error("No se pudo guardar la sesión del usuario:", error);
  }
}

/**
 * Elimina la sesión activa y los menús de navegación guardados en sesión.
 */
export function clearStoredUserSession(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (window.localStorage) {
      window.localStorage.removeItem(USER_SESSION_KEY);
    }
    if (window.sessionStorage) {
      for (const key of ROLE_MENU_KEYS) {
        window.sessionStorage.removeItem(key);
      }
    }
  } catch (error) {
    console.warn("Error al limpiar la sesión local:", error);
  }
}
