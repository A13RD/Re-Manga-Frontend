/**
 * Tipos para las solicitudes de venta de mangas en Re-Manga.
 * Basados en el modelo y contrato real del backend (SaleRequest).
 */

export type MangaConditionCode = "NEW" | "LIKE_NEW" | "GOOD" | "FAIR" | "POOR";

export type SaleRequestStatusCode = "PENDING" | "APPROVED" | "REJECTED";

export interface CreateSaleRequestPayload {
  title: string;
  volume?: number | null;
  author: string;
  genre: string;
  description: string;
  proposedPrice: number;
  condition: MangaConditionCode;
}

export interface SaleRequestResponse {
  id: string;
  userId: string;
  mangaId: string | null;
  title: string;
  volume: number | null;
  author: string;
  genre: string;
  description: string;
  image: string | null;
  proposedPrice: string | number;
  condition: string;
  status: SaleRequestStatusCode;
  createdAt: string;
  updatedAt: string;
  message?: string;
  user?: {
    name: string;
    email: string;
  };
  manga?: {
    title: string;
  };
}

/**
 * Traduce el código de estado de solicitud y proporciona estilos acordes al diseño.
 */
export function formatearEstadoSolicitud(status: SaleRequestStatusCode | string): {
  etiqueta: string;
  clase: string;
} {
  switch (status?.toUpperCase()) {
    case "APPROVED":
      return {
        etiqueta: "Aprobada",
        clase: "bg-[#238636]/15 text-[#238636] dark:text-[#3fb950] border border-[#238636]/30",
      };
    case "REJECTED":
      return {
        etiqueta: "Rechazada",
        clase: "bg-[#da3633]/15 text-[#da3633] dark:text-[#f85149] border border-[#da3633]/30",
      };
    case "PENDING":
    default:
      return {
        etiqueta: "En revisión",
        clase: "bg-[#d29922]/15 text-[#9a6700] dark:text-[#d29922] border border-[#d29922]/30",
      };
  }
}

export interface SaleFormValues {
  title: string;
  volume: string;
  author: string;
  genre: string;
  condition: string;
  proposedPrice: string;
  description: string;
}

export interface SaleFormErrors {
  title?: string;
  volume?: string;
  author?: string;
  genre?: string;
  condition?: string;
  proposedPrice?: string;
  description?: string;
}

