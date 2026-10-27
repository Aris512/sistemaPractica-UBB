import { useCallback, useEffect, useRef, useState } from "react";
import type { PlanificacionRetro } from "@/types/retroalimentacion";
import type { UserSession } from "@/types/auth";
import { ChatIA, type RevisionChat } from "@/components/IA/ChatIA";
import { listarRetroalimentacionesEstudiante, reemplazarArchivoPlanificacion } from "@/services/retroalimentacionApi";

/**
 * Asistentes de IA del alumno en práctica: igual que el del estudiante regular, pero las conversaciones de
 * revisión de una planificación (creadas desde «Retroalimentación») permiten subir una versión corregida con el botón +.
 */
export function PracticaAsistentesIAView({ user }: { user: UserSession }) {
  const rut = user.rut;
  // conversación de revisión → planificación que revisa
  const [revisiones, setRevisiones] = useState<Map<number, number>>(new Map());
  const revisionesRef = useRef(revisiones);

  const aplicar = useCallback((datos: PlanificacionRetro[]) => {
    const mapa = new Map<number, number>();
    datos.forEach((p) => {
      const id = p.retroalimentacion?.idConversacion;
      if (id != null) mapa.set(id, p.idPlanificacion);
    });
    revisionesRef.current = mapa;
    setRevisiones(mapa);
  }, []);

  useEffect(() => {
    let cancelado = false;
    // Sin esta información el chat funciona igual, solo sin el botón +
    listarRetroalimentacionesEstudiante(rut).then(
      (datos) => !cancelado && aplicar(datos),
      () => undefined
    );
    return () => {
      cancelado = true;
    };
  }, [rut, aplicar]);

  const revision: RevisionChat = {
    esRevision: (idConversacion) => revisiones.has(idConversacion),
    reemplazarArchivo: async (idConversacion, archivo, mensaje) => {
      const idPlanificacion = revisionesRef.current.get(idConversacion);
      if (idPlanificacion === undefined) throw new Error("Esta conversación no corresponde a una revisión de planificación.");
      const inicio = await reemplazarArchivoPlanificacion(rut, idPlanificacion, archivo, mensaje);
      // La conversación nueva (si se reinició el ciclo) ya debe figurar como revisión
      const actualizadas = await listarRetroalimentacionesEstudiante(rut).catch(() => null);
      if (actualizadas) aplicar(actualizadas);
      return inicio;
    },
  };

  return <ChatIA rut={rut} revision={revision} />;
}
