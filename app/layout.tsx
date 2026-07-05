import type { Metadata } from "next";
import { Cinzel } from "next/font/google";
import "./globals.css";

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

export const metadata: Metadata = {
  title: "The Last Breath: Shadow of The Condor",
  description: "Plataformero 2D inspirado en leyendas ecuatorianas",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={cinzel.className}>{children}</body>
    </html>
  );
}