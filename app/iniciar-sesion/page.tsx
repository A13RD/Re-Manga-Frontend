import type { Metadata } from "next";
import { LoginContent } from "../login/LoginContent";

export const metadata: Metadata = {
  title: "Iniciar sesión | Re-Manga",
  description: "Accede a tu cuenta en Re-Manga para gestionar tus mangas de segunda mano y compras.",
};

export default function IniciarSesionPage() {
  return <LoginContent />;
}

