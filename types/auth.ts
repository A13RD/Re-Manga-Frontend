/**
 * Tipos para la autenticación y registro de usuarios en Re-Manga.
 */

export interface RegistroPayload {
  nombre: string;
  name?: string;
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  name: string;
  nombre?: string;
  email: string;
  role: "USER" | "ADMIN" | string;
  createdAt?: string;
}

export interface RegistroResponse {
  message?: string;
  user?: AuthUser;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  message?: string;
  token?: string;
  user?: AuthUser;
}

export interface MeResponse {
  user: AuthUser;
}

export interface ApiErrorResponse {
  message?: string;
  error?: string;
}
