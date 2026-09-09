import { NextResponse } from "next/server";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { ensureDb } from "@/lib/bootstrap";

export const dynamic = "force-dynamic";

// Endpoint publik (tanpa login) — hanya identitas tampilan aplikasi
export async function GET() {
  try {
    await ensureDb();
    const rows = await db.select().from(settings);
    const map: Record<string, string> = {};
    for (const r of rows) map[r.key] = r.value;
    return NextResponse.json({
      namaAplikasi: map.namaAplikasi || "KAS RT — Blok Mawar RT 002 RW 014",
      keteranganAplikasi:
        map.keteranganAplikasi || "Sistem Kas Digital Blok Mawar",
      logoAplikasi: map.logoAplikasi || "",
      namaRt: map.namaRt || "Blok Mawar RT 002 RW 014",
      namaPerumahan: map.namaPerumahan || "Perumahan Ciptaland",
    });
  } catch {
    return NextResponse.json({
      namaAplikasi: "KAS RT — Blok Mawar RT 002 RW 014",
      keteranganAplikasi: "Sistem Kas Digital Blok Mawar",
      logoAplikasi: "",
      namaRt: "Blok Mawar RT 002 RW 014",
      namaPerumahan: "Perumahan Ciptaland",
    });
  }
}
