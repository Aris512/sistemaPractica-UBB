import type { UserSession } from "@/types/auth";

const USER_SESSION_KEY = "ubb_user_session";

const ROLE_MENU_KEYS = [
  "ubb_active_menu_estudiante",
  "ubb_active_menu_practica",
  "ubb_active_menu_profesor",
  "ubb_active_menu_profesor_ctutor",
  "ubb_active_menu_coordinador",
] as const;

/**
 * Obtiene la sesión del usuario persistida en sessionStorage.
 * Cada pestaña del navegador mantiene su propia sesión independiente,
 * lo que permite tener diferentes perfiles abiertos simultáneamente.
 * Retorna null si no hay sesión o si el formato es inválido.
 */
export function getStoredUserSession(): UserSession | null {
  if (typeof window === "undefined" || !window.sessionStorage) {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(USER_SESSION_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && typeof parsed.rut === "string" && parsed.rut.trim() !== "") {
      return parsed as UserSession;
    }
  } catch (error) {
    console.warn("No se pudo leer la sesión del usuario en almacenamiento de sesión:", error);
    try {
      window.sessionStorage.removeItem(USER_SESSION_KEY);
    } catch {
      // Ignorar errores al limpiar datos corruptos
    }
  }

  return null;
}

/**
 * Guarda la sesión del usuario en sessionStorage para persistir tras refrescar la página.
 * Al usar sessionStorage, cada pestaña tiene su propia sesión aislada.
 */
export function setStoredUserSession(user: UserSession): void {
  if (typeof window === "undefined" || !window.sessionStorage) {
    return;
  }

  try {
    window.sessionStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
  } catch (error) {
    console.error("No se pudo guardar la sesión del usuario:", error);
  }
}

/**
 * Obtiene si el estudiante pertenece a semestre de práctica (8.° o 9.°) guardado en sessionStorage.
 */
export function getStoredEsPractica(rut: string): boolean | null {
  if (typeof window === "undefined" || !window.sessionStorage || !rut) {
    return null;
  }
  try {
    const cached = window.sessionStorage.getItem(`ubb_es_practica_${rut}`);
    if (cached !== null) return cached === "true";
  } catch {}
  return null;
}

/**
 * Guarda si el estudiante pertenece a práctica en sessionStorage.
 */
export function setStoredEsPractica(rut: string, esPractica: boolean): void {
  if (typeof window === "undefined" || !window.sessionStorage || !rut) {
    return;
  }
  try {
    window.sessionStorage.setItem(`ubb_es_practica_${rut}`, String(esPractica));
  } catch {}
}

/**
 * Verifica asíncronamente si un estudiante pertenece a 8.° o 9.° semestre / práctica profesional.
 */
export async function verificarEstudianteEsPractica(rut: string): Promise<boolean> {
  if (!rut) return false;

  // 1. Intentar consultar por endpoint directo de RUT
  try {
    const res = await fetch(`/api/estudiantes/rut/${encodeURIComponent(rut)}`);
    if (res.ok) {
      const data = await res.json();
      const sem = String(data?.asignatura?.semestre || "");
      const nom = (data?.asignatura?.nombre || "").toLowerCase();
      const idAsig = data?.idAsignatura || data?.asignatura?.idAsignatura;
      const esDePractica =
        sem.includes("8") ||
        sem.includes("9") ||
        idAsig === 5 ||
        idAsig === 6 ||
        nom.includes("práctica") ||
        nom.includes("practica");
      return esDePractica;
    }
  } catch {}

  // 2. Intentar buscar en la lista general de estudiantes
  try {
    const listRes = await fetch("/api/estudiantes");
    if (listRes.ok) {
      const list = await listRes.json();
      const clean = rut.replace(/[.-]/g, "").toUpperCase().trim();
      const found = list.find((e: any) => {
        const r = (e.usuario?.rut || e.rutUsuario || "").replace(/[.-]/g, "").toUpperCase().trim();
        return r === clean;
      });
      if (found) {
        const sem = String(found?.asignatura?.semestre || "");
        const nom = (found?.asignatura?.nombre || "").toLowerCase();
        const idAsig = found?.idAsignatura || found?.asignatura?.idAsignatura;
        const esDePractica =
          sem.includes("8") ||
          sem.includes("9") ||
          idAsig === 5 ||
          idAsig === 6 ||
          nom.includes("práctica") ||
          nom.includes("practica");
        return esDePractica;
      }
    }
  } catch {}

  // 3. Fallback: verificar si tiene registros en /api/practicas
  try {
    const practicasRes = await fetch("/api/practicas");
    if (practicasRes.ok) {
      const practicas = await practicasRes.json();
      if (Array.isArray(practicas)) {
        const clean = rut.replace(/[.-]/g, "").toUpperCase().trim();
        const tienePractica = practicas.some((p: any) => {
          const pRut = (p.estudiante?.usuario?.rut || "").replace(/[.-]/g, "").toUpperCase().trim();
          return pRut === clean;
        });
        if (tienePractica) return true;
      }
    }
  } catch {}

  return false;
}

/**
 * Elimina la sesión activa y los menús de navegación guardados en sesión.
 */
export function clearStoredUserSession(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (window.sessionStorage) {
      window.sessionStorage.removeItem(USER_SESSION_KEY);
      for (const key of ROLE_MENU_KEYS) {
        window.sessionStorage.removeItem(key);
      }
      // Limpiar claves de práctica cacheadas
      Object.keys(window.sessionStorage).forEach((k) => {
        if (k.startsWith("ubb_es_practica_")) {
          window.sessionStorage.removeItem(k);
        }
      });
    }
  } catch (error) {
    console.warn("Error al limpiar la sesión local:", error);
  }
}
