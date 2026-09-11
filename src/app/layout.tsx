import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "KAS RT 002 RW 014 — Blok Mawar Perumahan Ciptaland",
  description: "Sistem Informasi Kas RT & Keuangan Transparan Blok Mawar RT 002 RW 014 Perumahan Ciptaland",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <body className="bg-slate-50 text-slate-900 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
