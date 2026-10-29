import type { Metadata } from "next";
import { AdminContent } from "./AdminContent";

export const metadata: Metadata = {
  title: "Panel de Administración | Re-Manga",
  description: "Administración del catálogo de mangas y solicitudes de venta en Re-Manga.",
};

export default function AdminPage() {
  return <AdminContent />;
}

