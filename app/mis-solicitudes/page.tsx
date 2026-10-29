import type { Metadata } from "next";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { UserSaleRequests } from "@/components/UserSaleRequests";

export const metadata: Metadata = {
  title: "Mis Solicitudes de Venta | Re-Manga",
  description: "Revisa el estado de tus solicitudes de publicación en Re-Manga.",
};

export default function MisSolicitudesPage() {
  return (
    <ProtectedRoute>
      <div className="max-w-[var(--max-ancho)] mx-auto px-5 sm:px-6 md:px-[30px] py-[40px] md:py-[var(--espacio-grande)]">
        <div className="bg-[var(--color-blanco)] border border-[var(--color-borde)] rounded-[var(--radio)] p-6 sm:p-8 shadow-xs transition-colors duration-200">
          <UserSaleRequests mostrarBotonVender={true} />
        </div>
      </div>
    </ProtectedRoute>
  );
}

