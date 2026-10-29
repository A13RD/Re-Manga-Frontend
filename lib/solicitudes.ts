import { api } from "@/lib/api";
import type { CreateSaleRequestPayload, SaleRequestResponse } from "@/types/sale";

/**
 * Servicio para gestión de solicitudes de venta de mangas en Re-Manga.
 */

/**
 * Envía una nueva solicitud de venta asociada al usuario autenticado (POST /api/solicitudes).
 * El backend extrae el id del vendedor del JWT verificado.
 */
export async function crearSolicitudVenta(
  payload: CreateSaleRequestPayload
): Promise<SaleRequestResponse> {
  return api.post<SaleRequestResponse>("/api/solicitudes", payload);
}

/**
 * Consulta únicamente las solicitudes de venta del usuario autenticado (GET /api/solicitudes/mias).
 */
export async function obtenerMisSolicitudes(): Promise<SaleRequestResponse[]> {
  const response = await api.get<SaleRequestResponse[]>("/api/solicitudes/mias");
  return Array.isArray(response) ? response : [];
}

/**
 * Consulta todas las solicitudes de venta del sistema (GET /api/solicitudes) — Exclusivo ADMIN.
 */
export async function obtenerTodasLasSolicitudes(): Promise<SaleRequestResponse[]> {
  const response = await api.get<SaleRequestResponse[]>("/api/solicitudes");
  return Array.isArray(response) ? response : [];
}

