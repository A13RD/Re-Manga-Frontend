"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

export type Theme = "claro" | "oscuro";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isMounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = "tema";

/**
 * Aplica las clases y atributos de tema al DOM.
 * Mantiene compatibilidad con la clase 'modo-oscuro' en body/html y '.dark' de Tailwind v4.
 */
function aplicarClasesTema(nuevoTema: Theme): void {
  if (typeof document === "undefined") return;

  const esOscuro = nuevoTema === "oscuro";
  const docEl = document.documentElement;
  const body = document.body;

  if (esOscuro) {
    docEl.classList.add("modo-oscuro", "dark");
    docEl.setAttribute("data-theme", "dark");
    if (body) {
      body.classList.add("modo-oscuro");
    }
  } else {
    docEl.classList.remove("modo-oscuro", "dark");
    docEl.removeAttribute("data-theme");
    if (body) {
      body.classList.remove("modo-oscuro");
    }
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("claro");
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    let temaInicial: Theme = "claro";

    try {
      const temaGuardado = localStorage.getItem(STORAGE_KEY);
      if (temaGuardado === "oscuro") {
        temaInicial = "oscuro";
      }
    } catch {
      // Si localStorage no está disponible o lanza error, se mantiene 'claro'.
    }

    const timer = setTimeout(() => {
      setIsMounted(true);
      setTheme(temaInicial);
      aplicarClasesTema(temaInicial);
    }, 0);

    // Sincronización entre pestañas mediante el evento 'storage'
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        const temaActualizado: Theme = event.newValue === "oscuro" ? "oscuro" : "claro";
        setTheme(temaActualizado);
        aplicarClasesTema(temaActualizado);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prevTheme) => {
      const siguienteTema: Theme = prevTheme === "oscuro" ? "claro" : "oscuro";
      try {
        localStorage.setItem(STORAGE_KEY, siguienteTema);
      } catch (error) {
        console.warn("No fue posible guardar la preferencia de tema en localStorage:", error);
      }
      aplicarClasesTema(siguienteTema);
      return siguienteTema;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isMounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme debe utilizarse dentro de un ThemeProvider.");
  }
  return context;
}
