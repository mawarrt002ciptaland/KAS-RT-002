import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" });

export const metadata: Metadata = {
  title: "KAS RT | Blok Mawar RT 002",
  description: "Sistem pengelolaan kas warga Blok Mawar RT 002 RW 014 Perumahan Ciptaland.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <body className={`${jakarta.variable} antialiased`}>{children}</body>
    </html>
  );
}
