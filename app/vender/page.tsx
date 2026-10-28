import type { Metadata } from "next";
import { SaleSection } from "@/components/SaleSection";

export const metadata: Metadata = {
  title: "Vender manga | Re-Manga",
  description: "Vende tus mangas de segunda mano en Re-Manga y dales una nueva vida.",
};

export default function VenderPage() {
  return (
    <div className="w-full py-6">
      <SaleSection />
    </div>
  );
}

