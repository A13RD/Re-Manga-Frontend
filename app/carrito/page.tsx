import type { Metadata } from "next";
import { CarritoContent } from "./CarritoContent";

export const metadata: Metadata = {
  title: "Carrito | Re-Manga",
  description: "Revisa y administra los mangas agregados a tu carrito de compras.",
};

export default function CarritoPage() {
  return <CarritoContent />;
}
