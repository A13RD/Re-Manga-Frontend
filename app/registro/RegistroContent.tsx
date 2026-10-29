"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import type { RegistroPayload, RegistroResponse } from "@/types/auth";
import { api, ApiError } from "@/lib/api";

interface FormValues {
  nombre: string;
  email: string;
  password: string;
  confirmarPassword: string;
}

interface FormErrors {
  nombre?: string;
  email?: string;
  password?: string;
  confirmarPassword?: string;
}

const VALORES_INICIALES: FormValues = {
  nombre: "",
  email: "",
  password: "",
  confirmarPassword: "",
};

/**
 * Valida los datos del formulario de registro respetando las reglas y textos originales:
 * - Nombre obligatorio.
 * - Correo obligatorio y con formato válido.
 * - Contraseña obligatoria y de al menos 8 caracteres.
 * - Confirmación obligatoria y coincidencia exacta con la contraseña.
 */
function validarRegistro(valores: FormValues): FormErrors {
  const errores: FormErrors = {};
  const nombreTrim = valores.nombre.trim();
  const emailTrim = valores.email.trim();

  // Validación de Nombre
  if (!nombreTrim) {
    errores.nombre = "El nombre es obligatorio.";
  }

  // Validación de Correo electrónico
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailTrim || !emailRegex.test(emailTrim)) {
    errores.email = "Introduce un correo válido.";
  }

  // Validación de Contraseña
  if (!valores.password) {
    errores.password = "La contraseña es obligatoria.";
  } else if (valores.password.length < 8) {
    errores.password = "La contraseña debe tener al menos 8 caracteres.";
  }

  // Validación de Confirmación de contraseña
  if (!valores.confirmarPassword) {
    errores.confirmarPassword = "Confirma tu contraseña.";
  } else if (valores.password !== valores.confirmarPassword) {
    errores.confirmarPassword = "Las contraseñas no coinciden.";
  }

  return errores;
}

/**
 * Componente cliente que renderiza el formulario de registro de Re-Manga.
 * Gestiona validaciones en el cliente, accesibilidad por teclado y lectores de pantalla,
 * prevención de envíos inválidos y retroalimentación sin almacenar contraseñas en el navegador.
 */
