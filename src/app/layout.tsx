import type { Metadata } from "next";
import "./globals.css";

const UI = {
  title:            "Árbol genealógico familiar",
  description: "Árbol genealógico familiar interactivo",
} as const;

export const metadata: Metadata = {
  title: UI.title,
  description: UI.description,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}