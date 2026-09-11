export interface LoginCredentials {
  email: string;
  password: string;
}

export interface UserSession {
  idUsuario: number;
  nombre: string;
  apellido: string;
  correo: string;
  roles: string[];
}

export interface LoginResponse {
  success: boolean;
  message: string;
  idUsuario?: number;
  nombre?: string;
  apellido?: string;
  correo?: string;
  roles?: string[];
}
