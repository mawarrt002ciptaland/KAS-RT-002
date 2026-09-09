import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { transaksi } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const jenis = req.nextUrl.searchParams.get("jenis");
  const base = db.select().from(transaksi);
  const rows =
    jenis === "masuk" || jenis === "keluar"
      ? await base.where(eq(transaksi.jenis, jenis)).orderBy(desc(transaksi.tanggal), desc(transaksi.id))
      : await base.orderBy(desc(transaksi.tanggal), desc(transaksi.id));
  return NextResponse.json({ data: rows });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin")
    return NextResponse.json({ error: "Hanya admin" }, { status: 403 });
  try {
    const body = await req.json();
    if (!body.keterangan || !body.nominal || !body.tanggal) {
      return NextResponse.json(
        { error: "Keterangan, nominal, dan tanggal wajib diisi" },
        { status: 400 }
      );
    }
    const inserted = await db
      .insert(transaksi)
      .values({
        jenis: body.jenis === "keluar" ? "keluar" : "masuk",
        kategori: String(body.kategori || "Umum"),
        keterangan: String(body.keterangan).trim(),
        nominal: Number(body.nominal),
        tanggal: String(body.tanggal),
      })
      .returning();
    return NextResponse.json({ data: inserted[0] }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
