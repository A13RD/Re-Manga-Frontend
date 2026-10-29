"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useFavorites } from "@/context/FavoritesContext";
import { useCart } from "@/context/CartContext";
import { formatearPrecioCOP } from "@/data/mangas";

export function FavoritesList() {
  const { favorites, isLoading, error, refreshFavorites, toggleFavorite } = useFavorites();
  const { agregarAlCarrito } = useCart();

  if (isLoading && favorites.length === 0) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Cargando favoritos">
        <div className="h-6 w-48 bg-gray-200 dark:bg-gray-800 rounded animate-pulse mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-44 bg-[var(--color-superficie-secundaria)] rounded-[var(--radio)] border border-[var(--color-borde)] animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-[var(--radio)] text-center">
        <p className="text-red-700 dark:text-red-300 font-semibold mb-3">{error}</p>
        <button
          type="button"
          onClick={() => refreshFavorites()}
          className="px-4 py-2 bg-[var(--color-principal)] text-[var(--color-blanco)] font-bold rounded-full text-sm hover:bg-[var(--color-principal-hover)] transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="text-center py-12 px-4 border border-dashed border-[var(--color-borde)] rounded-[var(--radio)] bg-[var(--color-superficie-secundaria)]">
        <svg
          className="w-12 h-12 mx-auto text-gray-400 mb-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
        <h3 className="text-lg font-bold text-[var(--color-texto)] mb-1">
          Aún no tienes mangas favoritos
        </h3>
        <p className="text-sm text-[var(--color-texto-secundario)] max-w-md mx-auto mb-5">
          Explora el catálogo y pulsa el corazón en las portadas de los mangas que más te gusten para guardarlos aquí.
        </p>
        <Link
          href="/#catalogo"
          className="inline-flex items-center justify-center px-6 py-2.5 bg-[var(--color-principal)] hover:bg-[var(--color-principal-hover)] text-[var(--color-blanco)] font-bold text-sm rounded-full transition-all hover:-translate-y-0.5"
        >
          Explorar catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-[var(--color-texto)]">
          Tus mangas favoritos ({favorites.length})
        </h3>
        <button
          type="button"
          onClick={() => refreshFavorites()}
          className="text-xs text-[var(--color-principal)] hover:underline font-semibold"
        >
          Actualizar lista
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {favorites.map((fav) => {
          const manga = fav.manga;
          if (!manga) return null;

          const precioNum = Number(manga.price);

          return (
            <div
              key={fav.id}
              className="flex bg-[var(--color-blanco)] border border-[var(--color-borde)] rounded-[var(--radio)] overflow-hidden shadow-xs hover:shadow-md transition-all p-3 gap-3 relative group"
            >
              {/* Miniatura */}
              <div className="relative w-20 h-28 bg-[var(--color-superficie-secundaria)] rounded shrink-0 overflow-hidden flex items-center justify-center">
                {manga.image ? (
                  <Image
                    src={manga.image}
                    alt={manga.title}
                    fill
                    sizes="80px"
                    className="object-cover"
                    unoptimized={Boolean(manga.image.startsWith("http://") || manga.image.startsWith("https://"))}
                  />
                ) : (
                  <span className="text-xs text-[var(--color-texto-secundario)]">Sin foto</span>
                )}
              </div>

              {/* Información */}
              <div className="flex flex-col flex-1 min-w-0 justify-between">
                <div>
                  <span className="text-[0.7rem] uppercase font-bold text-[var(--color-principal)] block truncate">
                    {manga.genre}
                  </span>
                  <h4 className="text-sm font-bold text-[var(--color-texto)] truncate" title={manga.title}>
                    {manga.title}
                  </h4>
                  <p className="text-xs text-[var(--color-texto-secundario)]">
                    {manga.volume ? `Tomo ${manga.volume}` : "Tomo único"} · {manga.author}
                  </p>
                  <strong className="text-sm font-extrabold text-[var(--color-principal)] block mt-1">
                    {formatearPrecioCOP(precioNum)}
                  </strong>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[var(--color-borde)]">
                  <button
                    type="button"
                    onClick={() =>
                      agregarAlCarrito({
                        id: manga.id,
                        titulo: manga.title,
                        volumen: manga.volume ?? 1,
                        precio: precioNum,
                        imagen: manga.image || "/images/placeholder.jpg",
                      })
                    }
                    className="flex-1 py-1 px-2.5 bg-[var(--color-principal)] text-[var(--color-blanco)] text-xs font-bold rounded-full hover:bg-[var(--color-principal-hover)] transition-colors text-center truncate"
                  >
                    + Al carrito
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleFavorite(manga.id)}
                    aria-label={`Quitar ${manga.title} de favoritos`}
                    className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                    title="Quitar de favoritos"
                  >
                    <svg className="w-5 h-5 fill-current text-red-500" viewBox="0 0 24 24">
                      <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

