"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import type { FilterGenre, Manga, MangaPagination } from "@/types/manga";
import { MangaCard } from "@/components/MangaCard";
import { obtenerMangas } from "@/lib/mangas";
import { ApiError } from "@/lib/api";

const GENEROS: readonly FilterGenre[] = ["Todos", "Shonen", "Seinen", "Shojo", "Josei"];
const MANGAS_POR_PAGINA = 6;

const PAGINACION_INICIAL: MangaPagination = {
  page: 1,
  pageSize: MANGAS_POR_PAGINA,
  total: 0,
  totalPages: 1,
};

/**
 * Sección interactiva del catálogo de Re-Manga conectada a la API real (GET /api/mangas).
 * Maneja carga de datos, estados de interfaz (carga inicial, catálogo vacío, error con reintento),
 * paginación sincronizada con el backend y filtros visuales por género y búsqueda por título.
 */
export function CatalogSection() {
  const [generoSeleccionado, setGeneroSeleccionado] = useState<FilterGenre>("Todos");
  const [busqueda, setBusqueda] = useState<string>("");
  const [pagina, setPagina] = useState<number>(1);

  const [mangas, setMangas] = useState<Manga[]>([]);
  const [paginacion, setPaginacion] = useState<MangaPagination>(PAGINACION_INICIAL);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reintentos, setReintentos] = useState<number>(0);

  const sectionRef = useRef<HTMLElement>(null);

  /**
   * Desplaza la vista suavemente al inicio del catálogo al cambiar de página.
   */
  const desplazarAlCatalogo = useCallback(() => {
    if (sectionRef.current) {
      sectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  /**
   * Carga los mangas desde la API real respetando la paginación y parámetros de búsqueda.
   */
  useEffect(() => {
    let cancelado = false;

    const timer = setTimeout(async () => {
      setCargando(true);
      setError(null);

      try {
        const resultado = await obtenerMangas({
          page: pagina,
          pageSize: MANGAS_POR_PAGINA,
          genre: generoSeleccionado,
          search: busqueda,
        });

        if (!cancelado) {
          setMangas(resultado.mangas);
          setPaginacion(resultado.pagination);
        }
      } catch (err) {
        if (!cancelado) {
          if (err instanceof ApiError) {
            setError(err.message || "Error al conectar con el servidor.");
          } else {
            setError(
              "No fue posible conectar con el servidor para obtener el catálogo de mangas."
            );
          }
        }
      } finally {
        if (!cancelado) {
          setCargando(false);
        }
      }
    }, 250);

    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [pagina, generoSeleccionado, busqueda, reintentos]);

  // Selección de género con reinicio inmediato a página 1
  const handleSeleccionarGenero = (genero: FilterGenre) => {
    setGeneroSeleccionado(genero);
    setPagina(1);
  };

  // Cambio en el buscador con reinicio inmediato a página 1
  const handleBusquedaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBusqueda(e.target.value);
    setPagina(1);
  };

  // Limpiar filtros y regresar a página 1
  const handleLimpiarFiltros = () => {
    setGeneroSeleccionado("Todos");
    setBusqueda("");
    setPagina(1);
  };

  // Navegación de paginación
  const handlePaginaAnterior = () => {
    if (paginacion.page > 1) {
      setPagina((prev) => prev - 1);
      desplazarAlCatalogo();
    }
  };

  const handlePaginaSiguiente = () => {
    if (paginacion.page < paginacion.totalPages) {
      setPagina((prev) => prev + 1);
      desplazarAlCatalogo();
    }
  };

  // Reintento manual tras un error de conexión
  const handleReintentar = () => {
    setReintentos((prev) => prev + 1);
  };

  const noHayResultados = !cargando && !error && mangas.length === 0;

  return (
    <section
      ref={sectionRef}
      id="catalogo"
      className="max-w-[var(--max-ancho)] mx-auto px-5 sm:px-6 md:px-[30px] py-[50px] md:py-[var(--espacio-grande)]"
      aria-labelledby="titulo-catalogo"
    >
      <h2
        id="titulo-catalogo"
        className="text-[1.8rem] md:text-[2.2rem] font-bold mb-[15px] text-[var(--color-texto)]"
      >
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

      {/* ====================================================================
          ESTADO 1: CARGA INICIAL (SKELETON)
          ==================================================================== */}
      {cargando && mangas.length === 0 && !error && (
        <div
          id="catalogo-skeleton"
          className="mt-[35px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[25px]"
          aria-label="Cargando catálogo de mangas..."
          aria-busy="true"
        >
          {Array.from({ length: MANGAS_POR_PAGINA }).map((_, i) => (
            <div
              key={`skeleton-${i}`}
              className="flex flex-col h-full bg-[var(--color-blanco)] border border-[var(--color-borde)] rounded-[var(--radio)] overflow-hidden animate-pulse"
            >
              <div className="w-full h-[320px] max-sm:h-[350px] bg-[var(--color-superficie-secundaria)]" />
              <div className="p-5 flex flex-col flex-1 gap-3">
                <div className="h-3 w-16 bg-[var(--color-superficie-secundaria)] rounded" />
                <div className="h-6 w-3/4 bg-[var(--color-superficie-secundaria)] rounded" />
                <div className="h-4 w-1/2 bg-[var(--color-superficie-secundaria)] rounded" />
                <div className="h-4 w-1/3 bg-[var(--color-superficie-secundaria)] rounded" />
                <div className="h-6 w-24 bg-[var(--color-superficie-secundaria)] rounded mt-auto" />
                <div className="h-11 w-full bg-[var(--color-superficie-secundaria)] rounded-full mt-4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ====================================================================
          ESTADO 2: ERROR DE CONEXIÓN O RESPUESTA INESPERADA
          ==================================================================== */}
      {error && !cargando && (
        <div
          id="catalogo-error"
          className="mt-[35px] max-w-[650px] mx-auto bg-[var(--color-blanco)] border border-[var(--color-principal)]/30 rounded-[var(--radio)] p-8 text-center shadow-sm"
          role="alert"
        >
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[var(--color-principal)]/10 text-[var(--color-principal)] flex items-center justify-center">
            <svg
              className="w-7 h-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-2 text-[var(--color-texto)]">
            No se pudo cargar el catálogo
          </h3>
          <p className="text-[var(--color-texto-secundario)] text-sm mb-6 max-w-[450px] mx-auto">
            {error}
          </p>
          <button
            type="button"
            onClick={handleReintentar}
            className="inline-flex items-center gap-2 border border-[var(--color-principal)] rounded-[var(--radio)] py-2.5 px-6 bg-[var(--color-principal)] text-[var(--color-blanco)] font-bold text-sm sm:text-base cursor-pointer hover:bg-[var(--color-principal-hover)] hover:-translate-y-0.5 transition-all focus-visible:outline-2 focus-visible:outline-[var(--color-principal)]"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>Reintentar conexión</span>
          </button>
        </div>
      )}

      {/* ====================================================================
          ESTADO 3: CATÁLOGO VACÍO / SIN RESULTADOS
          ==================================================================== */}
      {noHayResultados && (
        <div
          id="mensaje-sin-resultados"
          className="mensaje-sin-resultados mt-[35px] text-center py-12 max-w-[500px] mx-auto"
          role="status"
        >
          <p className="text-[var(--color-texto-secundario)] text-base md:text-lg mb-4">
            No encontramos mangas que coincidan con tu búsqueda.
          </p>
          {(generoSeleccionado !== "Todos" || busqueda.trim().length > 0) && (
            <button
              type="button"
              onClick={handleLimpiarFiltros}
              className="border border-[var(--color-borde)] rounded-[var(--radio)] py-2 px-4 text-sm font-semibold text-[var(--color-principal)] hover:bg-[var(--color-superficie-secundaria)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-principal)] cursor-pointer"
            >
              Limpiar filtros de búsqueda
            </button>
          )}
        </div>
      )}

      {/* ====================================================================
          ESTADO 4: CATÁLOGO CON RESULTADOS
          ==================================================================== */}
      {!error && !noHayResultados && (
        <div
          id="catalogo-grid"
          className={`mt-[35px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[25px] transition-opacity duration-200 ${
            cargando ? "opacity-50 pointer-events-none" : "opacity-100"
          }`}
          aria-busy={cargando}
        >
          {mangas.map((manga, index) => (
            <MangaCard key={manga.id} manga={manga} priority={index < 3} />
          ))}
        </div>
      )}

      {/* ====================================================================
          ESTADO 5: CONTROLES DE PAGINACIÓN SINCRONIZADOS CON LA API
          ==================================================================== */}
      {!error && paginacion.totalPages > 1 && (
        <nav
          aria-label="Paginación del catálogo"
          className="mt-[45px] flex items-center justify-center gap-3 sm:gap-4 flex-wrap"
        >
          <button
            id="pagina-anterior"
            type="button"
            onClick={handlePaginaAnterior}
            disabled={paginacion.page <= 1 || cargando}
            aria-label="Ir a la página anterior"
            className={`border rounded-[var(--radio)] py-2.5 px-4 font-bold text-sm sm:text-base transition-all duration-200 flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-[var(--color-principal)] ${
              paginacion.page <= 1 || cargando
                ? "border-[var(--color-borde)] text-[var(--color-texto-secundario)] opacity-40 cursor-not-allowed bg-[var(--color-superficie-secundaria)]"
                : "border-[var(--color-principal)] bg-[var(--color-blanco)] text-[var(--color-principal)] hover:bg-[var(--color-principal)] hover:text-[var(--color-blanco)] hover:-translate-y-0.5 cursor-pointer shadow-sm"
            }`}
          >
            ← Anterior
          </button>

          <span
            className="text-sm sm:text-base font-semibold text-[var(--color-texto)] px-3 py-2"
            aria-current="page"
          >
            Página <strong className="font-bold">{paginacion.page}</strong> de{" "}
            <strong className="font-bold">{paginacion.totalPages}</strong>
          </span>

          <button
            id="pagina-siguiente"
            type="button"
            onClick={handlePaginaSiguiente}
            disabled={paginacion.page >= paginacion.totalPages || cargando}
            aria-label="Ir a la página siguiente"
            className={`border rounded-[var(--radio)] py-2.5 px-4 font-bold text-sm sm:text-base transition-all duration-200 flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-[var(--color-principal)] ${
              paginacion.page >= paginacion.totalPages || cargando
                ? "border-[var(--color-borde)] text-[var(--color-texto-secundario)] opacity-40 cursor-not-allowed bg-[var(--color-superficie-secundaria)]"
                : "border-[var(--color-principal)] bg-[var(--color-blanco)] text-[var(--color-principal)] hover:bg-[var(--color-principal)] hover:text-[var(--color-blanco)] hover:-translate-y-0.5 cursor-pointer shadow-sm"
            }`}
          >
            Siguiente →
          </button>
        </nav>
      )}
    </section>
  );
}
