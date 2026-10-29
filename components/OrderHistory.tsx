"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { obtenerMisOrdenes } from "@/lib/ordenes";
import { formatearPrecioCOP } from "@/data/mangas";
import type { Order } from "@/types/order";

export function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [direccionesPorOrden, setDireccionesPorOrden] = useState<Record<string, string>>({});
  const [direccionDefault, setDireccionDefault] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      try {
        const rawMap = localStorage.getItem("remanga_ordenes_direcciones");
        if (rawMap) {
          setDireccionesPorOrden(JSON.parse(rawMap));
        }
        const savedDir = localStorage.getItem("remanga_direccion_entrega");
        if (savedDir) {
          setDireccionDefault(savedDir);
        }
      } catch {
        // Ignorar errores de acceso a localStorage
      }
      const data = await obtenerMisOrdenes();
      setOrders(data);
    } catch (err: unknown) {
      console.error("Error al obtener órdenes:", err);
      setError("No fue posible cargar tu historial de compras. Verifica tu conexión.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchOrders]);

  if (isLoading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Cargando historial de compras">
        <div className="h-6 w-52 bg-gray-200 dark:bg-gray-800 rounded animate-pulse mb-4" />
        {[1, 2].map((i) => (
          <div
            key={i}
            className="h-36 bg-[var(--color-superficie-secundaria)] rounded-[var(--radio)] border border-[var(--color-borde)] animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-[var(--radio)] text-center">
        <p className="text-red-700 dark:text-red-300 font-semibold mb-3">{error}</p>
        <button
          type="button"
          onClick={() => fetchOrders()}
          className="px-4 py-2 bg-[var(--color-principal)] text-[var(--color-blanco)] font-bold rounded-full text-sm hover:bg-[var(--color-principal-hover)] transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12 px-4 border border-dashed border-[var(--color-borde)] rounded-[var(--radio)] bg-[var(--color-superficie-secundaria)]">
        <svg
          className="w-12 h-12 mx-auto text-gray-400 mb-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
          />
        </svg>
        <h3 className="text-lg font-bold text-[var(--color-texto)] mb-1">
          No tienes compras registradas
        </h3>
        <p className="text-sm text-[var(--color-texto-secundario)] max-w-md mx-auto mb-5">
          Cuando realices un pedido a través de tu carrito, verás aquí el desglose completo, estado y mangas adquiridos.
        </p>
        <Link
          href="/#catalogo"
          className="inline-flex items-center justify-center px-6 py-2.5 bg-[var(--color-principal)] hover:bg-[var(--color-principal-hover)] text-[var(--color-blanco)] font-bold text-sm rounded-full transition-all hover:-translate-y-0.5"
        >
          Ir a comprar mangas
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-[var(--color-texto)]">
          Historial de compras ({orders.length})
        </h3>
        <button
          type="button"
          onClick={() => fetchOrders()}
          className="text-xs text-[var(--color-principal)] hover:underline font-semibold"
        >
          Actualizar historial
        </button>
      </div>

      <div className="space-y-4">
        {orders.map((order) => {
          const dateStr = new Date(order.createdAt).toLocaleDateString("es-CO", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });

          const totalNum = Number(order.totalAmount);

          const statusColor =
            order.status === "COMPLETED"
              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800"
              : order.status === "PENDING"
              ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 border-amber-300 dark:border-amber-800"
              : "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-400 border-red-300 dark:border-red-800";

          const statusLabel =
            order.status === "COMPLETED"
              ? "Completado"
              : order.status === "PENDING"
              ? "Pendiente (Contraentrega)"
              : "Cancelado";

          const direccionOrden = direccionesPorOrden[order.id] || direccionDefault;

          return (
            <article
              key={order.id}
              className="bg-[var(--color-blanco)] border border-[var(--color-borde)] rounded-[var(--radio)] overflow-hidden shadow-xs transition-colors"
            >
              {/* Encabezado del pedido */}
              <div className="p-4 sm:p-5 bg-[var(--color-superficie-secundaria)] border-b border-[var(--color-borde)] flex flex-wrap items-center justify-between gap-3 text-sm">
                <div>
                  <span className="text-xs text-[var(--color-texto-secundario)] block uppercase tracking-wider font-semibold">
                    Orden #{order.id.slice(0, 8)}...
                  </span>
                  <span className="text-xs text-[var(--color-texto-secundario)] block">{dateStr}</span>
                  {direccionOrden && (
                    <span className="text-xs text-[var(--color-texto-secundario)] block mt-0.5">
                      Entrega: <strong className="text-[var(--color-texto)] font-medium">{direccionOrden}</strong>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-bold border ${statusColor}`}
                  >
                    {statusLabel}
                  </span>
                  <strong className="text-base font-extrabold text-[var(--color-principal)]">
                    {formatearPrecioCOP(totalNum)}
                  </strong>
                </div>
              </div>

              {/* Mangas de la orden */}
              <div className="p-4 sm:p-5 divide-y divide-[var(--color-borde)]">
                {order.orderItems && order.orderItems.length > 0 ? (
                  order.orderItems.map((item) => {
                    const unitPriceNum = Number(item.unitPrice);
                    const subtotal = unitPriceNum * item.quantity;
                    const manga = item.manga;

                    return (
                      <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-center gap-4">
                        <div className="relative w-14 h-20 bg-[var(--color-superficie-secundaria)] rounded shrink-0 overflow-hidden flex items-center justify-center border border-[var(--color-borde)]">
                          {manga?.image ? (
                            <Image
                              src={manga.image}
                              alt={manga.title || "Manga"}
                              fill
                              sizes="56px"
                              className="object-cover"
                              unoptimized={Boolean(manga.image.startsWith("http://") || manga.image.startsWith("https://"))}
                            />
                          ) : (
                            <span className="text-[10px] text-[var(--color-texto-secundario)]">Sin foto</span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-[var(--color-texto)] truncate">
                            {manga?.title || "Manga"}
                          </h4>
                          <p className="text-xs text-[var(--color-texto-secundario)]">
                            {manga?.volume ? `Tomo ${manga.volume}` : "Tomo único"} · {manga?.author || "Autor"}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-xs">
                            <span className="text-[var(--color-texto-secundario)]">
                              Cantidad: <strong className="text-[var(--color-texto)]">{item.quantity}</strong>
                            </span>
                            <span className="text-[var(--color-texto-secundario)]">·</span>
                            <span className="text-[var(--color-texto-secundario)]">
                              Precio unitario: {formatearPrecioCOP(unitPriceNum)}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs text-[var(--color-texto-secundario)] block">Subtotal</span>
                          <strong className="text-sm font-bold text-[var(--color-texto)]">
                            {formatearPrecioCOP(subtotal)}
                          </strong>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-[var(--color-texto-secundario)] py-2">
                    Sin detalle de items disponible
                  </p>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

