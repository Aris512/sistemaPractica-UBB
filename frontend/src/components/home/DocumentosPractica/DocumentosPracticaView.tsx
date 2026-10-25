import { useState, useEffect, useCallback } from "react";
import type { UserSession } from "@/types/auth";
import {
  FolderGit2,
  FileText,
  Upload,
  Download,
  CheckCircle2,
  Clock,
  User,
  GraduationCap,
  RefreshCw,
} from "lucide-react";
import { FileUploadModal } from "@/components/ui/FileUploadModal";
import { sileo } from "sileo";

interface DocumentosPracticaViewProps {
  user: UserSession;
  onBack?: () => void;
}

interface DocumentoItem {
  idDocumentoPractica: number | null;
  nombreDocumento: string;
  nombreArchivo: string;
  tipoDocumento: string; // "ESTUDIANTE" | "PROFESOR"
  fechaCarga: string | null;
  estado: string; // "ENTREGADO" | "PENDIENTE"
  tamanio: string;
  subidoPorNombre: string;
  subidoPorCorreo: string;
  urlDescarga: string | null;
}

interface DetalleExpediente {
  rut: string;
  nombre: string;
  correo: string;
  asignatura: string;
  idAsignatura: number | null;
  semestre: string;
  progreso: number;
  entregados: number;
  requeridos: number;
  documentos: DocumentoItem[];
}

