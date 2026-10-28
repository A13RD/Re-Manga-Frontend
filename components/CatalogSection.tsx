"use client";

import React, { useState, useMemo } from "react";
import type { FilterGenre } from "@/types/manga";
import { MANGAS, normalizarGenero } from "@/data/mangas";
import { MangaCard } from "@/components/MangaCard";

const GENEROS: readonly FilterGenre[] = ["Todos", "Shonen", "Seinen", "Shojo", "Josei"];
const MANGAS_POR_CARGA = 6;

/**
 * Sección interactiva del catálogo de Re-Manga.
 * Maneja el filtrado por género, búsqueda en tiempo real por título,
 * paginación progresiva con "Ver más" y estado vacío.
 */
export function CatalogSection() {
  const [generoSeleccionado, setGeneroSeleccionado] = useState<FilterGenre>("Todos");
  const [busqueda, setBusqueda] = useState<string>("");
  const [mangasVisibles, setMangasVisibles] = useState<number>(MANGAS_POR_CARGA);

  // Filtrado reactivo combinando género y búsqueda por título
  const mangasFiltrados = useMemo(() => {
    const textoNormalizado = busqueda.trim().toLowerCase();

    return MANGAS.filter((manga) => {
      const coincideGenero =
        generoSeleccionado === "Todos" ||
        normalizarGenero(manga.genero) === generoSeleccionado;

      const coincideBusqueda = manga.titulo
        .toLowerCase()
        .includes(textoNormalizado);

      return coincideGenero && coincideBusqueda;
    });
  }, [generoSeleccionado, busqueda]);

  // Selección de género con reinicio de paginación
  const handleSeleccionarGenero = (genero: FilterGenre) => {
    setGeneroSeleccionado(genero);
    setMangasVisibles(MANGAS_POR_CARGA);
  };

  // Cambio en el campo de búsqueda con reinicio de paginación
  const handleBusquedaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBusqueda(e.target.value);
    setMangasVisibles(MANGAS_POR_CARGA);
  };

  // Carga de mangas adicionales
  const handleVerMas = () => {
    setMangasVisibles((prev) => prev + MANGAS_POR_CARGA);
  };

  const mangasAMostrar = mangasFiltrados.slice(0, mangasVisibles);
  const hayMasPorMostrar = mangasVisibles < mangasFiltrados.length;
  const noHayResultados = mangasFiltrados.length === 0;

  return (
    <section
      id="catalogo"
      className="max-w-[var(--max-ancho)] mx-auto px-5 sm:px-6 md:px-[30px] py-[50px] md:py-[var(--espacio-grande)]"
    >
      <h2 className="text-[1.8rem] md:text-[2.2rem] font-bold mb-[15px] text-[var(--color-texto)]">
        Catálogo
      </h2>
      <p className="text-[var(--color-texto-secundario)]">
        Explora nuestra colección de mangas de segunda mano.
      </p>

      {/* Barra de controles: Filtros por género y buscador */}
      <div className="catalogo-controles flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 mt-[30px]">
        {/* Filtros por género */}
        <div
          className="filtros-genero flex flex-wrap gap-2.5"
          role="group"
          aria-label="Filtrar por género"
        >
          {GENEROS.map((genero) => {
            const esActivo = generoSeleccionado === genero;
            return (
              <button
                key={genero}
                type="button"
                data-genero={genero}
                onClick={() => handleSeleccionarGenero(genero)}
                aria-pressed={esActivo}
                className={`filtro-genero border border-[var(--color-principal)] rounded-[var(--radio)] py-2.5 px-[18px] font-bold text-sm sm:text-base cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_10px_var(--color-sombra)] focus-visible:outline-2 focus-visible:outline-[var(--color-principal)] ${
                  esActivo
                    ? "activo bg-[var(--color-principal)] text-[var(--color-blanco)]"
                    : "bg-[var(--color-blanco)] text-[var(--color-principal)] hover:bg-[var(--color-principal)] hover:text-[var(--color-blanco)]"
                }`}
              >
                {genero}
              </button>
            );
          })}
        </div>

        {/* Búsqueda por título */}
        <label className="busqueda-manga w-full sm:w-auto sm:flex-1 sm:max-w-[300px] relative block">
          <span className="texto-oculto sr-only">Buscar manga</span>
          <input
            id="busqueda-manga"
            type="search"
            placeholder="Buscar manga..."
            autoComplete="off"
            value={busqueda}
            onChange={handleBusquedaChange}
            className="w-full border border-[var(--color-borde)] rounded-[var(--radio)] py-[11px] px-[14px] text-[var(--color-texto)] font-inherit bg-[var(--color-blanco)] transition-colors duration-200 focus:outline-2 focus:outline-[var(--color-principal)] focus:outline-offset-2"
          />
        </label>
      </div>

      {/* Cuadrícula del catálogo */}
      {!noHayResultados && (
        <div
          id="catalogo-grid"
          className="mt-[35px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[25px]"
        >
          {mangasAMostrar.map((manga, index) => (
            <MangaCard
              key={manga.id}
              manga={manga}
              priority={index < 3}
            />
          ))}
        </div>
      )}

      {/* Mensaje de estado cuando no se encuentran resultados */}
      {noHayResultados && (
        <p
          id="mensaje-sin-resultados"
          className="mensaje-sin-resultados mt-[35px] text-center text-[var(--color-texto-secundario)] text-base md:text-lg py-12"
          role="status"
        >
          No encontramos mangas que coincidan con tu búsqueda.
        </p>
      )}

      {/* Botón "Ver más" para paginación incremental */}
      {hayMasPorMostrar && (
        <button
          id="ver-mas"
          type="button"
          onClick={handleVerMas}
          className="boton-ver-mas block mx-auto mt-[35px] border border-[var(--color-principal)] rounded-[var(--radio)] py-2.5 px-[18px] bg-[var(--color-principal)] text-[var(--color-blanco)] font-bold cursor-pointer transition-all duration-200 hover:bg-[var(--color-principal-hover)] hover:-translate-y-0.5 hover:shadow-[0_4px_10px_var(--color-sombra)] active:translate-y-0 focus-visible:outline-2 focus-visible:outline-[var(--color-principal)]"
        >
          Ver más
        </button>
      )}
    </section>
  );
}
