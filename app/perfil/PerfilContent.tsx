"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { UserSaleRequests } from "@/components/UserSaleRequests";
import { FavoritesList } from "@/components/FavoritesList";
import { OrderHistory } from "@/components/OrderHistory";

type PerfilTab = "compras" | "favoritos" | "solicitudes";

export function PerfilContent() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<PerfilTab>("compras");

  return (
    <ProtectedRoute>
      <div className="max-w-[var(--max-ancho)] mx-auto px-5 sm:px-6 md:px-[30px] py-[40px] md:py-[var(--espacio-grande)]">
        {/* Encabezado del perfil */}
        <div className="mb-8">
          <h1 className="text-[2rem] sm:text-[2.5rem] font-bold text-[var(--color-texto)] mb-2">
            Mi Cuenta
          </h1>
          <p className="text-[var(--color-texto-secundario)] text-sm sm:text-base">
            Gestiona tu información de perfil, tus compras, favoritos y solicitudes de venta.
          </p>
        </div>

        {/* Tarjeta de información del usuario */}
        <div className="bg-[var(--color-blanco)] border border-[var(--color-borde)] rounded-[var(--radio)] p-6 sm:p-8 shadow-xs mb-8 transition-colors duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-[var(--color-borde)]">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[var(--color-principal)]/15 text-[var(--color-principal)] font-black text-2xl flex items-center justify-center shrink-0">
                {(user?.nombre || user?.name || user?.email || "U")
                  .charAt(0)
                  .toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold text-[var(--color-texto)]">
                  {user?.nombre || user?.name || "Usuario Re-Manga"}
                </h2>
                <p className="text-sm text-[var(--color-texto-secundario)]">
                  {user?.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`text-xs px-3 py-1 rounded-full font-mono font-bold uppercase tracking-wider ${
                  user?.role?.toUpperCase() === "ADMIN"
                    ? "bg-[var(--color-principal)] text-[var(--color-blanco)]"
                    : "bg-[#238636]/15 text-[#238636] dark:text-[#3fb950] border border-[#238636]/30"
                }`}
              >
                Rol: {user?.role || "USER"}
              </span>

              {user?.role?.toUpperCase() === "ADMIN" && (
                <Link
                  href="/admin"
                  className="px-4 py-1.5 bg-[var(--color-superficie-secundaria)] border border-[var(--color-principal)] text-[var(--color-principal)] hover:bg-[var(--color-principal)] hover:text-[var(--color-blanco)] text-xs font-bold rounded-[var(--radio)] transition-all"
                >
                  Panel Administrador →
                </Link>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 text-sm">
            <div>
              <span className="block text-xs font-semibold text-[var(--color-texto-secundario)] mb-1 uppercase tracking-wider">
                Identificador de cuenta
              </span>
              <code className="text-xs font-mono text-[var(--color-texto)] bg-[var(--color-superficie-secundaria)] px-2.5 py-1 rounded border border-[var(--color-borde)]">
                {user?.id}
              </code>
            </div>
            <div>
              <span className="block text-xs font-semibold text-[var(--color-texto-secundario)] mb-1 uppercase tracking-wider">
                Estado de la sesión
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#238636] dark:text-[#3fb950]">
                <span className="w-2 h-2 rounded-full bg-[#238636]" />
                Autenticada con JWT verificado
              </span>
            </div>
          </div>
        </div>

        {/* Pestañas de navegación de secciones del usuario */}
        <div className="flex border-b border-[var(--color-borde)] mb-6 gap-2 sm:gap-4 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("compras")}
            className={`pb-3 px-3 sm:px-4 text-sm sm:text-base font-bold whitespace-nowrap transition-all border-b-2 ${
              activeTab === "compras"
                ? "border-[var(--color-principal)] text-[var(--color-principal)]"
                : "border-transparent text-[var(--color-texto-secundario)] hover:text-[var(--color-texto)]"
            }`}
          >
            Mis Compras
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("favoritos")}
            className={`pb-3 px-3 sm:px-4 text-sm sm:text-base font-bold whitespace-nowrap transition-all border-b-2 ${
              activeTab === "favoritos"
                ? "border-[var(--color-principal)] text-[var(--color-principal)]"
                : "border-transparent text-[var(--color-texto-secundario)] hover:text-[var(--color-texto)]"
            }`}
          >
            Mis Favoritos
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("solicitudes")}
            className={`pb-3 px-3 sm:px-4 text-sm sm:text-base font-bold whitespace-nowrap transition-all border-b-2 ${
              activeTab === "solicitudes"
                ? "border-[var(--color-principal)] text-[var(--color-principal)]"
                : "border-transparent text-[var(--color-texto-secundario)] hover:text-[var(--color-texto)]"
            }`}
          >
            Mis Solicitudes de Venta
          </button>
        </div>

        {/* Contenido de la pestaña activa */}
        <div className="bg-[var(--color-blanco)] border border-[var(--color-borde)] rounded-[var(--radio)] p-6 sm:p-8 shadow-xs transition-colors duration-200">
          {activeTab === "compras" && <OrderHistory />}
          {activeTab === "favoritos" && <FavoritesList />}
          {activeTab === "solicitudes" && <UserSaleRequests mostrarBotonVender={true} />}
        </div>
      </div>
    </ProtectedRoute>
  );
}
