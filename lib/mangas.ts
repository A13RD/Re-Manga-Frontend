import { api } from "@/lib/api";
import type {
  MangasResponse,
  MangaQueryOptions,
  Manga,
  MangaPagination,
  BackendManga,
  CreateMangaPayload,
  UpdateMangaPayload,
} from "@/types/manga";
import { adaptarMangaDesdeBackend } from "@/types/manga";

export interface ObtenerMangasResultado {
  mangas: Manga[];
  pagination: MangaPagination;
}

/**
 * Consulta el listado de mangas paginados desde el endpoint real del backend (GET /api/mangas).
 * - Envía los parámetros de paginación reales (page y pageSize).
 * - Envía parámetros de filtro (genre, search) si se proporcionan.
 * - Transforma los resultados al modelo normalizado Manga para la UI.
 */
export async function obtenerMangas(
  options: MangaQueryOptions = {}
): Promise<ObtenerMangasResultado> {
  const { page = 1, pageSize = 6, genre, search } = options;

  const queryParams = new URLSearchParams();
  queryParams.set("page", String(page));
  queryParams.set("pageSize", String(pageSize));

  if (genre && genre !== "Todos") {
    queryParams.set("genre", genre);
  }

  if (search && search.trim().length > 0) {
    queryParams.set("search", search.trim());
  }

  const endpoint = `/api/mangas?${queryParams.toString()}`;
  const response = await api.get<MangasResponse>(endpoint);

  const rawList = Array.isArray(response?.data) ? response.data : [];
  const mangas = rawList.map(adaptarMangaDesdeBackend);

  const pagination: MangaPagination = response?.pagination || {
    page,
    pageSize,
    total: mangas.length,
    totalPages: Math.max(1, Math.ceil(mangas.length / pageSize)),
  };

  return { mangas, pagination };
}

/**
 * Obtiene el detalle de un manga específico por su identificador (GET /api/mangas/:id).
 */
export async function obtenerMangaPorId(id: string | number): Promise<Manga> {
  const response = await api.get<BackendManga>(`/api/mangas/${encodeURIComponent(String(id))}`);
  return adaptarMangaDesdeBackend(response);
}

/**
 * Crea un nuevo manga en el catálogo (POST /api/mangas) — Exclusivo ADMIN.
 */
export async function crearManga(payload: CreateMangaPayload): Promise<BackendManga> {
  return api.post<BackendManga>("/api/mangas", payload);
}

/**
 * Actualiza un manga existente en el catálogo (PUT /api/mangas/:id) — Exclusivo ADMIN.
 */
export async function actualizarManga(
  id: string | number,
  payload: UpdateMangaPayload
): Promise<BackendManga> {
  return api.put<BackendManga>(`/api/mangas/${encodeURIComponent(String(id))}`, payload);
}

/**
 * Elimina un manga del catálogo (DELETE /api/mangas/:id) — Exclusivo ADMIN.
 */
export async function eliminarManga(id: string | number): Promise<void> {
  return api.delete<void>(`/api/mangas/${encodeURIComponent(String(id))}`);
}
