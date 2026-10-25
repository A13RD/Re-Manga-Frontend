/**
 * Estructura de un elemento del carrito de compras en Re-Manga.
 * Compatible con la estructura existente en localStorage del frontend original.
 */
export interface CartItem {
  id: number;
  titulo: string;
  volumen: number;
  precio: number;
  imagen: string;
  cantidad: number;
}
