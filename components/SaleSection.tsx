"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { api, ApiError } from "@/lib/api";
import type {
  SaleFormValues,
  SaleFormErrors,
  CreateSaleRequestPayload,
  SaleRequestResponse,
  MangaConditionCode,
} from "@/types/sale";

const VALORES_INICIALES: SaleFormValues = {
  title: "",
  volume: "1",
  author: "",
  genre: "",
  condition: "",
  proposedPrice: "",
  description: "",
};

/**
 * Valida los datos del formulario de venta del lado del cliente respetando el contrato del backend:
 * - title: Obligatorio.
 * - author: Obligatorio.
 * - genre: Obligatorio.
 * - condition: Obligatorio (debe coincidir con MangaCondition del backend).
 * - proposedPrice: Obligatorio, finito y mayor que 0 COP.
 * - volume: Si se proporciona, debe ser un número entero mayor que 0.
 * - description: Obligatoria según el controlador de backend.
 */
export function validarSolicitudVenta(valores: SaleFormValues): SaleFormErrors {
  const errores: SaleFormErrors = {};
  const titleTrim = valores.title.trim();
  const authorTrim = valores.author.trim();
  const descriptionTrim = valores.description.trim();

  // Validación de Título
  if (!titleTrim) {
    errores.title = "El título del manga es obligatorio.";
  }

  // Validación de Volumen
  if (valores.volume !== "") {
    const volumenNum = Number(valores.volume);
    if (!Number.isInteger(volumenNum) || volumenNum <= 0) {
      errores.volume = "El volumen debe ser un número entero mayor que 0.";
    }
  }

  // Validación de Autor
  if (!authorTrim) {
    errores.author = "El autor es obligatorio.";
  }

  // Validación de Género
  if (!valores.genre) {
    errores.genre = "Selecciona un género para el manga.";
  }

  // Validación de Condición / Estado
  if (!valores.condition) {
    errores.condition = "Selecciona el estado físico del manga.";
  }

  // Validación de Precio propuesto
  if (!valores.proposedPrice.trim()) {
    errores.proposedPrice = "El precio propuesto es obligatorio.";
  } else {
    const precioNum = Number(valores.proposedPrice);
    if (!Number.isFinite(precioNum) || precioNum <= 0) {
      errores.proposedPrice = "El precio propuesto debe ser mayor que 0 COP.";
    }
  }

  // Validación de Descripción
  if (!descriptionTrim) {
    errores.description = "La descripción breve del tomo o estado es obligatoria.";
  }

  return errores;
}

/**
 * Componente cliente que renderiza la sección y formulario de venta de mangas en Re-Manga.
 * Conecta con el endpoint real del backend (POST /api/solicitudes) cuando está disponible,
 * asocia la solicitud al usuario autenticado mediante los mecanismos del servidor,
 * gestiona estados de carga, prevención de envíos duplicados y accesibilidad.
 */
