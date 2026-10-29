/**
 * Cliente HTTP centralizado para Re-Manga.
 * Gestiona la URL base, cabeceras, inyección de JWT, manejo de errores HTTP y respuestas JSON.
 */

export const TOKEN_STORAGE_KEY = "remanga_auth_token";

export class ApiError extends Error {
  public readonly status: number;
  public readonly data?: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

let cachedToken: string | null = null;
let onUnauthorizedCallback: (() => void) | null = null;

/**
 * Obtiene la URL base del servidor backend respetando NEXT_PUBLIC_API_URL.
 * Normaliza barras finales y un sufijo "/api" opcional para evitar rutas "/api/api" duplicadas.
 */
export function getApiBaseUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000")
    .trim()
    .replace(/\/+$/, "");
  return raw.replace(/\/api$/i, "");
}

/**
 * Construye la URL final hacia el backend garantizando el prefijo "/api" sin duplicarlo,
 * tanto si NEXT_PUBLIC_API_URL incluye "/api" al final como si solo define el dominio base.
 */
export function buildApiUrl(endpoint: string): string {
  if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
    return endpoint;
  }
  const baseUrl = getApiBaseUrl();
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const pathWithApi =
    normalizedEndpoint === "/api" || normalizedEndpoint.startsWith("/api/")
      ? normalizedEndpoint
      : `/api${normalizedEndpoint}`;
  return `${baseUrl}${pathWithApi}`;
}

/**
 * Obtiene el token JWT actualmente almacenado (en memoria o localStorage).
 */
export function getStoredToken(): string | null {
  if (cachedToken) return cachedToken;
  if (typeof window !== "undefined") {
    try {
      cachedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      return cachedToken;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Guarda o elimina el token JWT del almacenamiento local y la memoria.
 */
export function setStoredToken(token: string | null): void {
  cachedToken = token;
  if (typeof window !== "undefined") {
    try {
      if (token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    } catch {
      // Ignorar fallos de acceso a localStorage (ej. navegación privada estricta)
    }
  }
}

/**
 * Registra un manejador para cuando una solicitud privada responda 401 Unauthorized,
 * permitiendo limpiar la sesión centralizada sin provocar bucles de redirección.
 */
export function setOnUnauthorizedListener(callback: (() => void) | null): void {
  onUnauthorizedCallback = callback;
}

export interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  token?: string | null;
  skipAuth?: boolean;
}

/**
 * Realiza una solicitud HTTP estructurada hacia el backend.
 */
async function httpRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const url = buildApiUrl(endpoint);

  const headers = new Headers(options.headers || {});
  headers.set("Accept", "application/json");

  // Inyección automática del token Bearer si existe y no se omitió explícitamente
  if (!options.skipAuth) {
    const token = options.token !== undefined ? options.token : getStoredToken();
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  // Serialización automática de JSON si hay cuerpo y no se especificó otro Content-Type
  let body: BodyInit | null | undefined = undefined;
  if (options.body !== undefined && options.body !== null) {
    if (typeof options.body === "object" && !(options.body instanceof FormData)) {
      if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
      body = JSON.stringify(options.body);
    } else {
      body = options.body as BodyInit;
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      body,
      credentials: "include", // Compatibilidad adicional para cookies seguras
    });
  } catch (error) {
    throw new ApiError(
      0,
      "No fue posible conectar con el servidor. Asegúrate de que el backend esté en ejecución y accesible.",
      error
    );
  }

  // Parseo seguro de la respuesta JSON
  let responseData: unknown = null;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      responseData = await response.json();
    } catch {
      responseData = null;
    }
  } else {
    try {
      const text = await response.text();
      responseData = text ? { message: text } : null;
    } catch {
      responseData = null;
    }
  }

  // Manejo de códigos de estado HTTP de error
  if (!response.ok) {
    const errorBody =
      typeof responseData === "object" && responseData !== null
        ? (responseData as Record<string, unknown>)
        : null;
    const message =
      (typeof errorBody?.message === "string" && errorBody.message) ||
      (typeof errorBody?.error === "string" && errorBody.error) ||
      `Error en la solicitud al servidor (HTTP ${response.status})`;

    // Si es un 401 en un endpoint protegido (no en login ni registro), disparar notificación
    if (response.status === 401 && !url.includes("/api/auth/login") && !url.includes("/api/auth/register")) {
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
    }

    throw new ApiError(response.status, message, responseData);
  }

  return responseData as T;
}

export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    httpRequest<T>(endpoint, { ...options, method: "GET" }),

  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    httpRequest<T>(endpoint, { ...options, method: "POST", body }),

  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    httpRequest<T>(endpoint, { ...options, method: "PUT", body }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    httpRequest<T>(endpoint, { ...options, method: "DELETE" }),
};
