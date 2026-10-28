"use client";

import React, {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useSyncExternalStore,
} from "react";
import type { CartItem, CartItemInput } from "@/types/cart";

export interface CartContextType {
  items: CartItem[];
  totalItems: number;
  agregarAlCarrito: (manga: CartItemInput) => void;
  estaEnCarrito: (id: number) => boolean;
  obtenerCantidad: (id: number) => number;
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
 * Emite un evento en la ventana para notificar a los componentes que
 * los datos del carrito han sido modificados localmente.
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

    // Validar rigurosamente cada elemento para evitar que datos corruptos rompan la interfaz
    return parsed.filter((item): item is CartItem => {
      return (
        item !== null &&
        typeof item === "object" &&
        typeof item.id === "number" &&
        Number.isFinite(item.id) &&
        typeof item.titulo === "string" &&
        item.titulo.trim().length > 0 &&
        typeof item.volumen === "number" &&
        Number.isFinite(item.volumen) &&
        typeof item.precio === "number" &&
        Number.isFinite(item.precio) &&
        item.precio >= 0 &&
        typeof item.imagen === "string" &&
        item.imagen.trim().length > 0 &&
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
 * Guarda los elementos del carrito en localStorage y notifica a los suscriptores.
 */
export function guardarCarritoEnStorage(carrito: CartItem[]): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(carrito));
    memoryCartSnapshot = carrito;
    notificarCambioCarrito();
    notificarListeners();
  } catch (error) {
    console.warn("Error al guardar el carrito en localStorage:", error);
  }
}

/**
 * Calcula el número total de unidades en el carrito sumando las cantidades de cada manga.
 * Ejemplo: Manga A (2) + Manga B (3) = 5 unidades.
 */
export function calcularTotalUnidades(items: CartItem[]): number {
  return items.reduce((total, item) => {
    const cant =
      typeof item.cantidad === "number" && Number.isFinite(item.cantidad)
        ? item.cantidad
        : 0;
    return total + Math.max(0, cant);
  }, 0);
}

// ============================================================================
// GESTOR DE ESTADO EXTERNO CON useSyncExternalStore
// Evita desincronizaciones, bucles de renderizado y discrepancias de hidratación SSR.
// ============================================================================

let memoryCartSnapshot: CartItem[] | null = null;
let storeListeners: Array<() => void> = [];

function notificarListeners(): void {
  for (const listener of storeListeners) {
    listener();
  }
}

function getCartSnapshot(): CartItem[] {
  if (memoryCartSnapshot === null) {
    memoryCartSnapshot = leerCarritoDesdeStorage();
  }
  return memoryCartSnapshot;
}

const SERVER_SNAPSHOT: CartItem[] = [];
function getServerSnapshot(): CartItem[] {
  return SERVER_SNAPSHOT;
}

function subscribeToCartStore(callback: () => void): () => void {
  storeListeners.push(callback);

  // Sincronización entre pestañas distintas mediante evento nativo de almacenamiento
  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === CART_STORAGE_KEY) {
      memoryCartSnapshot = leerCarritoDesdeStorage();
      callback();
    }
  };

  // Sincronización dentro de la misma pestaña mediante evento personalizado
  const handleCustomChange = () => {
    memoryCartSnapshot = leerCarritoDesdeStorage();
    callback();
  };

  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(CART_UPDATED_EVENT, handleCustomChange);
  }

  return () => {
    storeListeners = storeListeners.filter((l) => l !== callback);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(CART_UPDATED_EVENT, handleCustomChange);
    }
  };
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  // Sincronización reactiva con localStorage compatible con SSR y React 19
  const items = useSyncExternalStore(
    subscribeToCartStore,
    getCartSnapshot,
    getServerSnapshot
  );

  // El total de unidades se deriva de manera memoizada
  const totalItems = useMemo(() => calcularTotalUnidades(items), [items]);

  /**
   * Agrega un manga al carrito o incrementa su cantidad si ya existe.
   * Conserva las propiedades originales del manga y persiste el resultado en localStorage.
   */
  const agregarAlCarrito = useCallback((manga: CartItemInput) => {
    const elementosActuales = leerCarritoDesdeStorage();
    const indiceExistente = elementosActuales.findIndex(
      (item) => item.id === manga.id
    );

    const cantidadAAgregar =
      typeof manga.cantidad === "number" && manga.cantidad > 0
        ? manga.cantidad
        : 1;

    let nuevosElementos: CartItem[];

    if (indiceExistente >= 0) {
      // Incrementar cantidad del manga existente
      nuevosElementos = elementosActuales.map((item, index) =>
        index === indiceExistente
          ? { ...item, cantidad: item.cantidad + cantidadAAgregar }
          : item
      );
    } else {
      // Agregar nuevo manga con sus datos originales y cantidad inicial
      const nuevoItem: CartItem = {
        id: manga.id,
        titulo: manga.titulo,
        volumen: manga.volumen,
        precio: manga.precio,
        imagen: manga.imagen,
        cantidad: cantidadAAgregar,
      };
      nuevosElementos = [...elementosActuales, nuevoItem];
    }

    guardarCarritoEnStorage(nuevosElementos);
  }, []);

  /**
   * Determina si un manga con el id especificado se encuentra en el carrito.
   */
  const estaEnCarrito = useCallback(
    (id: number): boolean => {
      return items.some((item) => item.id === id);
    },
    [items]
  );

  /**
   * Retorna la cantidad de unidades en el carrito para un manga específico.
   */
  const obtenerCantidad = useCallback(
    (id: number): number => {
      const encontrado = items.find((item) => item.id === id);
      return encontrado ? encontrado.cantidad : 0;
    },
    [items]
  );

  /**
   * Fuerza una relectura del carrito desde localStorage.
   */
  const refreshCart = useCallback(() => {
    memoryCartSnapshot = leerCarritoDesdeStorage();
    notificarListeners();
    notificarCambioCarrito();
  }, []);

  const value = useMemo(
    () => ({
      items,
      totalItems,
      agregarAlCarrito,
      estaEnCarrito,
      obtenerCantidad,
      refreshCart,
    }),
    [items, totalItems, agregarAlCarrito, estaEnCarrito, obtenerCantidad, refreshCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart debe utilizarse dentro de un CartProvider.");
  }
  return context;
}