export function SaleSection() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [valores, setValores] = useState<SaleFormValues>(VALORES_INICIALES);
  const [errores, setErrores] = useState<SaleFormErrors>({});
  const [cargando, setCargando] = useState<boolean>(false);
  const [mensajeFeedback, setMensajeFeedback] = useState<string>("");
  const [esExito, setEsExito] = useState<boolean>(false);

  // Referencias para foco accesible en el primer campo inválido
  const titleRef = useRef<HTMLInputElement>(null);
  const volumeRef = useRef<HTMLInputElement>(null);
  const authorRef = useRef<HTMLInputElement>(null);
  const genreRef = useRef<HTMLSelectElement>(null);
  const conditionRef = useRef<HTMLSelectElement>(null);
  const proposedPriceRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setValores((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (mensajeFeedback) {
      setMensajeFeedback("");
      setEsExito(false);
    }

    if (errores[name as keyof SaleFormErrors]) {
      setErrores((prev) => {
        const nuevosErrores = { ...prev };
        delete nuevosErrores[name as keyof SaleFormErrors];
        return nuevosErrores;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Prevención de envíos múltiples o repetidos mientras la solicitud está en curso
    if (cargando) return;

    // Control de permisos y autenticación: no se permite envío si el usuario no está autenticado
    if (!isAuthenticated || !user) {
      setEsExito(false);
      setMensajeFeedback(
        "Debes iniciar sesión con tu cuenta para enviar una solicitud de venta."
      );
      return;
    }

    // Validación del lado del cliente
    const nuevosErrores = validarSolicitudVenta(valores);
    setErrores(nuevosErrores);

    if (Object.keys(nuevosErrores).length > 0) {
      setEsExito(false);
      setMensajeFeedback("");

      // Llevar el foco de manera accesible al primer campo con error
      if (nuevosErrores.title) {
        titleRef.current?.focus();
      } else if (nuevosErrores.volume) {
        volumeRef.current?.focus();
      } else if (nuevosErrores.author) {
        authorRef.current?.focus();
      } else if (nuevosErrores.genre) {
        genreRef.current?.focus();
      } else if (nuevosErrores.condition) {
        conditionRef.current?.focus();
      } else if (nuevosErrores.proposedPrice) {
        proposedPriceRef.current?.focus();
      } else if (nuevosErrores.description) {
        descriptionRef.current?.focus();
      }
      return;
    }

    setCargando(true);
    setMensajeFeedback("");
    setEsExito(false);

    // Estructuración del payload estrictamente según el contrato del backend (CreateSaleRequestDTO)
    // El backend asocia automáticamente el userId mediante el token JWT verificado
    const payload: CreateSaleRequestPayload = {
      title: valores.title.trim(),
      volume: valores.volume.trim() !== "" ? Number(valores.volume) : null,
      author: valores.author.trim(),
      genre: valores.genre,
      condition: valores.condition as MangaConditionCode,
      proposedPrice: Number(valores.proposedPrice),
      description: valores.description.trim(),
    };

    try {
      const data = await api.post<SaleRequestResponse>("/api/solicitudes", payload);

      // Solicitud creada con éxito (HTTP 201)
      setEsExito(true);
      const estadoConfirmado = data?.status || "PENDING";
      setMensajeFeedback(
        `¡Solicitud enviada con éxito! Tu publicación ha quedado registrada en estado de revisión (${estadoConfirmado}). Nuestro equipo la evaluará antes de publicarla en el catálogo.`
      );
      // Limpiar el formulario únicamente tras confirmación exitosa
      setValores(VALORES_INICIALES);
      setErrores({});
    } catch (error) {
      setEsExito(false);

      if (error instanceof ApiError) {
        if (error.status === 401) {
          setMensajeFeedback(
            error.message || "Tu sesión ha expirado o no tienes autorización. Por favor, inicia sesión nuevamente."
          );
        } else if (error.status === 403) {
          // Error 403: permisos insuficientes (no cierra sesión)
          setMensajeFeedback(
            error.message || "Acceso denegado: no tienes permisos suficientes para realizar esta acción."
          );
        } else if (error.status === 400) {
          setMensajeFeedback(
            error.message || "Faltan campos obligatorios o los datos enviados no son válidos."
          );
        } else if (error.status === 404) {
          setMensajeFeedback(
            "El servicio de solicitudes de venta no se encuentra disponible en el backend (HTTP 404)."
          );
        } else {
          setMensajeFeedback(
            error.message || "Error en el servidor. Por favor, intenta de nuevo más tarde."
          );
        }
      } else {
        setMensajeFeedback("Ocurrió un error inesperado al enviar la solicitud.");
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <section
      id="vender"
      className="max-w-[var(--max-ancho)] mx-auto px-5 sm:px-6 md:px-[30px] py-[50px] md:py-[var(--espacio-grande)] text-center"
      aria-labelledby="titulo-vender"
    >
      <h2
        id="titulo-vender"
        className="text-[1.8rem] md:text-[2.2rem] font-bold mb-[15px] text-[var(--color-texto)]"
      >
        Vender manga
      </h2>
      <p className="max-w-[600px] mx-auto text-[var(--color-texto-secundario)] mb-8">
        ¿Tienes mangas que ya no lees? Puedes venderlos con nosotros.
      </p>

      {/* Tarjeta contenedora del formulario de venta */}
      <div className="venta-tarjeta max-w-[760px] mx-auto bg-[var(--color-blanco)] border border-[var(--color-borde)] rounded-[var(--radio)] p-6 sm:p-8 shadow-[0_10px_25px_rgba(0,0,0,0.05)] text-left transition-colors duration-200">
        {/* Aviso de autenticación si el usuario no ha iniciado sesión */}
        {!authLoading && !isAuthenticated && (
          <div
            className="mb-6 p-4 rounded-[var(--radio)] border border-[#e63946]/30 bg-[#e63946]/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            role="alert"
          >
            <div>
              <p className="font-bold text-[var(--color-texto)] text-sm sm:text-base">
                Inicia sesión para publicar un manga
              </p>
              <p className="text-xs sm:text-sm text-[var(--color-texto-secundario)] mt-0.5">
                Debes tener una sesión activa para asociar la solicitud de venta a tu cuenta.
              </p>
            </div>
            <Link
              href="/login"
              className="px-4 py-2 bg-[var(--color-principal)] hover:bg-[var(--color-principal-hover)] text-[var(--color-blanco)] text-sm font-bold rounded-[var(--radio)] transition-colors shrink-0 focus-visible:outline-2 focus-visible:outline-[var(--color-principal)]"
            >
              Iniciar sesión
            </Link>
          </div>
        )}

        {/* Indicador de usuario autenticado */}
        {!authLoading && isAuthenticated && user && (
          <div className="mb-6 p-3.5 rounded-[var(--radio)] border border-[var(--color-borde)] bg-[var(--color-superficie-secundaria)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs sm:text-sm text-[var(--color-texto-secundario)]">
            <span>
              Publicando como:{" "}
              <strong className="text-[var(--color-texto)] font-semibold">
                {user.nombre || user.name || user.email}
              </strong>
            </span>
            <div className="flex items-center gap-3">
              <Link
                href="/mis-solicitudes"
                className="text-xs font-bold text-[var(--color-principal)] hover:underline"
              >
                Mis solicitudes →
              </Link>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#238636]/15 text-[#238636] dark:text-[#3fb950] font-bold">
                Activa
              </span>
            </div>
          </div>
        )}

        <form id="formulario-venta" onSubmit={handleSubmit} noValidate aria-busy={cargando}>
          <div className="venta-grid grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
            {/* Campo: Título del manga (ocupa ancho completo) */}
            <div className="campo-venta sm:col-span-2">
              <label
                htmlFor="titulo-manga"
                className="block mb-[7px] font-bold text-[var(--color-texto)] text-sm sm:text-base"
              >
                Título del manga
              </label>
              <input
                ref={titleRef}
                id="titulo-manga"
                name="title"
                type="text"
                placeholder="Ej. One Piece, Berserk, Chainsaw Man..."
                autoComplete="off"
                required
                value={valores.title}
                onChange={handleChange}
                aria-invalid={Boolean(errores.title)}
                aria-describedby={errores.title ? "titulo-manga-error" : undefined}
                className={`w-full min-h-[48px] border rounded-[var(--radio)] py-3 px-3.5 bg-[var(--color-blanco)] text-[var(--color-texto)] font-inherit transition-all duration-200 focus:outline-2 focus:outline-[var(--color-principal)] focus:outline-offset-2 ${
                  errores.title
                    ? "border-[var(--color-principal)] ring-1 ring-[var(--color-principal)]"
                    : "border-[var(--color-borde)]"
                }`}
              />
              <p
                id="titulo-manga-error"
                className="mensaje-error min-h-[20px] mt-1 text-[var(--color-principal)] text-[0.875rem]"
                aria-live="polite"
              >
                {errores.title || ""}
              </p>
            </div>

            {/* Campo: Volumen */}
            <div className="campo-venta">
              <label
                htmlFor="volumen-manga"
                className="block mb-[7px] font-bold text-[var(--color-texto)] text-sm sm:text-base"
              >
                Volumen (número)
              </label>
              <input
                ref={volumeRef}
                id="volumen-manga"
                name="volume"
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                placeholder="Ej. 1"
                value={valores.volume}
                onChange={handleChange}
                aria-invalid={Boolean(errores.volume)}
                aria-describedby={errores.volume ? "volumen-manga-error" : undefined}
                className={`w-full min-h-[48px] border rounded-[var(--radio)] py-3 px-3.5 bg-[var(--color-blanco)] text-[var(--color-texto)] font-inherit transition-all duration-200 focus:outline-2 focus:outline-[var(--color-principal)] focus:outline-offset-2 ${
                  errores.volume
                    ? "border-[var(--color-principal)] ring-1 ring-[var(--color-principal)]"
                    : "border-[var(--color-borde)]"
                }`}
              />
              <p
                id="volumen-manga-error"
                className="mensaje-error min-h-[20px] mt-1 text-[var(--color-principal)] text-[0.875rem]"
                aria-live="polite"
              >
                {errores.volume || ""}
              </p>
            </div>

            {/* Campo: Género */}
            <div className="campo-venta">
              <label
                htmlFor="genero-manga"
                className="block mb-[7px] font-bold text-[var(--color-texto)] text-sm sm:text-base"
              >
                Género
              </label>
              <select
                ref={genreRef}
                id="genero-manga"
                name="genre"
                required
                value={valores.genre}
                onChange={handleChange}
                aria-invalid={Boolean(errores.genre)}
                aria-describedby={errores.genre ? "genero-manga-error" : undefined}
                className={`w-full min-h-[48px] border rounded-[var(--radio)] py-3 px-3.5 bg-[var(--color-blanco)] text-[var(--color-texto)] font-inherit transition-all duration-200 focus:outline-2 focus:outline-[var(--color-principal)] focus:outline-offset-2 ${
                  errores.genre
                    ? "border-[var(--color-principal)] ring-1 ring-[var(--color-principal)]"
                    : "border-[var(--color-borde)]"
                }`}
              >
                <option value="">Selecciona un género</option>
                <option value="Shonen">Shonen</option>
                <option value="Seinen">Seinen</option>
                <option value="Shojo">Shojo</option>
                <option value="Josei">Josei</option>
                <option value="Otro">Otro</option>
              </select>
              <p
                id="genero-manga-error"
                className="mensaje-error min-h-[20px] mt-1 text-[var(--color-principal)] text-[0.875rem]"
                aria-live="polite"
              >
                {errores.genre || ""}
              </p>
            </div>

            {/* Campo: Autor */}
            <div className="campo-venta">
              <label
                htmlFor="autor-manga"
                className="block mb-[7px] font-bold text-[var(--color-texto)] text-sm sm:text-base"
              >
                Autor
              </label>
              <input
                ref={authorRef}
                id="autor-manga"
                name="author"
                type="text"
                placeholder="Nombre del autor o mangaka"
                autoComplete="off"
                required
                value={valores.author}
                onChange={handleChange}
                aria-invalid={Boolean(errores.author)}
                aria-describedby={errores.author ? "autor-manga-error" : undefined}
                className={`w-full min-h-[48px] border rounded-[var(--radio)] py-3 px-3.5 bg-[var(--color-blanco)] text-[var(--color-texto)] font-inherit transition-all duration-200 focus:outline-2 focus:outline-[var(--color-principal)] focus:outline-offset-2 ${
                  errores.author
                    ? "border-[var(--color-principal)] ring-1 ring-[var(--color-principal)]"
                    : "border-[var(--color-borde)]"
                }`}
              />
              <p
                id="autor-manga-error"
                className="mensaje-error min-h-[20px] mt-1 text-[var(--color-principal)] text-[0.875rem]"
                aria-live="polite"
              >
                {errores.author || ""}
              </p>
            </div>

            {/* Campo: Estado o condición física */}
            <div className="campo-venta">
              <label
                htmlFor="estado-manga"
                className="block mb-[7px] font-bold text-[var(--color-texto)] text-sm sm:text-base"
              >
                Estado o condición
              </label>
              <select
                ref={conditionRef}
                id="estado-manga"
                name="condition"
                required
                value={valores.condition}
                onChange={handleChange}
                aria-invalid={Boolean(errores.condition)}
                aria-describedby={errores.condition ? "estado-manga-error" : undefined}
                className={`w-full min-h-[48px] border rounded-[var(--radio)] py-3 px-3.5 bg-[var(--color-blanco)] text-[var(--color-texto)] font-inherit transition-all duration-200 focus:outline-2 focus:outline-[var(--color-principal)] focus:outline-offset-2 ${
                  errores.condition
                    ? "border-[var(--color-principal)] ring-1 ring-[var(--color-principal)]"
                    : "border-[var(--color-borde)]"
                }`}
              >
                <option value="">Selecciona el estado</option>
                <option value="LIKE_NEW">Como nuevo (sin marcas ni roturas)</option>
                <option value="GOOD">Buen estado (uso normal de lectura)</option>
                <option value="FAIR">Estado aceptable (desgaste evidente)</option>
                <option value="NEW">Nuevo (sellado o sin estrenar)</option>
                <option value="POOR">Desgastado (portadas o páginas marcadas)</option>
              </select>
              <p
                id="estado-manga-error"
                className="mensaje-error min-h-[20px] mt-1 text-[var(--color-principal)] text-[0.875rem]"
                aria-live="polite"
              >
                {errores.condition || ""}
              </p>
            </div>

            {/* Campo: Precio propuesto en COP */}
            <div className="campo-venta sm:col-span-2">
              <label
                htmlFor="precio-manga"
                className="block mb-[7px] font-bold text-[var(--color-texto)] text-sm sm:text-base"
              >
                Precio propuesto en COP
              </label>
              <input
                ref={proposedPriceRef}
                id="precio-manga"
                name="proposedPrice"
                type="number"
                min="1"
                step="100"
                inputMode="decimal"
                placeholder="Ej. 28000"
                required
                value={valores.proposedPrice}
                onChange={handleChange}
                aria-invalid={Boolean(errores.proposedPrice)}
                aria-describedby={errores.proposedPrice ? "precio-manga-error" : undefined}
                className={`w-full min-h-[48px] border rounded-[var(--radio)] py-3 px-3.5 bg-[var(--color-blanco)] text-[var(--color-texto)] font-inherit transition-all duration-200 focus:outline-2 focus:outline-[var(--color-principal)] focus:outline-offset-2 ${
                  errores.proposedPrice
                    ? "border-[var(--color-principal)] ring-1 ring-[var(--color-principal)]"
                    : "border-[var(--color-borde)]"
                }`}
              />
              <p
                id="precio-manga-error"
                className="mensaje-error min-h-[20px] mt-1 text-[var(--color-principal)] text-[0.875rem]"
                aria-live="polite"
              >
                {errores.proposedPrice || ""}
              </p>
            </div>

            {/* Campo: Descripción breve (ocupa ancho completo) */}
            <div className="campo-venta sm:col-span-2">
              <label
                htmlFor="descripcion-manga"
                className="block mb-[7px] font-bold text-[var(--color-texto)] text-sm sm:text-base"
              >
                Descripción breve del tomo
              </label>
              <textarea
                ref={descriptionRef}
                id="descripcion-manga"
                name="description"
                rows={3}
                placeholder="Detalla el estado general, editorial, idioma o señas particulares del tomo..."
                required
                value={valores.description}
                onChange={handleChange}
                aria-invalid={Boolean(errores.description)}
                aria-describedby={errores.description ? "descripcion-manga-error" : undefined}
                className={`w-full border rounded-[var(--radio)] py-3 px-3.5 bg-[var(--color-blanco)] text-[var(--color-texto)] font-inherit transition-all duration-200 focus:outline-2 focus:outline-[var(--color-principal)] focus:outline-offset-2 resize-y ${
                  errores.description
                    ? "border-[var(--color-principal)] ring-1 ring-[var(--color-principal)]"
                    : "border-[var(--color-borde)]"
                }`}
              />
              <p
                id="descripcion-manga-error"
                className="mensaje-error min-h-[20px] mt-1 text-[var(--color-principal)] text-[0.875rem]"
                aria-live="polite"
              >
                {errores.description || ""}
              </p>
            </div>
          </div>

          {/* Botón de envío */}
          <button
            type="submit"
            disabled={cargando || !isAuthenticated}
            aria-busy={cargando}
            className={`boton-registro w-full border-0 rounded-[var(--radio)] py-[13px] px-[18px] bg-[var(--color-principal)] text-[var(--color-blanco)] font-bold text-base transition-all duration-200 shadow-sm focus-visible:outline-3 focus-visible:outline-[rgba(230,57,70,0.35)] focus-visible:outline-offset-2 flex items-center justify-center gap-2 mt-2 ${
              cargando || !isAuthenticated
                ? "opacity-60 cursor-not-allowed"
                : "cursor-pointer hover:bg-[var(--color-principal-hover)] hover:-translate-y-0.5 active:translate-y-0 hover:shadow-md"
            }`}
          >
            {cargando ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Enviando solicitud...</span>
              </>
            ) : (
              "Enviar solicitud de venta"
            )}
          </button>

          {/* Mensaje de estado tras envío */}
          <p
            id="mensaje-venta"
            className={`mensaje-registro min-h-[24px] mt-[15px] text-center text-sm font-semibold transition-opacity duration-200 ${
              esExito
                ? "mensaje-venta-exito text-[#238636] dark:text-[#3fb950]"
                : "text-[var(--color-principal)]"
            }`}
            aria-live="polite"
            role={esExito ? "status" : "alert"}
          >
            {mensajeFeedback}
          </p>
        </form>
      </div>
    </section>
  );
}