export function RegistroContent() {
  const [valores, setValores] = useState<FormValues>(VALORES_INICIALES);
  const [errores, setErrores] = useState<FormErrors>({});
  const [mensajeFeedback, setMensajeFeedback] = useState<string>("");
  const [esExito, setEsExito] = useState<boolean>(false);
  const [cargando, setCargando] = useState<boolean>(false);

  // Referencias a los campos para foco accesible en el primer error
  const nombreRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmarPasswordRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValores((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Limpiar mensaje de éxito o feedback global al escribir
    if (mensajeFeedback) {
      setMensajeFeedback("");
      setEsExito(false);
    }

    // Limpiar el error del campo que está siendo editado
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

    // Validación del lado del cliente previa al envío
    const nuevosErrores = validarRegistro(valores);
    setErrores(nuevosErrores);

    if (Object.keys(nuevosErrores).length > 0) {
      setEsExito(false);
      setMensajeFeedback("");

      // Llevar el foco de manera accesible al primer campo con error
      if (nuevosErrores.nombre) {
        nombreRef.current?.focus();
      } else if (nuevosErrores.email) {
        emailRef.current?.focus();
      } else if (nuevosErrores.password) {
        passwordRef.current?.focus();
      } else if (nuevosErrores.confirmarPassword) {
        confirmarPasswordRef.current?.focus();
      }
      return;
    }

    // Inicio de estado de carga
    setCargando(true);
    setMensajeFeedback("");
    setEsExito(false);

    // Enviar campos requeridos por el registro mediante el cliente HTTP centralizado
    const payload: RegistroPayload = {
      nombre: valores.nombre.trim(),
      name: valores.nombre.trim(),
      email: valores.email.trim().toLowerCase(),
      password: valores.password,
    };

    try {
      const data = await api.post<RegistroResponse>("/api/auth/register", payload);

      // Registro exitoso confirmado por el servidor (HTTP 201)
      setEsExito(true);
      setMensajeFeedback(
        data?.message || "¡Registro exitoso! Tu cuenta ha sido creada. Ya puedes iniciar sesión con tus credenciales."
      );
      // Restablecer el formulario tras confirmación exitosa
      setValores(VALORES_INICIALES);
      setErrores({});
    } catch (error) {
      setEsExito(false);

      if (error instanceof ApiError) {
        if (error.status === 409) {
          // Conflicto: correo ya registrado
          const mensajeConflicto = error.message || "No se puede registrar este correo porque ya existe una cuenta.";
          setErrores((prev) => ({ ...prev, email: mensajeConflicto }));
          setMensajeFeedback(mensajeConflicto);
          emailRef.current?.focus();
        } else if (error.status === 400) {
          // Error de validación del backend
          setMensajeFeedback(error.message || "Los datos proporcionados no son válidos. Por favor, revísalos.");
        } else if (error.status === 404) {
          // Endpoint no disponible
          setMensajeFeedback("El servicio de registro no se encuentra disponible en el backend (HTTP 404).");
        } else {
          // Error 500 u otros
          setMensajeFeedback(error.message || "Ocurrió un error en el servidor. Por favor, intenta más tarde.");
        }
      } else {
        // Error inesperado
        setMensajeFeedback("Ocurrió un error inesperado al procesar el registro.");
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="registro-main min-h-[calc(100vh-170px)] flex items-center justify-center py-10 px-4 sm:px-6">
      <section
        className="registro-seccion w-full max-w-[560px] mx-auto py-[var(--espacio-grande)] sm:px-[30px]"
        aria-labelledby="titulo-registro"
      >
        <div className="registro-tarjeta bg-[var(--color-blanco)] border border-[var(--color-borde)] rounded-[var(--radio)] p-6 sm:p-10 shadow-[0_10px_25px_rgba(0,0,0,0.05)] transition-colors duration-200">
          <h1
            id="titulo-registro"
            className="text-[1.9rem] sm:text-[2.2rem] font-bold mb-2.5 text-[var(--color-texto)] leading-tight"
          >
            Crear una cuenta
          </h1>
          <p className="text-[var(--color-texto-secundario)] mb-[30px] text-base leading-relaxed">
            Únete a la comunidad de lectores de Re-Manga.
          </p>

          <form id="formulario-registro" onSubmit={handleSubmit} noValidate aria-busy={cargando}>
            {/* Campo: Nombre completo */}
            <div className="campo-formulario mb-5">
              <label
                htmlFor="nombre"
                className="block mb-[7px] font-bold text-[var(--color-texto)] text-sm sm:text-base"
              >
                Nombre completo
              </label>
              <input
                ref={nombreRef}
                id="nombre"
                name="nombre"
                type="text"
                placeholder="Tu nombre completo"
                autoComplete="name"
                required
                value={valores.nombre}
                onChange={handleChange}
                aria-invalid={Boolean(errores.nombre)}
                aria-describedby={errores.nombre ? "nombre-error" : undefined}
                className={`w-full min-h-[48px] border rounded-[var(--radio)] py-3 px-3.5 bg-[var(--color-blanco)] text-[var(--color-texto)] font-inherit transition-all duration-200 focus:outline-2 focus:outline-[var(--color-principal)] focus:outline-offset-2 ${
                  errores.nombre
                    ? "border-[var(--color-principal)] ring-1 ring-[var(--color-principal)]"
                    : "border-[var(--color-borde)]"
                }`}
              />
              <p
                id="nombre-error"
                className="mensaje-error min-h-[22px] mt-1 text-[var(--color-principal)] text-[0.9rem]"
                aria-live="polite"
              >
                {errores.nombre || ""}
              </p>
            </div>

            {/* Campo: Correo electrónico */}
            <div className="campo-formulario mb-5">
              <label
                htmlFor="email"
                className="block mb-[7px] font-bold text-[var(--color-texto)] text-sm sm:text-base"
              >
                Correo electrónico
              </label>
              <input
                ref={emailRef}
                id="email"
                name="email"
                type="email"
                placeholder="tu-correo@ejemplo.com"
                autoComplete="email"
                required
                value={valores.email}
                onChange={handleChange}
                aria-invalid={Boolean(errores.email)}
                aria-describedby={errores.email ? "email-error" : undefined}
                className={`w-full min-h-[48px] border rounded-[var(--radio)] py-3 px-3.5 bg-[var(--color-blanco)] text-[var(--color-texto)] font-inherit transition-all duration-200 focus:outline-2 focus:outline-[var(--color-principal)] focus:outline-offset-2 ${
                  errores.email
                    ? "border-[var(--color-principal)] ring-1 ring-[var(--color-principal)]"
                    : "border-[var(--color-borde)]"
                }`}
              />
              <p
                id="email-error"
                className="mensaje-error min-h-[22px] mt-1 text-[var(--color-principal)] text-[0.9rem]"
                aria-live="polite"
              >
                {errores.email || ""}
              </p>
            </div>

            {/* Campo: Contraseña */}
            <div className="campo-formulario mb-5">
              <label
                htmlFor="password"
                className="block mb-[7px] font-bold text-[var(--color-texto)] text-sm sm:text-base"
              >
                Contraseña
              </label>
              <input
                ref={passwordRef}
                id="password"
                name="password"
                type="password"
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
                required
                value={valores.password}
                onChange={handleChange}
                aria-invalid={Boolean(errores.password)}
                aria-describedby={errores.password ? "password-error" : undefined}
                className={`w-full min-h-[48px] border rounded-[var(--radio)] py-3 px-3.5 bg-[var(--color-blanco)] text-[var(--color-texto)] font-inherit transition-all duration-200 focus:outline-2 focus:outline-[var(--color-principal)] focus:outline-offset-2 ${
                  errores.password
                    ? "border-[var(--color-principal)] ring-1 ring-[var(--color-principal)]"
                    : "border-[var(--color-borde)]"
                }`}
              />
              <p
                id="password-error"
                className="mensaje-error min-h-[22px] mt-1 text-[var(--color-principal)] text-[0.9rem]"
                aria-live="polite"
              >
                {errores.password || ""}
              </p>
            </div>

            {/* Campo: Confirmar contraseña */}
            <div className="campo-formulario mb-5">
              <label
                htmlFor="confirmar-password"
                className="block mb-[7px] font-bold text-[var(--color-texto)] text-sm sm:text-base"
              >
                Confirmar contraseña
              </label>
              <input
                ref={confirmarPasswordRef}
                id="confirmar-password"
                name="confirmarPassword"
                type="password"
                placeholder="Repite tu contraseña"
                autoComplete="new-password"
                required
                value={valores.confirmarPassword}
                onChange={handleChange}
                aria-invalid={Boolean(errores.confirmarPassword)}
                aria-describedby={
                  errores.confirmarPassword ? "confirmar-password-error" : undefined
                }
                className={`w-full min-h-[48px] border rounded-[var(--radio)] py-3 px-3.5 bg-[var(--color-blanco)] text-[var(--color-texto)] font-inherit transition-all duration-200 focus:outline-2 focus:outline-[var(--color-principal)] focus:outline-offset-2 ${
                  errores.confirmarPassword
                    ? "border-[var(--color-principal)] ring-1 ring-[var(--color-principal)]"
                    : "border-[var(--color-borde)]"
                }`}
              />
              <p
                id="confirmar-password-error"
                className="mensaje-error min-h-[22px] mt-1 text-[var(--color-principal)] text-[0.9rem]"
                aria-live="polite"
              >
                {errores.confirmarPassword || ""}
              </p>
            </div>

            {/* Botón de envío */}
            <button
              type="submit"
              disabled={cargando}
              aria-busy={cargando}
              className={`boton-registro w-full border-0 rounded-[var(--radio)] py-[13px] px-[18px] bg-[var(--color-principal)] text-[var(--color-blanco)] font-bold text-base transition-all duration-200 shadow-sm focus-visible:outline-3 focus-visible:outline-[rgba(230,57,70,0.35)] focus-visible:outline-offset-2 flex items-center justify-center gap-2 ${
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
                  <span>Registrando...</span>
                </>
              ) : (
                "Registrarme"
              )}
            </button>

            {/* Mensaje de estado tras envío */}
            <p
              id="mensaje-registro"
              className={`mensaje-registro min-h-[24px] mt-[15px] text-center text-sm font-semibold transition-opacity duration-200 ${
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

          {/* Enlaces de navegación: Iniciar sesión y Catálogo */}
          <div className="mt-6 pt-5 border-t border-[var(--color-borde)] text-center space-y-3">
            <p className="text-sm text-[var(--color-texto-secundario)]">
              ¿Ya tienes una cuenta?{" "}
              <Link
                href="/login"
                className="text-[var(--color-principal)] font-bold hover:underline transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-principal)] rounded-sm"
              >
                Inicia sesión aquí
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
