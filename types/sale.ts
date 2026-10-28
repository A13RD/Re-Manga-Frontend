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

