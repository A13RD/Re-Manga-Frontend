"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useAuth } from "./AuthContext";
import { obtenerFavoritos, agregarFavorito, eliminarFavorito } from "@/lib/favoritos";
import type { FavoriteItem } from "@/types/favorite";

interface FavoritesContextType {
  favorites: FavoriteItem[];
  favoriteIds: Set<string>;
  isFavorite: (mangaId: string | number) => boolean;
  toggleFavorite: (mangaId: string | number) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
  refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const favoriteIds = useMemo(() => {
    return new Set(favorites.map((f) => String(f.mangaId)));
  }, [favorites]);

  const refreshFavorites = useCallback(async () => {
    if (!isAuthenticated) {
      setFavorites([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await obtenerFavoritos();
      setFavorites(data);
    } catch (err: unknown) {
      console.error("Error al cargar favoritos:", err);
      setError("No se pudieron cargar tus mangas favoritos.");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      const timer = setTimeout(() => {
        setFavorites([]);
      }, 0);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      refreshFavorites();
    }, 0);
    return () => clearTimeout(timer);
  }, [isAuthenticated, refreshFavorites]);

  const isFavorite = useCallback(
    (mangaId: string | number): boolean => {
      return favoriteIds.has(String(mangaId));
    },
    [favoriteIds]
  );

  const toggleFavorite = useCallback(
    async (mangaId: string | number): Promise<boolean> => {
      const idStr = String(mangaId);
      const currentlyFav = favoriteIds.has(idStr);

      if (currentlyFav) {
        setFavorites((prev) => prev.filter((f) => String(f.mangaId) !== idStr));
        try {
          await eliminarFavorito(idStr);
          return false;
        } catch (err) {
          await refreshFavorites();
          throw err;
        }
      } else {
        try {
          const newFav = await agregarFavorito(idStr);
          setFavorites((prev) => [newFav, ...prev]);
          return true;
        } catch (err) {
          await refreshFavorites();
          throw err;
        }
      }
    },
    [favoriteIds, refreshFavorites]
  );

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        favoriteIds,
        isFavorite,
        toggleFavorite,
        isLoading,
        error,
        refreshFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesContextType {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites debe ser utilizado dentro de un FavoritesProvider");
  }
  return context;
}

