import React from "react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-[var(--espacio-grande)] bg-[#1a1a1a] dark:bg-[#16181d] text-[#cccccc] border-t border-[var(--color-borde)] py-10 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-[var(--max-ancho)] mx-auto flex flex-col items-center text-center gap-5">
        {/* Nombre de la tienda */}
        <Link
          href="/#hero"
          className="text-xl font-extrabold text-[var(--color-principal)] tracking-tight focus-visible:outline-2 focus-visible:outline-[var(--color-principal)] rounded-sm"
        >
          Re-Manga
        </Link>

        {/* Breve texto sobre la reutilización de manga de segunda mano */}
        <p className="text-sm max-w-lg text-[#cccccc] dark:text-[#b9bec7] leading-relaxed">
          Encuentra mangas de segunda mano en buen estado y dales una nueva vida.
          Fomentamos la lectura accesible y la reutilización responsable de historias.
        </p>

        {/* Enlaces internos útiles */}
        <nav aria-label="Navegación del pie de página">
          <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-semibold">
            <li>
              <Link
                href="/#hero"
                className="hover:text-[var(--color-principal)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-principal)] rounded-sm"
              >
                Inicio
              </Link>
            </li>
            <li>
              <Link
                href="/#catalogo"
                className="hover:text-[var(--color-principal)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-principal)] rounded-sm"
              >
                Catálogo
              </Link>
            </li>
            <li>
              <Link
                href="/#como-funciona"
                className="hover:text-[var(--color-principal)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-principal)] rounded-sm"
              >
                Cómo funciona
              </Link>
            </li>
            <li>
              <Link
                href="/#vender"
                className="hover:text-[var(--color-principal)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-principal)] rounded-sm"
              >
                Vender
              </Link>
            </li>
            <li>
              <Link
                href="/registro"
                className="hover:text-[var(--color-principal)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-principal)] rounded-sm"
              >
                Registro
              </Link>
            </li>
            <li>
              <Link
                href="/carrito"
                className="hover:text-[var(--color-principal)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-principal)] rounded-sm"
              >
                Carrito
              </Link>
            </li>
          </ul>
        </nav>

        {/* Aviso de derechos de autor */}
        <p className="text-xs text-[#888888] pt-4 border-t border-[#333333] dark:border-[#2a2e36] w-full max-w-md">
          &copy; 2026 Re-Manga. Manga de segunda mano. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
