"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { obtenerMangas, crearManga, actualizarManga, eliminarManga } from "@/lib/mangas";
import { obtenerTodasLasSolicitudes } from "@/lib/solicitudes";
import { formatearPrecioCOP } from "@/data/mangas";
import { formatearCondicion } from "@/types/manga";
import { formatearEstadoSolicitud, type SaleRequestResponse } from "@/types/sale";
import type { Manga, MangaPagination, CreateMangaPayload } from "@/types/manga";
import { ApiError } from "@/lib/api";

type TabAdmin = "catalogo" | "solicitudes";

interface MangaFormState {
  title: string;
  volume: string;
  author: string;
  genre: string;
  price: string;
  condition: string;
  stock: string;
  image: string;
  description: string;
}

const VALORES_FORM_INICIALES: MangaFormState = {
  title: "",
  volume: "1",
  author: "",
  genre: "Shonen",
  price: "",
  condition: "LIKE_NEW",
  stock: "1",
  image: "",
  description: "",
};

export function AdminContent() {
  const [tabActiva, setTabActiva] = useState<TabAdmin>("catalogo");

  // Estados de catálogo
  const [mangas, setMangas] = useState<Manga[]>([]);
  const [paginacion, setPaginacion] = useState<MangaPagination>({
    page: 1,
    pageSize: 8,
    total: 0,
    totalPages: 1,
  });
  const [cargandoCatalogo, setCargandoCatalogo] = useState<boolean>(true);
  const [errorCatalogo, setErrorCatalogo] = useState<string | null>(null);

  // Estados del formulario de creación/edición
  const [mostrarForm, setMostrarForm] = useState<boolean>(false);
  const [editandoId, setEditandoId] = useState<string | number | null>(null);
  const [formValores, setFormValores] = useState<MangaFormState>(VALORES_FORM_INICIALES);
  const [formError, setFormError] = useState<string | null>(null);
  const [formGuardando, setFormGuardando] = useState<boolean>(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // Estados de solicitudes administrativas
  const [solicitudes, setSolicitudes] = useState<SaleRequestResponse[]>([]);
  const [cargandoSolicitudes, setCargandoSolicitudes] = useState<boolean>(false);
  const [errorSolicitudes, setErrorSolicitudes] = useState<string | null>(null);

  // Carga de catálogo administrativo
  const cargarCatalogoAdmin = useCallback(async (paginaObjetivo: number = 1) => {
    setCargandoCatalogo(true);
    setErrorCatalogo(null);
    try {
      const res = await obtenerMangas({ page: paginaObjetivo, pageSize: 8 });
      setMangas(res.mangas);
      setPaginacion(res.pagination);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorCatalogo(err.message || "Error al cargar mangas del catálogo.");
      } else {
        setErrorCatalogo("No fue posible cargar el catálogo.");
      }
    } finally {
      setCargandoCatalogo(false);
    }
  }, []);

  // Carga de solicitudes administrativas
  const cargarSolicitudesAdmin = useCallback(async () => {
    setCargandoSolicitudes(true);
    setErrorSolicitudes(null);
    try {
      const data = await obtenerTodasLasSolicitudes();
      setSolicitudes(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorSolicitudes(err.message || "Error al cargar las solicitudes de venta.");
      } else {
        setErrorSolicitudes("No fue posible cargar las solicitudes.");
      }
    } finally {
      setCargandoSolicitudes(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (tabActiva === "catalogo") {
        await cargarCatalogoAdmin(paginacion.page);
      } else {
        await cargarSolicitudesAdmin();
      }
    }, 0);

    return () => {
      clearTimeout(timer);
    };
  }, [tabActiva, cargarCatalogoAdmin, cargarSolicitudesAdmin, paginacion.page]);

  // Manejo de formulario
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormValores((prev) => ({ ...prev, [name]: value }));
    if (formError) setFormError(null);
  };

  const abrirCreacion = () => {
    setEditandoId(null);
    setFormValores(VALORES_FORM_INICIALES);
    setFormError(null);
    setMostrarForm(true);
  };

  const abrirEdicion = (manga: Manga) => {
    setEditandoId(manga.id);
    setFormValores({
      title: manga.titulo,
      volume: String(manga.volumen || 1),
      author: manga.autor,
      genre: manga.genero,
      price: String(manga.precio),
      condition:
        manga.estado === "Como nuevo"
          ? "LIKE_NEW"
          : manga.estado === "Buen estado"
          ? "GOOD"
          : manga.estado === "Aceptable"
          ? "FAIR"
          : manga.estado === "Nuevo"
          ? "NEW"
          : manga.estado === "Desgastado"
          ? "POOR"
          : "GOOD",
      stock: String(manga.stock ?? 1),
      image: manga.imagen || "",
      description: manga.descripcion || "",
    });
    setFormError(null);
    setMostrarForm(true);
  };

  const cerrarForm = () => {
    setMostrarForm(false);
    setEditandoId(null);
    setFormError(null);
  };

  const handleSubmitForm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (formGuardando) return;

    // Validación básica del lado del cliente
    if (
      !formValores.title.trim() ||
      !formValores.author.trim() ||
      !formValores.genre.trim() ||
      !formValores.description.trim() ||
      !formValores.price.trim() ||
      !formValores.condition
    ) {
      setFormError("Por favor completa todos los campos requeridos.");
      return;
    }

    const precioNum = Number(formValores.price);
    if (!Number.isFinite(precioNum) || precioNum <= 0) {
      setFormError("El precio debe ser un número mayor a 0 COP.");
      return;
    }

    const stockNum = Number(formValores.stock);
    if (!Number.isInteger(stockNum) || stockNum < 0) {
      setFormError("El stock debe ser un número entero mayor o igual a 0.");
      return;
    }

    if (formValores.volume.trim() !== "") {
      const volNum = Number(formValores.volume);
      if (!Number.isInteger(volNum) || volNum <= 0) {
        setFormError("El volumen debe ser un número entero mayor que 0.");
        return;
      }
    }

    const payload: CreateMangaPayload = {
      title: formValores.title.trim(),
      volume: formValores.volume.trim() !== "" ? Number(formValores.volume) : null,
      author: formValores.author.trim(),
      genre: formValores.genre.trim(),
      description: formValores.description.trim(),
      price: precioNum,
      condition: formValores.condition,
      stock: stockNum,
      image: formValores.image.trim() || null,
    };

    setFormGuardando(true);
    setFormError(null);

    try {
      if (editandoId !== null) {
        // Actualizar manga existente (PUT /api/mangas/:id)
        await actualizarManga(editandoId, payload);
        setMensajeExito(`Manga "${payload.title}" actualizado con éxito.`);
      } else {
        // Crear nuevo manga (POST /api/mangas)
        await crearManga(payload);
        setMensajeExito(`Manga "${payload.title}" creado y publicado en el catálogo.`);
      }
      cerrarForm();
      await cargarCatalogoAdmin(paginacion.page);
      setTimeout(() => setMensajeExito(null), 3500);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 403) {
          setFormError("Acceso denegado: no tienes permisos de administrador para realizar esta operación.");
        } else {
          setFormError(err.message || "Error al procesar la solicitud en el servidor.");
        }
      } else {
        setFormError("Ocurrió un error inesperado al guardar el manga.");
      }
    } finally {
      setFormGuardando(false);
    }
  };

  const handleEliminarManga = async (manga: Manga) => {
    const confirmado = window.confirm(
      `¿Estás seguro de que deseas eliminar permanentemente "${manga.titulo}" (Tomo ${manga.volumen}) del catálogo?`
    );
    if (!confirmado) return;

    try {
      await eliminarManga(manga.id);
      setMensajeExito(`Manga "${manga.titulo}" eliminado del catálogo.`);
      await cargarCatalogoAdmin(paginacion.page);
      setTimeout(() => setMensajeExito(null), 3000);
    } catch (err) {
      if (err instanceof ApiError) {
        alert(err.message || "No fue posible eliminar el manga.");
      } else {
        alert("Ocurrió un error al eliminar el manga.");
      }
    }
  };

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <div className="max-w-[var(--max-ancho)] mx-auto px-5 sm:px-6 md:px-[30px] py-[40px] md:py-[var(--espacio-grande)]">
        {/* Encabezado del panel de administración */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-[var(--color-principal)] text-[var(--color-blanco)] font-bold">
                Administración
              </span>
              <span className="text-xs text-[var(--color-texto-secundario)]">
                Control de catálogo y solicitudes
              </span>
            </div>
            <h1 className="text-[2rem] sm:text-[2.5rem] font-bold text-[var(--color-texto)]">
              Panel de Administrador
            </h1>
          </div>

          {tabActiva === "catalogo" && (
            <button
              type="button"
              onClick={abrirCreacion}
              className="px-5 py-2.5 bg-[var(--color-principal)] hover:bg-[var(--color-principal-hover)] text-[var(--color-blanco)] font-bold rounded-[var(--radio)] transition-all flex items-center gap-2 self-start sm:self-auto cursor-pointer shadow-sm focus-visible:outline-2 focus-visible:outline-[var(--color-principal)]"
            >
              + Nuevo manga
            </button>
          )}
        </div>

        {/* Mensaje global de éxito */}
        {mensajeExito && (
          <div
            className="mb-6 p-4 rounded-[var(--radio)] bg-[#238636]/15 border border-[#238636]/30 text-[#238636] dark:text-[#3fb950] font-semibold text-sm flex items-center justify-between"
            role="status"
          >
            <span>{mensajeExito}</span>
            <button
              type="button"
              onClick={() => setMensajeExito(null)}
              className="text-xs font-bold underline cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Pestañas de navegación interna */}
        <div className="flex border-b border-[var(--color-borde)] mb-8 gap-4" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tabActiva === "catalogo"}
            onClick={() => setTabActiva("catalogo")}
            className={`pb-3 px-2 font-bold text-sm sm:text-base border-b-2 transition-colors cursor-pointer ${
              tabActiva === "catalogo"
                ? "border-[var(--color-principal)] text-[var(--color-principal)]"
                : "border-transparent text-[var(--color-texto-secundario)] hover:text-[var(--color-texto)]"
            }`}
          >
            Gestión del Catálogo ({paginacion.total})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tabActiva === "solicitudes"}
            onClick={() => setTabActiva("solicitudes")}
            className={`pb-3 px-2 font-bold text-sm sm:text-base border-b-2 transition-colors cursor-pointer ${
              tabActiva === "solicitudes"
                ? "border-[var(--color-principal)] text-[var(--color-principal)]"
                : "border-transparent text-[var(--color-texto-secundario)] hover:text-[var(--color-texto)]"
            }`}
          >
            Solicitudes de Venta Recibidas
          </button>
        </div>

        {/* MODAL / FORMULARIO DE CREACIÓN O EDICIÓN */}
        {mostrarForm && (
          <div
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-modal-manga"
          >
            <div className="bg-[var(--color-blanco)] border border-[var(--color-borde)] rounded-[var(--radio)] p-6 sm:p-8 max-w-[700px] w-full my-8 shadow-2xl transition-all">
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-[var(--color-borde)]">
                <h2 id="titulo-modal-manga" className="text-xl font-bold text-[var(--color-texto)]">
                  {editandoId !== null ? "Editar Manga" : "Publicar Nuevo Manga"}
                </h2>
                <button
                  type="button"
                  onClick={cerrarForm}
                  className="p-1 rounded text-[var(--color-texto-secundario)] hover:text-[var(--color-texto)] hover:bg-[var(--color-superficie-secundaria)] transition-colors cursor-pointer"
                  aria-label="Cerrar modal"
                >
                  ✕
                </button>
              </div>

              {formError && (
                <div
                  className="mb-5 p-3 rounded bg-[#e63946]/10 border border-[#e63946]/30 text-[#e63946] text-sm font-semibold"
                  role="alert"
                >
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmitForm} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Título */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-[var(--color-texto)] mb-1 uppercase tracking-wider">
                      Título del manga *
                    </label>
                    <input
                      name="title"
                      type="text"
                      required
                      value={formValores.title}
                      onChange={handleInputChange}
                      placeholder="Ej. Chainsaw Man"
                      className="w-full border border-[var(--color-borde)] rounded-[var(--radio)] py-2.5 px-3 bg-[var(--color-blanco)] text-[var(--color-texto)] text-sm focus:outline-2 focus:outline-[var(--color-principal)]"
                    />
                  </div>

                  {/* Volumen */}
                  <div>
                    <label className="block text-xs font-bold text-[var(--color-texto)] mb-1 uppercase tracking-wider">
                      Volumen (número)
                    </label>
                    <input
                      name="volume"
                      type="number"
                      min="1"
                      value={formValores.volume}
                      onChange={handleInputChange}
                      placeholder="1"
                      className="w-full border border-[var(--color-borde)] rounded-[var(--radio)] py-2.5 px-3 bg-[var(--color-blanco)] text-[var(--color-texto)] text-sm focus:outline-2 focus:outline-[var(--color-principal)]"
                    />
                  </div>

                  {/* Autor */}
                  <div>
                    <label className="block text-xs font-bold text-[var(--color-texto)] mb-1 uppercase tracking-wider">
                      Autor o mangaka *
                    </label>
                    <input
                      name="author"
                      type="text"
                      required
                      value={formValores.author}
                      onChange={handleInputChange}
                      placeholder="Tatsuki Fujimoto"
                      className="w-full border border-[var(--color-borde)] rounded-[var(--radio)] py-2.5 px-3 bg-[var(--color-blanco)] text-[var(--color-texto)] text-sm focus:outline-2 focus:outline-[var(--color-principal)]"
                    />
                  </div>

                  {/* Género */}
                  <div>
                    <label className="block text-xs font-bold text-[var(--color-texto)] mb-1 uppercase tracking-wider">
                      Género *
                    </label>
                    <select
                      name="genre"
                      required
                      value={formValores.genre}
                      onChange={handleInputChange}
                      className="w-full border border-[var(--color-borde)] rounded-[var(--radio)] py-2.5 px-3 bg-[var(--color-blanco)] text-[var(--color-texto)] text-sm focus:outline-2 focus:outline-[var(--color-principal)]"
                    >
                      <option value="Shonen">Shonen</option>
                      <option value="Seinen">Seinen</option>
                      <option value="Shojo">Shojo</option>
                      <option value="Josei">Josei</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>

                  {/* Estado / Condición */}
                  <div>
                    <label className="block text-xs font-bold text-[var(--color-texto)] mb-1 uppercase tracking-wider">
                      Condición física *
                    </label>
                    <select
                      name="condition"
                      required
                      value={formValores.condition}
                      onChange={handleInputChange}
                      className="w-full border border-[var(--color-borde)] rounded-[var(--radio)] py-2.5 px-3 bg-[var(--color-blanco)] text-[var(--color-texto)] text-sm focus:outline-2 focus:outline-[var(--color-principal)]"
                    >
                      <option value="NEW">Nuevo (sellado)</option>
                      <option value="LIKE_NEW">Como nuevo</option>
                      <option value="GOOD">Buen estado</option>
                      <option value="FAIR">Aceptable</option>
                      <option value="POOR">Desgastado</option>
                    </select>
                  </div>

                  {/* Precio COP */}
                  <div>
                    <label className="block text-xs font-bold text-[var(--color-texto)] mb-1 uppercase tracking-wider">
                      Precio en COP *
                    </label>
                    <input
                      name="price"
                      type="number"
                      min="1"
                      step="500"
                      required
                      value={formValores.price}
                      onChange={handleInputChange}
                      placeholder="35000"
                      className="w-full border border-[var(--color-borde)] rounded-[var(--radio)] py-2.5 px-3 bg-[var(--color-blanco)] text-[var(--color-texto)] text-sm focus:outline-2 focus:outline-[var(--color-principal)]"
                    />
                  </div>

                  {/* Stock */}
                  <div>
                    <label className="block text-xs font-bold text-[var(--color-texto)] mb-1 uppercase tracking-wider">
                      Stock disponible *
                    </label>
                    <input
                      name="stock"
                      type="number"
                      min="0"
                      required
                      value={formValores.stock}
                      onChange={handleInputChange}
                      placeholder="1"
                      className="w-full border border-[var(--color-borde)] rounded-[var(--radio)] py-2.5 px-3 bg-[var(--color-blanco)] text-[var(--color-texto)] text-sm focus:outline-2 focus:outline-[var(--color-principal)]"
                    />
                  </div>

                  {/* Portada URL */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-[var(--color-texto)] mb-1 uppercase tracking-wider">
                      Ruta o URL de portada
                    </label>
                    <input
                      name="image"
                      type="text"
                      value={formValores.image}
                      onChange={handleInputChange}
                      placeholder="/images/chainsawman-vol1.jpg o https://..."
                      className="w-full border border-[var(--color-borde)] rounded-[var(--radio)] py-2.5 px-3 bg-[var(--color-blanco)] text-[var(--color-texto)] text-sm focus:outline-2 focus:outline-[var(--color-principal)]"
                    />
                  </div>

                  {/* Descripción */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-[var(--color-texto)] mb-1 uppercase tracking-wider">
                      Descripción del tomo *
                    </label>
                    <textarea
                      name="description"
                      rows={3}
                      required
                      value={formValores.description}
                      onChange={handleInputChange}
                      placeholder="Detalles sobre editorial, idioma o estado..."
                      className="w-full border border-[var(--color-borde)] rounded-[var(--radio)] py-2.5 px-3 bg-[var(--color-blanco)] text-[var(--color-texto)] text-sm focus:outline-2 focus:outline-[var(--color-principal)] resize-y"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-borde)] mt-6">
                  <button
                    type="button"
                    onClick={cerrarForm}
                    className="px-4 py-2 border border-[var(--color-borde)] rounded-[var(--radio)] text-sm font-semibold text-[var(--color-texto)] hover:bg-[var(--color-superficie-secundaria)] transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={formGuardando}
                    className="px-5 py-2 bg-[var(--color-principal)] hover:bg-[var(--color-principal-hover)] text-[var(--color-blanco)] text-sm font-bold rounded-[var(--radio)] transition-all cursor-pointer disabled:opacity-60"
                  >
                    {formGuardando
                      ? "Guardando..."
                      : editandoId !== null
                      ? "Guardar cambios"
                      : "Publicar manga"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 1: GESTIÓN DEL CATÁLOGO */}
        {tabActiva === "catalogo" && (
          <div className="bg-[var(--color-blanco)] border border-[var(--color-borde)] rounded-[var(--radio)] overflow-hidden shadow-xs transition-colors duration-200">
            {cargandoCatalogo && (
              <div className="p-12 text-center" aria-busy="true">
                <div className="w-8 h-8 border-3 border-[var(--color-borde)] border-t-[var(--color-principal)] rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-[var(--color-texto-secundario)]">
                  Cargando catálogo administrativo...
                </p>
              </div>
            )}

            {errorCatalogo && !cargandoCatalogo && (
              <div className="p-8 text-center" role="alert">
                <p className="text-sm text-[#e63946] mb-3">{errorCatalogo}</p>
                <button
                  type="button"
                  onClick={() => cargarCatalogoAdmin(paginacion.page)}
                  className="px-4 py-2 bg-[var(--color-principal)] text-[var(--color-blanco)] text-xs font-bold rounded-[var(--radio)] cursor-pointer"
                >
                  Reintentar
                </button>
              </div>
            )}

            {!cargandoCatalogo && !errorCatalogo && mangas.length === 0 && (
              <div className="p-12 text-center text-sm text-[var(--color-texto-secundario)]">
                No hay mangas registrados en el catálogo. Haz clic en &quot;+ Nuevo manga&quot; para crear uno.
              </div>
            )}

            {!cargandoCatalogo && !errorCatalogo && mangas.length > 0 && (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-[var(--color-borde)] bg-[var(--color-superficie-secundaria)] text-xs font-bold uppercase tracking-wider text-[var(--color-texto-secundario)]">
                        <th className="py-3.5 px-4">Manga</th>
                        <th className="py-3.5 px-4">Autor / Género</th>
                        <th className="py-3.5 px-4">Condición</th>
                        <th className="py-3.5 px-4">Precio</th>
                        <th className="py-3.5 px-4">Stock</th>
                        <th className="py-3.5 px-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-borde)]">
                      {mangas.map((manga) => (
                        <tr
                          key={manga.id}
                          className="hover:bg-[var(--color-superficie-secundaria)]/40 transition-colors"
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-14 bg-[var(--color-superficie-secundaria)] rounded border border-[var(--color-borde)] overflow-hidden shrink-0 flex items-center justify-center relative">
                                {manga.imagen ? (
                                  <Image
                                    src={manga.imagen}
                                    alt={manga.titulo}
                                    fill
                                    sizes="40px"
                                    className="object-cover"
                                    unoptimized={Boolean(manga.imagen.startsWith("http"))}
                                  />
                                ) : (
                                  <span className="text-[10px] text-[var(--color-texto-secundario)]">
                                    N/A
                                  </span>
                                )}
                              </div>
                              <div>
                                <span className="font-bold text-[var(--color-texto)] block">
                                  {manga.titulo}
                                </span>
                                <span className="text-xs text-[var(--color-texto-secundario)]">
                                  Tomo {manga.volumen}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-[var(--color-texto)]">
                            <div>{manga.autor}</div>
                            <span className="text-xs text-[var(--color-principal)] font-semibold">
                              {manga.genero}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[var(--color-superficie-secundaria)] border border-[var(--color-borde)] text-[var(--color-texto)]">
                              {manga.estado}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-[var(--color-principal)]">
                            {formatearPrecioCOP(manga.precio)}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-xs">
                            <span
                              className={`px-2 py-0.5 rounded font-bold ${
                                (manga.stock ?? 0) > 0
                                  ? "bg-[#238636]/15 text-[#238636] dark:text-[#3fb950]"
                                  : "bg-[#da3633]/15 text-[#da3633]"
                              }`}
                            >
                              {manga.stock ?? 1} disp.
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => abrirEdicion(manga)}
                                className="px-2.5 py-1 text-xs font-bold border border-[var(--color-borde)] rounded hover:border-[var(--color-principal)] hover:text-[var(--color-principal)] transition-colors cursor-pointer"
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleEliminarManga(manga)}
                                className="px-2.5 py-1 text-xs font-bold border border-[#da3633]/30 text-[#da3633] rounded hover:bg-[#da3633]/10 transition-colors cursor-pointer"
                              >
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Paginación de tabla administrativa */}
                {paginacion.totalPages > 1 && (
                  <div className="p-4 border-t border-[var(--color-borde)] flex items-center justify-between text-xs text-[var(--color-texto-secundario)]">
                    <span>
                      Mostrando página {paginacion.page} de {paginacion.totalPages} ({paginacion.total} mangas en total)
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={paginacion.page <= 1 || cargandoCatalogo}
                        onClick={() => cargarCatalogoAdmin(paginacion.page - 1)}
                        className="px-3 py-1.5 border border-[var(--color-borde)] rounded font-semibold disabled:opacity-40 cursor-pointer hover:bg-[var(--color-superficie-secundaria)]"
                      >
                        ← Anterior
                      </button>
                      <button
                        type="button"
                        disabled={paginacion.page >= paginacion.totalPages || cargandoCatalogo}
                        onClick={() => cargarCatalogoAdmin(paginacion.page + 1)}
                        className="px-3 py-1.5 border border-[var(--color-borde)] rounded font-semibold disabled:opacity-40 cursor-pointer hover:bg-[var(--color-superficie-secundaria)]"
                      >
                        Siguiente →
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* TAB 2: SOLICITUDES DE VENTA RECIBIDAS */}
        {tabActiva === "solicitudes" && (
          <div className="bg-[var(--color-blanco)] border border-[var(--color-borde)] rounded-[var(--radio)] overflow-hidden shadow-xs transition-colors duration-200">
            {cargandoSolicitudes && (
              <div className="p-12 text-center" aria-busy="true">
                <div className="w-8 h-8 border-3 border-[var(--color-borde)] border-t-[var(--color-principal)] rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-[var(--color-texto-secundario)]">
                  Cargando solicitudes de los usuarios...
                </p>
              </div>
            )}

            {errorSolicitudes && !cargandoSolicitudes && (
              <div className="p-8 text-center" role="alert">
                <p className="text-sm text-[#e63946] mb-3">{errorSolicitudes}</p>
                <button
                  type="button"
                  onClick={cargarSolicitudesAdmin}
                  className="px-4 py-2 bg-[var(--color-principal)] text-[var(--color-blanco)] text-xs font-bold rounded-[var(--radio)] cursor-pointer"
                >
                  Reintentar
                </button>
              </div>
            )}

            {!cargandoSolicitudes && !errorSolicitudes && solicitudes.length === 0 && (
              <div className="p-12 text-center text-sm text-[var(--color-texto-secundario)]">
                No hay solicitudes de venta registradas en la base de datos.
              </div>
            )}

            {!cargandoSolicitudes && !errorSolicitudes && solicitudes.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[var(--color-borde)] bg-[var(--color-superficie-secundaria)] text-xs font-bold uppercase tracking-wider text-[var(--color-texto-secundario)]">
                      <th className="py-3.5 px-4">Manga Solicitado</th>
                      <th className="py-3.5 px-4">Usuario Postulante</th>
                      <th className="py-3.5 px-4">Condición</th>
                      <th className="py-3.5 px-4">Precio Propuesto</th>
                      <th className="py-3.5 px-4">Estado</th>
                      <th className="py-3.5 px-4">Fecha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-borde)]">
                    {solicitudes.map((sol) => {
                      const estado = formatearEstadoSolicitud(sol.status);
                      const fecha = sol.createdAt
                        ? new Date(sol.createdAt).toLocaleDateString("es-CO", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "N/A";

                      const precioNum =
                        typeof sol.proposedPrice === "number"
                          ? sol.proposedPrice
                          : parseFloat(String(sol.proposedPrice)) || 0;

                      return (
                        <tr
                          key={sol.id}
                          className="hover:bg-[var(--color-superficie-secundaria)]/40 transition-colors"
                        >
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-[var(--color-texto)] block">
                              {sol.title}
                            </span>
                            <span className="text-xs text-[var(--color-texto-secundario)]">
                              Tomo {sol.volume || 1} · {sol.genre}
                            </span>
                            {sol.description && (
                              <p className="text-xs text-[var(--color-texto-secundario)] mt-1 italic max-w-[280px] truncate">
                                &quot;{sol.description}&quot;
                              </p>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-[var(--color-texto)] block">
                              {sol.user?.name || "Usuario registrado"}
                            </span>
                            <span className="text-xs text-[var(--color-texto-secundario)]">
                              {sol.user?.email || sol.userId}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-xs font-semibold">
                            {formatearCondicion(sol.condition)}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-[var(--color-principal)]">
                            {formatearPrecioCOP(precioNum)}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${estado.clase}`}
                            >
                              {estado.etiqueta}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-xs text-[var(--color-texto-secundario)]">
                            {fecha}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
