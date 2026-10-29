/**
 * Estructura de un elemento del carrito de compras en Re-Manga.
 * Compatible con la estructura existente en localStorage del frontend original.
 */
export interface CartItem {
  id: string | number;
  titulo: string;
  volumen: number;
  precio: number;
  imagen: string;
  cantidad: number;
}

/**
 * Datos requeridos para agregar un manga al carrito de compras.
 * Compatible con objetos Manga y CartItem.
 * La cantidad es opcional (por defecto 1).
 */
export type CartItemInput = Pick<CartItem, "id" | "titulo" | "volumen" | "precio" | "imagen"> & {
  cantidad?: number;
};
