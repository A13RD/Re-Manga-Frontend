import { api } from "@/lib/api";
import type { FavoriteItem } from "@/types/favorite";

/**
 * Consulta la lista de mangas favoritos del usuario autenticado (GET /api/favorites).
 */
export async function obtenerFavoritos(): Promise<FavoriteItem[]> {
  const response = await api.get<FavoriteItem[]>("/api/favorites");
  return Array.isArray(response) ? response : [];
}

/**
 * Agrega un manga a la lista de favoritos del usuario (POST /api/favorites).
 */
export async function agregarFavorito(mangaId: string): Promise<FavoriteItem> {
  return api.post<FavoriteItem>("/api/favorites", { mangaId });
}

/**
 * Elimina un manga de los favoritos del usuario (DELETE /api/favorites/:mangaId).
 */
export async function eliminarFavorito(mangaId: string): Promise<void> {
  await api.delete<{ message: string }>(`/api/favorites/${encodeURIComponent(mangaId)}`);
}

