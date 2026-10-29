import { api } from "@/lib/api";
import type { Order, CreateOrderItemInput } from "@/types/order";

/**
 * Consulta el historial de órdenes del usuario autenticado (GET /api/orders).
 */
export async function obtenerMisOrdenes(): Promise<Order[]> {
  const response = await api.get<Order[]>("/api/orders");
  return Array.isArray(response) ? response : [];
}

/**
 * Consulta el detalle de una orden por su identificador (GET /api/orders/:id).
 */
export async function obtenerOrdenPorId(id: string): Promise<Order> {
  return api.get<Order>(`/api/orders/${encodeURIComponent(id)}`);
}

/**
 * Crea una nueva orden de compra con validación de stock y precios en el backend (POST /api/orders).
 */
export async function crearOrden(items: CreateOrderItemInput[]): Promise<Order> {
  return api.post<Order>("/api/orders", { items });
}

