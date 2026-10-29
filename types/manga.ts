/**
 * Definición de tipos para el catálogo de mangas de Re-Manga.
 * Conecta el modelo de dominio del backend con la interfaz de usuario.
 */

export type FilterGenre = "Todos" | "Shonen" | "Seinen" | "Shojo" | "Josei";

export type MangaState =
  | "Como nuevo"
  | "Muy buen estado"
  | "Buen estado"
  | "Aceptable"
  | "Nuevo"
  | "Desgastado";

/**
 * Entidad de Manga tal como es retornada por la API del backend Re-Manga (GET /api/mangas).
 */
export interface BackendManga {
  id: string;
  title: string;
  volume: number | null;
  author: string;
  genre: string;
  description: string;
  image: string | null;
  price: number | string; // Decimal serializado en JSON como número o string
  condition: string; // 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR' | 'POOR'
  stock: number;
  sellerId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Metadatos de paginación devueltos por el backend.
 */
export interface MangaPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/**
 * Respuesta estructurada de GET /api/mangas.
 */
export interface MangasResponse {
  pagination: MangaPagination;
  data: BackendManga[];
}

/**
 * Estructura de un manga adaptada y normalizada para el consumo de los componentes visuales.
 */
export interface Manga {
  id: string | number;
  titulo: string;
  volumen: number;
  autor: string;
  genero: string;
  precio: number;
  estado: string;
  imagen: string;
  descripcion?: string;
  stock?: number;
}

/**
 * Opciones para consultar mangas desde la API.
 */
export interface MangaQueryOptions {
  page?: number;
  pageSize?: number;
  genre?: string;
  search?: string;
}

/**
 * Datos requeridos para registrar un nuevo manga en el catálogo (solo ADMIN).
 */
export interface CreateMangaPayload {
  title: string;
  volume?: number | null;
  author: string;
  genre: string;
  description: string;
  image?: string | null;
  price: number;
  condition: string;
  stock: number;
}

/**
 * Datos para actualizar un manga existente (solo ADMIN).
 */
export type UpdateMangaPayload = Partial<CreateMangaPayload>;

/**
 * Traduce el código de condición en inglés del backend a una etiqueta legible en español.
 */
export function formatearCondicion(condition?: string | null): string {
  if (!condition) return "Buen estado";
  switch (condition.toUpperCase()) {
    case "NEW":
      return "Nuevo";
    case "LIKE_NEW":
      return "Como nuevo";
    case "GOOD":
      return "Buen estado";
    case "FAIR":
      return "Aceptable";
    case "POOR":
      return "Desgastado";
    default:
      return condition;
  }
}

/**
 * Normaliza las variantes de géneros históricas:
 * Shounen -> Shonen
 * Shoujo -> Shojo
 */
export function normalizarGenero(genero: string): string {
  return (genero || "")
    .replace("Shounen", "Shonen")
    .replace("Shoujo", "Shojo");
}

/**
 * Adapta un registro de manga retornado por el backend al formato esperado por la interfaz.
 */
export function adaptarMangaDesdeBackend(raw: BackendManga): Manga {
  return {
    id: raw.id,
    titulo: raw.title,
    volumen: typeof raw.volume === "number" && raw.volume > 0 ? raw.volume : 1,
    autor: raw.author || "Autor desconocido",
    genero: normalizarGenero(raw.genre || "Otro"),
    precio: typeof raw.price === "number" ? raw.price : parseFloat(String(raw.price)) || 0,
    estado: formatearCondicion(raw.condition),
    imagen: raw.image?.trim() || "",
    descripcion: raw.description || "",
    stock: typeof raw.stock === "number" ? raw.stock : 1,
  };
}