export function DocumentosPracticaView({ user }: DocumentosPracticaViewProps) {
  const [expediente, setExpediente] = useState<DetalleExpediente | null>(null);
  const [estudiantesProfesor, setEstudiantesProfesor] = useState<any[]>([]);
  const [selectedStudentRut, setSelectedStudentRut] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  // Modal de Carga de Archivos
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadConfig, setUploadConfig] = useState<{
    endpoint: string;
    title: string;
    description: string;
    additionalData: Record<string, string | number>;
  }>({
    endpoint: "",
    title: "",
    description: "",
    additionalData: {},
  });

  const isProfesor = (user.rol || (user.roles && user.roles[0]) || "")
    .toUpperCase()
    .includes("PROFESOR");

  // Cargar expediente del estudiante
  const fetchEstudianteExpediente = useCallback(async (rut: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/documentos-practica/estudiante/${encodeURIComponent(rut)}`);
      if (res.ok) {
        const data = await res.json();
        setExpediente(data);
      } else {
        // Fallback local informativo si el backend no encuentra registro
        setExpediente({
          rut: rut,
          nombre: `${user.nombre || ""} ${user.apellido || ""}`.trim() || "Estudiante de Práctica",
          correo: user.correo || "estudiante@alumnos.ubiobio.cl",
          asignatura: "Práctica Profesional Pedagógica",
          idAsignatura: 1,
          semestre: "2026-1",
          progreso: 0,
          entregados: 0,
          requeridos: 2,
          documentos: [
            {
              idDocumentoPractica: null,
              nombreDocumento: "Informe de Práctica y Autoevaluación",
              nombreArchivo: "—",
              tipoDocumento: "ESTUDIANTE",
              fechaCarga: null,
              estado: "PENDIENTE",
              tamanio: "—",
              subidoPorNombre: `${user.nombre || ""} ${user.apellido || ""}`.trim(),
              subidoPorCorreo: user.correo || "",
              urlDescarga: null,
            },
            {
              idDocumentoPractica: null,
              nombreDocumento: "Evaluación Final de Desempeño y Pauta",
              nombreArchivo: "—",
              tipoDocumento: "PROFESOR",
              fechaCarga: null,
              estado: "PENDIENTE",
              tamanio: "—",
              subidoPorNombre: "Profesor Guía Asignado",
              subidoPorCorreo: "—",
              urlDescarga: null,
            },
          ],
        });
      }
    } catch (err) {
      console.warn("Error cargando expediente:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Cargar lista de estudiantes si es Profesor
  const fetchProfesorData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/admin/documentos/estudiantes");
      if (res.ok) {
        const data = await res.json();
        setEstudiantesProfesor(data);
        if (data.length > 0) {
          const firstRut = data[0].rut;
          setSelectedStudentRut(firstRut);
          fetchEstudianteExpediente(firstRut);
        }
      }
    } catch (err) {
      console.warn("Error cargando estudiantes para profesor:", err);
    } finally {
      setLoading(false);
    }
  }, [fetchEstudianteExpediente]);

  useEffect(() => {
    if (isProfesor) {
      fetchProfesorData();
    } else if (user.rut) {
      fetchEstudianteExpediente(user.rut);
    }
  }, [isProfesor, user.rut, fetchProfesorData, fetchEstudianteExpediente]);

  const handleStudentSelect = (rut: string) => {
    setSelectedStudentRut(rut);
    fetchEstudianteExpediente(rut);
  };

  // Abrir modal para que el ESTUDIANTE suba su informe
  const handleOpenUploadEstudiante = () => {
    setUploadConfig({
      endpoint: "/api/documentos-practica/estudiante/subir",
      title: "Subir Informe de Práctica y Autoevaluación",
      description: "Límite: 20 MB • Formatos: PDF, DOCX, ZIP, PPTX, XLSX",
      additionalData: {
        rutEstudiante: user.rut,
        nombreDocumento: "Informe de Práctica y Autoevaluación",
      },
    });
    setIsUploadModalOpen(true);
  };

  // Abrir modal para que el PROFESOR suba la evaluación del estudiante
  const handleOpenUploadProfesor = (studentRut: string, studentName: string) => {
    setUploadConfig({
      endpoint: "/api/documentos-practica/profesor/subir",
      title: `Subir Pauta/Evaluación para ${studentName}`,
      description: "Límite: 20 MB • Formatos: PDF, DOCX, XLSX",
      additionalData: {
        rutProfesor: user.rut,
        rutEstudiante: studentRut,
        nombreDocumento: "Evaluación Final de Desempeño Docente",
      },
    });
    setIsUploadModalOpen(true);
  };

  const handleUploadSuccess = () => {
    if (isProfesor && selectedStudentRut) {
      fetchEstudianteExpediente(selectedStudentRut);
    } else if (user.rut) {
      fetchEstudianteExpediente(user.rut);
    }
  };

  const handleDownload = (doc: DocumentoItem) => {
    if (doc.idDocumentoPractica) {
      window.open(`/api/documentos-practica/descargar/${doc.idDocumentoPractica}`, "_blank");
    } else {
      sileo.info({
        title: "Documento no disponible",
        description: "El archivo aún no ha sido entregado.",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado del Módulo 2 */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shadow-2xs shrink-0">
              <FolderGit2 className="size-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Gestión de Documentos y Archivos
                </h1>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 uppercase tracking-wide">
                  Práctica Docente
                </span>
              </div>
              <p className="text-slate-600 text-xs sm:text-sm mt-1">
                Almacena, consulta y entrega los informes y pautas evaluativas asociadas a tu proceso de práctica.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (isProfesor && selectedStudentRut) fetchEstudianteExpediente(selectedStudentRut);
              else if (user.rut) fetchEstudianteExpediente(user.rut);
            }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer self-start sm:self-auto"
            title="Actualizar datos"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Selector de Estudiantes para el Profesor */}
      {isProfesor && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <User className="size-4 text-sky-600" />
              <span>Estudiantes a Cargo para Evaluación</span>
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              {estudiantesProfesor.length} estudiantes registrados
            </span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {estudiantesProfesor.map((est) => {
              const isSelected = est.rut === selectedStudentRut;
              return (
                <button
                  key={est.rut}
                  onClick={() => handleStudentSelect(est.rut)}
                  className={`px-3.5 py-2 rounded-xl text-left transition-all shrink-0 cursor-pointer border ${isSelected
                      ? "bg-sky-50/90 border-sky-300 text-sky-950 font-bold shadow-2xs"
                      : "bg-slate-50/80 border-slate-200 hover:bg-slate-100/80 text-slate-700"
                    }`}
                >
                  <p className="text-xs truncate max-w-[170px]">{est.nombre}</p>
                  <p className="text-[10px] text-slate-500 font-normal">RUT: {est.rut}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tarjeta de Resumen del Estudiante / Asignatura */}
      {expediente && (
        <div className="bg-gradient-to-r from-sky-900 to-slate-900 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sky-300 text-xs font-semibold">
              <GraduationCap className="size-4" />
              <span>{expediente.asignatura} • Semestre {expediente.semestre}</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold">{expediente.nombre}</h2>
            <p className="text-xs text-slate-300">RUT: {expediente.rut} • {expediente.correo}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 sm:px-5 border border-white/15 flex items-center gap-4">
            <div>
              <p className="text-[11px] font-semibold text-slate-300 uppercase">Documentos</p>
              <p className="text-lg font-extrabold text-white">
                {expediente.entregados} / {expediente.requeridos}
              </p>
            </div>
            <div className="w-16 h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${expediente.progreso}%` }}
              />
            </div>
            <span className="text-xs font-bold text-emerald-300">{expediente.progreso}%</span>
          </div>
        </div>
      )}

      {/* Cuadrícula de Documentos del Proceso (Slots Estudiante y Profesor) */}
      {expediente && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {expediente.documentos.map((doc, idx) => {
            const isEstudianteDoc = doc.tipoDocumento === "ESTUDIANTE";
            const isEntregado = doc.estado === "ENTREGADO";

            return (
              <div
                key={idx}
                className={`bg-white rounded-2xl border p-6 shadow-xs flex flex-col justify-between transition-all ${isEntregado
                    ? "border-slate-200 hover:border-slate-300"
                    : "border-amber-200/80 bg-amber-50/20"
                  }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`size-10 rounded-xl flex items-center justify-center font-bold ${isEstudianteDoc
                            ? "bg-sky-100 text-sky-700"
                            : "bg-emerald-100 text-emerald-700"
                          }`}
                      >
                        <FileText className="size-5" />
                      </div>
                      <div>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${isEstudianteDoc
                              ? "bg-sky-50 text-sky-700 border border-sky-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            }`}
                        >
                          {isEstudianteDoc ? "Entrega Estudiante" : "Evaluación Profesor"}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 mt-1">
                          {doc.nombreDocumento}
                        </h3>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${isEntregado
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                    >
                      {isEntregado ? (
                        <>
                          <CheckCircle2 className="size-3.5 text-emerald-600" />
                          <span>Entregado</span>
                        </>
                      ) : (
                        <>
                          <Clock className="size-3.5 text-amber-600" />
                          <span>Pendiente</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Metadatos del documento */}
                  <div className="space-y-1.5 my-4 p-3.5 bg-slate-50 rounded-xl text-xs text-slate-600 border border-slate-100">
                    <p className="flex justify-between">
                      <span className="text-slate-400 font-medium">Archivo:</span>
                      <strong className="text-slate-800 truncate max-w-[220px]" title={doc.nombreArchivo}>
                        {doc.nombreArchivo}
                      </strong>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-400 font-medium">Tamaño:</span>
                      <span>{doc.tamanio || "—"}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-400 font-medium">Fecha:</span>
                      <span>{doc.fechaCarga ? new Date(doc.fechaCarga).toLocaleDateString("es-CL") : "—"}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-400 font-medium">Responsable:</span>
                      <span className="font-semibold text-slate-700">{doc.subidoPorNombre}</span>
                    </p>
                  </div>
                </div>

                {/* Acciones de Carga y Descarga */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  {/* Botón de Descarga */}
                  {isEntregado ? (
                    <button
                      type="button"
                      onClick={() => handleDownload(doc)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-slate-700 hover:text-sky-700 bg-slate-100 hover:bg-sky-50 border border-slate-200/80 transition-colors cursor-pointer"
                    >
                      <Download className="size-3.5" />
                      <span>Descargar Archivo</span>
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400 italic">Esperando entrega...</span>
                  )}

                  {/* Botón con Icono de Subida */}
                  {/* Si es el documento del estudiante y el usuario actual es el estudiante */}
                  {!isProfesor && isEstudianteDoc && (
                    <button
                      type="button"
                      onClick={handleOpenUploadEstudiante}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 shadow-2xs hover:shadow transition-all cursor-pointer"
                    >
                      <Upload className="size-3.5" />
                      <span>{isEntregado ? "Reemplazar Informe (20MB)" : "Subir Informe (20MB)"}</span>
                    </button>
                  )}

                  {/* Si es el documento del profesor y el usuario actual es el profesor */}
                  {isProfesor && !isEstudianteDoc && (
                    <button
                      type="button"
                      onClick={() => handleOpenUploadProfesor(expediente.rut, expediente.nombre)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-2xs hover:shadow transition-all cursor-pointer"
                    >
                      <Upload className="size-3.5" />
                      <span>{isEntregado ? "Reemplazar Pauta (20MB)" : "Subir Evaluación (20MB)"}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Componente Modal Reutilizable de Carga de Archivos */}
      <FileUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title={uploadConfig.title}
        description={uploadConfig.description}
        endpoint={uploadConfig.endpoint}
        additionalData={uploadConfig.additionalData}
        maxSizeMB={20}
        allowedExtensions={[".pdf", ".docx", ".doc", ".zip", ".pptx", ".xlsx"]}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
}
