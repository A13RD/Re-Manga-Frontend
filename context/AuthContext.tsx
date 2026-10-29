"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { AuthUser, MeResponse } from "@/types/auth";
import {
  api,
  ApiError,
  getStoredToken,
  setStoredToken,
  setOnUnauthorizedListener,
} from "@/lib/api";

export interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Proveedor de contexto de autenticación para Re-Manga.
 * Gestiona el token JWT y la sesión del usuario obtenida del backend.
 * - Restaura la sesión al recargar la página consultando GET /api/auth/me con el token almacenado.
 * - Mantiene el estado del usuario verificado por el servidor (no confía en roles modificables del cliente).
 * - Maneja respuestas 401 limpiando la sesión vencida de manera no intrusiva.
 * - Evita desajustes de hidratación en Next.js.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  /**
   * Cierra la sesión en el frontend: elimina el JWT de localStorage y restablece el estado en memoria.
   */
  const logout = useCallback(() => {
    setStoredToken(null);
    setUser(null);
    setTokenState(null);
  }, []);

  /**
   * Establece una nueva sesión tras un inicio de sesión exitoso con token y perfil confirmado por el backend.
   */
  const login = useCallback((newToken: string, newUser: AuthUser) => {
    setStoredToken(newToken);
    setTokenState(newToken);
    setUser(newUser);
  }, []);

  /**
   * Verifica la validez de la sesión contra el endpoint real del backend (GET /api/auth/me).
   * Solo si el servidor valida la firma y vigencia del JWT se asume la identidad del usuario.
   */
  const checkSession = useCallback(async () => {
    const storedToken = getStoredToken();

    if (!storedToken) {
      setUser(null);
      setTokenState(null);
      setIsLoading(false);
      return;
    }

    try {
      const data = await api.get<MeResponse>("/api/auth/me", { token: storedToken });
      if (data?.user) {
        setUser(data.user);
        setTokenState(storedToken);
      } else {
        logout();
      }
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 404)) {
        // Token expirado, inválido o no reconocido por el backend
        logout();
      } else {
        // Error de red temporal: no se destruye la sesión arbitrariamente pero se mantiene no confirmada
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    // Escuchar respuestas 401 del cliente HTTP en peticiones privadas
    setOnUnauthorizedListener(() => {
      logout();
    });

    // Diferir la verificación inicial de sesión fuera del turno síncrono del efecto
    const timer = setTimeout(() => {
      void checkSession();
    }, 0);

    return () => {
      clearTimeout(timer);
      setOnUnauthorizedListener(null);
    };
  }, [checkSession, logout]);

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: Boolean(user),
    isLoading,
    login,
    logout,
    checkSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook para acceder a la sesión y acciones de autenticación.
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe utilizarse dentro de un AuthProvider");
  }
  return context;
}
