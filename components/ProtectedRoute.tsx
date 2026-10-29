"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "ADMIN" | "USER";
  redirectTo?: string;
}

/**
 * Componente guardián para proteger rutas y vistas según sesión y rol.
 * - Evita mostrar contenido privado mientras la sesión se está verificando (isLoading).
 * - Redirige a usuarios no autenticados a /login.
 * - Restringe acceso a páginas exclusivas de ADMIN si el usuario tiene rol regular (403 Forbidden).
 */
export function ProtectedRoute({
  children,
  requiredRole,
  redirectTo = "/login",
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isLoading, isAuthenticated, redirectTo, router]);

  // Mientras se valida el JWT con el backend (GET /api/auth/me), no se renderiza nada privado
  if (isLoading) {
    return (
      <div
        className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="w-10 h-10 border-4 border-[var(--color-borde)] border-t-[var(--color-principal)] rounded-full animate-spin mb-4" />
        <p className="text-[var(--color-texto-secundario)] text-sm font-semibold">
          Verificando sesión...
        </p>
      </div>
    );
  }

  // Si no está autenticado, no renderizar el contenido mientras se produce la redirección
  if (!isAuthenticated || !user) {
    return null;
  }

  // Si se requiere rol ADMIN y el usuario no lo tiene (403 Forbidden a nivel interfaz)
  if (
    requiredRole === "ADMIN" &&
    user.role?.toUpperCase() !== "ADMIN"
  ) {
    return (
      <div
        className="max-w-[600px] mx-auto my-12 p-8 bg-[var(--color-blanco)] border border-[#e63946]/30 rounded-[var(--radio)] text-center shadow-sm"
        role="alert"
      >
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#e63946]/10 text-[#e63946] flex items-center justify-center">
          <svg
            className="w-7 h-7"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold mb-2 text-[var(--color-texto)]">
          Acceso denegado (403 Forbidden)
        </h2>
        <p className="text-[var(--color-texto-secundario)] text-sm mb-6">
          Esta sección está reservada exclusivamente para administradores de Re-Manga. Tu cuenta actual no posee privilegios suficientes.
        </p>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="px-5 py-2.5 bg-[var(--color-principal)] text-[var(--color-blanco)] font-bold rounded-[var(--radio)] hover:bg-[var(--color-principal-hover)] transition-colors text-sm cursor-pointer"
        >
          Volver al inicio
        </button>
      </div>
    );
  }

  return <>{children}</>;
}

