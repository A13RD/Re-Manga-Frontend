import type { Metadata } from "next";
import { RegistroContent } from "./RegistroContent";

export const metadata: Metadata = {
  title: "Registrarse | Re-Manga",
  description: "Únete a la comunidad de lectores de Re-Manga. Encuentra y vende mangas de segunda mano.",
};

export default function RegistroPage() {
  return <RegistroContent />;
}
