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
import { Eye, EyeOff, UserPlus, BookOpen, Loader2 } from "lucide-react";
import { validateRut, formatRutStandard } from "@/lib/rutUtils";

export interface NewUserData {
  rut: string;
  nombre: string;
  apellido: string;
  correo: string;
  contrasena: string;
  rol: string;
  asignatura?: string;
  idAsignatura?: number | null;
  estado?: boolean;
}

interface AsignaturaItem {
  idAsignatura: number;
  nombre: string;
  descripcion?: string;
  semestre?: string;
}

interface RolItem {
  idRol: number;
  nombre: string;
  descripcion?: string;
}

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  suggestedId?: string; // Mantenido por retrocompatibilidad
  onCreate?: (newUser: NewUserData | any) => void;
}

const getRolLabel = (nombre: string): string => {
  if (!nombre) return "";
  return nombre
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export function CreateModal({
  isOpen,
  onClose,
  onCreate,
}: CreateModalProps) {
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

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  useEffect(() => {
    if (isOpen) {
      setRut("");
      setNombre("");
      setApellido("");
      setCorreo("");
      setContrasena("");
      setShowPassword(false);
      setRol("ESTUDIANTE");
      setEstado(true);
      setAsignaturaId("");
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
              if (data.length > 0 && !data.some((r: RolItem) => r.nombre === "ESTUDIANTE")) {
                setRol(data[0].nombre);
              }
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

      fetchRoles();
      fetchAsignaturas();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    const rawRut = rut.trim();
    if (!rawRut) {
      newErrors.rut = "El RUT es obligatorio.";
    } else if (!validateRut(rawRut)) {
      newErrors.rut = "El RUT ingresado no es válido. Compruebe el formato y dígito verificador.";
    }

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

    if (!contrasena) {
      newErrors.contrasena = "La contraseña es obligatoria.";
    } else if (contrasena.length < 6) {
      newErrors.contrasena = "La contraseña debe tener al menos 6 caracteres.";
    }

    if (!rol) {
      newErrors.rol = "Debes seleccionar un rol.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstError = Object.values(newErrors)[0];
      sileo.error({
        title: "Error de validación",
        description: firstError || "Revisa los campos obligatorios del usuario.",
      });
      return;
    }

    const standardRut = formatRutStandard(rawRut);

    const selectedAsig = asignaturas.find(
      (a) => String(a.idAsignatura) === asignaturaId
    );

    setSubmitting(true);

    try {
      const credentials = btoa("admin:admin123");
      const res = await fetch("http://localhost:8080/admin/usuarios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${credentials}`,
        },
        body: JSON.stringify({
          rut: standardRut,
          nombre: nombre.trim(),
          apellido: apellido.trim(),
          correo: correo.trim(),
          contrasena,
          rol,
          estado,
          idAsignatura: selectedAsig ? selectedAsig.idAsignatura : null,
          asignatura: selectedAsig ? selectedAsig.nombre : null,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          json?.error || json?.message || `Error ${res.status}: No se pudo guardar el usuario en la base de datos.`
        );
      }

      onCreate?.({
        rut: standardRut,
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        correo: correo.trim(),
        contrasena,
        rol,
        asignatura: selectedAsig ? selectedAsig.nombre : "—",
        idAsignatura: selectedAsig ? selectedAsig.idAsignatura : null,
        estado,
      });

      onClose();
    } catch (err: any) {
      console.error("Error al registrar usuario en la base de datos:", err);
      const errorMsg = err.message || "Error al conectar con la base de datos para guardar el usuario.";
      sileo.error({
        title: "Error al crear usuario",
        description: errorMsg,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-lg bg-white border border-slate-200">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-slate-100 rounded-lg text-slate-800">
              <UserPlus className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-slate-900 font-bold">Nuevo Usuario</DialogTitle>
              <DialogDescription className="text-slate-500 text-xs">
                Ingresa los datos para registrar un nuevo usuario en la plataforma.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">

          <FieldGroup className="gap-3">
            {/* RUT y Rol */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="create-user-rut">RUT</FieldLabel>
                <Input
                  id="create-user-rut"
                  value={rut}
                  onChange={(e) => {
                    setRut(e.target.value);
                    if (errors.rut) setErrors((prev) => ({ ...prev, rut: undefined }));
                  }}
                  placeholder="ej. 12345678-5"
                  className="bg-white"
                />
                {errors.rut && <FieldError>{errors.rut}</FieldError>}
                <FieldDescription>RUT con guión.</FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="create-user-rol" className="flex items-center gap-1.5">
                  Rol (Tabla &quot;roles&quot;)
                  {loadingRoles && (
                    <Loader2 className="size-3 animate-spin text-blue-500 ml-1" />
                  )}
                </FieldLabel>
                <select
                  id="create-user-rol"
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
                {errors.rol && <FieldError>{errors.rol}</FieldError>}
              </Field>
            </div>

            {/* Asignatura disponible para todos los usuarios */}
            <Field className="p-3 bg-slate-50/80 rounded-lg border border-slate-200/80 transition-all">
              <FieldLabel
                htmlFor="create-user-asignatura"
                className="flex items-center gap-1.5 text-slate-800 font-semibold text-xs"
              >
                <BookOpen className="size-3.5 text-blue-600" />
                Asignatura (Tabla &quot;asignatura&quot;)
                {loadingAsignaturas && (
                  <Loader2 className="size-3 animate-spin text-blue-500 ml-1" />
                )}
              </FieldLabel>
              <select
                id="create-user-asignatura"
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
                    {asig.nombre} {asig.semestre ? `(Semestre ${asig.semestre})` : ""}
                  </option>
                ))}
              </select>
              {errors.asignatura && (
                <FieldError className="text-rose-600 mt-1">{errors.asignatura}</FieldError>
              )}
              <FieldDescription className="text-slate-500 text-[11px]">
                Asignatura de la carrera vinculada desde la base de datos (estudiantes, profesores, tutores, etc.).
              </FieldDescription>
            </Field>

            {/* Nombre y Apellido */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="create-user-nombre">Nombre</FieldLabel>
                <Input
                  id="create-user-nombre"
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
                <FieldLabel htmlFor="create-user-apellido">Apellido</FieldLabel>
                <Input
                  id="create-user-apellido"
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
                <FieldLabel htmlFor="create-user-correo">Correo Electrónico</FieldLabel>
                <Input
                  id="create-user-correo"
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
                <FieldDescription>Dirección institucional.</FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="create-user-estado">Estado de Cuenta</FieldLabel>
                <select
                  id="create-user-estado"
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

            {/* Contraseña con toggle de visibilidad */}
            <Field>
              <FieldLabel htmlFor="create-user-contrasena">Contraseña</FieldLabel>
              <div className="relative">
                <Input
                  id="create-user-contrasena"
                  type={showPassword ? "text" : "password"}
                  value={contrasena}
                  onChange={(e) => {
                    setContrasena(e.target.value);
                    if (errors.contrasena) setErrors((prev) => ({ ...prev, contrasena: undefined }));
                  }}
                  placeholder="••••••••"
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
              <FieldDescription>Mínimo 6 caracteres.</FieldDescription>
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
                  <UserPlus className="size-4" />
                  Crear Usuario
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

