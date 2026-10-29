"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { LoginPayload, LoginResponse } from "@/types/auth";
import { useAuth } from "@/context/AuthContext";
import { api, ApiError } from "@/lib/api";

interface FormValues {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
}

const VALORES_INICIALES: FormValues = {
  email: "",
  password: "",
};

/**
 * Valida los datos del formulario de inicio de sesión del lado del cliente:
 * - Correo obligatorio y con formato válido.
 * - Contraseña obligatoria.
 */
function validarLogin(valores: FormValues): FormErrors {
  const errores: FormErrors = {};
  const emailTrim = valores.email.trim();

  // Validación de Correo electrónico
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailTrim) {
    errores.email = "Introduce tu correo electrónico.";
  } else if (!emailRegex.test(emailTrim)) {
    errores.email = "Introduce un correo válido.";
  }

  // Validación de Contraseña
  if (!valores.password) {
    errores.password = "Introduce tu contraseña.";
  }

  return errores;
}

/**
 * Componente cliente que renderiza el formulario de inicio de sesión de Re-Manga.
 * Incluye validaciones accesibles, alternancia de visibilidad de contraseña,
 * prevención de envíos repetidos, estados de carga y manejo de respuestas del backend
 * sin almacenar contraseñas ni tokens sensibles en el navegador.
 */
