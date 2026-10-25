"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { CartItem } from "@/types/cart";

interface CartContextType {
  totalItems: number;
  items: CartItem[];
  refreshCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CART_STORAGE_KEY = "carrito";

/**
 * Nombre del evento personalizado para sincronizar actualizaciones del carrito
 * entre componentes dentro de la misma pestaña sin recargar la página.
 */
export const CART_UPDATED_EVENT = "remanga:carrito-actualizado";

/**
 * Emite un evento en la ventana para notificar a los componentes escuchando que
 * los datos del carrito han sido modificados.
 */
export function notificarCambioCarrito(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT));
  }
}

/**
 * Lee y valida los datos del carrito desde localStorage de manera segura.
 * Retorna un arreglo vacío si el carrito no existe, está corrupto o tiene datos inválidos.
 */
export function leerCarritoDesdeStorage(): CartItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Validar cada elemento según la estructura original { id, titulo, volumen, precio, imagen, cantidad }
    return parsed.filter((item): item is CartItem => {
      return (
        item !== null &&
        typeof item === "object" &&
        typeof item.id === "number" &&
        typeof item.cantidad === "number" &&
        Number.isFinite(item.cantidad) &&
        item.cantidad > 0
      );
    });
  } catch (error) {
    console.warn("Error al leer el carrito desde localStorage:", error);
    return [];
  }
}

/**
 * Calcula el número total de unidades en el carrito sumando las cantidades de cada manga.
 */
export function calcularTotalUnidades(items: CartItem[]): number {
  return items.reduce((total, item) => {
    const cant = typeof item.cantidad === "number" && Number.isFinite(item.cantidad) ? item.cantidad : 0;
    return total + Math.max(0, cant);
  }, 0);
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);

  const refreshCart = useCallback(() => {
    const elementos = leerCarritoDesdeStorage();
    setItems(elementos);
    setTotalItems(calcularTotalUnidades(elementos));
  }, []);

  useEffect(() => {
    // Lectura inicial en el cliente tras el montaje (evita disparidad de hidratación SSR)
    refreshCart();

    // Sincronización entre pestañas distintas (evento nativo de almacenamiento)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === CART_STORAGE_KEY) {
        refreshCart();
      }
    };

    // Sincronización dentro de la misma pestaña mediante evento personalizado
    const handleCustomChange = () => {
      refreshCart();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(CART_UPDATED_EVENT, handleCustomChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(CART_UPDATED_EVENT, handleCustomChange);
    };
  }, [refreshCart]);

  return (
    <CartContext.Provider value={{ totalItems, items, refreshCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart debe utilizarse dentro de un CartProvider.");
  }
  return context;
}
