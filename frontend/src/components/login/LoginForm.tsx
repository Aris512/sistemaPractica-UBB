import { useState } from "react";
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
import { Field, FieldError, FieldGroup } from "@/components/ui/field";
import type { UserSession } from "@/types/auth";

interface LoginFormProps {
  onLoginSuccess: (user: UserSession) => void;
}

export function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message ?? "Credenciales incorrectas.");
        return;
      }

      onLoginSuccess({
        idUsuario: data.idUsuario,
        nombre: data.nombre,
        apellido: data.apellido,
        correo: data.correo,
        roles: data.roles,
      });
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full shadow-sm">
      <CardHeader>
        <CardTitle>Iniciar sesión</CardTitle>
        <CardDescription>
          Ingresa tus credenciales institucionales para acceder al sistema.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form id="login-form" onSubmit={handleSubmit}>
          <FieldGroup>
            {/* Email */}
            <Field>
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@ubiobio.cl"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!error}
              />
            </Field>

            {/* Password */}
            <Field>
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!error}
              />
            </Field>

            {/* Error message */}
            {error && <FieldError>{error}</FieldError>}
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
          {loading ? "Iniciando sesión…" : "Ingresar"}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          ¿Problemas para ingresar? Contacta al administrador del sistema.
        </p>
      </CardFooter>
    </Card>
  );
}
