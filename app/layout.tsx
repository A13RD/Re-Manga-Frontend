import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Re-Manga | Manga de segunda mano",
  description: "Encuentra mangas de segunda mano en buen estado y dales una nueva vida.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}

