import type { Metadata } from "next";
import { PerfilContent } from "./PerfilContent";

export const metadata: Metadata = {
  title: "Mi Cuenta | Re-Manga",
  description: "Perfil y solicitudes de venta del usuario en Re-Manga.",
};

export default function PerfilPage() {
  return <PerfilContent />;
}

