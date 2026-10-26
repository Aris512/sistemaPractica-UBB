/**
 * Limpia un RUT eliminando puntos, guiones y espacios en blanco, y convirtiéndolo a mayúsculas.
 * Ejemplo: " 12345678-k " -> "12345678K"
 */
export function cleanRut(rut: string): string {
  if (!rut) return "";
  return rut.replace(/[^0-9kK]/g, "").toUpperCase();
}

/**
 * Calcula el dígito verificador para el cuerpo numérico de un RUT mediante Módulo 11.
 */
export function calculateDv(body: string): string {
  let sum = 0;
  let multiplier = 2;

  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i], 10) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const remainder = 11 - (sum % 11);
  if (remainder === 11) return "0";
  if (remainder === 10) return "K";
  return String(remainder);
}

/**
 * Valida si un RUT chileno es válido según el algoritmo Módulo 11.
 */
export function validateRut(rut: string): boolean {
  if (!rut || typeof rut !== "string") return false;

  const cleaned = cleanRut(rut);
  if (cleaned.length < 8 || cleaned.length > 9) return false;

  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);

  if (!/^\d+$/.test(body)) return false;

  return calculateDv(body) === dv;
}

/**
 * Formatea un RUT únicamente con guión (sin puntos): "12345678-9".
 */
export function formatRut(rut: string): string {
  const cleaned = cleanRut(rut);
  if (!cleaned) return "";

  // Si tiene al menos 2 caracteres, separa cuerpo y dígito verificador con un guión
  if (cleaned.length >= 2) {
    const body = cleaned.slice(0, -1);
    const dv = cleaned.slice(-1);
    return `${body}-${dv}`;
  }

  return cleaned;
}

/**
 * Formato estándar (cuerpo con guión): "12345678-9"
 */
export function formatRutStandard(rut: string): string {
  return formatRut(rut);
}
