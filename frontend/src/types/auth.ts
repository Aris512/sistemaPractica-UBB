export interface LoginCredentials {
  rut: string;
  password: string;
}

export interface UserSession {
  rut: string;
  idUsuario?: string | number;
  nombre: string;
  apellido: string;
  correo: string;
  roles: string[];
}

export interface LoginResponse {
  success: boolean;
  message: string;
  rut?: string;
  idUsuario?: string | number;
  nombre?: string;
  apellido?: string;
  correo?: string;
  roles?: string[];
}
