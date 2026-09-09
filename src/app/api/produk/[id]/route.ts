import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { produk } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const rows = await db
    .select()
    .from(produk)
    .where(eq(produk.id, Number(id)))
    .limit(1);
  if (rows.length === 0)
    return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
  const item = rows[0];
  // Admin boleh edit semua; warga hanya produknya sendiri
  if (user.role !== "admin" && item.wargaId !== user.wargaId) {
    return NextResponse.json({ error: "Bukan produk Anda" }, { status: 403 });
  }
  try {
    const body = await req.json();
    const updated = await db
      .update(produk)
      .set({
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
      })
      .where(eq(produk.id, Number(id)))
      .returning();
    return NextResponse.json({ data: updated[0] });
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const rows = await db
    .select()
    .from(produk)
    .where(eq(produk.id, Number(id)))
    .limit(1);
  if (rows.length === 0) return NextResponse.json({ ok: true });
  if (user.role !== "admin" && rows[0].wargaId !== user.wargaId) {
    return NextResponse.json({ error: "Bukan produk Anda" }, { status: 403 });
  }
  await db.delete(produk).where(eq(produk.id, Number(id)));
  return NextResponse.json({ ok: true });
}
