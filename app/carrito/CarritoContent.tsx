"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { formatearPrecioCOP } from "@/data/mangas";
import { crearOrden } from "@/lib/ordenes";
import type { Order } from "@/types/order";

const DIRECCION_STORAGE_KEY = "remanga_direccion_entrega";
const ORDENES_DIRECCIONES_KEY = "remanga_ordenes_direcciones";

/**
 * Componente cliente que renderiza la interfaz completa de la página del carrito.
 * Gestiona la lista de productos, controles de cantidad, eliminación individual,
 * acción para vaciar el carrito con confirmación, verificación de dirección contraentrega
 * y cálculo reactivo del total.
 */
export function CarritoContent() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const {
    items,
    totalPrecio,
    incrementarCantidad,
    disminuirCantidad,
    eliminarDelCarrito,
    vaciarCarrito,
  } = useCart();

  const [direccionEntrega, setDireccionEntrega] = useState<string>("");
  const [direccionConfirmada, setDireccionConfirmada] = useState<string>("");
  const [isCheckingOut, setIsCheckingOut] = useState<boolean>(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<Order | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const guardada = localStorage.getItem(DIRECCION_STORAGE_KEY);
        if (guardada) {
          setDireccionEntrega(guardada);
        }
      } catch {
        // Ignorar errores de acceso a localStorage
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleDireccionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDireccionEntrega(val);
    if (orderError) setOrderError(null);
    try {
      localStorage.setItem(DIRECCION_STORAGE_KEY, val);
    } catch {
      // Ignorar errores de acceso a localStorage
    }
  };

  /**
   * Solicita confirmación nativa al usuario antes de vaciar el carrito,
   * replicando el comportamiento original del frontend.
   */
  const handleVaciarCarrito = () => {
    if (typeof window !== "undefined") {
      const confirmado = window.confirm("¿Quieres vaciar tu carrito?");
      if (confirmado) {
        vaciarCarrito();
      }
    }
  };

  /**
   * Procesa la compra contraentrega enviando los items al endpoint protegido POST /api/orders.
   * El backend valida el stock y recalcula los precios reales desde la base de datos.
   */
  const handleRealizarCompra = async () => {
    setOrderError(null);

    if (!isAuthenticated) {
      router.push("/login?redirect=carrito");
      return;
    }

    if (items.length === 0) {
      setOrderError("Tu carrito está vacío.");
      return;
    }

    const dirLimpia = direccionEntrega.trim();
    if (!dirLimpia) {
      setOrderError("Por favor ingresa y verifica tu dirección de entrega antes de finalizar el pedido.");
      return;
    }

    setIsCheckingOut(true);
    try {
      const orderPayload = items.map((item) => ({
        mangaId: String(item.id),
        quantity: item.cantidad,
      }));

      const createdOrder = await crearOrden(orderPayload);

      try {
        localStorage.setItem(DIRECCION_STORAGE_KEY, dirLimpia);
        const rawMap = localStorage.getItem(ORDENES_DIRECCIONES_KEY);
        const map: Record<string, string> = rawMap ? JSON.parse(rawMap) : {};
        map[createdOrder.id] = dirLimpia;
        localStorage.setItem(ORDENES_DIRECCIONES_KEY, JSON.stringify(map));
      } catch {
        // Ignorar errores de localStorage
      }

      setDireccionConfirmada(dirLimpia);
      vaciarCarrito();
      setOrderSuccess(createdOrder);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Ocurrió un error al procesar tu compra. Por favor intenta de nuevo.";
      setOrderError(msg);
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (orderSuccess) {
    return (
      <section
        id="carrito-exito"
        aria-labelledby="titulo-orden-exitosa"
        className="max-w-[var(--max-ancho)] mx-auto px-5 sm:px-6 md:px-[30px] py-[40px] md:py-[var(--espacio-grande)] min-h-[60vh]"
      >
        <div className="max-w-[650px] mx-auto bg-[var(--color-blanco)] border border-[var(--color-borde)] rounded-[var(--radio)] p-8 sm:p-10 text-center shadow-[0_10px_25px_var(--color-sombra)]">
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 id="titulo-orden-exitosa" className="text-2xl sm:text-3xl font-extrabold text-[var(--color-texto)] mb-2">
            ¡Pedido contraentrega confirmado!
          </h1>
          <p className="text-[var(--color-texto-secundario)] text-base mb-6">
            Tu orden ha sido registrada exitosamente y las unidades se han reservado del inventario. El pago se realiza en efectivo al recibir tus mangas.
          </p>

          <div className="bg-[var(--color-superficie-secundaria)] rounded-[var(--radio)] p-5 text-left mb-6 space-y-2 border border-[var(--color-borde)]">
            <div className="flex justify-between text-sm gap-4">
              <span className="text-[var(--color-texto-secundario)]">N.° de Orden:</span>
              <span className="font-mono font-bold text-[var(--color-texto)] break-all text-right">{orderSuccess.id}</span>
            </div>
            <div className="flex justify-between text-sm gap-4">
              <span className="text-[var(--color-texto-secundario)]">Modalidad de pago:</span>
              <span className="font-semibold text-[var(--color-texto)]">Contraentrega</span>
            </div>
            {direccionConfirmada && (
              <div className="flex justify-between text-sm gap-4">
                <span className="text-[var(--color-texto-secundario)]">Dirección de entrega:</span>
                <span className="font-semibold text-[var(--color-texto)] text-right">{direccionConfirmada}</span>
              </div>
            )}
            <div className="flex justify-between text-sm gap-4">
              <span className="text-[var(--color-texto-secundario)]">Estado del pedido:</span>
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                {orderSuccess.status === "PENDING" ? "Pendiente de entrega (PENDING)" : orderSuccess.status}
              </span>
            </div>
            <div className="flex justify-between text-base font-bold pt-2 border-t border-[var(--color-borde)]">
              <span className="text-[var(--color-texto)]">Total a pagar contraentrega:</span>
              <span className="text-[var(--color-principal)]">{formatearPrecioCOP(Number(orderSuccess.totalAmount))}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/perfil"
              className="inline-flex items-center justify-center rounded-full py-3 px-6 bg-[var(--color-principal)] hover:bg-[var(--color-principal-hover)] text-[var(--color-blanco)] font-bold text-base transition-all hover:-translate-y-0.5"
            >
              Ver mis compras
            </Link>
            <Link
              href="/#catalogo"
              className="inline-flex items-center justify-center rounded-full py-3 px-6 border border-[var(--color-borde)] bg-[var(--color-blanco)] text-[var(--color-texto)] hover:bg-[var(--color-superficie-secundaria)] font-bold text-base transition-all hover:-translate-y-0.5"
            >
              Seguir explorando
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const estaVacio = items.length === 0;

  return (
    <section
      id="carrito"
      aria-labelledby="titulo-carrito"
      className="max-w-[var(--max-ancho)] mx-auto px-5 sm:px-6 md:px-[30px] py-[40px] md:py-[var(--espacio-grande)] min-h-[60vh]"
    >
      <h1
        id="titulo-carrito"
        className="text-[2.2rem] md:text-[3rem] font-bold mb-[25px] text-[var(--color-texto)] leading-tight"
      >
        Tu carrito
      </h1>

      {/* ====================================================================
          ESTADO VACÍO
          Se presenta cuando no hay productos en el carrito.
          ==================================================================== */}
      {estaVacio ? (
        <div
          id="carrito-vacio"
          className="carrito-vacio max-w-[680px] mx-auto bg-[var(--color-blanco)] border border-[var(--color-borde)] rounded-[var(--radio)] p-[42px_30px] text-center shadow-[0_8px_20px_var(--color-sombra)] my-8 transition-colors duration-200"
          role="status"
        >
          <p className="text-[1.8rem] md:text-[2.5rem] font-extrabold text-[var(--color-texto)] mb-3 leading-snug">
            Tu carrito está vacío
          </p>
          <p className="text-[var(--color-texto-secundario)] mb-6 text-base leading-relaxed">
            Explora nuestro catálogo y encuentra tu próximo manga.
          </p>
          <Link
            href="/#catalogo"
            className="boton-carrito boton-principal inline-flex items-center justify-center rounded-full py-3 px-7 bg-[var(--color-principal)] hover:bg-[var(--color-principal-hover)] text-[var(--color-blanco)] font-bold text-base transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-[var(--color-principal)]"
          >
            Ver catálogo
          </Link>
        </div>
      ) : (
        /* ====================================================================
           RESUMEN DEL CARRITO Y LISTA DE MANGAS
           ==================================================================== */
        <div
          id="resumen-carrito"
          className="resumen-carrito grid grid-cols-1 lg:grid-cols-[minmax(0,2.2fr)_minmax(280px,0.8fr)] gap-[25px] items-start mt-6"
        >
          {/* Lista de tarjetas de mangas en el carrito */}
          <div
            id="lista-carrito"
            className="lista-carrito grid grid-cols-1 sm:grid-cols-2 gap-[25px]"
          >
            {items.map((item) => {
              const subtotal = item.precio * item.cantidad;

              return (
                <article
                  key={item.id}
                  className="manga-card carrito-card bg-[var(--color-blanco)] border border-[var(--color-borde)] rounded-[var(--radio)] overflow-hidden flex flex-col h-full shadow-[0_8px_20px_var(--color-sombra)] hover:-translate-y-1 hover:shadow-[0_12px_26px_var(--color-sombra)] transition-all duration-200"
                >
                  {/* Portada del manga */}
                  <div className="carrito-card-imagen relative w-full h-[230px] max-sm:h-[200px] bg-[var(--color-superficie-secundaria)] flex items-center justify-center overflow-hidden">
                    <Image
                      src={item.imagen}
                      alt={`Portada de ${item.titulo}, volumen ${item.volumen}`}
                      fill
                      sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw"
                      className="object-contain block transition-transform duration-200 hover:scale-[1.02]"
                    />
                  </div>

                  {/* Contenido descriptivo y acciones */}
                  <div className="manga-card-content carrito-card-content p-5 flex flex-col flex-1">
                    <span className="manga-genero inline-block mb-2 text-[var(--color-principal)] text-[0.8rem] font-bold uppercase tracking-wider">
                      Manga
                    </span>

                    <h2 className="text-[1.3rem] font-bold mb-1 text-[var(--color-texto)] leading-snug">
                      {item.titulo}
                    </h2>

                    <p className="manga-volumen text-[0.9rem] text-[var(--color-texto-secundario)] mb-2.5">
                      Tomo {item.volumen}
                    </p>

                    <strong className="manga-precio text-[var(--color-principal)] text-[1.2rem] font-bold block mb-4">
                      {formatearPrecioCOP(item.precio)}
                    </strong>

                    {/* Fila de controles de cantidad y eliminación */}
                    <div className="carrito-acciones mt-auto flex flex-wrap items-center justify-between gap-[15px] max-sm:flex-col max-sm:items-stretch">
                      <div
                        className="controles-cantidad inline-flex items-center border border-[var(--color-borde)] rounded-[10px] overflow-hidden bg-[var(--color-blanco)] max-sm:w-full max-sm:justify-between transition-colors duration-200"
                        aria-label={`Cantidad de ${item.titulo}`}
                      >
                        <button
                          type="button"
                          className="btn-cantidad w-[38px] h-[38px] flex items-center justify-center border-none bg-transparent text-[var(--color-texto)] text-[1.4rem] font-bold cursor-pointer hover:bg-[var(--color-superficie-secundaria)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-principal)]"
                          onClick={() => disminuirCantidad(item.id)}
                          aria-label={`Disminuir cantidad de ${item.titulo}`}
                        >
                          −
                        </button>
                        <span
                          className="min-w-[38px] text-center font-bold text-[var(--color-texto)] select-none text-base"
                          aria-live="polite"
                        >
                          {item.cantidad}
                        </span>
                        <button
                          type="button"
                          className="btn-cantidad w-[38px] h-[38px] flex items-center justify-center border-none bg-transparent text-[var(--color-texto)] text-[1.4rem] font-bold cursor-pointer hover:bg-[var(--color-superficie-secundaria)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-principal)]"
                          onClick={() => incrementarCantidad(item.id)}
                          aria-label={`Aumentar cantidad de ${item.titulo}`}
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        className="btn-eliminar border border-[var(--color-borde)] rounded-[var(--radio)] bg-[var(--color-blanco)] text-[var(--color-texto)] px-4 py-2 font-bold text-sm sm:text-base cursor-pointer transition-colors duration-200 hover:bg-[#fff5f5] hover:border-[#f0b9bf] hover:text-[var(--color-principal)] dark:hover:bg-[#382628] dark:hover:border-[#6b353b] dark:hover:text-[#ff6b6b] max-sm:w-full text-center focus-visible:outline-2 focus-visible:outline-[var(--color-principal)]"
                        onClick={() => eliminarDelCarrito(item.id)}
                        aria-label={`Eliminar ${item.titulo} del carrito`}
                      >
                        Eliminar
                      </button>
                    </div>

                    {/* Subtotal por elemento */}
                    <p className="carrito-subtotal mt-4 text-[0.95rem] text-[var(--color-texto-secundario)]">
                      Subtotal:{" "}
                      <strong className="text-[var(--color-texto)] font-bold">
                        {formatearPrecioCOP(subtotal)}
                      </strong>
                    </p>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Bloque resumen del total (adhesivo en pantallas grandes) */}
          <div className="carrito-total bg-[var(--color-blanco)] border border-[var(--color-borde)] rounded-[var(--radio)] p-[22px_18px] sm:p-[26px_22px] shadow-[0_8px_20px_var(--color-sombra)] lg:sticky lg:top-[90px] transition-colors duration-200">
            <p className="flex items-center justify-between gap-4 m-0 text-[1.1rem] font-bold text-[var(--color-texto)]">
              <span>Total</span>
              <strong
                id="total-carrito"
                className="text-[var(--color-principal)] text-[1.8rem] sm:text-[2rem] leading-tight"
              >
                {formatearPrecioCOP(totalPrecio)}
              </strong>
            </p>

            {/* Información de pago contraentrega y verificación de dirección */}
            <div className="mt-4 pt-4 border-t border-[var(--color-borde)] space-y-3">
              <div className="bg-[var(--color-superficie-secundaria)] rounded-[var(--radio)] p-3 border border-[var(--color-borde)]">
                <span className="block text-xs font-bold uppercase tracking-wider text-[var(--color-principal)] mb-0.5">
                  Modalidad: Pago contraentrega
                </span>
                <p className="text-xs text-[var(--color-texto-secundario)] leading-relaxed m-0">
                  No se requiere tarjeta ni pasarela de pago en línea. Pagas en efectivo al recibir tus mangas.
                </p>
              </div>

              <div>
                <label
                  htmlFor="direccion-entrega"
                  className="block text-xs font-bold text-[var(--color-texto)] mb-1.5"
                >
                  Dirección de entrega <span className="text-[var(--color-principal)]">*</span>
                </label>
                <input
                  id="direccion-entrega"
                  type="text"
                  value={direccionEntrega}
                  onChange={handleDireccionChange}
                  placeholder="Ej. Calle 45 # 12-34, Apto 301, Bogotá"
                  className="w-full border border-[var(--color-borde)] rounded-[var(--radio)] py-2.5 px-3 text-sm text-[var(--color-texto)] bg-[var(--color-blanco)] focus:outline-2 focus:outline-[var(--color-principal)]"
                />
              </div>
            </div>

            {orderError && (
              <div
                role="alert"
                className="mt-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-[var(--radio)] text-sm text-red-600 dark:text-red-400"
              >
                {orderError}
              </div>
            )}

            <div className="acciones-carrito flex flex-col gap-3 mt-[22px]">
              <button
                id="finalizar-compra"
                type="button"
                onClick={handleRealizarCompra}
                disabled={isCheckingOut}
                className="boton-carrito boton-principal w-full rounded-full py-3.5 px-[18px] font-bold border border-[var(--color-principal)] bg-[var(--color-principal)] text-[var(--color-blanco)] text-center cursor-pointer transition-all duration-200 hover:bg-[var(--color-principal-hover)] hover:border-[var(--color-principal-hover)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-[var(--color-principal)] text-base shadow-sm"
              >
                {isCheckingOut ? "Procesando compra..." : "Finalizar compra"}
              </button>
              <button
                id="vaciar-carrito"
                type="button"
                onClick={handleVaciarCarrito}
                disabled={isCheckingOut}
                className="boton-carrito boton-secundario w-full rounded-full py-3 px-[18px] font-bold border border-[#f1b8bf] dark:border-[#5a2e34] bg-[var(--color-blanco)] text-[var(--color-principal)] cursor-pointer transition-all duration-200 hover:bg-[#fff5f5] dark:hover:bg-[#342225] hover:border-[#e78692] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-[var(--color-principal)] text-center text-base"
              >
                Vaciar carrito
              </button>
              <Link
                href="/#catalogo"
                className="boton-carrito boton-secundario w-full rounded-full py-3 px-[18px] font-semibold border border-[var(--color-borde)] bg-[var(--color-blanco)] text-[var(--color-texto-secundario)] hover:text-[var(--color-texto)] hover:bg-[var(--color-superficie-secundaria)] text-center cursor-pointer transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-2 focus-visible:outline-[var(--color-principal)] text-base"
              >
                Continuar comprando
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