export function LoginContent() {
  const router = useRouter();
  const { login } = useAuth();

  const [valores, setValores] = useState<FormValues>(VALORES_INICIALES);
  const [errores, setErrores] = useState<FormErrors>({});
  const [mensajeFeedback, setMensajeFeedback] = useState<string>("");
  const [esExito, setEsExito] = useState<boolean>(false);
  const [cargando, setCargando] = useState<boolean>(false);
  const [mostrarPassword, setMostrarPassword] = useState<boolean>(false);

  // Referencias para gestión de foco accesible
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValores((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Limpiar feedback global al escribir
    if (mensajeFeedback) {
      setMensajeFeedback("");
      setEsExito(false);
    }

    // Limpiar el error del campo correspondiente
    if (errores[name as keyof FormErrors]) {
      setErrores((prev) => {
        const nuevosErrores = { ...prev };
        delete nuevosErrores[name as keyof FormErrors];
        return nuevosErrores;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Prevención de envíos duplicados si la petición ya está en curso
    if (cargando) return;

    // Validación en el cliente antes de la solicitud
    const nuevosErrores = validarLogin(valores);
    setErrores(nuevosErrores);

    if (Object.keys(nuevosErrores).length > 0) {
      setEsExito(false);
      setMensajeFeedback("");

      // Llevar el foco de manera accesible al primer campo con error
      if (nuevosErrores.email) {
        emailRef.current?.focus();
      } else if (nuevosErrores.password) {
        passwordRef.current?.focus();
      }
      return;
    }

    // Inicio de estado de carga
    setCargando(true);
    setMensajeFeedback("");
    setEsExito(false);

    // Enviar exclusivamente los campos requeridos por el contrato
    const payload: LoginPayload = {
      email: valores.email.trim().toLowerCase(),
      password: valores.password,
    };

    try {
      const data = await api.post<LoginResponse>("/api/auth/login", payload);

      // Inicio de sesión exitoso (HTTP 200)
      setEsExito(true);
      setMensajeFeedback(data?.message || "¡Inicio de sesión exitoso! Redirigiendo...");

      if (data?.token && data?.user) {
        login(data.token, data.user);
      }

      // Limpiar el campo de contraseña por seguridad
      setValores(VALORES_INICIALES);
      setErrores({});

      // Redirección a la página principal existente tras un breve instante
      setTimeout(() => {
        router.push("/");
      }, 1000);
    } catch (error) {
      setEsExito(false);

      if (error instanceof ApiError) {
        if (error.status === 401 || error.status === 403) {
          // Credenciales incorrectas: mensaje genérico sin revelar si el usuario existe
          setMensajeFeedback("Correo electrónico o contraseña incorrectos. Por favor, verifica tus datos.");
          passwordRef.current?.focus();
        } else if (error.status === 400) {
          setMensajeFeedback(error.message || "Los datos proporcionados no son válidos. Por favor, revísalos.");
        } else if (error.status === 404) {
          setMensajeFeedback("El servicio de inicio de sesión no se encuentra disponible en el backend (HTTP 404).");
        } else {
          setMensajeFeedback(error.message || "Error en el servidor. Por favor, intenta de nuevo más tarde.");
        }
      } else {
        setMensajeFeedback("Ocurrió un error inesperado al iniciar sesión.");
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="login-main min-h-[calc(100vh-170px)] flex items-center justify-center py-10 px-4 sm:px-6">
      <section
        className="login-seccion w-full max-w-[560px] mx-auto py-[var(--espacio-grande)] sm:px-[30px]"
        aria-labelledby="titulo-login"
      >
        <div className="login-tarjeta bg-[var(--color-blanco)] border border-[var(--color-borde)] rounded-[var(--radio)] p-6 sm:p-10 shadow-[0_10px_25px_rgba(0,0,0,0.05)] transition-colors duration-200">
          <h1
            id="titulo-login"
            className="text-[1.9rem] sm:text-[2.2rem] font-bold mb-2.5 text-[var(--color-texto)] leading-tight"
          >
            Iniciar sesión
          </h1>
          <p className="text-[var(--color-texto-secundario)] mb-[30px] text-base leading-relaxed">
            Accede a tu cuenta para continuar en Re-Manga.
          </p>

          <form id="formulario-login" onSubmit={handleSubmit} noValidate aria-busy={cargando}>
            {/* Campo: Correo electrónico */}
            <div className="campo-formulario mb-5">
              <label
                htmlFor="login-email"
                className="block mb-[7px] font-bold text-[var(--color-texto)] text-sm sm:text-base"
              >
                Correo electrónico
              </label>
              <input
                ref={emailRef}
                id="login-email"
                name="email"
                type="email"
                placeholder="tu-correo@ejemplo.com"
                autoComplete="email"
                required
                value={valores.email}
                onChange={handleChange}
                aria-invalid={Boolean(errores.email)}
                aria-describedby={errores.email ? "login-email-error" : undefined}
                className={`w-full min-h-[48px] border rounded-[var(--radio)] py-3 px-3.5 bg-[var(--color-blanco)] text-[var(--color-texto)] font-inherit transition-all duration-200 focus:outline-2 focus:outline-[var(--color-principal)] focus:outline-offset-2 ${
                  errores.email
                    ? "border-[var(--color-principal)] ring-1 ring-[var(--color-principal)]"
                    : "border-[var(--color-borde)]"
                }`}
              />
              <p
                id="login-email-error"
                className="mensaje-error min-h-[22px] mt-1 text-[var(--color-principal)] text-[0.9rem]"
                aria-live="polite"
              >
                {errores.email || ""}
              </p>
            </div>

            {/* Campo: Contraseña con alternancia para mostrar/ocultar */}
            <div className="campo-formulario mb-5">
              <label
                htmlFor="login-password"
                className="block mb-[7px] font-bold text-[var(--color-texto)] text-sm sm:text-base"
              >
                Contraseña
              </label>
              <div className="relative flex items-center">
                <input
                  ref={passwordRef}
                  id="login-password"
                  name="password"
                  type={mostrarPassword ? "text" : "password"}
                  placeholder="Introduce tu contraseña"
                  autoComplete="current-password"
                  required
                  value={valores.password}
                  onChange={handleChange}
                  aria-invalid={Boolean(errores.password)}
                  aria-describedby={errores.password ? "login-password-error" : undefined}
                  className={`w-full min-h-[48px] border rounded-[var(--radio)] py-3 pl-3.5 pr-12 bg-[var(--color-blanco)] text-[var(--color-texto)] font-inherit transition-all duration-200 focus:outline-2 focus:outline-[var(--color-principal)] focus:outline-offset-2 ${
                    errores.password
                      ? "border-[var(--color-principal)] ring-1 ring-[var(--color-principal)]"
                      : "border-[var(--color-borde)]"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                  aria-label={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  aria-pressed={mostrarPassword}
                  className="absolute right-2.5 p-1.5 text-[var(--color-texto-secundario)] hover:text-[var(--color-principal)] focus-visible:outline-2 focus-visible:outline-[var(--color-principal)] rounded-[var(--radio)] transition-colors cursor-pointer"
                >
                  {mostrarPassword ? (
                    // Ícono: Ocultar contraseña (ojo tachado)
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                      />
                    </svg>
                  ) : (
                    // Ícono: Mostrar contraseña (ojo visible)
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              <p
                id="login-password-error"
                className="mensaje-error min-h-[22px] mt-1 text-[var(--color-principal)] text-[0.9rem]"
                aria-live="polite"
              >
                {errores.password || ""}
              </p>
            </div>

            {/* Botón de envío */}
            <button
              type="submit"
              disabled={cargando}
              aria-busy={cargando}
              className={`boton-login w-full border-0 rounded-[var(--radio)] py-[13px] px-[18px] bg-[var(--color-principal)] text-[var(--color-blanco)] font-bold text-base transition-all duration-200 shadow-sm focus-visible:outline-3 focus-visible:outline-[rgba(230,57,70,0.35)] focus-visible:outline-offset-2 flex items-center justify-center gap-2 ${
                cargando
                  ? "opacity-70 cursor-not-allowed"
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
                  <span>Iniciando sesión...</span>
                </>
              ) : (
                "Iniciar sesión"
              )}
            </button>

            {/* Mensaje de estado tras envío */}
            <p
              id="mensaje-login"
              className={`mensaje-login min-h-[24px] mt-[15px] text-center text-sm font-semibold transition-opacity duration-200 ${
                esExito
                  ? "mensaje-exito text-[#238636] dark:text-[#3fb950]"
                  : "text-[var(--color-principal)]"
              }`}
              aria-live="polite"
              role={esExito ? "status" : "alert"}
            >
              {mensajeFeedback}
            </p>
          </form>

          {/* Enlaces de navegación: Registro y Catálogo */}
          <div className="mt-6 pt-5 border-t border-[var(--color-borde)] text-center space-y-3">
            <p className="text-sm text-[var(--color-texto-secundario)]">
              ¿No tienes una cuenta todavía?{" "}
              <Link
                href="/registro"
                className="text-[var(--color-principal)] font-bold hover:underline transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-principal)] rounded-sm"
              >
                Regístrate aquí
              </Link>
            </p>

            <p className="enlace-catalogo">
              <Link
                href="/#catalogo"
                className="text-sm text-[var(--color-texto-secundario)] hover:text-[var(--color-principal)] hover:underline transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-principal)] rounded-sm"
              >
                ← Volver al catálogo
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

