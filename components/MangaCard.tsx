"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { Manga } from "@/types/manga";
import { formatearPrecioCOP } from "@/data/mangas";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useFavorites } from "@/context/FavoritesContext";

interface MangaCardProps {
  manga: Manga;
  priority?: boolean;
}

/**
 * Componente de tarjeta de manga individual para el catálogo.
 * Presenta portada, género, título, volumen, autor, condición física, precio y botón de acción.
 */
export function MangaCard({ manga, priority = false }: MangaCardProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { agregarAlCarrito } = useCart();
  const [imageError, setImageError] = useState<boolean>(false);
  const [agregadoReciente, setAgregadoReciente] = useState<boolean>(false);
  const [isTogglingFav, setIsTogglingFav] = useState<boolean>(false);

  const isFav = isFavorite(manga.id);

  const handleToggleFavorite = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      router.push("/login?redirect=catalogo");
      return;
    }

    if (isTogglingFav) return;
    setIsTogglingFav(true);
    try {
      await toggleFavorite(manga.id);
    } catch (err) {
      console.error("Error al actualizar favorito:", err);
    } finally {
      setIsTogglingFav(false);
    }
  };

  /**
   * Manejador de evento al pulsar "Agregar al carrito".
   * Agrega el manga al estado compartido o incrementa su cantidad si ya existe.
   * Evita cualquier navegación accidental y muestra una confirmación visual local.
   */
  const handleAgregarAlCarrito = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    agregarAlCarrito(manga);

    setAgregadoReciente(true);
    setTimeout(() => {
      setAgregadoReciente(false);
    }, 1200);
  };

  return (
    <article className="manga-card flex flex-col h-full bg-[var(--color-blanco)] border border-[var(--color-borde)] rounded-[var(--radio)] overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_10px_25px_var(--color-sombra)]">
      {/* Contenedor de la portada con dimensiones fijas para evitar CLS */}
      <div className="relative w-full h-[320px] max-sm:h-[350px] bg-[var(--color-superficie-secundaria)] flex items-center justify-center overflow-hidden">
        {imageError || !manga.imagen ? (
          <div
            className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-[var(--color-texto-secundario)] bg-[var(--color-superficie-secundaria)]"
            role="img"
            aria-label={`Sin portada para ${manga.titulo}`}
          >
            <svg
              className="w-12 h-12 mb-2 opacity-40 text-[var(--color-texto-secundario)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-sm font-semibold">Sin portada</span>
          </div>
        ) : (
          <Image
            src={manga.imagen}
            alt={`Portada de ${manga.titulo}, volumen ${manga.volumen}`}
            fill
            sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw"
            className="object-contain block transition-transform duration-200 hover:scale-[1.02]"
            priority={priority}
            unoptimized={Boolean(manga.imagen && (manga.imagen.startsWith("http://") || manga.imagen.startsWith("https://")))}
            onError={() => setImageError(true)}
          />
        )}

        {/* Botón de favorito con icono de corazón */}
        <button
          type="button"
          onClick={handleToggleFavorite}
          disabled={isTogglingFav}
          aria-label={
            isFav
              ? `Eliminar ${manga.titulo} de tus favoritos`
              : `Agregar ${manga.titulo} a tus favoritos`
          }
          className="absolute top-3 right-3 z-10 p-2 rounded-full bg-[var(--color-blanco)]/90 dark:bg-[var(--color-superficie)]/90 backdrop-blur-sm shadow-md border border-[var(--color-borde)] hover:scale-110 active:scale-95 transition-all text-gray-400 hover:text-[#e63946] focus-visible:outline-2 focus-visible:outline-[#e63946]"
        >
          <svg
            className={`w-5 h-5 transition-colors ${
              isFav ? "text-[#e63946] fill-current" : "fill-none stroke-current"
            }`}
            viewBox="0 0 24 24"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </button>
      </div>

      {/* Contenido textual de la tarjeta */}
      <div className="manga-card-content p-5 flex flex-col flex-1">
        <span className="manga-genero inline-block mb-2.5 text-[var(--color-principal)] text-[0.8rem] font-bold uppercase tracking-wider">
          {manga.genero}
        </span>

        <h3 className="text-[1.3rem] font-bold mb-[5px] text-[var(--color-texto)] leading-snug">
          {manga.titulo}
        </h3>

        <p className="manga-volumen text-[0.9rem] text-[var(--color-texto-secundario)] mb-2.5">
          {manga.volumen ? `Tomo ${manga.volumen}` : "Tomo único"} · {manga.autor || "Autor"}
        </p>

        <p className="manga-estado text-[0.9rem] text-[var(--color-texto-secundario)] mb-[15px]">
          ● {manga.estado}
        </p>

        <strong className="manga-precio text-[var(--color-principal)] text-[1.2rem] font-bold block mb-auto">
          {formatearPrecioCOP(manga.precio)}
        </strong>

        {/* Botón de añadir al carrito con confirmación visual local de adición */}
        <button
          type="button"
          className={`btn-agregar-carrito w-full mt-[18px] border rounded-full py-3 px-[18px] font-bold text-base cursor-pointer transition-all duration-200 active:translate-y-0 focus-visible:outline-3 focus-visible:outline-[rgba(230,57,70,0.35)] focus-visible:outline-offset-2 ${
            agregadoReciente
              ? "bg-[#2b8a3e] border-[#2b8a3e] text-[var(--color-blanco)] shadow-sm"
              : "bg-[var(--color-principal)] border-[var(--color-principal)] text-[var(--color-blanco)] hover:bg-[var(--color-principal-hover)] hover:-translate-y-0.5"
          }`}
          data-id={String(manga.id)}
          onClick={handleAgregarAlCarrito}
          aria-label={`Agregar ${manga.titulo} tomo ${manga.volumen} al carrito`}
        >
          {agregadoReciente ? "¡Agregado al carrito!" : "Agregar al carrito"}
        </button>
      </div>
    </article>
  );
}
