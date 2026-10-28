/**
 * Tipos para la autenticación y registro de usuarios en Re-Manga.
 */

export interface RegistroPayload {
  nombre: string;
  email: string;
  password: string;
}

export interface RegistroResponse {
  message?: string;
  user?: {
    id: string;
    nombre?: string;
    name?: string;
    email: string;
    role?: string;
  };
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  nombre?: string;
  name?: string;
  role?: string;
}

export interface LoginResponse {
  message?: string;
  user?: AuthUser;
  token?: string;
}

export interface ApiErrorResponse {
  message?: string;
  error?: string;
}

