import { useState, useEffect, useCallback } from "react";
import type { UserSession } from "@/types/auth";
import type {
  DatosPracticaEstudiante,
  SemestrePractica,
  DocumentoFiltroItem,
  EvaluacionItem,
  ObservacionItem,
  ItemPendiente,
  PersonaEquipo,
} from "../types";

export function usePracticaEstudiante(user: UserSession) {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [datos, setDatos] = useState<DatosPracticaEstudiante | null>(null);

  const rut = user.rut || "";

  const cargarDatos = useCallback(async () => {
    if (!rut) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Consultar información del estudiante en la base de datos
      let estudianteDb: any = null;
      try {
        const estRes = await fetch(`/api/estudiantes/rut/${encodeURIComponent(rut)}`);
        if (estRes.ok) {
          estudianteDb = await estRes.json();
        }
      } catch (e) {
        console.warn("No se pudo obtener datos del estudiante por RUT:", e);
      }

      // Si no se encontró por RUT específico, buscar en la lista completa
      if (!estudianteDb) {
        try {
          const listRes = await fetch("/api/estudiantes");
          if (listRes.ok) {
            const list = await listRes.json();
            const cleanRut = rut.replace(/[.-]/g, "").toUpperCase().trim();
            const found = list.find((item: any) => {
              const r = (item.usuario?.rut || item.rutUsuario || "").replace(/[.-]/g, "").toUpperCase().trim();
              return r === cleanRut;
            });
            if (found) estudianteDb = found;
          }
        } catch {}
      }

      // 2. Determinar Semestre (8 o 9) y Asignatura
      const asigDb = estudianteDb?.asignatura;
      const semStr = String(asigDb?.semestre || "");
      const nombreAsig = asigDb?.nombre || "";
      
      const esNoveno = semStr.includes("9") || nombreAsig.toLowerCase().includes("profesional");
      const semestre: SemestrePractica = esNoveno ? 9 : 8;
      const asignaturaNombre = esNoveno ? "Práctica Profesional" : "Práctica Pedagógica";
      const codigoAsignatura = esNoveno ? "PRA-501" : "PRA-403";

      // 3. Consultar Prácticas registradas en el backend
      let practicaEncontrada: any = null;
      try {
        const practicasRes = await fetch("/api/practicas");
        if (practicasRes.ok) {
          const practicas = await practicasRes.json();
          if (Array.isArray(practicas)) {
            const cleanRut = rut.replace(/[.-]/g, "").toUpperCase().trim();
            practicaEncontrada = practicas.find((p: any) => {
              const pRut = (p.estudiante?.usuario?.rut || "").replace(/[.-]/g, "").toUpperCase().trim();
              return pRut === cleanRut;
            });
          }
        }
      } catch {}

      // 4. Consultar Documentos del Expediente de Práctica
      let expedienteDoc: any = null;
      try {
        const expRes = await fetch(`/api/documentos-practica/estudiante/${encodeURIComponent(rut)}`);
        if (expRes.ok) {
          expedienteDoc = await expRes.json();
        }
      } catch {}

      // 5. Consultar Evidencias y Documentos del Portafolio (sin filtro soloPropios para que el estudiante vea también lo subido por el docente)
      let evidenciasPortafolio: any[] = [];
      try {
        const portRes = await fetch(`/api/portafolio/estudiante/${encodeURIComponent(rut)}`);
        if (portRes.ok) {
          evidenciasPortafolio = await portRes.json();
        }
      } catch (e) {
        console.warn("No se pudieron cargar documentos del portafolio:", e);
      }

      // 6. Consultar Observaciones de Práctica registradas
      let observacionesPractica: any[] = [];
      try {
        const obsRes = await fetch(`/api/observaciones-practica/estudiante/${encodeURIComponent(rut)}`);
        if (obsRes.ok) {
          observacionesPractica = await obsRes.json();
        }
      } catch {}

      const cleanUserRut = rut.replace(/[.-]/g, "").toUpperCase().trim();

      // Construcción consolidada de documentos
      const docsConsolidados: DocumentoFiltroItem[] = [];

      // A. Documentos del expediente obligatorio (tanto de estudiante como de profesor)
      if (expedienteDoc && Array.isArray(expedienteDoc.documentos)) {
        expedienteDoc.documentos.forEach((d: any, idx: number) => {
          const esDocEstudiante = d.tipoDocumento === "ESTUDIANTE";
          const nombreArch = d.nombreArchivo && d.nombreArchivo !== "—" ? d.nombreArchivo : d.nombreDocumento;
          const ext = nombreArch.includes(".") ? nombreArch.split(".").pop().toLowerCase() : "pdf";
          docsConsolidados.push({
            id: d.idDocumentoPractica || `exp-${idx}`,
            nombre: d.nombreDocumento || nombreArch,
            ext,
            tamanio: d.tamanio && d.tamanio !== "—" ? d.tamanio : "1.8 MB",
            fecha: d.fechaCarga ? new Date(d.fechaCarga).toLocaleDateString("es-CL") : "En proceso",
            categoria: "Informes",
            subidoPor: d.subidoPorNombre || d.subidoPor || (esDocEstudiante ? user.nombre : "Profesor Guía"),
            rolSubidoPor: esDocEstudiante ? "Estudiante" : "Profesor Guía",
            esPropio: esDocEstudiante,
            urlDescarga: d.urlDescarga || (d.idDocumentoPractica ? `/api/documentos-practica/descargar/${d.idDocumentoPractica}` : null),
          });
        });
      }

      // B. Documentos y evidencias del portafolio
      if (Array.isArray(evidenciasPortafolio)) {
        evidenciasPortafolio.forEach((item: any) => {
          const nombre = item.nombre || "Archivo de portafolio";
          const ext = nombre.includes(".") ? nombre.split(".").pop().toLowerCase() : "pdf";
          const tipoStr = (item.tipo || "").toUpperCase();
          let categoria: "Documentos" | "Evidencias" | "Informes" | "Otros" = "Evidencias";
          if (tipoStr.includes("INFORME") || tipoStr.includes("REFLEXION")) categoria = "Informes";
          else if (tipoStr.includes("EVIDENCIA")) categoria = "Evidencias";
          else if (tipoStr.includes("PAUTA") || tipoStr.includes("DOCUMENTO")) categoria = "Documentos";
          else categoria = "Otros";

          const itemRut = (item.subidoPorRut || item.rutUsuarioSubio || "").replace(/[.-]/g, "").toUpperCase().trim();
          const esPropio = itemRut === cleanUserRut || (!itemRut && item.usuarioSubioRol === "Estudiante");

          docsConsolidados.push({
            id: item.idDocumento,
            nombre: item.nombre,
            ext,
            tamanio: item.tamanioFormatted || (item.tamanio ? `${Math.round(item.tamanio / 1024)} KB` : "1.2 MB"),
            fecha: item.fechaCarga ? new Date(item.fechaCarga).toLocaleDateString("es-CL") : "Reciente",
            categoria,
            subidoPor: item.subidoPorNombre || item.usuarioSubioNombre || `${user.nombre} ${user.apellido || ""}`.trim(),
            rolSubidoPor: item.usuarioSubioRol || (esPropio ? "Estudiante" : "Profesor"),
            esPropio,
            urlDescarga: item.urlDescarga || `/api/portafolio/archivos/${item.idDocumento}/descargar`,
          });
        });
      }

      // 7. Evaluaciones reales del estudiante desde el backend
      const evalsConsolidadas: EvaluacionItem[] = [];
      try {
        const evalsRes = await fetch(`/api/evaluaciones/estudiante/rut/${encodeURIComponent(rut)}`);
        if (evalsRes.ok) {
          const listEvals = await evalsRes.json();
          if (Array.isArray(listEvals)) {
            listEvals.forEach((item: any, idx: number) => {
              if (!item.idEvaluacion && item.nota == null && !item.tipoEvaluacion) return;
              const obsList: ObservacionItem[] = [];
              if (item.observacion && item.observacion.trim()) {
                obsList.push({
                  id: `obs-ev-${item.idEvaluacion || idx}`,
                  evalId: item.idEvaluacion,
                  autor: item.evaluadorNombre || "Profesor Evaluador",
                  rol: "Docente",
                  fecha: item.fechaEvaluacion || "Reciente",
                  texto: item.observacion.trim(),
                  editada: false,
                });
              }
              evalsConsolidadas.push({
                id: item.idEvaluacion || idx + 1,
                titulo: item.tipoEvaluacion || item.tituloActividad || "Evaluación Formativa",
                evaluador: item.evaluadorNombre || "Profesor Evaluador",
                fecha: item.fechaEvaluacion || "En proceso",
                nota: item.nota != null ? String(item.nota).replace(".", ",") : null,
                estado: item.nota != null || item.estadoEvaluacion === "EVALUADO" ? "CALIFICADA" : "PENDIENTE",
                observaciones: obsList,
              });
            });
          }
        }
      } catch (e) {
        console.warn("No se pudieron cargar evaluaciones del estudiante:", e);
      }

      // 8. Observaciones generales reales de práctica
      const obsGenerales: ObservacionItem[] = [];
      if (Array.isArray(observacionesPractica) && observacionesPractica.length > 0) {
        observacionesPractica.forEach((o: any) => {
          obsGenerales.push({
            id: o.id || o.idObservacionPractica,
            autor: o.focoObservacion ? `${o.focoObservacion} (Docente)` : (o.autor || "Profesor Observador"),
            rol: o.rol || "Profesor Guía",
            fecha: o.fecha ? new Date(o.fecha).toLocaleDateString("es-CL") : (o.fechaFormateada || "Reciente"),
            texto: o.resumen || o.texto || "Observación de visita en aula escolar.",
            editada: Boolean(o.editada),
          });
        });
      }

      // 9. Equipo de práctica — datos reales de BD o null si no existen
      const centroNombre = practicaEncontrada?.centroPractica?.nombre || null;
      const centroDir = practicaEncontrada?.centroPractica?.direccion || null;
      const tutorNom = practicaEncontrada?.tutorPractica?.nombre || null;
      const tutorMail = practicaEncontrada?.tutorPractica?.usuario?.correo || null;
      const asignaturaDb = practicaEncontrada?.asignatura || null;
      const estadoAprobacionDb = practicaEncontrada?.estadoAprobacion || null;

      // Construir equipo solo con miembros que realmente existen en la BD
      const equipo: PersonaEquipo[] = [
        {
          nombre: `${user.nombre} ${user.apellido || ""}`.trim(),
          rol: `Estudiante Practicante (${semestre}.º Semestre)`,
          correo: user.correo,
          lugar: "Campus Concepción - Chillán",
        },
      ];

      // Agregar tutor solo si existe en la BD
      if (tutorNom) {
        equipo.push({
          nombre: tutorNom,
          rol: "Tutora de Práctica en Centro Educativo",
          correo: tutorMail || "No registrado",
          lugar: centroNombre || "Centro de práctica",
          esTutor: true,
        });
      }

      // Agregar profesores colaboradores (sin duplicar al estudiante ni miembros ya agregados)
      if (practicaEncontrada) {
        try {
          const profColabRes = await fetch(`/api/profesores-colaboradores`);
          if (profColabRes.ok) {
            const profColabs = await profColabRes.json();
            if (Array.isArray(profColabs)) {
              const correosExistentes = new Set(
                equipo.map((m) => (m.correo || "").toLowerCase().trim())
              );

              profColabs.forEach((pc: any) => {
                const pcUsuario = pc.usuario;
                if (!pcUsuario) return;

                const correoPC = (pcUsuario.correo || "").toLowerCase().trim();

                // Saltar si ya está en el equipo (ej. el propio estudiante)
                if (correoPC && correosExistentes.has(correoPC)) return;

                const nombre = `${pcUsuario.nombre || ""} ${pcUsuario.apellido || ""}`.trim() || pc.especialidad || "Profesor Colaborador";

                equipo.push({
                  nombre,
                  rol: "Profesor Colaborador de Campo",
                  correo: pcUsuario.correo || "No registrado",
                  lugar: pc.centroPractica?.nombre || "Facultad de Educación UBB",
                  esProfesor: true,
                });

                correosExistentes.add(correoPC);
              });
            }
          }
        } catch {}
      }

      // 10. Tareas y pendientes
      const pendientes: ItemPendiente[] = [
        {
          id: "p-1",
          titulo: esNoveno
            ? "Subir Informe Final de Práctica Profesional y Autoevaluación"
            : "Subir Informe de Avance N.° 2 de Práctica Pedagógica",
          fechaLimite: "Vence el 12 de octubre",
          menuDestino: "documentos",
          tipo: "documento",
        },
        {
          id: "p-2",
          titulo: "Revisar la retroalimentación de Luis Contreras en Bitácora",
          fechaLimite: "Pendiente de lectura",
          menuDestino: "evaluaciones",
          tipo: "observacion",
        },
        {
          id: "p-3",
          titulo: "Subir evidencias fotográficas de la semana 4 de clases",
          fechaLimite: "Vence este viernes",
          menuDestino: "portafolio",
          tipo: "documento",
        },
      ];

      setDatos({
        semestre,
        asignaturaNombre: asignaturaDb?.nombre || asignaturaNombre,
        codigoAsignatura,
        centroPractica: centroNombre || "",
        direccionCentro: centroDir || "",
        periodo: "2026 - 2 (Segundo Semestre)",
        horasRealizadas: esNoveno ? 160 : 128,
        horasTotales: esNoveno ? 300 : 250,
        estadoAprobacion: estadoAprobacionDb || "",
        tutorNombre: tutorNom || "",
        tutorCorreo: tutorMail || "",
        profesorAsignatura: "",
        profesorAsignaturaCorreo: "",
        profesorColaborador: "",
        profesorColaboradorCorreo: "",
        coordinador: "",
        coordinadorCorreo: "",
        pendientes,
        equipo,
        documentos: docsConsolidados,
        evaluaciones: evalsConsolidadas,
        observacionesGenerales: obsGenerales,
      });
    } catch (err: any) {
      console.error("Error al cargar datos de práctica:", err);
      setError(err?.message || "No se pudieron cargar todos los datos de la práctica.");
    } finally {
      setLoading(false);
    }
  }, [rut, user.nombre, user.apellido, user.correo]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  return {
    datos,
    loading,
    error,
    recargar: cargarDatos,
  };
}
