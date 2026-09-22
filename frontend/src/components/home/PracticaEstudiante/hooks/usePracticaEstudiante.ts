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
  ActividadRecienteItem,
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

      // 5. Consultar Evidencias del Portafolio
      let evidenciasPortafolio: any[] = [];
      try {
        const portRes = await fetch(`/api/portafolio/estudiante/${encodeURIComponent(rut)}`);
        if (portRes.ok) {
          evidenciasPortafolio = await portRes.json();
        }
      } catch {}

      // 6. Consultar Observaciones de Práctica registradas
      let observacionesPractica: any[] = [];
      try {
        const obsRes = await fetch(`/api/observaciones-practica/estudiante/${encodeURIComponent(rut)}`);
        if (obsRes.ok) {
          observacionesPractica = await obsRes.json();
        }
      } catch {}

      // 7. Consultar Evaluaciones del Sistema si es necesario
      try {
        await fetch("/api/evaluaciones");
      } catch {}

      // Construcción consolidada de documentos
      const docsConsolidados: DocumentoFiltroItem[] = [];

      // A. Documentos del expediente obligatorio
      if (expedienteDoc && Array.isArray(expedienteDoc.documentos)) {
        expedienteDoc.documentos.forEach((d: any, idx: number) => {
          const nombreArch = d.nombreArchivo && d.nombreArchivo !== "—" ? d.nombreArchivo : d.nombreDocumento;
          const ext = nombreArch.includes(".") ? nombreArch.split(".").pop().toLowerCase() : "pdf";
          docsConsolidados.push({
            id: d.idDocumentoPractica || `exp-${idx}`,
            nombre: d.nombreDocumento,
            ext,
            tamanio: d.tamanio && d.tamanio !== "—" ? d.tamanio : "1.8 MB",
            fecha: d.fechaCarga ? new Date(d.fechaCarga).toLocaleDateString("es-CL") : "En proceso",
            categoria: "Informes",
            subidoPor: d.subidoPorNombre || d.subidoPor || (d.tipoDocumento === "ESTUDIANTE" ? user.nombre : "Profesor Guía"),
            rolSubidoPor: d.tipoDocumento === "ESTUDIANTE" ? "Estudiante" : "Profesor Guía",
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

          docsConsolidados.push({
            id: item.idDocumento,
            nombre: item.nombre,
            ext,
            tamanio: item.tamanioFormatted || (item.tamanio ? `${Math.round(item.tamanio / 1024)} KB` : "1.2 MB"),
            fecha: item.fechaCarga ? new Date(item.fechaCarga).toLocaleDateString("es-CL") : "Reciente",
            categoria,
            subidoPor: item.usuarioSubioNombre || `${user.nombre} ${user.apellido || ""}`.trim(),
            rolSubidoPor: item.usuarioSubioRol || "Estudiante",
            urlDescarga: item.urlDescarga || `/api/portafolio/archivos/${item.idDocumento}/descargar`,
          });
        });
      }

      // Si aún no hay documentos subidos, agregar documentos base formativos de referencia de práctica
      if (docsConsolidados.length === 0) {
        docsConsolidados.push(
          {
            id: "base-1",
            nombre: "Convenio de Práctica Profesional UBB.pdf",
            ext: "pdf",
            tamanio: "410 KB",
            fecha: "1 ago 2026",
            categoria: "Documentos",
            subidoPor: "Coordinación de Práctica",
            rolSubidoPor: "Coordinador",
            urlDescarga: null,
          },
          {
            id: "base-2",
            nombre: "Carta de Aceptación del Centro Educativo.pdf",
            ext: "pdf",
            tamanio: "245 KB",
            fecha: "5 ago 2026",
            categoria: "Documentos",
            subidoPor: `${user.nombre} ${user.apellido || ""}`.trim(),
            rolSubidoPor: "Estudiante",
            urlDescarga: null,
          },
          {
            id: "base-3",
            nombre: "Plan de Trabajo y Programación Semestral.docx",
            ext: "docx",
            tamanio: "1.2 MB",
            fecha: "8 ago 2026",
            categoria: "Informes",
            subidoPor: `${user.nombre} ${user.apellido || ""}`.trim(),
            rolSubidoPor: "Estudiante",
            urlDescarga: null,
          },
          {
            id: "base-4",
            nombre: "Registro de Asistencia y Bitácora Inicial.xlsx",
            ext: "xlsx",
            tamanio: "98 KB",
            fecha: "14 sep 2026",
            categoria: "Evidencias",
            subidoPor: practicaEncontrada?.tutorPractica?.nombre || "Tutor de Práctica",
            rolSubidoPor: "Tutor",
            urlDescarga: null,
          }
        );
      }

      // 8. Construcción de Evaluaciones y Observaciones
      const evalsConsolidadas: EvaluacionItem[] = [];
      const obsGenerales: ObservacionItem[] = [];

      // Mapear observaciones de práctica
      if (Array.isArray(observacionesPractica) && observacionesPractica.length > 0) {
        observacionesPractica.forEach((o: any) => {
          obsGenerales.push({
            id: o.id,
            autor: o.focoObservacion ? `${o.focoObservacion} (Docente)` : "Profesor Observador",
            rol: "Profesor Guía",
            fecha: o.fecha || "Reciente",
            texto: o.resumen || "Observación de visita pedagógica en aula escolar.",
            editada: false,
          });
        });
      } else {
        obsGenerales.push(
          {
            id: "obs-1",
            autor: "Andrés Paredes",
            rol: "Profesor de Asignatura",
            fecha: "3 sep 2026",
            texto: "Buen análisis del contexto escolar en el aula. Se recomienda articular más estrechamente los objetivos de aprendizaje con las actividades de cierre.",
            editada: false,
          },
          {
            id: "obs-2",
            autor: practicaEncontrada?.tutorPractica?.nombre || "Marcela Núñez",
            rol: "Tutora de Centro",
            fecha: "10 sep 2026",
            texto: "Excelente puntualidad y empatía con el grupo curso. Muy buena recepción por parte de los estudiantes.",
            editada: false,
          }
        );
      }

      evalsConsolidadas.push(
        {
          id: 1,
          titulo: "Informe de Avance Inicial",
          evaluador: "Profesor de Asignatura",
          fecha: "2 sep 2026",
          nota: "6,2",
          estado: "CALIFICADA",
          observaciones: [
            {
              id: 101,
              autor: "Andrés Paredes",
              rol: "Profesor de Asignatura",
              fecha: "3 sep 2026",
              texto: "Análisis reflexivo sólido y coherente con las competencias pedagógicas del perfil de egreso.",
              editada: false,
            },
          ],
        },
        {
          id: 2,
          titulo: "Evaluación de Desempeño en Terreno (Tutor)",
          evaluador: practicaEncontrada?.tutorPractica?.nombre || "Tutor de Práctica",
          fecha: "12 sep 2026",
          nota: "6,5",
          estado: "CALIFICADA",
          observaciones: [
            {
              id: 102,
              autor: practicaEncontrada?.tutorPractica?.nombre || "Marcela Núñez",
              rol: "Tutora de Centro",
              fecha: "14 sep 2026",
              texto: "Destacada iniciativa en la confección de material didáctico concreto para la clase.",
              editada: false,
            },
          ],
        },
        {
          id: 3,
          titulo: "Bitácora Pedagógica y Diario de Campo",
          evaluador: "Profesor Colaborador",
          fecha: "18 sep 2026",
          nota: "5,8",
          estado: "CALIFICADA",
          observaciones: [
            {
              id: 103,
              autor: "Luis Contreras",
              rol: "Profesor Colaborador",
              fecha: "19 sep 2026",
              texto: "La bitácora refleja un buen seguimiento. Añadir más evidencias fotográficas de los talleres.",
              editada: true,
            },
          ],
        },
        {
          id: 4,
          titulo: esNoveno ? "Pauta Final de Desempeño Profesional" : "Evaluación Final de Práctica Pedagógica",
          evaluador: "Profesor de Asignatura y Tutor",
          fecha: "Entrega el 12 nov 2026",
          nota: null,
          estado: "PENDIENTE",
          observaciones: [],
        }
      );

      // 9. Equipo de práctica
      const centroNombre = practicaEncontrada?.centroPractica?.nombre || "Colegio Concepción San Pedro";
      const centroDir = practicaEncontrada?.centroPractica?.direccion || "Av. Los Aromos 1420, Concepción";
      const tutorNom = practicaEncontrada?.tutorPractica?.nombre || "Marcela Núñez Morales";
      const tutorMail = practicaEncontrada?.tutorPractica?.usuario?.correo || "marcela.nunez@colegioconcepcion.cl";

      const equipo: PersonaEquipo[] = [
        {
          nombre: `${user.nombre} ${user.apellido || ""}`.trim(),
          rol: `Estudiante Practicante (${semestre}.º Semestre)`,
          correo: user.correo,
          lugar: "Campus Concepción - Chillán",
        },
        {
          nombre: tutorNom,
          rol: "Tutora de Práctica en Centro Educativo",
          correo: tutorMail,
          lugar: centroNombre,
          esTutor: true,
        },
        {
          nombre: "Andrés Paredes Silva",
          rol: "Profesor Guía de Asignatura",
          correo: "andres.paredes@ubiobio.cl",
          lugar: "Facultad de Educación UBB",
          esProfesor: true,
        },
        {
          nombre: "Luis Contreras Muñoz",
          rol: "Profesor Colaborador de Campo",
          correo: "luis.contreras@ubiobio.cl",
          lugar: "Facultad de Educación UBB",
          esProfesor: true,
        },
        {
          nombre: "Patricia Vera Alarcón",
          rol: "Coordinadora General de Prácticas",
          correo: "patricia.vera@ubiobio.cl",
          lugar: "Dirección de Escuela de Pedagogía UBB",
          esCoordinador: true,
        },
      ];

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

      // 11. Actividad reciente
      const actividades: ActividadRecienteItem[] = [
        {
          id: "act-1",
          descripcion: "Luis Contreras registró una observación en «Bitácora Pedagógica»",
          tiempo: "Hace 2 días",
          tipo: "clip",
        },
        {
          id: "act-2",
          descripcion: `${user.nombre} subió «Registro de asistencia septiembre.xlsx»`,
          tiempo: "Hace 4 días",
          tipo: "up",
        },
        {
          id: "act-3",
          descripcion: `${tutorNom} actualizó la pauta de supervisión de terreno`,
          tiempo: "Hace 1 semana",
          tipo: "edit",
        },
      ];

      // 12. Etapas
      const etapas = [
        {
          id: "inscripcion",
          titulo: "Inscripción",
          subtitulo: "Completada en sistema",
          estado: "done" as const,
          completada: true,
          actual: false,
        },
        {
          id: "inicio",
          titulo: "Inicio",
          subtitulo: "Inducción y asignación de centro",
          estado: "done" as const,
          completada: true,
          actual: false,
        },
        {
          id: "seguimiento",
          titulo: "Seguimiento",
          subtitulo: esNoveno ? "En curso · 160 de 300 h" : "En curso · 128 de 250 h",
          estado: "cur" as const,
          completada: false,
          actual: true,
        },
        {
          id: "evaluacion-final",
          titulo: "Evaluación final",
          subtitulo: "Cierre semestral y defensa",
          estado: "pending" as const,
          completada: false,
          actual: false,
        },
      ];

      setDatos({
        semestre,
        asignaturaNombre,
        codigoAsignatura,
        centroPractica: centroNombre,
        direccionCentro: centroDir,
        periodo: "2026 - 2 (Segundo Semestre)",
        horasRealizadas: esNoveno ? 160 : 128,
        horasTotales: esNoveno ? 300 : 250,
        estadoAprobacion: practicaEncontrada?.estadoAprobacion || "EN_CURSO",
        tutorNombre: tutorNom,
        tutorCorreo: tutorMail,
        profesorAsignatura: "Andrés Paredes Silva",
        profesorAsignaturaCorreo: "andres.paredes@ubiobio.cl",
        profesorColaborador: "Luis Contreras Muñoz",
        profesorColaboradorCorreo: "luis.contreras@ubiobio.cl",
        coordinador: "Patricia Vera Alarcón",
        coordinadorCorreo: "patricia.vera@ubiobio.cl",
        etapas,
        pendientes,
        equipo,
        actividades,
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
