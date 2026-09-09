import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { produk } from "@/db/schema";
import { desc } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await db.select().from(produk).orderBy(desc(produk.id));
  return NextResponse.json({ data: rows });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    if (!body.nama || body.harga === undefined || !body.penjual) {
      return NextResponse.json(
        { error: "Nama produk, harga, dan nama penjual wajib diisi" },
        { status: 400 }
      );
    }
    const inserted = await db
      .insert(produk)
      .values({
        nama: String(body.nama).trim(),
        harga: Number(body.harga) || 0,
        kategori: ["Jual", "Jasa", "Donasi"].includes(body.kategori)
          ? body.kategori
          : "Jual",
        status: body.status === "habis" ? "habis" : "tersedia",
        penjual: String(body.penjual).trim(),
        telepon: String(body.telepon || ""),
        keterangan: String(body.keterangan || ""),
        warna: ["indigo", "amber", "emerald", "rose", "cyan", "violet"].includes(
          body.warna
        )
          ? body.warna
          : "indigo",
        wargaId: user.wargaId,
      })
      .returning();
    return NextResponse.json({ data: inserted[0] }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
