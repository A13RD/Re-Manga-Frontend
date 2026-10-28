/**
 * Definición de tipos para el catálogo de mangas de Re-Manga.
 * Representa la información recuperada del frontend original.
 */

export type FilterGenre = "Todos" | "Shonen" | "Seinen" | "Shojo" | "Josei";

export type MangaState = "Como nuevo" | "Muy buen estado" | "Buen estado" | "Aceptable";

export interface Manga {
  id: number;
  titulo: string;
  volumen: number;
  autor: string;
  genero: string;
  precio: number;
  estado: string;
  imagen: string;
}
