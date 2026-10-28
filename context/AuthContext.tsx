"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { AuthUser, ApiErrorResponse } from "@/types/auth";

export interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  checkSession: () => Promise<void>;
  logout: () => Promise<void>;
  setAuthenticatedUser: (user: AuthUser | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Proveedor de contexto de autenticación para Re-Manga.
 * Gestiona el estado de sesión en memoria de React sin almacenar
 * contraseñas ni tokens sensibles en localStorage o cookies accesibles por JavaScript.
 *
 * Prioriza la verificación de sesión basada en cookies HttpOnly si el backend
 * cuenta con un endpoint activo (ej: /api/auth/me). Si el endpoint no existe (HTTP 404),
 * asume estado no autenticado sin romper la hidratación ni inventar datos ficticios.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const getBaseUrl = useCallback((): string => {
    return (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/+$/, "");
  }, []);

  /**
   * Consulta al backend si existe una sesión activa y válida.
   * Utiliza credentials: "include" para transmitir cookies HttpOnly si están habilitadas.
   */
  const checkSession = useCallback(async () => {
    const baseUrl = getBaseUrl();
    const endpoint = `${baseUrl}/api/auth/me`;

    try {
      const res = await fetch(endpoint, {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.user) {
          setUser(data.user);
          return;
        }
      }
      // Sesión expirada, inválida o endpoint no implementado (404/401)
      setUser(null);
    } catch {
      // Backend no disponible o error de red
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [getBaseUrl]);

  /**
   * Cierra la sesión enviando la solicitud al backend si el endpoint existe,
   * y limpia el estado local en memoria.
   */
  const logout = useCallback(async () => {
    const baseUrl = getBaseUrl();
    const endpoint = `${baseUrl}/api/auth/logout`;

    try {
      await fetch(endpoint, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Manejo silencioso en caso de error de red o 404 del endpoint
    } finally {
      setUser(null);
    }
  }, [getBaseUrl]);

  const setAuthenticatedUser = useCallback((newUser: AuthUser | null) => {
    setUser(newUser);
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const value: AuthContextType = {
    user,
    isAuthenticated: Boolean(user),
    isLoading,
    checkSession,
    logout,
    setAuthenticatedUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook para acceder al contexto de autenticación en componentes cliente.
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe utilizarse dentro de un AuthProvider");
  }
  return context;
}

