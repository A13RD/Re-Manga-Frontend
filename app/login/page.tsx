import type { Metadata } from "next";
import { LoginContent } from "./LoginContent";

export const metadata: Metadata = {
  title: "Iniciar sesión | Re-Manga",
  description: "Accede a tu cuenta en Re-Manga para gestionar tus mangas de segunda mano y compras.",
};

export default function LoginPage() {
  return <LoginContent />;
}

