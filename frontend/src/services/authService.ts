import type { LoginCredentials, LoginResponse } from "../types/auth";

export async function loginUser(credentials: LoginCredentials): Promise<LoginResponse> {
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    const data: LoginResponse = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Error al iniciar sesión. Verifique sus credenciales.",
      };
    }

    return data;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error de conexión con el servidor.",
    };
  }
}
