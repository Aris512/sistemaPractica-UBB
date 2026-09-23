import type { PortafolioItem, EstudiantePortafolioSummary } from "@/types/portafolio";

export async function obtenerDocumentosPortafolio(rut: string): Promise<PortafolioItem[]> {
  const res = await fetch(`/api/portafolio/estudiante/${encodeURIComponent(rut)}`);
  if (!res.ok) {
    throw new Error(`Error al obtener portafolio (${res.status})`);
  }
  return res.json();
}

export async function eliminarDocumentoPortafolio(idDocumento: number): Promise<void> {
  const res = await fetch(`/api/portafolio/${idDocumento}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Error al eliminar archivo (${res.status})`);
  }
}

export async function obtenerEstudiantesPortafolio(idAsignatura?: number | string): Promise<EstudiantePortafolioSummary[]> {
  const url = idAsignatura 
    ? `/api/portafolio/estudiantes?idAsignatura=${encodeURIComponent(idAsignatura)}`
    : "/api/portafolio/estudiantes";
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Error al obtener lista de estudiantes (${res.status})`);
  }
  return res.json();
}

