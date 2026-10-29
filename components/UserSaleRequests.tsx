"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { obtenerMisSolicitudes } from "@/lib/solicitudes";
import { formatearPrecioCOP } from "@/data/mangas";
import { formatearCondicion } from "@/types/manga";
import { formatearEstadoSolicitud, type SaleRequestResponse } from "@/types/sale";
import { ApiError } from "@/lib/api";

interface UserSaleRequestsProps {
  mostrarBotonVender?: boolean;
}

/**
 * Componente que muestra las solicitudes de venta del usuario autenticado (GET /api/solicitudes/mias).
 * Presenta estado de carga, errores con reintento, estado vacío y listado estructurado.
 */
export function UserSaleRequests({ mostrarBotonVender = true }: UserSaleRequestsProps) {
  const [solicitudes, setSolicitudes] = useState<SaleRequestResponse[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const cargarSolicitudes = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const data = await obtenerMisSolicitudes();
      setSolicitudes(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || "Error al obtener las solicitudes de venta.");
      } else {
        setError("No fue posible cargar tus solicitudes de venta.");
      }
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void cargarSolicitudes();
    }, 0);

    return () => {
      clearTimeout(timer);
    };
  }, [cargarSolicitudes]);

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-bold text-[var(--color-texto)]">
            Mis solicitudes de venta
          </h3>
          <p className="text-xs sm:text-sm text-[var(--color-texto-secundario)]">
            Historial y estado de los mangas que has postulado para vender en Re-Manga.
          </p>
        </div>
        {mostrarBotonVender && (
          <Link
            href="/vender"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--color-principal)] hover:bg-[var(--color-principal-hover)] text-[var(--color-blanco)] text-sm font-bold rounded-[var(--radio)] transition-all shrink-0 self-start sm:self-auto focus-visible:outline-2 focus-visible:outline-[var(--color-principal)]"
          >
            + Nueva solicitud
          </Link>
        )}
      </div>

      {/* Estado 1: Cargando */}
      {cargando && (
        <div className="py-12 flex flex-col items-center justify-center text-center" aria-busy="true">
          <div className="w-8 h-8 border-3 border-[var(--color-borde)] border-t-[var(--color-principal)] rounded-full animate-spin mb-3" />
          <p className="text-xs sm:text-sm text-[var(--color-texto-secundario)]">
            Cargando tus solicitudes...
          </p>
        </div>
      )}

      {/* Estado 2: Error */}
      {error && !cargando && (
        <div
          className="p-5 border border-[#e63946]/30 bg-[#e63946]/10 rounded-[var(--radio)] text-center my-4"
          role="alert"
        >
          <p className="text-sm font-semibold text-[var(--color-texto)] mb-3">{error}</p>
          <button
            type="button"
            onClick={cargarSolicitudes}
            className="px-4 py-1.5 bg-[var(--color-principal)] text-[var(--color-blanco)] text-xs font-bold rounded-[var(--radio)] hover:bg-[var(--color-principal-hover)] transition-colors cursor-pointer"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Estado 3: Sin solicitudes */}
      {!cargando && !error && solicitudes.length === 0 && (
        <div
          className="p-8 border border-dashed border-[var(--color-borde)] rounded-[var(--radio)] text-center my-4 bg-[var(--color-superficie-secundaria)]/50"
          role="status"
        >
          <p className="text-sm text-[var(--color-texto-secundario)] mb-4">
            Aún no has enviado ninguna solicitud de venta.
          </p>
          {mostrarBotonVender && (
            <Link
              href="/vender"
              className="inline-block px-4 py-2 border border-[var(--color-principal)] text-[var(--color-principal)] hover:bg-[var(--color-principal)] hover:text-[var(--color-blanco)] text-xs font-bold rounded-[var(--radio)] transition-colors"
            >
              Publicar mi primer manga
            </Link>
          )}
        </div>
      )}

      {/* Estado 4: Listado de solicitudes */}
      {!cargando && !error && solicitudes.length > 0 && (
        <div className="flex flex-col gap-3">
          {solicitudes.map((solicitud) => {
            const estado = formatearEstadoSolicitud(solicitud.status);
            const precioNum =
              typeof solicitud.proposedPrice === "number"
                ? solicitud.proposedPrice
                : parseFloat(String(solicitud.proposedPrice)) || 0;

            const fecha = solicitud.createdAt
              ? new Date(solicitud.createdAt).toLocaleDateString("es-CO", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              : "";

            return (
              <div
                key={solicitud.id}
                className="p-4 sm:p-5 rounded-[var(--radio)] border border-[var(--color-borde)] bg-[var(--color-blanco)] hover:border-[var(--color-principal)]/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-principal)]">
                      {solicitud.genre}
                    </span>
                    <span className="text-[var(--color-texto-secundario)] text-xs">·</span>
                    <span className="text-xs text-[var(--color-texto-secundario)]">
                      {solicitud.volume ? `Volumen ${solicitud.volume}` : "Tomo único"}
                    </span>
                    {fecha && (
                      <>
                        <span className="text-[var(--color-texto-secundario)] text-xs">·</span>
                        <span className="text-xs text-[var(--color-texto-secundario)]">
                          Enviada el {fecha}
                        </span>
                      </>
                    )}
                  </div>
                  <h4 className="text-base sm:text-lg font-bold text-[var(--color-texto)] truncate">
                    {solicitud.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-[var(--color-texto-secundario)] mt-0.5">
                    Autor: {solicitud.author} · Estado físico:{" "}
                    <strong>{formatearCondicion(solicitud.condition)}</strong>
                  </p>
                  {solicitud.description && (
                    <p className="text-xs text-[var(--color-texto-secundario)] mt-1.5 italic line-clamp-1">
                      &quot;{solicitud.description}&quot;
                    </p>
                  )}
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-[var(--color-borde)]">
                  <strong className="text-base sm:text-lg font-bold text-[var(--color-principal)]">
                    {formatearPrecioCOP(precioNum)}
                  </strong>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${estado.clase}`}
                  >
                    {estado.etiqueta}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
