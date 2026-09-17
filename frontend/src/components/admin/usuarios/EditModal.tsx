import { useState, useEffect } from "react";
import { sileo } from "sileo";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, UserCheck, BookOpen, Loader2, AlertCircle, Lock, Building2 } from "lucide-react";
import type { UsuarioRow } from "../data-table-features";

export interface EditUserData {
  rut: string;
  nombre: string;
  apellido: string;
  correo: string;
  contrasena?: string;
  rol: string;
  asignatura?: string;
  idAsignatura?: number | null;
  centroPractica?: string;
  idCentro?: number | null;
  estado?: boolean;
}

interface AsignaturaItem {
  idAsignatura: number;
  nombre: string;
  descripcion?: string;
  semestre?: string;
}

interface CentroPracticaItem {
  idCentro: number;
  nombre: string;
  direccion?: string;
}

interface RolItem {
  idRol: number;
  nombre: string;
  descripcion?: string;
}

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: UsuarioRow | any | null;
  invoice?: any | null; // Retrocompatibilidad para page.tsx
  onSave?: (originalRut: string, updatedUser: any) => void;
}

const getRolLabel = (nombre: string): string => {
  if (!nombre) return "";
  return nombre
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export function EditModal({
  isOpen,
  onClose,
  user,
  invoice,
  onSave,
}: EditModalProps) {
  // Soporte tanto para prop "user" como "invoice" por retrocompatibilidad
  const targetUser = user || invoice;

  const [rut, setRut] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rol, setRol] = useState("ESTUDIANTE");
  const [estado, setEstado] = useState(true);

  // Roles dinámicos cargados desde la base de datos
  const [roles, setRoles] = useState<RolItem[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);

  // Asignaturas dinámicas cargadas desde la base de datos
  const [asignaturas, setAsignaturas] = useState<AsignaturaItem[]>([]);
  const [asignaturaId, setAsignaturaId] = useState("");
  const [loadingAsignaturas, setLoadingAsignaturas] = useState(false);

  // Centros de práctica dinámicos cargados desde la base de datos
  const [centros, setCentros] = useState<CentroPracticaItem[]>([]);
  const [centroId, setCentroId] = useState("");
  const [loadingCentros, setLoadingCentros] = useState(false);

  // Solo Profesor Colaborador y Tutor de Práctica deben tener la opción de Centro de Práctica
  // Profesor de Asignatura NO debe tener esta opción
  const isProfesorColaborador =
    !rol.toUpperCase().includes("ASIGNATURA") &&
    (rol.toUpperCase().includes("COLABORADOR") ||
    rol.toUpperCase().includes("TUTOR"));

  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  useEffect(() => {
    if (isOpen && targetUser) {
      const userRut = targetUser.rut || targetUser.invoice || "";
      setRut(userRut);

      // Separar nombre completo si viene en un solo campo
      const full = (targetUser.nombre || "").trim();
      const parts = full.split(/\s+/);
      if (parts.length > 1) {
        setNombre(parts[0]);
        setApellido(parts.slice(1).join(" "));
      } else {
        setNombre(full);
        setApellido(targetUser.apellido || "");
      }

      setCorreo(targetUser.correo || "");
      setContrasena("");
      setShowPassword(false);
      const initialRol = targetUser.rol || (Array.isArray(targetUser.roles) && targetUser.roles.length > 0 ? targetUser.roles[0] : "") || "ESTUDIANTE";
      setRol(initialRol);
      setEstado(targetUser.estado !== undefined ? Boolean(targetUser.estado) : true);
      setServerError(null);
      setSubmitting(false);
      setErrors({});

      // Cargar roles desde la base de datos (/api/roles)
      const fetchRoles = async () => {
        setLoadingRoles(true);
        try {
          const res = await fetch("http://localhost:8080/api/roles");
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
              setRoles(data);
            }
          }
        } catch (err) {
          console.error("Error al cargar roles desde la base de datos:", err);
        } finally {
          setLoadingRoles(false);
        }
      };

      // Cargar asignaturas desde la base de datos (/api/asignaturas)
      const fetchAsignaturas = async () => {
        setLoadingAsignaturas(true);
        try {
          const res = await fetch("http://localhost:8080/api/asignaturas");
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
              setAsignaturas(data);
              // Si el usuario ya tiene curso/asignatura asignada, preseleccionar su id
              const userCurso = (targetUser.curso || targetUser.asignatura || "").trim();
              if (userCurso && userCurso !== "—" && userCurso !== "-") {
                const matching = data.find(
                  (a: AsignaturaItem) =>
                    a.nombre.toLowerCase() === userCurso.toLowerCase()
                );
                if (matching) {
                  setAsignaturaId(String(matching.idAsignatura));
                } else {
                  setAsignaturaId("");
                }
              } else {
                setAsignaturaId("");
              }
            }
          } else {
            setAsignaturas([]);
          }
        } catch (err) {
          console.error("Error al cargar asignaturas desde la base de datos:", err);
          setAsignaturas([]);
        } finally {
          setLoadingAsignaturas(false);
        }
      };

      // Cargar centros de práctica desde la base de datos (/api/centros-practica)
      const fetchCentros = async () => {
        setLoadingCentros(true);
        try {
          const res = await fetch("http://localhost:8080/api/centros-practica");
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
              setCentros(data);
              // Preseleccionar si el usuario ya tiene centro de práctica
              if (targetUser.idCentro) {
                setCentroId(String(targetUser.idCentro));
              } else if (targetUser.centroPractica && targetUser.centroPractica !== "—" && targetUser.centroPractica !== "-") {
                const found = data.find(
                  (c: CentroPracticaItem) => c.nombre.toLowerCase() === targetUser.centroPractica.toLowerCase()
                );
                if (found) {
                  setCentroId(String(found.idCentro));
                } else {
                  setCentroId("");
                }
              } else {
                setCentroId("");
              }
            }
          }
        } catch (err) {
          console.error("Error al cargar centros de práctica:", err);
        } finally {
          setLoadingCentros(false);
        }
      };

      fetchRoles();
      fetchAsignaturas();
      fetchCentros();
    }
  }, [isOpen, targetUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!nombre.trim()) {
      newErrors.nombre = "El nombre es obligatorio.";
    }

    if (!apellido.trim()) {
      newErrors.apellido = "El apellido es obligatorio.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!correo.trim()) {
      newErrors.correo = "El correo electrónico es obligatorio.";
    } else if (!emailRegex.test(correo.trim())) {
      newErrors.correo = "Ingresa un formato de correo válido.";
    }

    // Contraseña es opcional al editar; si se escribe, debe tener >= 6 caracteres
    if (contrasena && contrasena.length < 6) {
      newErrors.contrasena = "La nueva contraseña debe tener al menos 6 caracteres.";
    }

    if (!rol) {
      newErrors.rol = "Debes seleccionar un rol.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstError = Object.values(newErrors)[0];
      sileo.error({
        title: "Error de validación",
        description: firstError || "Revisa los campos del formulario.",
      });
      return;
    }

    const selectedAsig = asignaturas.find(
      (a) => String(a.idAsignatura) === asignaturaId
    );

    const selectedCentro = centros.find(
      (c) => String(c.idCentro) === centroId
    );

    setSubmitting(true);
    setServerError(null);

    try {
      const credentials = btoa("admin:admin123");
      const res = await fetch(`http://localhost:8080/admin/usuarios/${encodeURIComponent(rut)}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${credentials}`,
        },
        body: JSON.stringify({
          nombre: nombre.trim(),
          apellido: apellido.trim(),
          correo: correo.trim(),
          contrasena: contrasena.trim() || null,
          rol,
          estado,
          idAsignatura: selectedAsig ? selectedAsig.idAsignatura : null,
          asignatura: selectedAsig ? selectedAsig.nombre : null,
          idCentro: isProfesorColaborador && selectedCentro ? selectedCentro.idCentro : null,
          centroPractica: isProfesorColaborador && selectedCentro ? selectedCentro.nombre : null,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          json?.error || json?.message || `Error ${res.status}: No se pudieron guardar los cambios en la base de datos.`
        );
      }

      onSave?.(rut, {
        rut,
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        correo: correo.trim(),
        rol,
        asignatura: selectedAsig ? selectedAsig.nombre : "—",
        idAsignatura: selectedAsig ? selectedAsig.idAsignatura : null,
        centroPractica: isProfesorColaborador && selectedCentro ? selectedCentro.nombre : "—",
        idCentro: isProfesorColaborador && selectedCentro ? selectedCentro.idCentro : null,
        curso: selectedAsig ? selectedAsig.nombre : "—",
        estado,
      });

      onClose();
    } catch (err: any) {
      console.error("Error al actualizar usuario en la base de datos:", err);
      const errorMsg = err.message || "Error al conectar con la base de datos.";
      setServerError(errorMsg);
      sileo.error({
        title: "Error al modificar usuario",
        description: errorMsg,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className={`bg-white border border-slate-200 transition-all duration-300 ${isProfesorColaborador ? "sm:max-w-2xl lg:max-w-3xl" : "sm:max-w-lg"}`}>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
              <UserCheck className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-slate-900 font-bold">Editar Usuario</DialogTitle>
              <DialogDescription className="text-slate-500 text-xs">
                Modifica los datos del usuario seleccionado en la plataforma.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {serverError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 animate-in fade-in duration-200">
              <AlertCircle className="size-4 text-rose-500 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          <FieldGroup className="gap-3">
            {/* RUT (Read-only) y Rol */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="edit-user-rut" className="flex items-center gap-1">
                  <Lock className="size-3 text-slate-400" />
                  RUT (Identificador)
                </FieldLabel>
                <Input
                  id="edit-user-rut"
                  value={rut}
                  disabled
                  className="bg-slate-100 text-slate-600 cursor-not-allowed font-mono text-xs"
                />
                <FieldDescription>El RUT no se puede modificar.</FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="edit-user-rol" className="flex items-center gap-1.5">
                  Rol (Tabla &quot;roles&quot;)
                  {loadingRoles && (
                    <Loader2 className="size-3 animate-spin text-blue-500 ml-1" />
                  )}
                </FieldLabel>
                <select
                  id="edit-user-rol"
                  value={rol}
                  onChange={(e) => {
                    setRol(e.target.value);
                    if (errors.rol) setErrors((prev) => ({ ...prev, rol: undefined }));
                  }}
                  disabled={loadingRoles}
                  className="h-8 w-full rounded-lg border border-input bg-white px-2.5 py-1 text-sm outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {loadingRoles ? (
                    <option value="">Cargando roles de la BD...</option>
                  ) : (
                    <>
                      {rol && !roles.some((r) => r.nombre === rol) && (
                        <option value={rol}>{getRolLabel(rol)}</option>
                      )}
                      {roles.map((r) => (
                        <option key={r.idRol} value={r.nombre}>
                          {getRolLabel(r.nombre)}
                        </option>
                      ))}
                    </>
                  )}
                </select>
                <FieldDescription>Rol cargado de la base de datos.</FieldDescription>
              </Field>
            </div>

            {/* Asignatura y Lugar de Práctica (visible si es Profesor Colaborador) */}
            <div className={`grid gap-3 transition-all duration-300 ${isProfesorColaborador ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
              {/* Asignatura */}
              <Field className="p-3 bg-slate-50/80 rounded-lg border border-slate-200/80 transition-all">
                <FieldLabel
                  htmlFor="edit-user-asignatura"
                  className="flex items-center gap-1.5 text-slate-800 font-semibold text-xs"
                >
                  <BookOpen className="size-3.5 text-blue-600" />
                  Asignatura (Tabla &quot;asignatura&quot;)
                  {loadingAsignaturas && (
                    <Loader2 className="size-3 animate-spin text-blue-500 ml-1" />
                  )}
                </FieldLabel>
                <select
                  id="edit-user-asignatura"
                  value={asignaturaId}
                  onChange={(e) => {
                    setAsignaturaId(e.target.value);
                    if (errors.asignatura) {
                      setErrors((prev) => ({ ...prev, asignatura: undefined }));
                    }
                  }}
                  disabled={loadingAsignaturas}
                  className="mt-1 h-8 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-sm outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="">
                    {loadingAsignaturas
                      ? "Cargando asignaturas de la BD..."
                      : "-- Sin Asignatura (Opcional) --"}
                  </option>
                  {asignaturas.map((asig) => (
                    <option key={asig.idAsignatura} value={String(asig.idAsignatura)}>
                      {asig.nombre} {asig.semestre ? `(Sem. ${asig.semestre})` : ""}
                    </option>
                  ))}
                </select>
                {errors.asignatura && (
                  <FieldError className="text-rose-600 mt-1">{errors.asignatura}</FieldError>
                )}
                <FieldDescription className="text-slate-500 text-[11px]">
                  Asignatura vinculada desde la base de datos.
                </FieldDescription>
              </Field>

              {/* Lugar de Práctica (Solo para Profesor Colaborador) */}
              {isProfesorColaborador && (
                <Field className="p-3 bg-blue-50/40 rounded-lg border border-blue-200/70 transition-all animate-in fade-in-50 duration-200">
                  <FieldLabel
                    htmlFor="edit-user-centro"
                    className="flex items-center gap-1.5 text-slate-800 font-semibold text-xs"
                  >
                    <Building2 className="size-3.5 text-blue-600" />
                    Lugar de Práctica (Tabla &quot;centro_practica&quot;)
                    {loadingCentros && (
                      <Loader2 className="size-3 animate-spin text-blue-500 ml-1" />
                    )}
                  </FieldLabel>
                  <select
                    id="edit-user-centro"
                    value={centroId}
                    onChange={(e) => {
                      setCentroId(e.target.value);
                      if (errors.centro) {
                        setErrors((prev) => ({ ...prev, centro: undefined }));
                      }
                    }}
                    disabled={loadingCentros}
                    className="mt-1 h-8 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-sm outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <option value="">
                      {loadingCentros
                        ? "Cargando centros de práctica..."
                        : "-- Selecciona Lugar de Práctica --"}
                    </option>
                    {centros.map((c) => (
                      <option key={c.idCentro} value={String(c.idCentro)}>
                        {c.nombre} {c.direccion ? `(${c.direccion})` : ""}
                      </option>
                    ))}
                  </select>
                  {errors.centro && (
                    <FieldError className="text-rose-600 mt-1">{errors.centro}</FieldError>
                  )}
                  <FieldDescription className="text-slate-500 text-[11px]">
                    Institución o colegio asignado al profesor colaborador o tutor de práctica.
                  </FieldDescription>
                </Field>
              )}
            </div>

            {/* Nombre y Apellido */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="edit-user-nombre">Nombre</FieldLabel>
                <Input
                  id="edit-user-nombre"
                  value={nombre}
                  onChange={(e) => {
                    setNombre(e.target.value);
                    if (errors.nombre) setErrors((prev) => ({ ...prev, nombre: undefined }));
                  }}
                  placeholder="ej. Juan"
                  className="bg-white"
                />
                {errors.nombre && <FieldError>{errors.nombre}</FieldError>}
              </Field>

              <Field>
                <FieldLabel htmlFor="edit-user-apellido">Apellido</FieldLabel>
                <Input
                  id="edit-user-apellido"
                  value={apellido}
                  onChange={(e) => {
                    setApellido(e.target.value);
                    if (errors.apellido) setErrors((prev) => ({ ...prev, apellido: undefined }));
                  }}
                  placeholder="ej. Pérez"
                  className="bg-white"
                />
                {errors.apellido && <FieldError>{errors.apellido}</FieldError>}
              </Field>
            </div>

            {/* Correo Electrónico y Estado */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="edit-user-correo">Correo Electrónico</FieldLabel>
                <Input
                  id="edit-user-correo"
                  type="email"
                  value={correo}
                  onChange={(e) => {
                    setCorreo(e.target.value);
                    if (errors.correo) setErrors((prev) => ({ ...prev, correo: undefined }));
                  }}
                  placeholder="ej. juan.perez@test.com"
                  className="bg-white"
                />
                {errors.correo && <FieldError>{errors.correo}</FieldError>}
                <FieldDescription>Dirección de correo institucional.</FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="edit-user-estado">Estado de la Cuenta</FieldLabel>
                <select
                  id="edit-user-estado"
                  value={estado ? "true" : "false"}
                  onChange={(e) => setEstado(e.target.value === "true")}
                  className="h-8 w-full rounded-lg border border-input bg-white px-2.5 py-1 text-sm outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="true">Activo (Habilitado para ingresar)</option>
                  <option value="false">Inactivo (Acceso bloqueado)</option>
                </select>
                <FieldDescription>Los inactivos no podrán ingresar.</FieldDescription>
              </Field>
            </div>

            {/* Contraseña opcional al editar */}
            <Field>
              <FieldLabel htmlFor="edit-user-contrasena">Nueva Contraseña (Opcional)</FieldLabel>
              <div className="relative">
                <Input
                  id="edit-user-contrasena"
                  type={showPassword ? "text" : "password"}
                  value={contrasena}
                  onChange={(e) => {
                    setContrasena(e.target.value);
                    if (errors.contrasena) setErrors((prev) => ({ ...prev, contrasena: undefined }));
                  }}
                  placeholder="•••••••• (dejar en blanco para no modificar)"
                  className="bg-white pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.contrasena && <FieldError>{errors.contrasena}</FieldError>}
              <FieldDescription>
                Dejar vacío si no deseas modificar la contraseña actual.
              </FieldDescription>
            </Field>
          </FieldGroup>

          <DialogFooter className="mt-4 pt-2 border-t border-slate-100 sm:justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="gap-1.5 bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Guardando en BD...
                </>
              ) : (
                <>
                  <UserCheck className="size-4" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

