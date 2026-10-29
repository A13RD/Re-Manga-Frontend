import type { BackendManga } from "./manga";

/**
 * Representa un favorito registrado en la base de datos de Re-Manga.
 */
export interface FavoriteItem {
  id: string;
  userId: string;
  mangaId: string;
  createdAt: string;
  manga?: BackendManga;
}

