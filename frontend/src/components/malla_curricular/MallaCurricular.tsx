import { useState, useEffect } from "react";
import type { AsignaturaMalla } from "./types";
import { MALLA_POR_AÑOS } from "./mallaData";
import { AsignaturaCard } from "./AsignaturaCard";

export interface MallaCurricularProps {
  userRut?: string;
  className?: string;
  onSubjectClick?: (asig: AsignaturaMalla) => void;
}

/**
 * Consulta la base de datos (tabla 'estudiante' -> atributo 'id_asignatura' y tabla 'asignatura')
 * para obtener el id_asignatura y datos de la asignatura que actualmente va cursando el estudiante.
 */
export async function fetchAsignaturaCursandoEstudiante(
  userRut?: string
): Promise<{ idAsignatura: number | null; nombreAsignatura?: string } | null> {
  try {
    let idAsignaturaEncontrado: number | null = null;
    let nombreAsignaturaEncontrado: string | undefined = undefined;

    // 1. Intentar consultar por RUT directo (/api/estudiantes/rut/{rut})
    if (userRut) {
      try {
        const response = await fetch(`/api/estudiantes/rut/${encodeURIComponent(userRut)}`);
        if (response.ok) {
          const data = await response.json();
          idAsignaturaEncontrado = data.idAsignatura ?? data.asignatura?.idAsignatura ?? null;
          nombreAsignaturaEncontrado = data.asignatura?.nombre;
        }
      } catch {
        // Fallback
      }
    }

    // 2. Si no se encontró aún, consultar la lista completa (/api/estudiantes)
    if (!idAsignaturaEncontrado) {
      try {
        const listRes = await fetch("/api/estudiantes");
        if (listRes.ok) {
          const list = await listRes.json();
          if (Array.isArray(list) && list.length > 0) {
            let matched = list[0];
            if (userRut) {
              const cleanUserRut = userRut.replace(/[.-]/g, "").toUpperCase().trim();
              const found = list.find((e: any) => {
                const eRut = (e.usuario?.rut || e.rutUsuario || "").replace(/[.-]/g, "").toUpperCase().trim();
                return eRut === cleanUserRut;
              });
              if (found) matched = found;
            }
            idAsignaturaEncontrado = matched.idAsignatura ?? matched.asignatura?.idAsignatura ?? null;
            nombreAsignaturaEncontrado = matched.asignatura?.nombre;
          }
        }
      } catch {
        // Fallback
      }
    }

    // 3. Si tenemos id_asignatura pero no su nombre, consultar tabla asignatura (/api/asignaturas/{id})
    if (idAsignaturaEncontrado && !nombreAsignaturaEncontrado) {
      try {
        const asigRes = await fetch(`/api/asignaturas/${idAsignaturaEncontrado}`);
        if (asigRes.ok) {
          const asigData = await asigRes.json();
          nombreAsignaturaEncontrado = asigData?.nombre;
        }
      } catch {
        // Ignorar
      }
    }

    if (idAsignaturaEncontrado) {
      return {
        idAsignatura: Number(idAsignaturaEncontrado),
        nombreAsignatura: nombreAsignaturaEncontrado,
      };
    }

    // Fallback: si aún no responde el backend (offline o en carga), usar id_asignatura: 1 por defecto (Curriculum Educacional)
    return {
      idAsignatura: 1,
      nombreAsignatura: "Curriculum Educacional",
    };
  } catch (error) {
    console.warn("No se pudo obtener id_asignatura de la tabla estudiante:", error);
    return {
      idAsignatura: 1,
      nombreAsignatura: "Curriculum Educacional",
    };
  }
}

export function MallaCurricular({
  userRut,
  className = "",
  onSubjectClick,
}: MallaCurricularProps) {
  // Asignatura obtenida de la base de datos (tabla 'estudiante', atributo 'id_asignatura')
  const [asignaturaCursandoDb, setAsignaturaCursandoDb] = useState<{
    idAsignatura: number | null;
    nombreAsignatura?: string;
  } | null>(null);

  // Consultar en la BD al cargar o cambiar el RUT del estudiante
  useEffect(() => {
    let isMounted = true;
    fetchAsignaturaCursandoEstudiante(userRut).then((res) => {
      if (isMounted && res && res.idAsignatura) {
        setAsignaturaCursandoDb(res);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [userRut]);

  /**
   * Verifica si una asignatura de la malla corresponde a la que se va cursando
   * según la tabla 'asignatura' en el atributo id_asignatura
   */
  const isCursandoEstudianteDb = (asig: AsignaturaMalla): boolean => {
    if (!asignaturaCursandoDb || !asignaturaCursandoDb.idAsignatura) {
      return false;
    }
    // 1. Coincidencia por id_asignatura numérico (ej: 1 -> Curriculum Educacional)
    if (asig.idAsignaturaDb && asig.idAsignaturaDb === asignaturaCursandoDb.idAsignatura) {
      return true;
    }
    // 2. Coincidencia por nombre normalizado
    if (asignaturaCursandoDb.nombreAsignatura) {
      const n1 = asig.nombre
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .trim();
      const n2 = asignaturaCursandoDb.nombreAsignatura
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .trim();
      if (n1 === n2 || n1.includes(n2) || n2.includes(n1)) {
        return true;
      }
    }
    return false;
  };

  return (
    <div className={`w-full ${className}`}>
      {/* ── Cuadrícula Principal de la Malla Curricular ── */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {/* Barra superior de los 5 Años */}
        <div className="grid grid-cols-1 md:grid-cols-5 bg-[#1d5b79] text-white divide-y md:divide-y-0 md:divide-x divide-white/20 text-center font-bold text-xs sm:text-sm tracking-wide shadow-xs">
          <div className="py-2 px-1 flex items-center justify-center">Año 1</div>
          <div className="py-2 px-1 flex items-center justify-center">Año 2</div>
          <div className="py-2 px-1 flex items-center justify-center">Año 3</div>
          <div className="py-2 px-1 flex items-center justify-center">Año 4</div>
          <div className="py-2 px-1 flex items-center justify-center">Año 5</div>
        </div>

        {/* Contenido en 5 columnas con semestres impares arriba y pares abajo */}
        <div className="overflow-x-auto">
          <div className="min-w-[960px] grid grid-cols-5 divide-x divide-slate-200">
            {MALLA_POR_AÑOS.map((añoData) => (
              <div key={añoData.año} className="flex flex-col bg-slate-50/40">
                {añoData.semestres.map((semestre, sIdx) => (
                  <div
                    key={semestre.numero}
                    className={`p-2 space-y-1.5 flex-1 ${
                      sIdx > 0 ? "border-t-2 border-slate-200/80 bg-white/70" : ""
                    }`}
                  >
                    {/* Cabecera del Semestre */}
                    <div className="border-b border-cyan-100 pb-1 mb-1">
                      <span className="text-[#0097a7] font-extrabold text-[11px] tracking-wider uppercase">
                        {semestre.romano}
                      </span>
                    </div>

                    {/* Lista de asignaturas del semestre */}
                    <div className="space-y-1">
                      {semestre.asignaturas.map((asig) => {
                        const isCursando = isCursandoEstudianteDb(asig);

                        return (
                          <AsignaturaCard
                            key={asig.id}
                            asignatura={asig}
                            isCursandoActualmente={isCursando}
                            onSelect={onSubjectClick}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
