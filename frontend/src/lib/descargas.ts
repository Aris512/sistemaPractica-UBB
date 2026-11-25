/** Nombre del archivo según la cabecera Content-Disposition (acepta filename*=UTF-8''…), o el de respaldo. */
export function nombreDesdeContentDisposition(disposition: string | null, porDefecto: string): string {
  if (!disposition) return porDefecto;
  const utf8 = /filename\*=UTF-8''([^;\n]+)/i.exec(disposition);
  if (utf8?.[1]) {
    try {
      return decodeURIComponent(utf8[1].trim());
    } catch {
      return utf8[1].trim();
    }
  }
  const simple = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/i.exec(disposition);
  if (simple?.[1]) return simple[1].replace(/['"]/g, "").trim() || porDefecto;
  return porDefecto;
}

/**
 * Guarda la respuesta del servidor como archivo en el equipo, con el nombre que envía el backend.
 *
 * Se descarga con fetch y un enlace blob: del mismo origen (no con window.open ni con un enlace al servidor):
 * así la sesión viaja en las cabeceras, no hay ventanas emergentes y el navegador no lo trata como una
 * descarga de otro sitio. El tipo MIME se fija explícitamente y el enlace se libera después, no en el mismo
 * instante del clic, porque algunos navegadores cancelan la descarga si se revoca antes de empezar.
 *
 * Nota: si el sitio se sirve por HTTP (sin HTTPS), Chrome puede advertir «Se bloqueó una descarga no segura»
 * en cualquier descarga. Esa advertencia solo desaparece sirviendo el sitio por HTTPS.
 */
export async function guardarRespuestaComoArchivo(res: Response, nombrePorDefecto: string, tipo?: string): Promise<string> {
  const original = await res.blob();
  const tipoFinal = tipo || original.type || "application/octet-stream";
  const blob = original.type === tipoFinal ? original : new Blob([original], { type: tipoFinal });
  const nombre = nombreDesdeContentDisposition(res.headers.get("Content-Disposition"), nombrePorDefecto);

  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombre;
  enlace.rel = "noopener";
  enlace.style.display = "none";
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return nombre;
}
