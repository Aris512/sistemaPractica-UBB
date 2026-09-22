import { useState } from "react";
import { sileo } from "sileo";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup } from "@/components/ui/field";
import { formatRut, formatRutStandard, validateRut, cleanRut } from "@/lib/rutUtils";
import { verificarEstudianteEsPractica, setStoredEsPractica } from "@/lib/authSession";
import type { UserSession } from "@/types/auth";

interface LoginFormProps {
  onLoginSuccess: (user: UserSession) => void;
}

export function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [rut, setRut] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rutValidationError, setRutValidationError] = useState<string | null>(null);

  function handleRutChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    const formatted = formatRut(value);
    setRut(formatted);
    setError(null);

    const cleaned = cleanRut(value);
    if (cleaned.length >= 8) {
      if (!validateRut(value)) {
        setRutValidationError("Dígito verificador incorrecto");
      } else {
        setRutValidationError(null);
      }
    } else {
      setRutValidationError(null);
    }
  }

  function handleRutBlur() {
    if (rut.trim().length > 0 && !validateRut(rut)) {
      setRutValidationError("El RUT ingresado no es válido (ej: 12345678-9)");
    } else {
      setRutValidationError(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!rut.trim()) {
      const msg = "Por favor, ingrese su RUT institucional.";
      setError(msg);
      sileo.error({ title: "Campo requerido", description: msg });
      return;
    }

    if (!validateRut(rut)) {
      const msg = "El RUT ingresado no es válido. Compruebe el dígito verificador.";
      setError(msg);
      sileo.error({ title: "RUT inválido", description: msg });
      return;
    }

    if (!password) {
      const msg = "Por favor, ingrese su contraseña.";
      setError(msg);
      sileo.error({ title: "Campo requerido", description: msg });
      return;
    }

    setLoading(true);

    try {
      const standardRut = formatRutStandard(rut);
      const res = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rut: standardRut, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        const msg = data.message ?? "Credenciales incorrectas.";
        setError(msg);
        sileo.error({ title: "Error de autenticación", description: msg });
        return;
      }

      if (data.estado === false) {
        const msg = "Acceso denegado: su cuenta de usuario se encuentra inactiva. Contacte al administrador.";
        setError(msg);
        sileo.error({ title: "Cuenta inactiva", description: msg });
        return;
      }

      const userRut = data.rut || standardRut;
      const roles: string[] = data.roles || [];
      const isStudent = roles.some((r) => r.toUpperCase().includes("ESTUDIANTE"));
      let esPractica: boolean | undefined = undefined;

      if (isStudent) {
        try {
          esPractica = await verificarEstudianteEsPractica(userRut);
          setStoredEsPractica(userRut, esPractica);
        } catch {
          // El router lo verificará como fallback
        }
      }

      onLoginSuccess({
        rut: userRut,
        idUsuario: userRut,
        nombre: data.nombre,
        apellido: data.apellido,
        correo: data.correo,
        roles: data.roles,
        estado: data.estado !== undefined ? data.estado : true,
        esPractica: isStudent ? esPractica : undefined,
      });
    } catch {
      const msg = "No se pudo conectar con el servidor. Verifique que el backend esté activo.";
      setError(msg);
      sileo.error({ title: "Error de conexión", description: msg });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full shadow-sm">
      <CardHeader>
        <CardTitle>Iniciar sesión</CardTitle>
        <CardDescription>
          Ingresa con tu RUT y contraseña para acceder a la plataforma.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form id="login-form" onSubmit={handleSubmit}>
          <FieldGroup>
            {/* RUT */}
            <Field>
              <div className="flex items-center justify-between">
                <Label htmlFor="rut">RUT institucional</Label>
                {rutValidationError && (
                  <span className="text-xs text-amber-600 font-medium">
                    {rutValidationError}
                  </span>
                )}
              </div>
              <Input
                id="rut"
                type="text"
                placeholder="12345678-9"
                autoComplete="username"
                required
                value={rut}
                onChange={handleRutChange}
                onBlur={handleRutBlur}
                aria-invalid={!!error || !!rutValidationError}
                maxLength={10}
              />
              <span className="text-[11px] text-slate-500">
                Formato: 12345678-9 (sin puntos, con guión)
              </span>
            </Field>

            {/* Contraseña */}
            <Field>
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                aria-invalid={!!error}
              />
            </Field>

            {/* Mensaje de Error */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium flex items-start gap-2">
                <svg
                  className="w-4 h-4 text-red-600 shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <circle cx="12" cy="12" r="10" strokeWidth="2" />
                  <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2" />
                  <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2" />
                </svg>
                <span>{error}</span>
              </div>
            )}
          </FieldGroup>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col gap-3">
        <Button
          type="submit"
          form="login-form"
          size="lg"
          className="w-full"
          disabled={loading}
        >
          {loading ? "Iniciando sesión…" : "Ingresar con RUT"}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          ¿Problemas para ingresar? Contacta al administrador del sistema.
        </p>
      </CardFooter>
    </Card>
  );
}
