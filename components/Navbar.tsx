"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { useCart } from "@/context/CartContext";

export function Navbar() {
  const { theme, toggleTheme, isMounted } = useTheme();
  const { totalItems } = useCart();
  const pathname = usePathname();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Cerrar menú móvil al cambiar de ruta
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Manejar tecla Escape y clics fuera del menú móvil
  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  // Etiquetas y estado accesible del botón de tema
  const esOscuro = isMounted && theme === "oscuro";
  const textoBotonTema = esOscuro ? "☀️" : "🌙";
  const ariaLabelBotonTema = esOscuro ? "Activar modo claro" : "Activar modo oscuro";

  return (
    <header className="sticky top-0 z-50 bg-[var(--color-blanco)] border-b border-[var(--color-borde)] transition-colors duration-200">
      <nav
        aria-label="Navegación principal"
        className="max-w-[var(--max-ancho)] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between"
      >
        {/* Logotipo textual con enlace al inicio */}
        <Link
          href="/#hero"
          className="text-2xl font-extrabold text-[var(--color-principal)] tracking-tight focus-visible:outline-2 focus-visible:outline-[var(--color-principal)] rounded-sm"
        >
          Re-Manga
        </Link>

        {/* Navegación en escritorio */}
        <div className="hidden md:flex items-center gap-7">
          <Link
            href="/#hero"
            className="text-[0.95rem] font-semibold text-[var(--color-texto)] hover:text-[var(--color-principal)] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-[var(--color-principal)] rounded-sm"
          >
            Inicio
          </Link>
          <Link
            href="/#catalogo"
            className="text-[0.95rem] font-semibold text-[var(--color-texto)] hover:text-[var(--color-principal)] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-[var(--color-principal)] rounded-sm"
          >
            Catálogo
          </Link>
          <Link
            href="/#como-funciona"
            className="text-[0.95rem] font-semibold text-[var(--color-texto)] hover:text-[var(--color-principal)] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-[var(--color-principal)] rounded-sm"
          >
            Cómo funciona
          </Link>
          <Link
            href="/#vender"
            className="text-[0.95rem] font-semibold text-[var(--color-texto)] hover:text-[var(--color-principal)] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-[var(--color-principal)] rounded-sm"
          >
            Vender
          </Link>
          <Link
            href="/registro"
            aria-current={pathname === "/registro" ? "page" : undefined}
            className={`text-[0.95rem] font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-[var(--color-principal)] rounded-sm ${
              pathname === "/registro"
                ? "text-[var(--color-principal)]"
                : "text-[var(--color-texto)] hover:text-[var(--color-principal)]"
            }`}
          >
            Registro
          </Link>
          <Link
            href="/carrito"
            aria-current={pathname === "/carrito" ? "page" : undefined}
            className={`text-[0.95rem] font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-[var(--color-principal)] rounded-sm ${
              pathname === "/carrito"
                ? "text-[var(--color-principal)]"
                : "text-[var(--color-texto)] hover:text-[var(--color-principal)]"
            }`}
          >
            Carrito (<span className="contador-carrito">{totalItems}</span>)
          </Link>

          {/* Botón de alternancia de tema */}
          <button
            id="boton-tema"
            type="button"
            className="boton-tema border border-[var(--color-borde)] rounded-[var(--radio)] px-2.5 py-1.5 bg-[var(--color-blanco)] text-[var(--color-texto)] cursor-pointer text-base leading-none transition-all duration-200 hover:border-[var(--color-principal)] hover:text-[var(--color-principal)] hover:-translate-y-px active:translate-y-0 focus-visible:outline-2 focus-visible:outline-[var(--color-principal)]"
            aria-label={ariaLabelBotonTema}
            aria-pressed={esOscuro}
            onClick={toggleTheme}
          >
            {textoBotonTema}
          </button>
        </div>

        {/* Controles para dispositivos móviles */}
        <div className="flex md:hidden items-center gap-3">
          {/* Enlace rápido a carrito en móvil */}
          <Link
            href="/carrito"
            aria-label={`Ver carrito, ${totalItems} unidades`}
            className="text-sm font-semibold px-2 py-1 text-[var(--color-texto)] hover:text-[var(--color-principal)] transition-colors rounded-sm focus-visible:outline-2 focus-visible:outline-[var(--color-principal)]"
          >
            🛒 (<span className="contador-carrito">{totalItems}</span>)
          </Link>

          {/* Botón de tema en móvil */}
          <button
            id="boton-tema-movil"
            type="button"
            className="boton-tema border border-[var(--color-borde)] rounded-[var(--radio)] px-2.5 py-1.5 bg-[var(--color-blanco)] text-[var(--color-texto)] cursor-pointer text-base leading-none transition-all duration-200 hover:border-[var(--color-principal)] hover:text-[var(--color-principal)] focus-visible:outline-2 focus-visible:outline-[var(--color-principal)]"
            aria-label={ariaLabelBotonTema}
            aria-pressed={esOscuro}
            onClick={toggleTheme}
          >
            {textoBotonTema}
          </button>

          {/* Botón de menú hamburguesa */}
          <button
            ref={menuButtonRef}
            type="button"
            className="inline-flex items-center justify-center p-2 rounded-[var(--radio)] text-[var(--color-texto)] border border-[var(--color-borde)] hover:border-[var(--color-principal)] hover:text-[var(--color-principal)] focus-visible:outline-2 focus-visible:outline-[var(--color-principal)] transition-colors"
            aria-controls="menu-movil"
            aria-expanded={isMobileMenuOpen}
            aria-label={isMobileMenuOpen ? "Cerrar menú de navegación" : "Abrir menú de navegación"}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              // Ícono de cerrar (X)
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              // Ícono de hamburguesa (3 barras)
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Menú desplegable para móviles */}
      {isMobileMenuOpen && (
        <div
          id="menu-movil"
          ref={mobileMenuRef}
          className="md:hidden border-t border-[var(--color-borde)] bg-[var(--color-blanco)] px-4 py-4 shadow-md transition-all duration-200"
        >
          <div className="flex flex-col gap-2">
            <Link
              href="/#hero"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-[var(--radio)] text-base font-semibold text-[var(--color-texto)] hover:bg-[var(--color-superficie-secundaria)] hover:text-[var(--color-principal)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-principal)]"
            >
              Inicio
            </Link>
            <Link
              href="/#catalogo"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-[var(--radio)] text-base font-semibold text-[var(--color-texto)] hover:bg-[var(--color-superficie-secundaria)] hover:text-[var(--color-principal)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-principal)]"
            >
              Catálogo
            </Link>
            <Link
              href="/#como-funciona"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-[var(--radio)] text-base font-semibold text-[var(--color-texto)] hover:bg-[var(--color-superficie-secundaria)] hover:text-[var(--color-principal)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-principal)]"
            >
              Cómo funciona
            </Link>
            <Link
              href="/#vender"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-[var(--radio)] text-base font-semibold text-[var(--color-texto)] hover:bg-[var(--color-superficie-secundaria)] hover:text-[var(--color-principal)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-principal)]"
            >
              Vender
            </Link>
            <Link
              href="/registro"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-current={pathname === "/registro" ? "page" : undefined}
              className={`px-3 py-2.5 rounded-[var(--radio)] text-base font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-principal)] ${
                pathname === "/registro"
                  ? "bg-[var(--color-superficie-secundaria)] text-[var(--color-principal)]"
                  : "text-[var(--color-texto)] hover:bg-[var(--color-superficie-secundaria)] hover:text-[var(--color-principal)]"
              }`}
            >
              Registro
            </Link>
            <Link
              href="/carrito"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-current={pathname === "/carrito" ? "page" : undefined}
              className={`px-3 py-2.5 rounded-[var(--radio)] text-base font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-principal)] ${
                pathname === "/carrito"
                  ? "bg-[var(--color-superficie-secundaria)] text-[var(--color-principal)]"
                  : "text-[var(--color-texto)] hover:bg-[var(--color-superficie-secundaria)] hover:text-[var(--color-principal)]"
              }`}
            >
              Carrito (<span className="contador-carrito">{totalItems}</span>)
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
