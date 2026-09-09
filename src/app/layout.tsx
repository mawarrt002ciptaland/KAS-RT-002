import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "KAS RT — Blok Mawar RT 002 RW 014 Perumahan Ciptaland",
  description:
    "Sistem Kas Digital Blok Mawar RT 002 RW 014 Perumahan Ciptaland",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <body className="bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
